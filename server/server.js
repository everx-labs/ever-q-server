const fs = require('fs');

const express = require("express");
const http = require("http");
const https = require("https");

const { PubSub } = require('apollo-server');
const { ApolloServer } = require('apollo-server-express');

const createDb = require('./arango-db');
const startListener = require('./arango-listener');

const createResolvers = require('./resolvers');

class TONQServer {
    constructor(options) {
        this.config = options.config || {};
        this.logs = options.logs;
        this.log = this.logs.create('Q Server');
    }


    async start() {
        const config = this.config.server;
        const ssl = config.ssl;

        const pubsub = new PubSub();
        const db = createDb(this.config, this.logs);
        startListener(db, pubsub, this.config);

        const typeDefs = fs.readFileSync('server/type-defs.graphql', 'utf-8');
        const resolvers = createResolvers(db, pubsub, this.logs);

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


module.exports = TONQServer;
