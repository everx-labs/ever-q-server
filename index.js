const {ApolloServer} = require('apollo-server');

const config = {
	database: {
		servers: ['http://azp005.tonlabs.io:8529'],
		name: 'blockchain',
	}
};


const createDbConnector = require('./arango-db-connector');
const createExecutor = require('./graphql-executor');
const createLog = (name) => ({
	error(...args) {
		console.error(`[${name}] `, ...args);
	},
	debug(...args) {
		console.debug(`[${name}] `, ...args);
	}
});

(async () => {
	const db = await createDbConnector(config, createLog);
	const executor = await createExecutor(db, createLog);
	const server = new ApolloServer(executor);

	server.listen().then(({url}) => {
		console.log(`Server ready at ${url}`);
	});
})();

