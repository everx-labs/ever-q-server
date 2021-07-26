import {INDEXES} from "../server/data/blockchain";
import {isFastQuery} from "../server/filter/slow-detector";
import {
    CollectionFilter,
    parseOrderBy,
    QType,
} from "../server/filter/filters";
import {
    Transaction,
    Account,
    Message,
    Block,
    BlockSignatures,
} from "../server/graphql/resolvers-generated";


test("Slow Detector", () => {
    const log = console;
    let collectionName: string;
    let collectionType: QType;

    function setCollection(name: string, type: QType) {
        collectionName = name;
        collectionType = type;
    }

    function isFast(filter: CollectionFilter, orderBy?: string) {
        return isFastQuery(
            collectionName,
            INDEXES[collectionName].indexes,
            collectionType,
            filter,
            orderBy !== undefined ? parseOrderBy(orderBy) : [],
            log,
        );
    }

    setCollection("blocks_signatures", BlockSignatures);
    expect(isFast({ signatures: { any: { node_id: { in: ["1", "2"] } } } })).toBeTruthy();

    setCollection("accounts", Account);
    expect(isFast({ id: { eq: "1" } })).toBeTruthy();
    expect(isFast({}, "balance")).toBeTruthy();
    expect(isFast({
        id: { eq: "1" },
        balance: { gt: "0" },
    })).toBeTruthy();

    setCollection("transactions", Transaction);
    expect(isFast({
        id: { notIn: ["1"] },
        workchain_id: { eq: 0 },
        now: { ge: 1610237274 },
    }, "now")).toBeFalsy();
    expect(isFast({ now: { ge: 1 } }, "now desc, id desc")).toBeTruthy();
    expect(isFast({ account_addr: { eq: "1" } }, "lt desc")).toBeFalsy();
    expect(isFast({ block_id: { eq: "1" } })).toBeTruthy();
    expect(isFast({
        account_addr: { eq: "1" },
        now: { gt: 2 },
    }, "now")).toBeTruthy();
    expect(isFast({
        workchain_id: { eq: 1 },
        now: { gt: 2 },
    }, "now")).toBeFalsy();
    expect(isFast({
        in_msg: { in: ["1", "2"] },
        aborted: { eq: true },
    })).toBeFalsy();
    expect(isFast({ in_msg: { in: ["1", "2"] } })).toBeTruthy();
    expect(isFast({ in_msg: { eq: "1" } })).toBeTruthy();
    expect(isFast({
            orig_status: { eq: 0 },
            end_status: { eq: 1 },
            status: { eq: 3 },
            account_addr: { eq: "1" },
        },
    )).toBeTruthy();
    expect(isFast({ out_msgs: { any: { eq: "1" } } })).toBeTruthy();
    expect(isFast({
        in_msg: { eq: "1" },
        status: { eq: 3 },
    })).toBeTruthy();

    setCollection("blocks", Block);
    expect(isFast({ workchain_id: { eq: -1 } }, "seq_no desc")).toBeTruthy();
    expect(isFast({
        seq_no: { eq: 70000 },
        workchain_id: { eq: -1 },
    })).toBeTruthy();
    expect(isFast({
        seq_no: { in: [2798482, 2798483, 2798484] },
        workchain_id: { eq: -1 },
    }, "seq_no desc")).toBeTruthy();
    expect(isFast({
        workchain_id: { eq: -1 },
        shard: { eq: "8000000000000000" },
        seq_no: { in: [2799675, 2799676, 2799677, 2799678] },
    }, "seq_no")).toBeTruthy();
    expect(isFast({
        gen_utime: { gt: 1 },
        workchain_id: { eq: 1 },
    }, "gen_utime")).toBeTruthy();
    expect(isFast({ seq_no: { gt: 1 } }, "seq_no, gen_utime")).toBeTruthy();
    expect(isFast({ id: { in: ["1", "2"] } })).toBeTruthy();
    expect(isFast({ master: { min_shard_gen_utime: { ge: 1 } } })).toBeTruthy();

    setCollection("messages", Message);
    expect(isFast(
        {
            created_at: { gt: 1 },
            src: { eq: "1" },
            dst: { eq: "2" },
            value: { gt: "1" },
        },
        "created_at",
    )).toBeFalsy();
    expect(isFast(
        {
            src: { eq: "1" },
            dst: { eq: "2" },
            OR: {
                src: { eq: "2" },
                dst: { eq: "1" },
            },
        },
        "created_at",
    )).toBeFalsy();
    expect(isFast({
        status: { eq: 5 },
        src: { eq: "1" },
    })).toBeTruthy();
    expect(isFast(
        {
            msg_type: { eq: 0 }, // internal messages
            status: { eq: 5 },
            src: { in: ["1", "2"] },
            dst: { in: ["3", "4"] },
        },
    )).toBeFalsy();
    expect(isFast(
        {
            msg_type: { eq: 1 },
            src: { eq: "1" },
            status: { eq: 1 },
            created_at: { gt: 1 },
            created_lt: { gt: 2 },
        },
        "created_lt",
    )).toBeFalsy();
});
