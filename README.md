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
Option                                      ENV                                Default           Description
------------------------------------------  ---------------------------------  ----------------  ----------------------------------------------------------------------
--config                                    Q_CONFIG                                             Path to JSON configuration file
--host                                      Q_HOST                             {ip}              Listening address
--port                                      Q_PORT                             4000              Listening port
--keep-alive                                Q_KEEP_ALIVE                       60000             GraphQL keep alive ms
--requests-mode                             Q_REQUESTS_MODE                    kafka             Requests mode:
                                                                                                 `kafka` – writes external messages to kafka topic
                                                                                                 `rest` – posts external messages to REST endpoint
--requests-server                           Q_REQUESTS_SERVER                  kafka:9092        Requests server url
--requests-topic                            Q_REQUESTS_TOPIC                   requests          Requests topic name
--requests-max-size                         Q_REQUESTS_MAX_SIZE                16383             Maximum request message size in bytes
--filter-or-conversion                      Q_FILTER_OR_CONVERSION             sub-queries       Filter OR conversion:
                                                                                                 `or-operator` – q-server uses AQL with OR
                                                                                                 `sub-queries` – q-server performs parallel queries for each OR operand
                                                                                                  and combines results (this option provides faster execution
                                                                                                  than OR operator in AQL)
--wait-for-period                           Q_WAIT_FOR_PERIOD                  1000              Wait-for collection polling in ms
--hot-cache                                 Q_HOT_CACHE                                          hot cache server
--accounts                                  Q_ACCOUNTS                                           Accounts databases
--blocks-hot                                Q_BLOCKS_HOT                                         Blocks hot databases
--blocks-cache                              Q_BLOCKS_CACHE                                       Blocks cache server
--blocks-cold                               Q_BLOCKS_COLD                                        Blocks cold databases
--transactions-hot                          Q_TRANSACTIONS_HOT                                   Transactions hot databases
--transactions-cache                        Q_TRANSACTIONS_CACHE                                 Transactions cache server
--transactions-cold                         Q_TRANSACTIONS_COLD                                  Transactions cold databases
--zerostate                                 Q_ZEROSTATE                                          Zerostate database
--counterparties                            Q_COUNTERPARTIES                                     Counterparties databases
--chain-ranges-verification                 Q_CHAIN_RANGES_VERIFICATION                          Chain ranges verification databases
--slow-queries                              Q_SLOW_QUERIES                     redirect          Slow queries handling:
                                                                                                 `enable` – process slow queries on the main database
                                                                                                 `redirect` – redirect slow queries to slow-queries database
                                                                                                 `disable` – fail on slow queries
--slow-queries-hot-cache                    Q_SLOW_QUERIES_HOT_CACHE                             Slow queries hot cache server
--slow-queries-accounts                     Q_SLOW_QUERIES_ACCOUNTS                              Slow queries accounts databases
--slow-queries-blocks-hot                   Q_SLOW_QUERIES_BLOCKS_HOT                            Slow queries blocks hot databases
--slow-queries-blocks-cache                 Q_SLOW_QUERIES_BLOCKS_CACHE                          Slow queries blocks cache server
--slow-queries-blocks-cold                  Q_SLOW_QUERIES_BLOCKS_COLD                           Slow queries blocks cold databases
--slow-queries-transactions-hot             Q_SLOW_QUERIES_TRANSACTIONS_HOT                      Slow queries transactions hot databases
--slow-queries-transactions-cache           Q_SLOW_QUERIES_TRANSACTIONS_CACHE                    Slow queries transactions cache server
--slow-queries-transactions-cold            Q_SLOW_QUERIES_TRANSACTIONS_COLD                     Slow queries transactions cold databases
--slow-queries-zerostate                    Q_SLOW_QUERIES_ZEROSTATE                             Slow queries zerostate database
--data-mut (DEPRECATED)                     Q_DATA_MUT                         arangodb          Data mutable db config url
--data-hot (DEPRECATED)                     Q_DATA_HOT                         arangodb          Data hot db config url
--data-cold (DEPRECATED)                    Q_DATA_COLD                                          Data cold db config urls (comma separated)
--data-cache (DEPRECATED)                   Q_DATA_CACHE                                         Data cache config url
--data-counterparties (DEPRECATED)          Q_DATA_COUNTERPARTIES                                Data counterparties db config url
--slow-queries-mut (DEPRECATED)             Q_SLOW_QUERIES_MUT                 arangodb          Slow-queries mutable db config url
--slow-queries-hot (DEPRECATED)             Q_SLOW_QUERIES_HOT                 arangodb          Slow-queries hot db config url
--slow-queries-cold (DEPRECATED)            Q_SLOW_QUERIES_COLD                                  Slow-queries cold db config urls (comma separated)
--slow-queries-cache (DEPRECATED)           Q_SLOW_QUERIES_CACHE                                 Slow-queries cache config url
--slow-queries-counterparties (DEPRECATED)  Q_SLOW_QUERIES_COUNTERPARTIES                        Slow-queries counterparties db config url
--auth-endpoint                             Q_AUTH_ENDPOINT                                      Auth endpoint
--jaeger-endpoint                           Q_JAEGER_ENDPOINT                                    Jaeger endpoint
--trace-service                             Q_TRACE_SERVICE                    Q Server          Trace service name
--trace-tags                                Q_TRACE_TAGS                                         Additional trace tags (comma separated name=value pairs)
--statsd-server                             Q_STATSD_SERVER                                      StatsD server (host:port)
--statsd-tags                               Q_STATSD_TAGS                                        Additional StatsD tags (comma separated name=value pairs)
--statsd-reset-interval                     Q_STATSD_RESET_INTERVAL            0                 Interval between statsd reconnects.
                                                                                                 If it is zero – no reconnects.
--mam-access-keys                           Q_MAM_ACCESS_KEYS                                    Access keys used to authorize mam endpoint access
--is-tests                                  Q_IS_TESTS                         false             Determines that q-server runs in unit tests mode.
--network-name                              Q_NETWORK_NAME                     cinet.tonlabs.io  Define the name of the network q-server is working with
--cache-key-prefix                          Q_CACHE_KEY_PREFIX                 Q_                Prefix string to identify q-server keys in data cache
--endpoints                                 Q_ENDPOINTS                                          Alternative endpoints of q-server (comma separated addresses)
```

If you use `config.json` file the specified file must have the following structure (in TypeScript
notation):

```ts
type QConfig = {
    config: string,
    filter: FilterConfig,
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
    blockchain: QBlockchainDataConfig,
    counterparties: string[],
    chainRangesVerification: string[],

    slowQueries: SlowQueriesMode,
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
    accounts: string[],
    blocks: QHotColdDataConfig,
    transactions: QHotColdDataConfig,
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

Db config must be specified in form of URL:

```text
    `[https://][user:password@]host[:8529][/path][?[name=blockchain][&maxSockets=100][&listenerRestartTimeout=60000]]`
```

Default values:

- protocol is `https://`;
- auth is empty (it is means no auth);
- port is `8529`;
- path is empty;
- name is `blockchain`;
- maxSockets is `100` for fast queries and `3` for slow queries.
- listenerRestartTimeout is `60000` for fast queries and `3` for slow queries.

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
place `db-schema.ts`. After that you need to generate source code for a graphql type definitions and
for resolvers JavaScript code. You must do it with:

```bash
npm run tsc
npm run gen
npm run tsc
```

Yes, you need too run tsc twice :(.

## Tests

By default tests connects to Arango on [http://localhost:8901]

```bash
$ tondev info
TON Labs Dev Tools 0.17.7

default network/blockchain:

  Used version: latest
  Bound to host port: 8080
  Arango DB is bound to host port: 8901
  Docker image: tonlabs/local-node:latest
  Docker container: tonlabs-local-node-g9d running

$ tondev start
$ npm run test
```

## Configuration

You can change default behavior with env:

```bash
export Q_DATA_MUT=http://localhost:8529
export Q_DATA_HOT=${Q_DATA_MUT}
export Q_DATA_COLD=${Q_DATA_MUT}
export Q_SLOW_QUERIES_MUT=${Q_DATA_MUT}
export Q_SLOW_QUERIES_HOT=${Q_DATA_MUT}
export Q_SLOW_QUERIES_COLD=${Q_DATA_MUT}
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
	"data": {
		"mut": "",
		"hot": "",
		"cold": [],
		"cache": "",
		"counterparties": "",
		"chainRangesVerification": ""
	},
	"slowQueries": {
		"mode": "redirect",
		"mut": "arangodb",
		"hot": "arangodb",
		"cold": [],
		"cache": ""
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

QServer can reload config file without an actal restart by handling `SIGHUP` signal.

Required at least one of `--config` or `env Q_CONFIG` to be set at server start
