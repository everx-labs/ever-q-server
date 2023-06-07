import {
    testServerQuery,
    testServerRequired,
    testServerStop,
} from "./init-tests"

async function queryBlock(useCollectionApi: boolean, fields: string) {
    const data: any = await testServerQuery(
        useCollectionApi
            ? `query { blocks(limit:1) { ${fields} } }`
            : `query { blockchain { blocks(first:1) { edges { node { ${fields} } } } } }`,
    )
    return useCollectionApi
        ? data.blocks[0]
        : data.blockchain.blocks.edges[0].node
}

test("BOC storage (disabled)", async (): Promise<any> => {
    await testServerRequired()
    const b1 = await queryBlock(true, "id boc")
    expect(b1.boc.length).toBeGreaterThan(64)

    const b2 = await queryBlock(false, "hash boc")
    expect(b2.boc.length).toBeGreaterThan(64)

    const b3 = await queryBlock(true, "boc")
    expect(b3.boc.length).toBeGreaterThan(64)

    const b4 = await queryBlock(false, "boc")
    expect(b4.boc.length).toBeGreaterThan(64)

    await testServerStop()
})

test("BOC storage (pattern)", async (): Promise<any> => {
    await testServerRequired({
        blockBocs: {
            pattern: "{hash}",
        },
    })

    const b1 = await queryBlock(true, "id boc")
    expect(b1.boc).toEqual(b1.id)

    const b2 = await queryBlock(false, "hash boc")
    expect(b2.boc).toEqual(b2.hash)

    const b3 = await queryBlock(true, "boc")
    expect(b3.boc.length).toEqual(64)

    const b4 = await queryBlock(false, "boc")
    expect(b4.boc.length).toEqual(64)

    await testServerStop()
})
