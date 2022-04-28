import { KVIterator, KVProvider } from "./kv-provider"
import { ConfigParam } from "../config-param"

export type ListKeys = {
    listKey: string
    changesKey: string
}

export function listChangesConfigParams(
    name: string,
    optionPrefix: string,
    defaultListKey: string,
    defaultChangesKey: string,
) {
    return {
        listKey: ConfigParam.string(
            `${optionPrefix}-${name}-list-key`,
            defaultListKey,
            `Key for ${name} list\n` +
                `This parameter must contain substring \`{${name}}\`\n` +
                `that will be replaced with actual ${name} id`,
        ),

        changesKey: ConfigParam.string(
            `${optionPrefix}-${name}-changes-key`,
            defaultChangesKey,
            `Key for ${name} changes channel\n` +
                `This parameter must contain substring \`{${name}}\`\n` +
                `that will be replaced with actual ${name} id`,
        ),
    }
}

export async function startListChangesIterator<T>(
    provider: KVProvider,
    keys: ListKeys,
    mapItem: (item: unknown) => T,
    timeout: {
        beforeFirst: number
        afterFirst: number
    },
): Promise<KVIterator<T>> {
    const iterator = new KVIterator<T>()
    let processed = 0
    let timeoutHandle = setTimeout(
        () => iterator.throw(new Error("Timeout")),
        timeout.beforeFirst,
    )

    async function pushNext() {
        const items = await provider.list<T[]>(
            keys.listKey,
            0,
            -(processed + 1),
        )
        if (items !== null && items !== undefined && items.length > 0) {
            clearTimeout(timeoutHandle)
            processed += items.length
            for (let i = items.length - 1; i >= 0; i -= 1) {
                iterator.push(mapItem(items[i]))
            }
            timeoutHandle = setTimeout(
                () => iterator.throw(new Error("Timeout")),
                timeout.afterFirst,
            )
        }
    }

    void (async () => {
        try {
            await pushNext()
            const changesIterator = await provider.subscribe(keys.changesKey)
            iterator.onClose = async () => {
                if (changesIterator.return) {
                    await changesIterator.return()
                }
                clearTimeout(timeoutHandle)
            }
            let done = false
            while (!done) {
                done = (await changesIterator.next()).done ?? false
                if (!done) {
                    await pushNext()
                }
            }
        } catch (error) {
            void iterator
                .throw(new Error("Internal server error"))
                .then(() => {})
        }
    })().then(() => {})

    return iterator
}
