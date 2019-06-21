const arangochair = require('arangochair');

function createListener(db, pubsub, config) {
	let listener = null;
	const subscriptions = new Map();

	const restartListener = () => {
		if (listener) {
			listener.stop();
			listener = null;
		}
		if (subscriptions.size === 0) {
			return;
		}
		const listenerUrl = `http://${db.serverAddress}/${db.databaseName}`;
		listener = new arangochair(listenerUrl);
		[...subscriptions.keys()].forEach(name => {
			const sub = subscriptions.get(name);
			listener.subscribe({collection: sub.collection});
			listener.on(sub.collection, (docJson, type) => {
				if (type === 'insert/update') {
					const doc = db.convertDoc(JSON.parse(docJson));
					pubsub.publish(name, {[name]: doc});
				}
			});
		});
		listener.start();
		db.log.debug('Listener started at ', listenerUrl);
		listener.on('error', (err, httpStatus, headers, body) => {
			db.log.error('Listener failed: ', {err, httpStatus, headers, body});
			setTimeout(() => listener.start(), config.listener.restartTimeout);
		});
	};

	const subscribe = (name, collection) => {
		let sub = subscriptions.get(name);
		if (sub) {
			sub.count += 1;
			return;
		}
		subscriptions.set(name, {collection, count: 1});
		restartListener();
	};

	const unsubscribe = (name) => {
		let sub = subscriptions.get(name);
		if (!sub) {
			return;
		}
		sub.count -= 1;
		if (sub.count > 0) {
			return;
		}
		subscriptions.delete(name);
		restartListener();
	};

	subscriptions.set('transaction', { count: 1, collection: 'transactions' });
	subscriptions.set('message', { count: 1, collection: 'messages' });
	subscriptions.set('account', { count: 1, collection: 'accounts' });
	subscriptions.set('block', { count: 1, collection: 'blocks' });
	restartListener();

	return {
		subscribe,
		unsubscribe
	};
}

module.exports = createListener;
