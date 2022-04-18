import { GraphQLResolveInfo } from 'graphql'

import { convertBigUInt, QParams } from '../../../filter/filters'
import { QRequestContext } from '../../../request'
import { QTraceSpan } from '../../../tracing'
import { QError, required } from '../../../utils'

import { config } from '../config'
import {
  Direction,
  getNodeSelectionSetForConnection,
  isDefined,
  prepareChainOrderFilter,
  processPaginatedQueryResult,
  processPaginationArgs,
} from '../helpers'
import {
  BlockchainAccountQuery,
  BlockchainAccountQueryMessagesArgs,
  BlockchainMessage,
  BlockchainMessagesConnection,
  BlockchainMessageTypeFilterEnum,
} from '../resolvers-types-generated'

export async function resolve_message(
  hash: String,
  context: QRequestContext,
  info: GraphQLResolveInfo,
  traceSpan: QTraceSpan,
) {
  const maxJoinDepth = 1

  const selectionSet = info.fieldNodes[0].selectionSet
  const returnExpression = config.messages.buildReturnExpression(
    selectionSet,
    context,
    maxJoinDepth,
    'doc',
  )

  // query
  const params = new QParams()
  const query =
    'FOR doc IN messages ' +
    `FILTER doc._key == @${params.add(hash)} ` +
    `RETURN ${returnExpression}`
  const queryResult = (await context.services.data.query(
    required(context.services.data.messages.provider),
    {
      text: query,
      vars: params.values,
      orderBy: [],
      request: context,
      traceSpan,
      // TODO: shard
    },
  )) as BlockchainMessage[]

  await config.messages.fetchJoins(
    queryResult,
    selectionSet,
    context,
    traceSpan,
    maxJoinDepth,
  )

  return queryResult[0]
}

export async function resolve_account_messages(
  parent: BlockchainAccountQuery,
  args: BlockchainAccountQueryMessagesArgs,
  context: QRequestContext,
  info: GraphQLResolveInfo,
  traceSpan: QTraceSpan,
) {
  const maxJoinDepth = 1

  const hasMsgType = (value: BlockchainMessageTypeFilterEnum) =>
    args.msg_type && args.msg_type.length > 0
      ? args.msg_type.includes(value)
      : true
  const hasExtIn = hasMsgType(BlockchainMessageTypeFilterEnum.ExtIn)
  const hasExtOut = hasMsgType(BlockchainMessageTypeFilterEnum.ExtOut)
  const hasIntIn = hasMsgType(BlockchainMessageTypeFilterEnum.IntIn)
  const hasIntOut = hasMsgType(BlockchainMessageTypeFilterEnum.IntOut)
  const hasInbound = hasExtIn || hasIntIn
  const hasOutbound = hasExtOut || hasIntOut

  // fail fast
  if (args.counterparties && args.counterparties.length > 0) {
    if (args.msg_type && (hasExtIn || hasExtOut)) {
      throw QError.invalidQuery(
        'External messages do not have counterparties. ' +
          "Don't use counterparties filter together with extIn/ExtOut message types.",
      )
    }
    if (args.counterparties.length > 5) {
      throw QError.invalidQuery(
        'Only up to 5 counterparties are allowed in account messages filter.',
      )
    }
  }

  const { direction, limit } = processPaginationArgs(args)
  const params = new QParams()
  const queries: string[] = []
  const accountParam = params.add(parent.address)
  const minValueFilter = isDefined(args.min_value)
    ? `doc.value >= @${params.add(convertBigUInt(2, args.min_value))}`
    : undefined
  const counterpartiesParamsMap =
    args.counterparties && args.counterparties.length > 0
      ? args.counterparties.reduce((map, value) => {
          if (!map.has(value)) {
            map.set(value, params.add(value))
          }
          return map
        }, new Map<string, string>())
      : undefined

  const selectionSet = getNodeSelectionSetForConnection(info)
  const returnExpressionBuilder = (sortField: string) =>
    config.messages.buildReturnExpression(
      selectionSet,
      context,
      maxJoinDepth,
      'doc',
      undefined,
      [['account_chain_order', `doc.${sortField}`]],
    )

  if (hasInbound) {
    const inboundAndFilters: string[] = []
    inboundAndFilters.push(`doc.dst == @${accountParam}`)
    if (minValueFilter) {
      inboundAndFilters.push(minValueFilter)
    }
    await prepareChainOrderFilter(
      args,
      params,
      inboundAndFilters,
      context,
      'dst_chain_order',
    )
    const returnExpression = returnExpressionBuilder('dst_chain_order')
    const commonFilter = inboundAndFilters.join(' AND ')
    const orFilters: string[] = []
    if (counterpartiesParamsMap) {
      for (const cpParam of counterpartiesParamsMap.values()) {
        orFilters.push(
          `${commonFilter} AND doc.msg_type == 0 AND doc.src == @${cpParam}`,
        )
        // index: dst, msg_type, src, dst_chain_order
      }
    } else {
      if (hasIntIn && hasExtIn) {
        orFilters.push(commonFilter)
        // index: dst, dst_chain_order
      } else if (hasIntIn) {
        orFilters.push(`${commonFilter} AND doc.msg_type == 0`)
        // index: dst, msg_type, dst_chain_order
      } else if (hasExtIn) {
        orFilters.push(`${commonFilter} AND doc.msg_type == 1`)
        // index: dst, msg_type, dst_chain_order
      }
    }
    queries.push(
      ...orFilters.map(
        filter =>
          'FOR doc IN messages ' +
          `FILTER ${filter} ` +
          `SORT doc.dst_chain_order ${
            direction == Direction.Backward ? 'DESC' : 'ASC'
          } ` +
          `LIMIT ${limit} ` +
          `RETURN ${returnExpression}`,
      ),
    )
  }
  if (hasOutbound) {
    const outboundAndFilters: string[] = []
    outboundAndFilters.push(`doc.src == @${accountParam}`)
    if (minValueFilter) {
      outboundAndFilters.push(minValueFilter)
    }
    await prepareChainOrderFilter(
      args,
      params,
      outboundAndFilters,
      context,
      'src_chain_order',
    )
    const returnExpression = returnExpressionBuilder('src_chain_order')
    const commonFilter = outboundAndFilters.join(' AND ')
    const orFilters: string[] = []
    if (counterpartiesParamsMap) {
      for (const cpParam of counterpartiesParamsMap.values()) {
        orFilters.push(
          `${commonFilter} AND doc.msg_type == 0 AND doc.dst == @${cpParam}`,
        )
        // index: src, msg_type, dst, src_chain_order
      }
    } else {
      if (hasIntOut && hasExtOut) {
        orFilters.push(commonFilter)
        // index: src, src_chain_order
      } else if (hasIntOut) {
        orFilters.push(`${commonFilter} AND doc.msg_type == 0`)
        // index: src, msg_type, src_chain_order
      } else if (hasExtOut) {
        orFilters.push(`${commonFilter} AND doc.msg_type == 2`)
        // index: src, msg_type, src_chain_order
      }
    }
    queries.push(
      ...orFilters.map(
        filter =>
          'FOR doc IN messages ' +
          `FILTER ${filter} ` +
          `SORT doc.src_chain_order ${
            direction == Direction.Backward ? 'DESC' : 'ASC'
          } ` +
          `LIMIT ${limit} ` +
          `RETURN ${returnExpression}`,
      ),
    )
  }

  const query =
    queries.length === 1
      ? queries[0]
      : `FOR d IN UNION((${queries.join('),(')})) ` +
        `SORT d.account_chain_order ${
          direction == Direction.Backward ? 'DESC' : 'ASC'
        } ` +
        `LIMIT ${limit} ` +
        'RETURN d'
  const queryResult = (await context.services.data.query(
    required(context.services.data.transactions.provider),
    {
      text: query,
      vars: params.values,
      orderBy: [
        {
          path: 'account_chain_order',
          direction: 'ASC',
        },
      ],
      distinctBy: 'account_chain_order',
      request: context,
      traceSpan,
      // TODO: shard and complement_messages usage
    },
  )) as (BlockchainMessage & { account_chain_order?: string })[]

  return (await processPaginatedQueryResult(
    queryResult,
    limit,
    direction,
    'account_chain_order',
    async r => {
      await config.messages.fetchJoins(
        r,
        selectionSet,
        context,
        traceSpan,
        maxJoinDepth,
      )
    },
  )) as BlockchainMessagesConnection
}
