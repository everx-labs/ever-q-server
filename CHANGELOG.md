# Release Notes

All notable changes to this project will be documented in this file.

## [0.48.1] - 2022-03-16

### Fix

- Fix `blockchain.account(address).info`

## [0.48.0] - 2022-03-16

### New

- Support for `null` in scalar filter. e.g. `filter: { last_paid: null }`. Means missing filter.  
- Add new fields to `blockchain` query:
    - `account`, allows:
        - to fetch account info (e.g. boc) via `info` field
        - to fetch transaction info via `transactions` (similar to now deprecated `blockchain.account_transactions`)
    - `blocks` (is similar to now deprecated `workchain_blocks`)
    - `transactions` (is similar to now deprecated `workchain_transactions`)
- Cancel `blockchain.key_blocks` deprecation
- Cancel `blockchain.master_seq_no_range` deprecation

### Breaking

- In `blockchain.key_blocks` rename `seq_no` argument to `master_seq_no_range`.

### Internal

- Prepare code for messages joins in TBD `blockchain` and `account` messages queries.


## [0.47.1] - 2022-03-02

### Fixed

- `X-Evernode-Expected-Account-Boc-Version` header handler did not handle lowercase version of the header. 

## [0.47.0] - 2022-02-28

### New

- Support `X-Evernode-Expected-Account-Boc-Version` header. 
  `1` (default) means old version, `2` – new (with `init_code_hash` field).

- Support `boc1` field in accounts collection. `boc` field contains new `2` version, 
  `boc1` contains downgraded to `1` version.

- `account.init_code_hash` – account 's initial code hash (when it was deployed).

## [0.46.0] - 2022-02-17

### New
- Add joined fields to `blockchain.account_transactions` and `blockchain.workchain_transactions`:
    - `account`
    - `in_message`
    - `out_messages`

### Deprecated
- `when` argument in all joined fields (for example, transaction.in_message's `when` argument)
- the following root queries:
    - `blockchain` (usage of all internal functions must be replaced with the same API in the root Query)
    - `explainQueryAccounts`
    - `explainQueryTransactions`
    - `explainQueryMessages`
    - `explainQueryBlocks`
    - `explainQueryBlockSignatures`
    - `explainQueryZerostates`
    - `getAccountsCount`
    - `getTransactionsCount`
    - `getAccountsTotalBalance`
- `QueryExplanation` type

Check the deprecation schedule, policy and migration guides for more info
https://tonlabs.gitbook.io/evernode-platform/reference/breaking-changes/deprecation-schedule

### Fixed
- Collection filters should allow incorrect ids in the setup with multiple hot databases. Example affected query: `blocks(filter:{id:{eq:"a"}}) { id }`.

## [0.45.1] - 2022-02-04

### Fixed
- Fix recurring join queries  when trying to fetch non-existent documents

## [0.45.0] - 2021-11-18

### New
- New **`blockchain`** UNSTABLE root query, which features reliable pagination **with cursor** of blocks and transactions:
    - `master_seq_no_range` to transform time range into masterchain seq_no range
    - `key_blocks` - paginate through key blocks
    - `workchain_blocks` with optional filter by thread (former 'shard')
    - `workchain_transactions`
    - `account_transactions` 

Later, it will be expanded with messages pagination. 

### Optimized
- Without chain ranges verification database the verified boundary now 10 seconds ago instead of 120.

### Fixed
- StatsD reporting now has timeout to tackle with rare freeze problem

## [0.44.5] - 2021-11-15

### Fixed

- Bump apollo-server from 2.16.1 to 2.25.3

## [0.44.4] - 2021-10-25

### Fixed

- diagnostic timeout added to statsD reporting
- "Cannot read property 'length' of null" error 

## [0.44.3] - 2021-10-25

### Fix

- q-server didn't write error messages to log

## [0.44.2] - 2021-10-22

### Fix

- subscriptions with joins didn't work
- subscriptions for companion fields (`*_name`, `*_string`) didn't work

## [0.44.1] - 2021-10-22

### Fix

- subscriptions for accounts didn't work

## [0.44.0] - 2021-10-11

### New schema fields
- `file_hash` in block
- `file_hash` and `root_hash` in zerostate
- `ext_in_msg_fee` in message

### API
- API functions sorted in logical order

### Fix
- `gen_software_capabilities` block field is big integer

## [0.43.0] - 2021-09-22

### New schema fields
- `main` (number of masterchain validators) parameter added in ValidatorSet type
- `chain_order` fields added in `blocks`, `transactions`, `messages`
- `chainOrderBoundary` (the boundary before which no data inserts are possible) field added in `info`

### Configuration
- Flexible data sources configuration (including separation/sharding for accounts, blocks, messages/transactions).
  Old data configurations are deprecated now but supported yet. For details see README.
- Option to set max execution time for queries on ArangoDb side
- Option to configure polling period in waitFor queries (queries with timeout)
- Memjs data cache support for hot databases

### Optimizations
- Joins loading optimisations.
- Latency refreshing optimisation.
- Info query optimisation.
- Better jaeger tracing.
- When messages database is sharded, use two collections `messages` and `messages_complement` for queries
- New `qserver.stats.error.internal` StartD counter for internal server errors

### Fixed

- Subscriptions for sharded data sources

## [0.42.1] 2021-08-09

### Fixed

- Q-Server failed on StatsD sending

## [0.42.0] 2021-07-15

### New

- optimizations for queries with `OR` – use two simple sorted queries instead of using `OR` AQL operator.
- `filter-or-conversion` option to select filter OR conversion strategy (see README).
- ESLINT configuration and npm commands `run npm eslint` and `run npm eslint-fix`.

## [0.41.0] 2021-07-08

### New

- `config` config parameter added that allows to specify the configuration via JSON-based config file
- config file reload without restart on `SIGHUP` signal
- optimizations for aggregation queries `MIN` and `MAX` were made – use simple sorted queries instead of `COLLECT AGGREGATE`.
- port q-server code base to TypeScript

## [0.40.0] 2021-06-28

### New

- `slow-queries` config parameter allows specifying how to handle slow queries (see README for
  details).
- **IMPORTANT!** `zerostates` collection must reside in `mut` database (where the `accounts` reside).

### Fixed

- Incorrect sort order result when sorting fields are not included into the result set.
- Query returned more than `limit` records (and exceeded records were sorted wrong).

## [0.39.3] 2021-06-18

### Fixed

- incorrect sort order result when sorting by two or more fields.

## [0.39.2] 2021-06-16

### Fixed

- info query returned incorrect latency

## [0.39.1] 2021-05-26

### Fixed

- info query failed if collections was empty

## [0.39.0] 2021-05-14

### New

- `info` fields
    - `blocksLatency` calculated as now() - max(blocks.gen_utime)
    - `messagesLatency` calculated as now() - max(messages.created_at)
    - `transactionsLatency` calculated as now() - max(transactions.now)
    - `latency` calculated as max(blocks_latency, messages_latency, transactions_latency)
- `statsd-reset-interval` config parameter. Q-Server will recreate statsd socket periodically if
  this parameter is specified. `0` means disabled recreation.

### Fixed

- querying of the `lastBlockTime` and latency fields took a long time over big collections during
  write loads. AQL queries used for max time were simplified (got rid of COLLECT AGGREGATE).

## [0.38.0] 2021-04-26

### New

- Now you can retrieve account's code_hash from messages and transactions in the result set of
  fields: joined account fields were added to messages and transactions: `messages.src_account`
  , `messages.dst_account`, `transaction.account`. Remember, you can not filter by fields of joined
  objects.

### Fixed

- Some queries took a long time for execution. For example `messages` query with
  `dst_transaction` for the external outbound message if `msg_type` wasn't included into the result
  set.

## [0.37.0] 2021-04-19

### New

- `lastBlockTime` field of `info` query returns `MAX(blocks.gen_utime)`. This value is updated in
  realtime.

### Fixed

- counterparties sort order was ascending.

## [0.36.0] 2021-04-13

### New

- `counterpaties` query that allows to retrieve account counterparties, i.e. accounts that the
  account interacted with, sorted by last interaction (internal message between accounts) time
- `counterparties` subscription that allows to get updates in counterparties list.
- `data-counterparties` configuration parameter specifies endpoint to the database with
  counterparties collection.

## [0.35.0] 2021-03-23

### New

- `requests-max-size` config parameter sets limit of request message size in bytes. Default value is
  16384 bytes.

## 0.34.1 – Mar 11, 2021

### Fixed

- Aggregation of fields with negative values.

## 0.34.0 – Mar 2, 2021

### New

- `boc` field in `zerostate` collection.

## 0.33.0 – Feb 25, 2021

### New

- `bits`, `cells` and `public_cells` fields in `accounts` collection representing account used
  storage statistics for storage fee calculation.

## 0.32.0 – Feb 16, 2021

### New

- `qserver.subscription.count` StatsD counter.
- Filters for fields with a hex encoded content (id's, hashes and so on) can be represented in any
  case. Q-Server converts filter values into lower case before use.

## 0.31.2 – Jan 28, 2021

### Fixed

- `notIn` with more than two elements generates wrong AQL condition.

## 0.31.1 – Jan 27, 2021

### Fixed

- `id notIn` was detected as a fast.

## 0.31.0 – Jan 12, 2021

### New

- Fields in the schema are sorted in alphabetical order.
- When the server responds with the timeout termination error, in addition to the error message
  server attaches the reason why this query was detected as a slow.
- `explainQuery*` queries that examine the provided query parameters and return the conclusion – is
  this query fast or potentially slow. In case when the query is marked as slow, the additional
  information is provided about the reasons why this query is slow.

### Fixed

- Before: if query timeout was triggered before the db responded, the client would receive a
  successful result with an empty result set. Now: in this situation the client will receive error "
  request terminated due to timeout".
- Before: Q-Server crashed if statsd endpoint was unavailable. Now: StatsD socket recreates on
  statsd sending error.
- Tailing comma is ignored in ArangoDB configuration string.

## 0.30.0 – Dec 15, 2020

### New

- `info.endpoints` field returns list of alternative endpoints

## 0.29.2 – Nov 13, 2020

### New

- `ZerostateAccount` schema info

## 0.29.1 – Nov 13, 2020

### Fixed

- `zerostates` uses immutable database

## 0.29.0 – Nov 13, 2020

### New

- `zerostates` query to access blockchain Zero State.

## 0.28.7 – Nov 10, 2020

### Fixed

- Update node-fetch version to 2.6.1

## 0.28.6 – Oct 24, 2020

### New

- MemcachedClient: use hashedKey constructed from fingerprint of cold collection sizes
- MemcachedClient: hotUpdate fingerprint on mutator `dropCachedDbInfo`

## 0.28.5 – Oct 20, 2020

### Fixed

- crash when subscription filter is invalid.
- aggregation of empty set failed when it runs over partitioned data.

## 0.28.4 – Oct 19, 2020

### New

- MemcachedClient: by using memjs library

## 0.28.3 – Oct 18, 2020

### Fix

- MaxListenersExceededWarning in case when more than 6 joined objects in result.

## 0.28.2 – Oct 6, 2020

### New

- Size limit for external messages (60000).

## 0.28.1 – Sep 15, 2020

### Fix

- Aggregation functions worked wrong on partitioned data.

## 0.28.0 – Aug 15, 2020

### New

- Request broker that supports new gate-node arch (hot-dbs, cold-cache, cold-dbs).

### Fix

- False execution of subscriptions that had `some_big_int_field: { ne: null }` in filter.

## 0.27.9 – Aug 21, 2020

### Fix

- `acc_type` field in Account expanded with `NonExist` status

## 0.27.8 – Aug 12, 2020

### New

- `mam` mutation `dropCachedDbInfo` to reset cached indexes.

### Fix

- Update indexes retries if index creation has failed on the timeout.
- Basic Debian image updated from "Stretch" to "Buster" to meet dependencies.

## 0.27.7 – Jul 31, 2020

### Fix

- Release resources associated with aborted GraphQL requests.

## 0.27.6 – Jul 27, 2020

### New

- StatsD counter `qserver.start` with additional tag `{version=package.json.version}`.

## 0.27.5 – Jul 23, 2020

### Fix

- Slow detector must detects queries like `FILTER workchain_id == -1 SORT seq_no DESC` as a fast
  query.

## 0.27.4 – Jul 20, 2020

### New

- Field `state_hash` in `accounts` collection

## 0.27.3 – Jul 16, 2020

### New

- Add message tracing at: 1) post request 2) db notification / message has inserted

## 0.27.2 – Jul 8, 2020

### New

- Field `created_by` in `blocks`.

### Optimized

- Query builder generates reduced `RETURN` section according to the result set requested by user.

## 0.27.1 – Jun 16, 2020

### Optimized

- Queries like `{ signatures: { any: { node_id: { in: ["1", "2"] } } } }` generates optimized AQL
  like `(doc.signatures[*].node_id IN @v1) OR (doc.signatures[*].node_id IN @v2)`.

## 0.27.0 – Jun 3, 2020

### New

- Support for signed numbers encoded with strings.
- Field `balance_delta` and `balance_delta_other` of `Transaction`.
- `when` arg to join fields – ability to include joined objects into result set only if some
  conditions met.

  In following example we return `dst_transaction` only for messages with `value` greater than zero:

  ```graphql
  query { 
      messages { 
          dst_transaction(timeout: 0, when: { value: { gt: "0" } }) {
              id 
          } 
          value
          dst
      }
  }
  ```

- Unit test infrastructure is now suitable for TDD. It starts q-server and performs graphql queries
  during tests.

  ⚠️ Important to CI: you must run tests in environment correctly configured to start q-server
  connected to valid Arangodb with enough for tests set of data. You can configure q-server using
  env variables due to README.

### Fixed

- Unix time strings now correctly show unix seconds.

## 0.26.3 – May 7, 2020

### New

- Fields `Block.key_field` and `Block.boc`.
- Field `expireAt` in post requests.
- Field `time` in `info` query.
- `src_transaction` will wait only when `messages.created_lt` !== 0 (because there is no transaction
  for such messages).

### Fixed

- master config `p20`, `p21`, `p18` fields types

## 0.26.2 – May 6, 2020

### Fixed

- master config p17 field sizes

## 0.26.1 – May 4, 2020

### Fixed

- Aggregates on nested array fields failed with `value.substr is not function`.
- Slow detector for `MIN` `MAX` aggregates must use a specified field as `order by` to detect fast
  query.
- Indexes reloaded from db first time on demand and then every 1 hour.
- Config p17 stake types.

## 0.26.0 – May 2, 2020

### New

- companion fields `*_string` for fields that holds unix time values
- `timeout` argument (default to 40sec) to all join fields (used to wait joined document in
  condition of eventual consistency)
- companion fields `*_hash` containing BOC root hash for `code`, `data` and `library` fields in
  accounts and messages
- `qserver.query.failed` - statsd counter for failed queries
- `qserver.query.slow` - statsd counter for slow queries
- `qserver.post.count` - statsd counter for node requests
- `qserver.post.failed` - statsd counter for failed node requests
- `Q_KEEP_ALIVE` configuration parameter specify interval in ms of keep alive messages for active
  subscriptions (default 60000).

### Optimized

- array `any` filter with single field `eq` operator optimized to `<param> IN <path-to-field>` AQL
- aggregate with empty filter and single `COUNT` uses `RETURN LENGTH(<collection>)`

### Fixed

- fixed `seq_no` field in `BlockSignatures` (it contained shard ident before), added correct `shard`
  field.
- aggregation functions must return `null` when no data to aggregate (was `[Object object]`)

## 0.25.0 – Apr 17, 2020

### Featured

- Schema graph enhancements
- Filter language enhancements

### Breaking Compatibility

- some ENV configuration variables have renamed (to be prefixed with `Q_`).

### New

- `block` join added to `Message`, `Transaction`, and `BlockSignatures`
- `OR` combination operator in filters
- Added new fields (`gen_utime`, `seq_no`, `workchain_id`, `proof`, `validator_list_hash_short`
  , `catchain_seqno`, `sig_weight`) into `BlockSignatures`
- aggregation queries: `aggregateBlockSignatures`, `aggregateBlocks`, `aggregateTransactions`
  , `aggregateMessages`, `aggregateAccounts`
- `--statsd-tags` (`Q_STATSD_TAGS`) config parameter to specify additional tags

### Fixed

- all configuration env variables changed to be prefixed with `Q_`

## 0.24.9 – Apr 13, 2020

### Fixed

- internal memory optimizations
- jaeger injection format has changed from BINARY to TEXT_MAP

### New

- `shuffle_mc_validators` field to `CatchainConfig` struct (config param 28)
- `new_catchain_ids` field to `ConsensusConfig` struct (config param 29)
- jaeger endpoint without protocol part will use agent instead of collector.

## 0.24.8 – Apr 9, 2020

### Featured

### New

- supported new type of outbound message `dequeueShort` (msg_type: 7): added fields `msg_env_hash`
  , `next_workchain`, `next_addr_pfx`, `import_block_lt` to `OutMsg` type.

## 0.24.7 – Apr 8, 2020

### Featured

StatsD support

### New

- `--statsd-server` parameter (`Q_STATSD_SERVER` env) config option to specify StatsD server address
- `qserver.doc.count`, `qserver.query.count`, `qserver.query.time`, `qserver.query.active` statsd
  metrics

## 0.24.6 – Apr 5, 2020

### Featured

Stability fixes

### Fixed

- slow queries detector use filter and orderBy analysis
- fixed string format for big numbers
- change arangochair dependency to forked version (cause of dropped original repository)
- type of `total_weight` and `weight` fixed to `u64`

## 0.24.5 – Mar 27, 2020

### Featured

Stability fixes

### New

- `operationId` parameter to query methods
- `finishOperations` mutation

### Fixed

- inactive listeners were reduced with help of operation ids
- subscriptions with arrays crash

## 0.24.4 – Mar 20, 2020

### Featured

Scheme enhancements Security fixes

### New

- all big number fields can be optionally parametrized with `format` argument `HEX` (default)
  or `DEC`.
- `Message` contains new joined fields `src_transaction` (from where this message was originated)
  and `dst_transaction` (where this message was handled).
- `--mam-access-keys` and `MAM_ACCESS_KEYS` config to protect mam endpoint.
- all queries and mutations inside single GraphQL request must use the same access key.

### Fixed

- change type of `transaction_id` to string
- `auth` parameter of subscription changed to `accessKey`
- invalid `accessKey` treated by subscribe as a valid key
- all internal errors are logged as is but converted to `Service temporary unavailable` before
  sending to client
- server side stack traces are truncated before sending to client
- waitFor 2 minute limit timeout has been removed

## 0.24.3 – Mar 2, 2020

### Featured

Stability fixes

### New

- `min_shard_gen_utime` and `max_shard_gen_utime` fields in `block.master`

### Fixed

- joined objects returned as `null` if joined object inserted in DB later than parent object.

## 0.24.2 – Feb 19, 2020

### Featured

Ability to set restrictions to accounts for particular access keys

### New

- `accessKey` optional header used instead of `authorization`.
- keys passed to `registerAccessKeys` as structures (instead of strings) and
  include `restrictToAccounts` optional field

### Fixed

- message & transaction ids in `out_msg_descr`

## 0.24.1 – Feb 11, 2020

### New

- `--trace-service` (or `Q_TRACE_SERVICE` env) specify service name that will be used in jaeger.
- `--trace-tags` (or `Q_TRACE_TAGS` env) specify additional tags associated with a spans.

## 0.24.0 - Feb 10, 2020

### Featured

- Auth support

### New

- `--auth-endpoint` (or `AUTH_ENDPOINT` env) config option. Specify address of auth service.
- `authorization` optional header added to specify access token.
- `accessKey` optional parameter added to all GraphQL queries to specify access token in GraphQL
  playground.
- `getManagementAccessKey` query one time management access key.
- `registerAccessKeys` mutation to register account's access keys.
- `revokeAccessKeys` mutation to revoke account's access keys.

## 0.23.0 - Feb 5, 2020

### New

- OpenTracing (jaeger) support
- workchain_id field added alongside with account address to `accounts.workchain_id`
  , `transactions.workchain_id`, `messages.src_workchain_id`, `messages.dst_workchain_id`
- field `prev_key_block_seqno` into `blocks` collection

## 0.22.0 - January 22, 2020

### New

- Support for redirecting slow queries to alternative db connection.
- In scalar operations `undefined` (or missing) value is treated as `null`.

### Fixed

- Skip execution of queries with `false` filter.
