const arangochair = require('arangochair');


function startListener(db, pubsub, config) {
	const listenerUrl = `http://${db.serverAddress}/${db.databaseName}`;
	const listener = new arangochair(listenerUrl);
	['transactions', 'messages', 'accounts', 'blocks'].forEach(collectionName => {
		listener.subscribe({collection: collectionName});
		listener.on(collectionName, (docJson, type) => {
			if (type === 'insert/update') {
				const doc = db.convertDoc(JSON.parse(docJson));
				pubsub.publish(collectionName, {[collectionName]: doc});
			}
		});
	});
	listener.start();
	db.log.debug('Listen database', listenerUrl);
	listener.on('error', (err, httpStatus, headers, body) => {
		db.log.error('Listener failed: ', {err, httpStatus, headers, body});
		setTimeout(() => listener.start(), config.arango.restartTimeout);
	});
}


module.exports = startListener;
