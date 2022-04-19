import { Database } from "arangojs"
import program from "commander"
import fetch from "node-fetch"
import { URL } from "url"
import { INDEXES } from "../../server/data/blockchain"
import { QIndexInfo } from "../../server/data/data-provider"

function sameFields(a: string[], b: string[]): boolean {
    return a.join(",").toLowerCase() === b.join(",").toLowerCase()
}

async function detectRedirect(url: string) {
    try {
        const response = await fetch(url)
        return new URL(response.url).origin
    } catch {
        return url
    }
}

type ArangoIndex = {
    id: string
    fields: string[]
}

async function updateCollection(
    name: string,
    indexes: QIndexInfo[],
    arango: Database,
) {
    const dbCollection = arango.collection(name)
    const existingIndexes: ArangoIndex[] = await dbCollection.indexes()
    for (const existing of existingIndexes) {
        if (!indexes.find(x => sameFields(x.fields, existing.fields))) {
            console.log(
                `${name}: remove index [${
                    existing.id
                }] on [${existing.fields.join(",")}]`,
            )
            await dbCollection.dropIndex(existing.id)
        }
    }
    for (const required of indexes) {
        if (!existingIndexes.find(x => sameFields(x.fields, required.fields))) {
            console.log(
                `${name}: create index on [${required.fields.join(",")}]`,
            )
            let indexCreated = false
            while (!indexCreated) {
                try {
                    await dbCollection.createPersistentIndex(required.fields)
                    indexCreated = true
                } catch (error) {
                    if (error.message.toLowerCase().indexOf("timeout") >= 0) {
                        console.log(
                            `Index creation failed: ${error.message}. Retrying...`,
                        )
                    } else {
                        throw error
                    }
                }
            }
        }
    }
}

async function updateDb(config: {
    server: string
    name: string
    auth?: string
}) {
    const arango = new Database({
        url: await detectRedirect(config.server),
    })
    if (config.auth) {
        const [user, password] = config.auth.split(":")
        arango.useBasicAuth(user, password)
    }
    arango.useDatabase(config.name)
    for (const [name, info] of Object.entries(INDEXES)) {
        await updateCollection(name, info.indexes, arango)
    }
    await arango.close()
}

function update(servers: string[], options: { auth?: string }) {
    void (async () => {
        let hasErrors = false
        for (const server of ([] as string[]).concat(servers)) {
            console.log(`Update ${server}`)
            try {
                await updateDb({
                    server,
                    name: "blockchain",
                    auth: options.auth,
                })
            } catch (error) {
                console.error(error)
                hasErrors = true
            }
        }
        process.exit(hasErrors ? 1 : 0)
    })()
}

program
    .arguments("[servers...]")
    .option("-a, --auth <user:password>", "user:password", "")
    .action(update)
    .parse(process.argv)
