const fs = require('fs');

const express = require("express");
const {createServer} = require("http");

const {PubSub} = require('apollo-server');
const {ApolloServer} = require('apollo-server-express');

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
		const pubsub = new PubSub();
		const db = createDb(this.config, this.logs);
		startListener(db, pubsub, this.config);

		const typeDefs = fs.readFileSync('server/type-defs.graphql', 'utf-8');
		const resolvers = createResolvers(db, pubsub);

		const server = new ApolloServer({
			typeDefs,
			resolvers,
		});

		const app = express();
		server.applyMiddleware({app, path: '/graphql'});

		const httpServer = createServer(app);
		server.installSubscriptionHandlers(httpServer);

		httpServer.listen({
			host: this.config.server.host,
			port: this.config.server.port
		}, () => {
			const uri = `http://${this.config.server.host}:${this.config.server.port}/graphql`;
			this.log.debug(`Started on ${uri}`);
		});
	}
}


module.exports = TONQServer;
