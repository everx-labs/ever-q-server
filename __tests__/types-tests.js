// @flow
import { unixSecondsToString } from '../src/server/filter/filters';
import { packageJson } from '../src/server/utils';
import { testServerQuery } from './init-tests';

const { version } = packageJson();

declare function BigInt(v: any): any;

test('version', async () => {
    const info = await testServerQuery('query{info{version}}');
    expect(info).toMatchObject({ info: { version } })
});

test('time companion fields', async () => {
    const minTime = 1000000000000;  // 2001-09-09T01:46:40.000Z
    const maxTime = 10000000000000; // 2286-11-20T17:46:40.000Z

    const isValidSeconds = (value, string) => {
        if (value === null && string === null) {
            return true;
        }
        const ms = value * 1000;
        if (ms < minTime || ms > maxTime) {
            return false;
        }
        return unixSecondsToString(value) === string;
    }
    const data = await testServerQuery('query { messages { created_at created_at_string } }');
    for (const message of data.messages) {
        expect(isValidSeconds(message.created_at, message.created_at_string)).toBeTruthy();
    }
});

test('when conditions for joins', async () => {
    const data = await testServerQuery(`
    query { 
        messages { 
            dst_transaction(timeout: 0, when: { value: { gt: "0" } }) {
                id 
            } 
            value
            dst
        }
    }
    `);
    for (const message of data.messages) {
        if (message.value && BigInt(message.value) > BigInt(0)) {
            expect(message.dst_transaction).toBeTruthy();
        } else if (message.dst) {
            expect(message.dst_transaction).toBeNull();
        }
    }
});

test('Case insensitive filters', async () => {
    const query = async (collection, field, value) => {
        return (await testServerQuery(
            `query { ${collection}(filter:{${field}:{eq:"${value}"}}) { ${field} } }`))[collection]
    };
    const testField = async (collection, field) => {
        const docs = (await testServerQuery(`query { ${collection} { ${field} } }`))[collection];
        const valueLower = `${docs[0][field]}`.toLowerCase();
        const docsUpper = await query(collection, field, valueLower.toUpperCase());
        const docsLower = await query(collection, field, valueLower);
        expect(docsLower.length).toEqual(docsUpper.length);
        for (let i = 0; i < docsLower.length; i += 1) {
            expect(`${docsUpper[i][field]}`.toLowerCase()).toEqual(valueLower);
            expect(`${docsLower[i][field]}`.toLowerCase()).toEqual(valueLower);
        }
    };
    await testField("messages", "src");
    await testField("messages", "dst");
    await testField("transactions", "account_addr");
});
