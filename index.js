const TONQServer = require('./server/server');
const server = new TONQServer({
	config: require('./config'),
	logs: require('./logs'),
});
(async () => {
    await server.start();
})();


