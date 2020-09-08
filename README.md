# ton-q-server
TON GraphQL Server.

This component is a part of TON-Server and must not be accessed directly but through TON Labs Client Libraries.

# Prerequisites

Node.js

# Install

Clone this repository and run
```bash
npm install
```

# Setup

You can configure Q Server with command line parameters and/or ENV variables:

    Option                        ENV                   Default        Description
    ----------------------------  --------------------  -------------  ---------------------------------------------------------
    --host <value>                Q_HOST                192.168.1.137  Listening address
    --port <value>                Q_PORT                4000           Listening port
    --keep-alive <value>          Q_KEEP_ALIVE          60000          GraphQL keep alive ms
    --requests-mode <value>       Q_REQUESTS_MODE       kafka          Requests mode (kafka | rest)
    --requests-server <value>     Q_REQUESTS_SERVER     kafka:9092     Requests server url
    --requests-topic <value>      Q_REQUESTS_TOPIC      requests       Requests topic name
    --data-mut <value>            Q_DATA_MUT            arangodb       Data mutable db config url
    --data-hot <value>            Q_DATA_HOT            arangodb       Data hot db config url
    --data-cold <value>           Q_DATA_COLD                          Data cold db config urls (comma separated)
    --data-cache <value>          Q_DATA_CACHE                         Data cache config url
    --slow-queries-mut <value>    Q_SLOW_QUERIES_MUT    arangodb       Slow queries mutable db config url
    --slow-queries-hot <value>    Q_SLOW_QUERIES_HOT    arangodb       Slow queries hot db config url
    --slow-queries-cold <value>   Q_SLOW_QUERIES_COLD                  Slow queries cold db config urls (comma separated)
    --slow-queries-cache <value>  Q_SLOW_QUERIES_CACHE                 Slow queries cache config url
    --auth-endpoint <value>       Q_AUTH_ENDPOINT                      Auth endpoint
    --mam-access-keys <value>     Q_MAM_ACCESS_KEYS                    Access keys used to authorize mam endpoint access
    --jaeger-endpoint <value>     Q_JAEGER_ENDPOINT                    Jaeger endpoint
    --trace-service <value>       Q_TRACE_SERVICE       Q Server       Trace service name
    --trace-tags <value>          Q_TRACE_TAGS                         Additional trace tags (comma separated name=value pairs)
    --statsd-server <value>       Q_STATSD_SERVER                      StatsD server (host:port)
    --statsd-tags <value>         Q_STATSD_TAGS                        Additional StatsD tags (comma separated name=value pairs)

Db config must be specified in form of URL:

    `[https://][user:password@]host[:8059][/path][?[name=blockchain][&maxSockets=100][&listenerRestartTimeout=60000]]`

Default values:
- protocol is `https://`;
- auth is empty (it is means no auth);
- port is `8529`;
- path is empty;
- name is `blockchain`;
- maxSockets is `100` for fast queries and `3` for slow queries.
- listenerRestartTimeout is `60000` for fast queries and `3` for slow queries.
    
    
# Run

```bash
node index.js
```

# Connectivity

Q-Server is accessible with GraphQL HTTP/WebSocket protocol on port "4000" and path "/graphql".

There is the only valid way to communicate with Q-Server – TON Labs Client Libraries.

# StatsD

Q-Server reports several StatsD metrics if it is configured with `statsd` option:

    Metric                Type     Tags             Description
    --------------------  -------  ---------------  -------------------------------------------------------------
    qserver.start         counter  collection=name  Incremented for each start.
                                                    Contains the `version` tag.

    qserver.doc.count     counter  collection=name  Incremented for each db event (document insert/update)

    qserver.post.count    counter                   Incremented for each node request

    qserver.post.failed   counter                   Incremented for each failed node request

    qserver.query.count   counter  collection=name  Incremented for each db query

    qserver.query.failed  counter  collection=name  Incremented for each failed db query

    qserver.query.slow    counter  collection=name  Incremented each time when q-server has encountered
                                                    slow query

    qserver.query.time    timer    collection=name  Reported each time when q-server has finished 
                                                    query handler from SDK client
                                                       
    qserver.query.active  gauge    collection=name  Updated each time when q-server has started and finished 
                                                    query handler from SDK client

Q-Server can report additional tags with help of optional parameter `Q_STATSD_TAGS`. 
 
# Adding Indexes

If you need to add or change or remove index in Arango Db you must change following files:
- https://github.com/tonlabs/ton-q-server/blob/d491c7c0e6e11cb70d5f7f0813eef719ea6b997d/src/server/data/data-provider.js#L65
- https://github.com/tonlabs/TON-infrastructure/blob/ef4d409d9508ca5e1d815c5f21ec11f16c4b8f39/pipelines/arango/arango/initdb.d/upgrade-arango-db.js#L7

# For Developers

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
