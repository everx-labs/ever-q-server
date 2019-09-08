// @flow
import fs from 'fs';

import express from 'express';
import http from 'http';
import https from 'https';

import { ApolloServer } from 'apollo-server-express';

import Arango from './arango';

import { createResolvers } from './arango-resolvers';
import type { QConfig } from "./config";
import QLogs from "./logs";
import type { QLog } from "./logs";

type QOptions = {
    config: QConfig,
    logs: QLogs,
}

export default class TONQServer {
    config: QConfig;
    logs: QLogs;
    log: QLog;
    db: Arango;

    constructor(options: QOptions) {
        this.config = options.config;
        this.logs = options.logs;
        this.log = this.logs.create('Q Server');
    }


    async start() {
        const config = this.config.server;
        const ssl = config.ssl;

        this.db = new Arango(this.config, this.logs);
        const typeDefs = fs.readFileSync('server/type-defs.graphql', 'utf-8');
        const resolvers = createResolvers(this.db);
        await this.db.start();

        const apollo = new ApolloServer({
            typeDefs,
            resolvers,
        });

        const app = express();
        apollo.applyMiddleware({ app, path: '/graphql' });

        let server;
        if (ssl) {
            server = https.createServer(
                {
                    key: fs.readFileSync(ssl.key),
                    cert: fs.readFileSync(ssl.cert)
                },
                app
            )
        } else {
            server = http.createServer(app)
        }
        apollo.installSubscriptionHandlers(server);

        server.listen({
            host: config.host,
            port: ssl ? ssl.port : config.port
        }, () => {
            const uri = `http${ssl ? 's' : ''}://${config.host}:${ssl ? ssl.port : config.port}/graphql`;
            this.log.debug(`Started on ${uri}`);
        });
    }
}

