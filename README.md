# ton-q-server

TON GraphQL Server.

This component is a part of TON-Server and must not be accessed directly but through TON Labs Client
Libraries.

## Prerequisites

Node.js

## Install

Clone this repository and run

```bash
npm install
```

## Setup

You can configure Q Server with command line parameters and/or ENV variables:

```text
Option                                          ENV                                             Default                                 Description
----------------------------------------------  ----------------------------------------------  --------------------------------------  --------------------------------------------------------------------------------------
--config                                        Q_CONFIG                                                                                Path to JSON configuration file
--host                                          Q_HOST                                          {ip}                                    Listening address
--port                                          Q_PORT                                          4000                                    Listening port
--keep-alive                                    Q_KEEP_ALIVE                                    60000                                   GraphQL keep alive ms
--requests-mode                                 Q_REQUESTS_MODE                                 kafka                                   Requests mode:
                                                                                                                                        `tcpadnl` – posts external messages to c++ liteserver
                                                                                                                                        `kafka` – writes external messages to kafka topic
                                                                                                                                        `rest` – posts external messages to REST endpoint
                                                                                                                                        `jrpc` – posts external messages to JRPC endpoint
--requests-server                               Q_REQUESTS_SERVER                               kafka:9092                              Requests server url
--requests-pubkey                               Q_REQUESTS_PUBKEY                                                                       Liteserver base64 pubkey
--requests-topic                                Q_REQUESTS_TOPIC                                requests                                Requests topic name
--requests-max-size                             Q_REQUESTS_MAX_SIZE                             65535                                   Maximum request message size in bytes
--subscriptions-kafka-server                    Q_SUBSCRIPTIONS_KAFKA_SERVER                    kafka:9092                              Subscriptions server url (for 'external' subscriptions mode)
--subscriptions-kafka-topic                     Q_SUBSCRIPTIONS_KAFKA_TOPIC                     subscriptions                           Subscriptions topic name (for 'external' subscriptions mode)
--subscriptions-max-filter-size                 Q_SUBSCRIPTIONS_MAX_FILTER_SIZE                 65535                                   Maximum subscription's filter size in bytes (for 'external' subscriptions mode)
--subscriptions-filters-millis                  Q_SUBSCRIPTIONS_FILTERS_MILLIS                  30000                                   Kafka keep alive period for filters in millisecons (for 'external' subscriptions mode)
--subscriptions-redis-port                      Q_SUBSCRIPTIONS_REDIS_PORT                      6379                                    Redis port (for 'external' subscriptions mode)
--subscriptions-redis-host                      Q_SUBSCRIPTIONS_REDIS_HOST                      redis                                   Redis host (for 'external' subscriptions mode)
--subscriptions-health-redis-channel            Q_SUBSCRIPTIONS_HEALTH_REDIS_CHANNEL                                                    Redis channel with 'subscriptions are alive' messages
--subscriptions-health-timeout                  Q_SUBSCRIPTIONS_HEALTH_TIMEOUT                  60000                                   Timeout for 'subscriptions are alive' messages
--filter-or-conversion                          Q_FILTER_OR_CONVERSION                          sub-queries                             Filter OR conversion:
                                                                                                                                        `or-operator` – q-server uses AQL with OR
                                                                                                                                        `sub-queries` – q-server performs parallel queries for each OR operand
                                                                                                                                         and combines results (this option provides faster execution
                                                                                                                                         than OR operator in AQL)
--stringify-key-in-aql-comparison               Q_STRINGIFY_KEY_IN_AQL_COMPARISON               false                                   **UNSTABLE!** If `true` then AQL will use `TO_STRING(doc._key)` conversion
                                                                                                                                        if _key comparison operator is used in filter (e.g. `{ id: { lt: "123" }`).
--query-max-runtime                             Q_QUERY_MAX_RUNTIME                             600                                     Max allowed execution time for ArangoDb queries in seconds
--query-max-timeout-arg                         Q_QUERY_MAX_TIMEOUT_ARG                         86400000                                Max allowed `timeout` argument value (is ms) for collections queries
                                                                                                                                        (timeout will be coerced down to this value)
--slow-queries                                  Q_SLOW_QUERIES                                  redirect                                Slow queries handling:
                                                                                                                                        `enable` – process slow queries on the main database
                                                                                                                                        `redirect` – redirect slow queries to slow-queries database
                                                                                                                                        `disable` – fail on slow queries
--query-wait-for-period                         Q_QUERY_WAIT_FOR_PERIOD                         1000                                    Initial collection polling period for wait-for queries
                                                                                                                                        (collection queries with timeout) in ms
--remp-enabled                                  Q_REMP_ENABLED                                  false                                   REMP enabled
--remp-redis-client-url                         Q_REMP_REDIS_CLIENT_URL                         redis://localhost:6379                  URL to remp redis
--remp-message-list-key                         Q_REMP_MESSAGE_LIST_KEY                         remp-receipts:{message}                 Key for message list
                                                                                                                                        This parameter must contain substring `{message}`
                                                                                                                                        that will be replaced with actual message id
--remp-message-changes-key                      Q_REMP_MESSAGE_CHANGES_KEY                      __keyspace@0__:remp-receipts:{message}  Key for message changes channel
                                                                                                                                        This parameter must contain substring `{message}`
                                                                                                                                        that will be replaced with actual message id
--use-listeners (DEPRECATED)                    Q_USE_LISTENERS                                 true                                    Use database listeners for subscriptions (deprecated in favor of subscriptions-mode)
--walking-use-cache                             Q_WALKING_USE_CACHE                             false                                   Use cache to serve block walking algorithm
--ignore-messages-for-latency                   Q_IGNORE_MESSAGES_FOR_LATENCY                   false                                   Exclude messages from total latency (for networks without service messages)
--subscriptions-mode                            Q_SUBSCRIPTIONS_MODE                            arango                                  Subscriptions mode:
                                                                                                                                        `disabled` - disable subscriptions
                                                                                                                                        `arango` - subscribe to ArangoDB WAL for changes
                                                                                                                                        `external` - use external services to handle subscriptions
--hot                                           Q_HOT                                                                                   Default hot databases
--archive                                       Q_ARCHIVE                                                                               Default archive databases
--hot-cache                                     Q_HOT_CACHE                                                                             hot cache server
--hot-cache-expiration                          Q_HOT_CACHE_EXPIRATION                          10                                      hot cache expiration in seconds
--hot-cache-empty-data-expiration               Q_HOT_CACHE_EMPTY_DATA_EXPIRATION               2                                       hot cache empty entries expiration in seconds
--accounts                                      Q_ACCOUNTS                                                                              Accounts databases
--blocks-hot                                    Q_BLOCKS_HOT                                                                            Blocks hot databases
--blocks-archive                                Q_BLOCKS_ARCHIVE                                                                        Blocks archive databases
--blocks-cache                                  Q_BLOCKS_CACHE                                                                          Blocks cache server
--blocks-cold                                   Q_BLOCKS_COLD                                                                           Blocks cold databases
--transactions-hot                              Q_TRANSACTIONS_HOT                                                                      Transactions and messages hot databases
--transactions-archive                          Q_TRANSACTIONS_ARCHIVE                                                                  Transactions and messages archive databases
--transactions-cache                            Q_TRANSACTIONS_CACHE                                                                    Transactions and messages cache server
--transactions-cold                             Q_TRANSACTIONS_COLD                                                                     Transactions and messages cold databases
--zerostate                                     Q_ZEROSTATE                                                                             Zerostate database
--counterparties                                Q_COUNTERPARTIES                                                                        Counterparties databases
--chain-ranges-verification                     Q_CHAIN_RANGES_VERIFICATION                                                             Chain ranges verification databases
--slow-queries-hot-cache                        Q_SLOW_QUERIES_HOT_CACHE                                                                Slow queries hot cache server
--slow-queries-hot-cache-expiration             Q_SLOW_QUERIES_HOT_CACHE_EXPIRATION             10                                      Slow queries hot cache expiration in seconds
--slow-queries-hot-cache-empty-data-expiration  Q_SLOW_QUERIES_HOT_CACHE_EMPTY_DATA_EXPIRATION  2                                       Slow queries hot cache empty entries expiration in seconds
--slow-queries-accounts                         Q_SLOW_QUERIES_ACCOUNTS                                                                 Slow queries accounts databases
--slow-queries-blocks-hot                       Q_SLOW_QUERIES_BLOCKS_HOT                                                               Slow queries blocks hot databases
--slow-queries-blocks-archive                   Q_SLOW_QUERIES_BLOCKS_ARCHIVE                                                           Slow queries blocks archive databases
--slow-queries-blocks-cache                     Q_SLOW_QUERIES_BLOCKS_CACHE                                                             Slow queries blocks cache server
--slow-queries-blocks-cold                      Q_SLOW_QUERIES_BLOCKS_COLD                                                              Slow queries blocks cold databases
--slow-queries-transactions-hot                 Q_SLOW_QUERIES_TRANSACTIONS_HOT                                                         Slow queries transactions and messages hot databases
--slow-queries-transactions-archive             Q_SLOW_QUERIES_TRANSACTIONS_ARCHIVE                                                     Slow queries transactions and messages archive databases
--slow-queries-transactions-cache               Q_SLOW_QUERIES_TRANSACTIONS_CACHE                                                       Slow queries transactions and messages cache server
--slow-queries-transactions-cold                Q_SLOW_QUERIES_TRANSACTIONS_COLD                                                        Slow queries transactions and messages cold databases
--slow-queries-zerostate                        Q_SLOW_QUERIES_ZEROSTATE                                                                Slow queries zerostate database
--block-bocs-s3-endpoint                        Q_BLOCK_BOCS_S3_ENDPOINT                                                                block-bocs S3 endpoint
--block-bocs-s3-region                          Q_BLOCK_BOCS_S3_REGION                                                                  block-bocs S3 region
--block-bocs-s3-bucket                          Q_BLOCK_BOCS_S3_BUCKET                          everblocks                              block-bocs S3 bucket
--block-bocs-s3-access-key                      Q_BLOCK_BOCS_S3_ACCESS_KEY                                                              block-bocs S3 access key
--block-bocs-s3-secret-key                      Q_BLOCK_BOCS_S3_SECRET_KEY                                                              block-bocs S3 secret key
--block-bocs-pattern                            Q_BLOCK_BOCS_PATTERN                                                                    block-bocs BOC retrieval url pattern. `{hash} will be replaced with BOC's hash
--jaeger-endpoint                               Q_JAEGER_ENDPOINT                                                                       Jaeger endpoint
--trace-service                                 Q_TRACE_SERVICE                                 Q Server                                Trace service name
--trace-tags                                    Q_TRACE_TAGS                                                                            Additional trace tags (comma separated name=value pairs)
--statsd-server                                 Q_STATSD_SERVER                                                                         StatsD server (host:port)
--statsd-tags                                   Q_STATSD_TAGS                                                                           Additional StatsD tags (comma separated name=value pairs)
--statsd-reset-interval                         Q_STATSD_RESET_INTERVAL                         0                                       Interval between statsd reconnects.
                                                                                                                                        If it is zero – no reconnects.
--is-tests                                      Q_IS_TESTS                                      false                                   Determines that q-server runs in unit tests mode.
--network-name                                  Q_NETWORK_NAME                                  cinet.tonlabs.io                        Define the name of the network q-server is working with
--cache-key-prefix                              Q_CACHE_KEY_PREFIX                              Q_                                      Prefix string to identify q-server keys in data cache
--endpoints                                     Q_ENDPOINTS                                                                             Alternative endpoints of q-server (comma separated addresses)
```

If you use `config.json` file the specified file must have the following structure (in TypeScript
notation):

```ts
type QConfig = {
    config: string,
    server: {
        host: string,
        port: number,
        keepAlive: number,
    },
    requests: {
        mode: RequestsMode,
        server: string,
        pubkey: string,
        topic: string,
        maxSize: number,
    },
    queries: {
        filter: FilterConfig,
        maxRuntimeInS: number,
        slowQueries: SlowQueriesMode,
        waitForPeriod: number,
    },
    useListeners: boolean,
    blockchain: QBlockchainDataConfig,
    counterparties: string[],
    chainRangesVerification: string[],

    slowQueriesBlockchain?: QBlockchainDataConfig,

    data?: QDeprecatedDataConfig,
    slowQueriesData?: QDeprecatedDataConfig,

    authorization: {
        endpoint: string,
    },
    jaeger: {
        endpoint: string,
        service: string,
        tags: Record<string, string>,
    },
    statsd: {
        server: string,
        tags: string[],
        resetInterval: number,
    },
    mamAccessKeys: string[],
    isTests: boolean,
    networkName: string,
    cacheKeyPrefix: string,
    endpoints: string[],
};

type FilterConfig = {
    orConversion: FilterOrConversion,
};

type QBlockchainDataConfig = {
    hotCache?: string,
    hotCacheExpiration: number,
    hotCacheEmptyDataExpiration: number,
    accounts: string[],
    blocks: QHotColdDataConfig,
    transactions: QHotColdDataConfig,
    zerostate: string,
};

type QHotColdDataConfig = {
    hot: string[],
    cache?: string,
    cold: string[],
};

type QDeprecatedDataConfig = {
    mut?: string;
    hot?: string;
    cold?: string[];
    cache?: string;
    counterparties?: string;
};

enum SlowQueriesMode {
    ENABLE = "enable",
    REDIRECT = "redirect",
    DISABLE = "disable"
}

export enum RequestsMode {
    TCP_ADNL = "tcpadnl", // via c++ lite-server tcp adnl
    KAFKA = "kafka",
    REST = "rest",
    JRPC = "jrpc",
}

enum FilterOrConversion {
    OR_OPERATOR = "or-operator",
    SUB_QUERIES = "sub-queries",
}
```

Command line parameters and ENV variables with "databases"
at the end of description accept comma-separated list of database urls
(described below).
E.g.:
```text
Q_ACCOUNTS: accounts_db_url
Q_BLOCKS_HOT: blocks_00_url,blocks_01_url,blocks_10_url,blocks_11_url
```

Zerostate database defaults to the first database in hot blocks databases.
Db config must be specified in the form of URL:

```text
    `[https://][user:password@]host[:8529][/path][?[name=blockchain][&maxSockets=100][&listenerRestartTimeout=1000][&resultCacheTTL=0]]`
```

Parameters:

- `protocol` default value is `https://`;
- `auth` default is empty (it is means no auth);
- `port` default is `8529`;
- `path` default is empty;
- `name` default is `blockchain`;
- `maxSockets` is a maximum simultaneous connection to the arango database.
  Default is `100` for fast queries and `3` for slow queries.
- `listenerRestartTimeout` when Arango WAL listener has encountered a connection problem,
  it retries using this timeout.
  Measured in milliseconds.
  Default is `1000`.
- `resultCacheTTL` enables cache of the arango query results.
  Measured in milliseconds.
  `0` disables caching.
  Default is `0`.

## Run

```bash
node index.js
```

## Connectivity

Q-Server is accessible with GraphQL HTTP/WebSocket protocol on port "4000" and path "/graphql".

There is the only valid way to communicate with Q-Server – TON Labs Client Libraries.

## StatsD

Q-Server reports several StatsD metrics if it is configured with `statsd` option:

```text
    Metric                       Type     Tags             Description
    ---------------------------  -------  ---------------  -------------------------------------------------------------
    qserver.start                counter  collection=name  Incremented for each start.
                                                           Contains the `version` tag.

    qserver.doc.count            counter  collection=name  Incremented for each db event (document insert/update)

    qserver.post.count           counter                   Incremented for each node request

    qserver.post.failed          counter                   Incremented for each failed node request

    qserver.query.count          counter  collection=name  Incremented for each db query

    qserver.query.failed         counter  collection=name  Incremented for each failed db query

    qserver.query.slow           counter  collection=name  Incremented each time when q-server has encountered
                                                           slow query

    qserver.query.time           timer    collection=name  Reported each time when q-server has finished
                                                           query handler from SDK client

    qserver.query.active         gauge    collection=name  Updated each time when q-server has started and finished
                                                           query handler from SDK client

    qserver.subscription.count   counter  collection=name  Incremented for each subscription start

    qserver.stats.error.internal counter                   Incremented for each internal server error
```

Q-Server can report additional tags with help of optional parameter `Q_STATSD_TAGS`.

## Adding Indexes

If you need to add or change or remove index in Arango Db you must change following files:

- [https://github.com/tonlabs/ton-q-server/blob/d491c7c0e6e11cb70d5f7f0813eef719ea6b997d/src/server/data/data-provider.js#L65]
- [https://github.com/tonlabs/TON-infrastructure/blob/ef4d409d9508ca5e1d815c5f21ec11f16c4b8f39/pipelines/arango/arango/initdb.d/upgrade-arango-db.js#L7]

How to determine which index required to serve some slow query.

Let look to SLOW query reported by q-server log.

```text
messages QUERY {"filter":{"src":{"eq":"..."},"dst":{"eq":"..."},"value":{"ne":null},"OR":{"src":{"eq":"..."},"dst":{"eq":"..."},"value":{"ne":null}}},"orderBy":[{"path":"created_at","direction":"DESC"}],"limit":1}
```

First, lets extract `collection`, `filter` and `orderBy`:

```text
collection: messages
filter: {"src":{"eq":"..."},"dst":{"eq":"..."},"value":{"ne":null},"OR":{"src":{"eq":"..."},"dst":{"eq":"..."},"value":{"ne":null}}}
orderBy:[{"path":"created_at","direction":"DESC"}]
```

Next, reduce filter and order by:

- remove quotes;
- remove constants (`eq:"..."` -> `eq`);
- remove filter outer `{}`;
- replace order by with path direction pairs;

```text
collection: messages
filter: src:{eq},dst:{eq},value:{ne},OR:{src:{eq},dst:{eq},value:{ne}}
orderBy: created_at DESC
```

Next, separate filter by `OR` on several filters:

```text
collection: messages
filter: src:{eq},dst:{eq},value:{ne}
filter: src:{eq},dst:{eq},value:{ne}
orderBy: created_at DESC
```

Next, remove duplicated filters:

```text
collection: messages
filter: src:{eq},dst:{eq},value:{ne}
orderBy: created_at DESC
```

Next, collect fields from filter and order by into index (filter fields must be placed first in any
order, then fields from `orderBy` in same order as in `orderBy`:

```text
collection: messages
filter: src:{eq},dst:{eq},value:{ne}
orderBy: created_at DESC
index: src,dst,value,created_at
```

## For Developers

IMPORTANT!!!

**FIRST**. If you have modified source code you need to compile it:

```bash
npm run tsc
```

This will regenerate file in `dist` folder.

**SECOND**. If you want to modify scheme of database, you must do it only in one
place: `db-schema.ts`. After that you need to generate source code for a graphql type definitions and
for resolvers JavaScript code. You must do it with:

```bash
npm run tsc
npm run gen
npm run tsc
```

Yes, you need too run tsc twice :(.

## Tests

By default tests connect to Arango on [http://localhost:8901]

```bash
$ npx everdev se start
Starting tonlabs-tonos-se-user... ✓
$ npx everdev se set --db-port 8901
Stopping [tonlabs-tonos-se-user]... ✓
Removing [tonlabs-tonos-se-user]... ✓
Creating tonlabs-tonos-se-user... ✓
Starting tonlabs-tonos-se-user... ✓
$ npx everdev se info
Instance  State    Version  GraphQL Port  ArangoDB Port  Docker Container       Docker Image
--------  -------  -------  ------------  -------------  ---------------------  --------------------------
default   running  0.28.11  80            8901           tonlabs-tonos-se-user  tonlabs/local-node:0.28.11
$ Q_HOT=http://localhost:8901 Q_ARCHIVE=http://localhost:8901 Q_SLOW_QUERIES=enable npm run test
```

Optionally you can change Arango address for the tests
```
$ npx everdev se set --db-port 2021
$ npx everdev se info
Instance  State    Version  GraphQL Port  ArangoDB Port  Docker Container       Docker Image
--------  -------  -------  ------------  -------------  ---------------------  --------------------------
default   running  0.28.11  80            2021           tonlabs-tonos-se-user  tonlabs/local-node:0.28.11
$ export Q_ACCOUNTS="http://localhost:2021"
$ export Q_HOT="http://localhost:2021"
$ export Q_ARCHIVE="http://localhost:2021"
$ Q_SLOW_QUERIES=enable npm run test
```

## Configuration

You can change default behavior with env:

```bash
export Q_ACCOUNTS=http://localhost:8529
export Q_ACCOUNTS=${Q_DATA_MUT}
export Q_BLOCKS_HOT=${Q_DATA_MUT}
export Q_BLOCKS_COLD=${Q_DATA_MUT}
export Q_TRANSACTIONS_HOT=${Q_DATA_MUT}
export Q_TRANSACTIONS_COLD=${Q_DATA_MUT}
export Q_SLOW_QUERIES_ACCOUNTS=${Q_DATA_MUT}
export Q_SLOW_QUERIES_BLOCKS_HOT=${Q_DATA_MUT}
export Q_SLOW_QUERIES_BLOCKS_COLD=${Q_DATA_MUT}
export Q_SLOW_QUERIES_TRANSACTIONS_HOT=${Q_DATA_MUT}
export Q_SLOW_QUERIES_TRANSACTIONS_COLD=${Q_DATA_MUT}
```

or/and via arg `--config <path to config>`

```json
{
	"endpoints": [],
	"server": {
		"host": "localhost",
		"port": 4000,
		"keepAlive": 60000
	},
	"requests": {
		"mode": "rest",
		"server": "kafka:9092",
        "pubkey": "",
		"topic": "requests",
		"maxSize": "16383"
	},
    "blockchain": {
        "hotCache": "",
        "hotCacheExpiration": 10,
        "hotCacheEmptyDataExpiration": 3,
        "acounts": [],
        "blocks": {
            "hot": [],
            "cache": "",
            "cold": []
        },
        "transactions": {
            "hot": [],
            "cache": "",
            "cold": []
        },
        "zerostate": ""
    },
    "slowQueriesBlockchain": {
        "hotCache": "",
        "hotCacheExpiration": 10,
        "hotCacheEmptyDataExpiration": 3,
        "acounts": [],
        "blocks": {
            "hot": [],
            "cache": "",
            "cold": []
        },
        "transactions": {
            "hot": [],
            "cache": "",
            "cold": []
        },
        "zerostate": ""
    },
	"authEndpoint": "",
	"mamAccessKeys": "",
	"jaegerEndpoint": "",
	"trace": {
		"service": "",
		"tags": []
	},
	"statsd": {
		"server": "",
		"tags": [],
		"resetInterval": 0
	}
}
```

Configuration priority is follows:

    Program args > Config file > ENVs > defaults

### Reload config

QServer can reload config file without an actual restart by handling `SIGHUP` signal.

Required at least one of `--config` or `env Q_CONFIG` to be set at server start

### Run q-server in docker for development
If you want to run q-server in docker do the following:
1. Compile source files
```
npm install
npm run tsc
```
2. Build docker image
```
docker build . -t qserver
```
3. q-server needs other available resources (like ArangoDB and node). The easiest way to provide them is to run Evernode SE as a docker image:
```
$ everdev se start
$ everdev se set --db-port 8901
```
Wait a bit (sometimes it takes up to 2 minutes) and check if the ArangoDB web interface is available at http://localhost:8901.

4. Create and run a new container (change 192.168.122.1 to your IP address)
```
docker run --rm -d \
    -p 4000:4000 \
    -e Q_REQUESTS_MODE=rest \
    -e Q_REQUESTS_SERVER=192.168.122.1 \
    -e Q_DATA_MUT=http://192.168.122.1:8901 \
    -e Q_DATA_HOT=http://192.168.122.1:8901 \
  qserver
```
GraphQL playground must be available on http://localhost:4000/graphql
