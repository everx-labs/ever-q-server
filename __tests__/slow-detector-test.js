import type { CollectionInfo } from "../server/config";
import { BLOCKCHAIN_DB } from "../server/config";
import { isFastQuery } from "../server/slow-detector";
import {
    Transaction,
    Account,
    Message,
    Block,
} from "../server/resolvers-generated";


test('Slow Detector', () => {
    const accounts: CollectionInfo = BLOCKCHAIN_DB.collections.accounts;
    expect(isFastQuery(accounts, Account,
        { id: { eq: '1' } },
        [],
    )).toBeTruthy();
    expect(isFastQuery(accounts, Account,
        {},
        [{ path: 'balance' }],
    )).toBeTruthy();
    expect(isFastQuery(accounts, Account,
        { id: { eq: '1' }, balance: { gt: '0' } },
        [],
    )).toBeTruthy();

    const transactions: CollectionInfo = BLOCKCHAIN_DB.collections.transactions;
    expect(isFastQuery(transactions, Transaction,
        { account_addr: { eq: '1' } },
        [{ path: 'lt', direction: 'DESC' }],
    )).toBeTruthy();
    expect(isFastQuery(transactions, Transaction,
        { block_id: { eq: '1' } },
        [],
    )).toBeTruthy();
    expect(isFastQuery(transactions, Transaction,
        { account_addr: { eq: '1' }, now: { gt: 2 } },
        [{ path: 'now' }],
    )).toBeTruthy();
    expect(isFastQuery(transactions, Transaction,
        { workchain_id: { eq: 1 }, now: { gt: 2 } },
        [{ path: 'now' }],
    )).toBeTruthy();
    expect(isFastQuery(transactions, Transaction,
        { in_msg: { in: ['1', '2'] }, aborted: { eq: true } },
        [],
    )).toBeTruthy();
    expect(isFastQuery(transactions, Transaction,
        { in_msg: { in: ['1', '2'] } },
        [],
    )).toBeTruthy();
    expect(isFastQuery(transactions, Transaction,
        { in_msg: { eq: '1' } },
        [],
    )).toBeTruthy();
    expect(isFastQuery(transactions, Transaction,
        {
            orig_status: { eq: 0 },
            end_status: { eq: 1 },
            status: { eq: 3 },
            account_addr: { eq: '1' }
        },
        [],
    )).toBeTruthy();
    expect(isFastQuery(transactions, Transaction,
        { out_msgs: { any: { eq: '1' } } },
        [],
    )).toBeTruthy();
    expect(isFastQuery(transactions, Transaction,
        {
            in_msg: { eq: '1' },
            status: { eq: 3 }
        },
        [],
    )).toBeTruthy();

    const blocks: CollectionInfo = BLOCKCHAIN_DB.collections.blocks;
    expect(isFastQuery(blocks, Block,
        {
            seq_no: { eq: 70000 },
            workchain_id: { eq: -1 }
        },
        [],
    )).toBeTruthy();
    expect(isFastQuery(blocks, Block,
        {
            workchain_id: { eq: -1 }
        },
        [{ path: 'seq_no', direction: 'DESC' }],
    )).toBeTruthy();
    expect(isFastQuery(blocks, Block,
        {
            seq_no: { in: [2798482, 2798483, 2798484] },
            workchain_id: { eq: -1 },
        },
        [{ path: 'seq_no', direction: 'DESC' }],
    )).toBeTruthy();
    expect(isFastQuery(blocks, Block,
        {
            workchain_id: { eq: -1 },
            shard: { eq: '8000000000000000' },
            seq_no: { in: [2799675, 2799676, 2799677, 2799678] }
        },
        [{ path: 'seq_no' }],
    )).toBeTruthy();
    expect(isFastQuery(blocks, Block,
        {
            gen_utime: { gt: 1 },
            workchain_id: { eq: 1 },
        },
        [{ path: 'gen_utime' }],
    )).toBeTruthy();
    expect(isFastQuery(blocks, Block,
        {
            seq_no: { gt: 1 },
        },
        [{ path: 'seq_no' }, { path: 'gen_utime' }],
    )).toBeTruthy();
    expect(isFastQuery(blocks, Block,
        {
            id: { in: ['1', '2'] },
        },
        [],
    )).toBeTruthy();

    const messages: CollectionInfo = BLOCKCHAIN_DB.collections.messages;
    expect(isFastQuery(messages, Message,
        {
            created_at: { gt: 1 },
            src: { eq: '1' },
            dst: { eq: '2' },
            value: { gt: '1' }
        },
        [{ path: 'created_at' }],
    )).toBeTruthy();
    expect(isFastQuery(messages, Message,
        {
            status: { eq: 5 },
            src: { eq: '1' },
        },
        [],
    )).toBeTruthy();
    expect(isFastQuery(messages, Message,
        {
            msg_type: { eq: 0 }, // internal messages
            status: { eq: 5 },
            src: { in: ['1', '2'] },
            dst: { in: ['3', '4'] }
        },
        [],
    )).toBeTruthy();
    expect(isFastQuery(messages, Message,
        {
            msg_type: { eq: 1 },
            src: { eq: '1' },
            status: { eq: 1 },
            created_at: { gt: 1 },
            created_lt: { gt: 2 },
        },
        [{ path: 'created_lt' }],
    )).toBeTruthy();

});
