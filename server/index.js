import TONQServer from './server';
import config from './config';
import QLogs from './logs';

const server = new TONQServer({
	config,
	logs: new QLogs(),
});

export function main() {
    (async () => {
        try {
            await server.start();
        } catch (error) {
            server.log.error('Start failed:', error);
            process.exit(1);
        }
    })();
}
