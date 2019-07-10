const TONQServer = require('./server/server');
const config = require('./config');
const logs = require('./logs');

const server = new TONQServer({
	config,
	logs,
});

(async () => {
    try {
        await server.start();
    } catch (error) {
        logs.create('Q-Server').error('Start failed:', error);
        process.exit(1);
    }
})();


