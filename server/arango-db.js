const {Database} = require('arangojs');
const matcher = require('./matcher');


function createDb(config, logs) {
    const log = logs.create('Arango DB');
    const serverAddress = config.database.server;
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

    const fetchDocs = async (collection, filter) => wrap(async () => {
        const match = filter.match || {};
        const id = match.id;
        if (id) {
            let doc = await collection.document(id, true);
            if (!doc) {
                return [];
            }
            doc = convertDoc(doc);
            if (Object.keys(match).length === 1) {
                return [doc];
            }
            return matcher(match)(doc) ? [doc] : [];
        }
        throw {
            code: 'FetchDocsWithoutId',
            message: 'FetchDocs must include id field'
        }
    });

    const fetchQuery = async (query, bindVars) => wrap(async () => {
        const cursor = await db.query({query, bindVars});
        return cursor.all();
    });


    return {
        log,
        serverAddress,
        databaseName,

        convertDoc,
        fetchDocs,
        fetchQuery,

        transactions: db.collection('transactions'),
        messages: db.collection('messages'),
        accounts: db.collection('accounts'),
        blocks: db.collection('blocks'),
    }
}


module.exports = createDb;
