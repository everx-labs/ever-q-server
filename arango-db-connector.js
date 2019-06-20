const {Database, aqlQuery} = require('arangojs');

module.exports = async (config, createLog) => {
	const log = createLog('ArangoDB Connector');
	const db = new Database(config.database.servers[0]);
	db.useDatabase(config.database.name);

	const transactions = db.collection('transactions');
	const messages = db.collection('messages');
	const accounts = db.collection('accounts');
	const blocks = db.collection('blocks');

	const wrap = async (fetch) => {
		try {
			return await fetch();
		} catch (err) {
			const error = {
				message: err.message || err.ArangoError || err.toString(),
				code: err.code
			};
			log.error('Db operation failed: ', err);
			throw error;
		}
	};

	const convertDoc = (doc) => {
		return Object.assign({}, doc, {id: doc._key});
	};

	const fetchDoc = async (fetch) => convertDoc(await wrap(fetch));

	const fetchAll = async (query) => wrap(async () => {
		const cursor = await db.query(query);
		const docs = await cursor.all();
		return docs.map(convertDoc);
	});

	return {
		transaction: async (id) => fetchDoc(() => transactions.document(id)),
		message: async (id) => fetchDoc(() => messages.document(id)),
		allMessages: async () => fetchAll(aqlQuery`FOR m IN messages RETURN m`),
		account: async (id) => fetchDoc(() => accounts.document(id)),
		block: async (id) => fetchDoc(() => blocks.document(id)),
	}
};
