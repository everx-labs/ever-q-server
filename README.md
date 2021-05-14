# ton-q-server

TON GraphQL Server.

This component is a part of TON-Server and must not be accessed directly but through TON Labs Client Libraries.

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
    Option                         ENV                      Default        Description
    -----------------------------  -----------------------  -------------  ---------------------------------------------------------
    --endpoints <array>            Q_ENDPOINTS                             Alternative endpoints of q-server (comma separated addresses)
    --host <address>               Q_HOST                   192.168.1.137  Listening address
    --port <number>                Q_PORT                   4000           Listening port
    --keep-alive <number>          Q_KEEP_ALIVE             60000          GraphQL keep alive ms
    --requests-mode <string>       Q_REQUESTS_MODE          kafka          Requests mode (kafka | rest)
    --requests-server <address>    Q_REQUESTS_SERVER        kafka:9092     Requests server url
    --requests-topic <string>      Q_REQUESTS_TOPIC         requests       Requests topic name
    --requests-max-size <number>   Q_REQUESTS_MAX_SIZE      16383          Maximum request message size in bytes
    --data-mut <url>               Q_DATA_MUT               arangodb       Data mutable db config url
    --data-hot <url>               Q_DATA_HOT               arangodb       Data hot db config url
    --data-cold <array>            Q_DATA_COLD                             Data cold db config urls (comma separated)
    --data-cache <url>             Q_DATA_CACHE                            Data cache config url
    --data-counterparties <url>    Q_DATA_COUNTERPARTIES    <mut>          Data counterparties db config url
    --slow-queries-mut <url>       Q_SLOW_QUERIES_MUT       arangodb       Slow queries mutable db config url
    --slow-queries-hot <url>       Q_SLOW_QUERIES_HOT       arangodb       Slow queries hot db config url
    --slow-queries-cold <array>    Q_SLOW_QUERIES_COLD                     Slow queries cold db config urls (comma separated)
    --slow-queries-cache <url>     Q_SLOW_QUERIES_CACHE                    Slow queries cache config url
    --auth-endpoint <url>          Q_AUTH_ENDPOINT                         Auth endpoint
    --mam-access-keys <string>     Q_MAM_ACCESS_KEYS                       Access keys used to authorize mam endpoint access
    --jaeger-endpoint <url>        Q_JAEGER_ENDPOINT                       Jaeger endpoint
    --trace-service <string>       Q_TRACE_SERVICE          Q Server       Trace service name
    --trace-tags <array>           Q_TRACE_TAGS                            Additional trace tags (comma separated name=value pairs)
    --statsd-server <address>      Q_STATSD_SERVER                         StatsD server (host:port)
    --statsd-tags <array>          Q_STATSD_TAGS                           Additional StatsD tags (comma separated name=value pairs)
    --statsd-reset-interval <ms>   Q_STATSD_RESET_INTERVAL  0              Interval between statsd reconnects. If it is zero – no reconnects.
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

Next, collect fields from filter and order by into index (filter fields must be placed first in any order, then fields from `orderBy` in same order as in `orderBy`:

```text
collection: messages
filter: src:{eq},dst:{eq},value:{ne}
orderBy: created_at DESC
index: src,dst,value,created_at
```

## For Developers

IMPORTANT!!!

**FIRST**. If you have modified source code you need to compile it with babel:

```bash
npm run babel
```

This will regenerate file in `dist` folder.

**SECOND**. If you want to modify scheme of database, you must do it only in one place `db.scheme.js`.
After that you need to generate source code for a graphql type definitions and for resolvers JavaScript code.
You must do it with:

```bash
npm run babel
npm run gen
npm run babel
```

Yes, you need too run babel twice :(.

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

You can change default behavior with env:

```bash
export Q_DATA_MUT=http://localhost:8529
export Q_DATA_HOT=${Q_DATA_MUT}
export Q_DATA_COLD=${Q_DATA_MUT}
export Q_SLOW_QUERIES_MUT=${Q_DATA_MUT}
export Q_SLOW_QUERIES_HOT=${Q_DATA_MUT}
export Q_SLOW_QUERIES_COLD=${Q_DATA_MUT}
```
