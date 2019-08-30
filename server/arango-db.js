const {Database} = require('arangojs');
const {qlFilter, testFilter} = require('./filters');


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

    const fetchDocs = async (collection, args, filterType) => wrap(async () => {
        const filter = args.filter || {};
        const filterSection = Object.keys(filter).length > 0
            ? `FILTER ${qlFilter('doc', filter, filterType)}`
            : '';
        const sortSection = '';
        const limitSection = 'LIMIT 50';

        const query = `
            FOR doc IN ${collection.name}
            ${filterSection}
            ${sortSection}
            ${limitSection}
            RETURN doc`;
        const cursor = await db.query({query, bindVars: {}});
        return await cursor.all();
    });

    const fetchQuery = async (query, bindVars) => wrap(async () => {
        const cursor = await db.query({query, bindVars});
        return cursor.all();
    });


    return {
        log,
        serverAddress,
        databaseName,

        fetchDocs,
        fetchQuery,

        transactions: db.collection('transactions'),
        messages: db.collection('messages'),
        accounts: db.collection('accounts'),
        blocks: db.collection('blocks'),
    }
}


module.exports = createDb;
