const { Database } = require('arangojs');
const { BLOCKCHAIN_DB } = require('./config');

function sameFields(a, b) {
    return a.join(',').toLowerCase() === b.join(',').toLowerCase();
}

async function updateCollection(collection, db) {
    const existingIndexes = await db.collection(collection.name).indexes();
    existingIndexes.forEach((existing) => {
        if (!collection.indexes.find(x => sameFields(x.fields, existing.fields))) {
            console.log(`${collection.name}: remove index [${existing.id}] on [${existing.fields.join(',')}]`);
            db.collection(collection.name).dropIndex(existing.id)
        }
    });
    collection.indexes.forEach((required) => {
        if (!existingIndexes.find(x => sameFields(x.fields, required.fields))) {
            console.log(`${collection.name}: create index on [${required.fields.join(',')}]`);
            db.collection(collection.name).createPersistentIndex(required.fields);
        }
    });
}

async function updateDb(config) {
    const db = new Database({
        url: config.server,
    });
    db.useDatabase(config.name);
    if (config.auth) {
        const authParts = config.auth.split(':');
        db.useBasicAuth(authParts[0], authParts.slice(1).join(':'));
    }
    for (const collection of [...Object.values(BLOCKCHAIN_DB.collections)]) {
        await updateCollection(collection, db);
    }
}

const configs = [
    {
        server: 'http://localhost:8081',
        name: BLOCKCHAIN_DB.name,
    }
];

(async () => {
    console.log('>>>', process.argv);
    for (const config of configs) {
        await updateDb(config);
    }
})();


