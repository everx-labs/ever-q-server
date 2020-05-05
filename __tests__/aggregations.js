import { AggregationFn } from "../server/aggregations";
import Arango from "../server/arango";
import type { AccessRights } from "../server/auth";
import QLogs from "../server/logs";

test("Aggregations Fast Detector", async () => {
    const granted: AccessRights = { granted: true, restrictToAccounts: [] };
    const db = new Arango({
        database: { server: 'http://0.0.0.0', name: 'blockchain' },
        slowDatabase: { server: 'http://0.0.0.0', name: 'blockchain' }
    }, new QLogs());

    const isFast = async (filter, fields) => {
        const q = db.transactions.createAggregationQuery(filter, fields, granted);
        return db.transactions.isFastAggregationQuery(q.text, filter, q.helpers);
    }
    expect(await isFast({}, [
        { fn: AggregationFn.MIN, field: 'lt' }
    ])).toBeTruthy();
    expect(await isFast({}, [
        { fn: AggregationFn.MIN, field: 'outmsg_cnt' }
    ])).toBeFalsy();
    expect(await isFast({ outmsg_cnt: { eq: 1 } }, [
        { fn: AggregationFn.SUM, field: 'lt' }
    ])).toBeTruthy();
    expect(await isFast({ outmsg_cnt: { eq: 1 } }, [
        { fn: AggregationFn.COUNT, field: '' }
    ])).toBeFalsy();
    expect(await isFast({}, [
        { fn: AggregationFn.COUNT, field: '' }
    ])).toBeTruthy();
});

