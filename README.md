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
                                                                                                                                        `kafka` – writes external messages to kafka topic
                                                                                                                                        `rest` – posts external messages to REST endpoint
--requests-server                               Q_REQUESTS_SERVER                               kafka:9092                              Requests server url
--requests-topic                                Q_REQUESTS_TOPIC                                requests                                Requests topic name
--requests-max-size                             Q_REQUESTS_MAX_SIZE                             16383                                   Maximum request message size in bytes
--subscriptions-kafka-server                    Q_SUBSCRIPTIONS_KAFKA_SERVER                    kafka:9092                              Subscriptions server url (for 'external' subscriptions mode)
--subscriptions-kafka-topic                     Q_SUBSCRIPTIONS_KAFKA_TOPIC                     subscriptions                           Subscriptions topic name (for 'external' subscriptions mode)
--subscriptions-max-filter-size                 Q_SUBSCRIPTIONS_MAX_FILTER_SIZE                 16383                                   Maximum subscription's filter size in bytes (for 'external' subscriptions mode)
--subscriptions-filters-millis                  Q_SUBSCRIPTIONS_FILTERS_MILLIS                  30000                                   Kafka keep alive period for filters in millisecons (for 'external' subscriptions mode)
--subscriptions-redis-port                      Q_SUBSCRIPTIONS_REDIS_PORT                      6379                                    Redis port (for 'external' subscriptions mode)
--subscriptions-redis-host                      Q_SUBSCRIPTIONS_REDIS_HOST                      redis                                   Redis host (for 'external' subscriptions mode)
--filter-or-conversion                          Q_FILTER_OR_CONVERSION                          sub-queries                             Filter OR conversion:
                                                                                                                                        `or-operator` – q-server uses AQL with OR
                                                                                                                                        `sub-queries` – q-server performs parallel queries for each OR operand
                                                                                                                                         and combines results (this option provides faster execution
                                                                                                                                         than OR operator in AQL)
--query-max-runtime                             Q_QUERY_MAX_RUNTIME                             600                                     Max allowed execution time for ArangoDb queries in seconds
--slow-queries                                  Q_SLOW_QUERIES                                  redirect                                Slow queries handling:
                                                                                                                                        `enable` – process slow queries on the main database
                                                                                                                                        `redirect` – redirect slow queries to slow-queries database
                                                                                                                                        `disable` – fail on slow queries
--query-wait-for-period                         Q_QUERY_WAIT_FOR_PERIOD                         1000                                    Collection polling period for wait-for queries
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
--subscriptions-mode                            Q_SUBSCRIPTIONS_MODE                            arango                                  Subscriptions mode:
                                                                                                                                        `disabled` - disable subscriptions
                                                                                                                                        `arango` - subscribe to ArangoDB WAL for changes
                                                                                                                                        `external` - use external services to handle subscriptions
--hot-cache                                     Q_HOT_CACHE                                                                             hot cache server
--hot-cache-expiration                          Q_HOT_CACHE_EXPIRATION                          10                                      hot cache expiration in seconds
--hot-cache-empty-data-expiration               Q_HOT_CACHE_EMPTY_DATA_EXPIRATION               2                                       hot cache empty entries expiration in seconds
--accounts                                      Q_ACCOUNTS                                                                              Accounts databases
--blocks-hot                                    Q_BLOCKS_HOT                                                                            Blocks hot databases
--blocks-cache                                  Q_BLOCKS_CACHE                                                                          Blocks cache server
--blocks-cold                                   Q_BLOCKS_COLD                                                                           Blocks cold databases
--transactions-hot                              Q_TRANSACTIONS_HOT                                                                      Transactions and messages hot databases
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
--slow-queries-blocks-cache                     Q_SLOW_QUERIES_BLOCKS_CACHE                                                             Slow queries blocks cache server
--slow-queries-blocks-cold                      Q_SLOW_QUERIES_BLOCKS_COLD                                                              Slow queries blocks cold databases
--slow-queries-transactions-hot                 Q_SLOW_QUERIES_TRANSACTIONS_HOT                                                         Slow queries transactions and messages hot databases
--slow-queries-transactions-cache               Q_SLOW_QUERIES_TRANSACTIONS_CACHE                                                       Slow queries transactions and messages cache server
--slow-queries-transactions-cold                Q_SLOW_QUERIES_TRANSACTIONS_COLD                                                        Slow queries transactions and messages cold databases
--slow-queries-zerostate                        Q_SLOW_QUERIES_ZEROSTATE                                                                Slow queries zerostate database
--data-mut (DEPRECATED)                         Q_DATA_MUT                                      arangodb                                Data mutable db config url
--data-hot (DEPRECATED)                         Q_DATA_HOT                                      arangodb                                Data hot db config url
--data-cold (DEPRECATED)                        Q_DATA_COLD                                                                             Data cold db config urls (comma separated)
--data-cache (DEPRECATED)                       Q_DATA_CACHE                                                                            Data cache config url
--data-counterparties (DEPRECATED)              Q_DATA_COUNTERPARTIES                                                                   Data counterparties db config url
--slow-queries-mut (DEPRECATED)                 Q_SLOW_QUERIES_MUT                              arangodb                                Slow-queries mutable db config url
--slow-queries-hot (DEPRECATED)                 Q_SLOW_QUERIES_HOT                              arangodb                                Slow-queries hot db config url
--slow-queries-cold (DEPRECATED)                Q_SLOW_QUERIES_COLD                                                                     Slow-queries cold db config urls (comma separated)
--slow-queries-cache (DEPRECATED)               Q_SLOW_QUERIES_CACHE                                                                    Slow-queries cache config url
--slow-queries-counterparties (DEPRECATED)      Q_SLOW_QUERIES_COUNTERPARTIES                                                           Slow-queries counterparties db config url
--auth-endpoint                                 Q_AUTH_ENDPOINT                                                                         Auth endpoint
--jaeger-endpoint                               Q_JAEGER_ENDPOINT                                                                       Jaeger endpoint
--trace-service                                 Q_TRACE_SERVICE                                 Q Server                                Trace service name
--trace-tags                                    Q_TRACE_TAGS                                                                            Additional trace tags (comma separated name=value pairs)
--statsd-server                                 Q_STATSD_SERVER                                                                         StatsD server (host:port)
--statsd-tags                                   Q_STATSD_TAGS                                                                           Additional StatsD tags (comma separated name=value pairs)
--statsd-reset-interval                         Q_STATSD_RESET_INTERVAL                         0                                       Interval between statsd reconnects.
                                                                                                                                        If it is zero – no reconnects.
--mam-access-keys                               Q_MAM_ACCESS_KEYS                                                                       Access keys used to authorize mam endpoint access
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

enum RequestsMode {
    KAFKA = "kafka",
    REST = "rest",
}

enum FilterOrConversion {
    OR_OPERATOR = "or-operator",
    SUB_QUERIES = "sub-queries",
}
```

Command line parameters and ENV variables with "databases" at the end of desciption accept comma-separated list of database urls (described below). E.g.:
```text
Q_ACCOUNTS: accounts_db_url
Q_BLOCKS_HOT: blocks_00_url,blocks_01_url,blocks_10_url,blocks_11_url
```

Zerostate database defaults to the first database in hot blocks databases.
Db config must be specified in form of URL:

```text
    `[https://][user:password@]host[:8529][/path][?[name=blockchain][&maxSockets=100][&listenerRestartTimeout=1000]]`
```

Default values:

- protocol is `https://`;
- auth is empty (it is means no auth);
- port is `8529`;
- path is empty;
- name is `blockchain`;
- maxSockets is `100` for fast queries and `3` for slow queries.
- listenerRestartTimeout is `1000`.

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
$ tondev se start
Starting tonlabs-tonos-se-user... ✓
$ tondev se set --db-port 8901
Stopping [tonlabs-tonos-se-user]... ✓
Removing [tonlabs-tonos-se-user]... ✓
Creating tonlabs-tonos-se-user... ✓
Starting tonlabs-tonos-se-user... ✓
$ tondev se info
Instance  State    Version  GraphQL Port  ArangoDB Port  Docker Container       Docker Image
--------  -------  -------  ------------  -------------  ---------------------  --------------------------
default   running  0.28.11  80            8901           tonlabs-tonos-se-user  tonlabs/local-node:0.28.11
$ npm run test
```

Optionally you can change Arango address for the tests
```
$ tondev se info
Instance  State    Version  GraphQL Port  ArangoDB Port  Docker Container       Docker Image
--------  -------  -------  ------------  -------------  ---------------------  --------------------------
default   running  0.28.11  80            2021           tonlabs-tonos-se-user  tonlabs/local-node:0.28.11
$ export Q_DATA_MUT="http://localhost:2021"
$ npm run test
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
        "zerostate": "",
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
        "zerostate": "",
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

### Sharding configuration

**CAUTION**: sharding is experimental and is likely to change.

In the current state of code only Q_ACCOUNTS, Q_BLOCKS_HOT, Q_TRANSACTIONS_HOT databases and their "SLOW_QUERIES" counterparts could be sharded. For these six types of databases:
1. Sharding depth is determined as log2 of databases count.
2. If sharding depth is not an integer, the error is thrown (so there should be 1, 2, 4, 8, ... databases).
3. For every database the shard name is determined as last sharding depth symbols of database name. So for 8 databases case the database with name "blockchain-101" will have shard name "101".

- Accounts are considered sharded by workchain id: -1 and 0 resides in 0 shard ("000" for the case with 8 databases), 1 - in 1 ("001"), etc. So there should be at least as many account databases as there are workchains.
- Transactions and messages are considered to be sharded by the first bits by account hash ("-1:ac..." -> "ac" -> "10101011..." -> "1010" for the case with 16 databases).
- Blocks are considered to be sharded by the first bits of block id.

### Example configuration with a sharded database

```bash
export Q_BLOCKS_HOT=
export Q_BLOCKS_HOT="http://arango-3.example.com:8529?maxSockets=10&name=blockchain-hot-011,${Q_BLOCKS_HOT}"
export Q_BLOCKS_HOT="http://arango-0.example.com:8529?maxSockets=10&name=blockchain-hot-000,${Q_BLOCKS_HOT}"
export Q_BLOCKS_HOT="http://arango-1.example.com:8529?maxSockets=10&name=blockchain-hot-001,${Q_BLOCKS_HOT}"
export Q_BLOCKS_HOT="http://arango-5.example.com:8529?maxSockets=10&name=blockchain-hot-101,${Q_BLOCKS_HOT}"
export Q_BLOCKS_HOT="http://arango-2.example.com:8529?maxSockets=10&name=blockchain-hot-010,${Q_BLOCKS_HOT}"
export Q_BLOCKS_HOT="http://arango-4.example.com:8529?maxSockets=10&name=blockchain-hot-100,${Q_BLOCKS_HOT}"
export Q_BLOCKS_HOT="http://arango-6.example.com:8529?maxSockets=10&name=blockchain-hot-110,${Q_BLOCKS_HOT}"
export Q_BLOCKS_HOT="http://arango-7.example.com:8529?maxSockets=10&name=blockchain-hot-111,${Q_BLOCKS_HOT}"

export Q_TRANSACTIONS_HOT=${Q_BLOCKS_HOT}
export Q_ACCOUNTS=${Q_BLOCKS_HOT}
export Q_ZEROSTATE="http://arango-0.example.com:8529?maxSockets=10&name=blockchain-hot-000"

export Q_REQUESTS_MODE=kafka
export Q_REQUESTS_TOPIC=requests
export Q_REQUESTS_SERVER="kafka.example.com:9092"

export Q_JAEGER_ENDPOINT="http://jaeger.example.com:14268/api/traces"
export Q_TRACE_SERVICE=q-server
export Q_TRACE_TAGS=network=rustnet

export Q_STATSD_SERVER="statsd.example.com:9125"
```
