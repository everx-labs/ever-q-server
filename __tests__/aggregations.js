import { AggregationFn } from "../src/server/data/aggregations";
import type { AccessRights } from "../src/server/auth";
import {createTestData} from './init-tests';

test("Aggregations Fast Detector", async () => {
    const granted: AccessRights = { granted: true, restrictToAccounts: [] };
    const data = createTestData();

    const isFast = async (filter, fields) => {
        const q = data.transactions.createAggregationQuery(filter, fields, granted);
        return data.transactions.isFastAggregationQuery(q.text, filter, q.helpers);
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

