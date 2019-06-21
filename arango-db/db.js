const {Database, aqlQuery} = require('arangojs');


function createDb(config, logs) {
	const log = logs.create('Arango DB');
	const serverAddress = config.database.servers[0];
	const databaseName = config.database.name;

	const db = new Database(`http://${serverAddress}`);
	db.useDatabase(databaseName);

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

	const fetchDoc = async (collection, id) => wrap(async () => {
		return convertDoc(await collection.document(id));
	});

	const fetchDocs = async (collection, filter) => wrap(async () => {
		// const cursor = await db.query(query);
		// const docs = await cursor.all();
		// return docs.map(convertDoc);
		return [];
	});


	return {
		log,
		serverAddress,
		databaseName,

		convertDoc,

		fetchDoc,
		fetchDocs,

		transactions: db.collection('transactions'),
		messages: db.collection('messages'),
		accounts: db.collection('accounts'),
		blocks: db.collection('blocks'),
	}
}


module.exports = createDb;
