import { extract2Hashes, canUseCache } from "../server/data/resolveUsingCache"
import { QCollectionQuery } from "../server/data/collection-query"

const filter1 = {
    prev_ref: {
        root_hash: {
            eq: "370ac14f099189e5687a54ea81d2c9e446ece785acb8394fec3d7bcec6cd242b",
        },
    },
    OR: {
        prev_alt_ref: {
            root_hash: {
                eq: "91a42de15399c6b510255bf4285ca31037875f9895f057c19ce77e131f2800c1",
            },
        },
    },
}

const filter2 = {
    prev_ref: {
        root_hash: {
            eq: "370ac14f099189e5687a54ea81d2c9e446ece785acb8394fec3d7bcec6cd242b",
        },
    },
    AND: {
        prev_alt_ref: {
            root_hash: {
                eq: "91a42de15399c6b510255bf4285ca31037875f9895f057c19ce77e131f2800c1",
            },
        },
    },
}

const query1 = {
    filter: {
        prev_ref: {
            root_hash: {
                eq: "34eb90cad79914ed255519cd81fe8b4d3082ede6a5907432871eddaff8f12585",
            },
        },
        OR: {
            prev_alt_ref: {
                root_hash: {
                    eq: "34eb90cad79914ed255519cd81fe8b4d3082ede6a5907432871eddaff8f12585",
                },
            },
        },
    },
    selection: [
        { name: "id", selection: [] },
        { name: "gen_utime", selection: [] },
        { name: "after_split", selection: [] },
        { name: "workchain_id", selection: [] },
        { name: "shard", selection: [] },
        {
            name: "in_msg_descr",
            selection: [
                { name: "msg_id", selection: [] },
                { name: "transaction_id", selection: [] },
            ],
        },
    ],
    orderBy: [],
    limit: 1,
    timeout: 74154,
    operationId: null,
    text: "\n                FOR doc IN UNION_DISTINCT(\n                FOR doc IN blocks\n                FILTER doc.prev_ref.root_hash == @v1\n                \n                LIMIT 1\n                RETURN { _key: doc._key, gen_utime: doc.gen_utime, after_split: doc.after_split, workchain_id: doc.workchain_id, shard: doc.shard, in_msg_descr: ( doc.in_msg_descr && ( FOR doc__in_msg_descr IN doc.in_msg_descr || [] RETURN { msg_id: doc__in_msg_descr.msg_id, transaction_id: doc__in_msg_descr.transaction_id } ) ) }\n            , \n                FOR doc IN blocks\n                FILTER doc.prev_alt_ref.root_hash == @v2\n                \n                LIMIT 1\n                RETURN { _key: doc._key, gen_utime: doc.gen_utime, after_split: doc.after_split, workchain_id: doc.workchain_id, shard: doc.shard, in_msg_descr: ( doc.in_msg_descr && ( FOR doc__in_msg_descr IN doc.in_msg_descr || [] RETURN { msg_id: doc__in_msg_descr.msg_id, transaction_id: doc__in_msg_descr.transaction_id } ) ) }\n            )\n                \n                LIMIT 1\n                RETURN doc",
    params: {
        v1: "34eb90cad79914ed255519cd81fe8b4d3082ede6a5907432871eddaff8f12585",
        v2: "34eb90cad79914ed255519cd81fe8b4d3082ede6a5907432871eddaff8f12585",
    },
    accessRights: { granted: true, restrictToAccounts: [] },
}
const query2 = {
    filter: {
        prev_ref: {
            root_hash: {
                eq: "34eb90cad79914ed255519cd81fe8b4d3082ede6a5907432871eddaff8f12585",
            },
        },
        OR: {
            prev_alt_ref: {
                root_hash: {
                    eq: "34eb90cad79914ed255519cd81fe8b4d3082ede6a5907432871eddaff8f12585",
                },
            },
        },
    },
    selection: [
        { name: "id", selection: [] },
        { name: "gen_utime", selection: [] },
        { name: "after_split", selection: [] },
        { name: "workchain_id", selection: [] },
        { name: "shard", selection: [] },
        {
            name: "in_msg_descr",
            selection: [
                { name: "msg_id", selection: [] },
                { name: "transaction_id", selection: [] },
            ],
        },
    ],
    orderBy: [],
    limit: 10,
    timeout: 74154,
}

test("Suitable filter", () => {
    const result: any = extract2Hashes(filter1)
    expect(Array.isArray(result)).toBe(true)

    expect(result[1]).toBe(
        "370ac14f099189e5687a54ea81d2c9e446ece785acb8394fec3d7bcec6cd242b",
    )
    expect(result[2]).toBe(
        "91a42de15399c6b510255bf4285ca31037875f9895f057c19ce77e131f2800c1",
    )
})

test("Unsuitable filter", () => {
    const result: any = extract2Hashes(filter2)
    expect(result).toBeNull()
})

test("This query can be resolved from cache", () => {
    const result = canUseCache(query1 as unknown as QCollectionQuery)
    expect(result).toBeTruthy()
})

test("This query CAN'T be resolved from cache", () => {
    const result = canUseCache(query2 as unknown as QCollectionQuery)
    expect(result).toBeFalsy()
})
