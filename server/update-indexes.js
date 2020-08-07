const { Database } = require('arangojs');
const { BLOCKCHAIN_DB } = require('./config');
const program = require('commander');
const fetch = require('node-fetch');

function sameFields(a, b) {
    return a.join(',').toLowerCase() === b.join(',').toLowerCase();
}

async function detectRedirect(url) {
    try {
        const response = await fetch(url);
        return new URL(response.url).origin;
    } catch {
        return url;
    }
}

async function updateCollection(collection, db) {
    const dbCollection = db.collection(collection.name);
    const existingIndexes = await dbCollection.indexes();
    for (const existing of existingIndexes) {
        if (!collection.indexes.find(x => sameFields(x.fields, existing.fields))) {
            console.log(`${collection.name}: remove index [${existing.id}] on [${existing.fields.join(',')}]`);
            await dbCollection.dropIndex(existing.id);
        }
    }
    for (const required of collection.indexes) {
        if (!existingIndexes.find(x => sameFields(x.fields, required.fields))) {
            console.log(`${collection.name}: create index on [${required.fields.join(',')}]`);
            await dbCollection.createPersistentIndex(required.fields);
        }
    }
}

async function updateDb(config) {
    const db = new Database({
        url: await detectRedirect(config.server),

    });
    if (config.auth) {
        const [user, password] = config.auth.split(':');
        db.useBasicAuth(user, password);
    }
    db.useDatabase(config.name);
    for (const collection of [...Object.values(BLOCKCHAIN_DB.collections)]) {
        await updateCollection(collection, db);
    }
    await db.close();
}

function update(servers, options) {
    (async () => {
        let hasErrors = false;
        for (const server of [].concat(servers)) {
            console.log(`Update ${server}`);
            try {
                await updateDb({
                    server,
                    name: BLOCKCHAIN_DB.name,
                    auth: options.auth,
                });
            } catch (error) {
                console.error(error.message);
                hasErrors = true;
            }
        }
        process.exit(hasErrors ? 1 : 0);
    })();
}

program
    .arguments('[servers...]')
    .option('-a, --auth <user:password>', 'user:password', '')
    .action(update)
    .parse(process.argv);



