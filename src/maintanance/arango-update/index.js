const { Database } = require('arangojs');
const { dataCollectionInfo } = require('../../server/data/data');
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

async function updateCollection(collection, arango) {
    const dbCollection = arango.collection(collection.name);
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
            let indexCreated = false;
            while (!indexCreated) {
                try {
                    await dbCollection.createPersistentIndex(required.fields);
                    indexCreated = true;
                } catch(error) {
                    if (error.message.toLowerCase().indexOf('timeout') >= 0) {
                        console.log(`Index creation failed: ${error.message}. Retrying...`);
                    } else {
                        throw error;
                    }
                }
            }
        }
    }
}

async function updateDb(config) {
    const arango = new Database({
        url: await detectRedirect(config.server),

    });
    if (config.auth) {
        const [user, password] = config.auth.split(':');
        arango.useBasicAuth(user, password);
    }
    arango.useDatabase(config.name);
    for (const collection of [...Object.values(dataCollectionInfo)]) {
        await updateCollection(collection, arango);
    }
    await arango.close();
}

function update(servers, options) {
    (async () => {
        let hasErrors = false;
        for (const server of [].concat(servers)) {
            console.log(`Update ${server}`);
            try {
                await updateDb({
                    server,
                    name: 'blockchain',
                    auth: options.auth,
                });
            } catch (error) {
                console.error(error);
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


