import { KVIterator, KVProvider } from "./kv-provider"
import { ConfigParam } from "../config-param"

export type DataChangesKeys = {
    dataKey: string
    changesKey: string
}

export function dataChangesConfigParams(prefix: string, name: string) {
    return {
        dataKey: ConfigParam.string(
            `${prefix}-${name}-data-key`,
            `${prefix}-receipts:{${name}Id}`,
            `Key for ${name} data\n` +
                `This parameter must contain substring \`{${name}Id}\`\n` +
                `that will be replaced with actual ${name} id`,
        ),

        changesKey: ConfigParam.string(
            `${prefix}-${name}-changes-key`,
            `keyspace@0:${prefix}-receipts:{${name}Id}`,
            `Key for ${name} changes channel\n` +
                `This parameter must contain substring \`{${name}Id}\`\n` +
                `that will be replaced with actual ${name} id`,
        ),
    }
}

export async function startDataChangesIterator<T>(
    provider: KVProvider,
    keys: DataChangesKeys,
    mapData: (data: unknown) => T,
): Promise<KVIterator<T>> {
    const iterator = new KVIterator<T>()
    let pushedCount = 0

    async function pushNext() {
        const data = await provider.get<T[]>(keys.dataKey)
        if (data !== null && data !== undefined) {
            while (pushedCount < data.length) {
                iterator.push(mapData(data[pushedCount]))
                pushedCount += 1
            }
        }
    }

    await pushNext()
    void (async () => {
        const changesIterator = await provider.subscribe(keys.changesKey)
        iterator.onClose = async () => {
            if (changesIterator.return) {
                await changesIterator.return()
            }
        }
        let done = false
        while (!done) {
            done = (await changesIterator.next()).done ?? false
            if (!done) {
                await pushNext()
            }
        }
    })().then(() => {})

    return iterator
}
