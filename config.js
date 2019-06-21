module.exports = {
	server: {
		host: 'localhost',
		port: 4000,
	},
	database: {
		servers: ['azp005.tonlabs.io:8529'],
		name: 'blockchain',
	},
	listener: {
		restartTimeout: 1000
	}
};
