function getIp() {
	const ipv4 = Object.values(require('os').networkInterfaces())
		.flatMap(x => x)
		.find(x => x.family === 'IPv4' && !x.internal);
	return ipv4 && ipv4.address;
}

module.exports = {
	server: {
		host: getIp(),
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
