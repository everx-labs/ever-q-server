const fs = require('fs');

const express = require("express");
const {createServer} = require("http");

const {PubSub} = require('apollo-server');
const {ApolloServer} = require('apollo-server-express');

const createDb = require('./arango-db/db');
const createListener = require('./arango-db/listener');
const createResolvers = require('./resolvers');

const config = require('./config');
const logs = require('./logs');


async function main() {

	const pubsub = new PubSub();
	const db = createDb(config, logs);
	const listener = createListener(db, pubsub, config);

	const typeDefs = fs.readFileSync('type-defs.graphql', 'utf-8');
	const resolvers = createResolvers(db, pubsub);

	const server = new ApolloServer({
		typeDefs,
		resolvers,
	});

	const app = express();
	server.applyMiddleware({app, path: '/graphql'});

	const httpServer = createServer(app);
	server.installSubscriptionHandlers(httpServer);

	httpServer.listen({port: config.server.port}, () => {
		console.log(`GraphQL Server on http://localhost:${config.server.port}/${config.database.name}`);
	});
}


(async () => {
	await main();
})();

