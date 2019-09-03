// @flow
import { Database, DocumentCollection } from 'arangojs';
import arangochair from 'arangochair';
import { PubSub, withFilter } from 'apollo-server';
import type { QConfig } from './config'
import type { QLog } from "./logs";
import QLogs from './logs'

type FilterDispatcher = {
    ql: (path: string, filterKey: string, filterValue: any, field: any) => string,
    test: (value: any, filterKey: string, filterValue: any, field: any) => boolean,
}

type FilterType = {
    dispatcher: FilterDispatcher,
    fields: { [string]: any }
}

function combine(path: string, key: string): string {
    return key !== '' ? `${path}.${key}` : path;
}

function qlOp(path: string, op: string, filter: any): string {
    return `${path} ${op} ${JSON.stringify(filter)}`;
}

function qlCombine(conditions: string[], op: string, defaultConditions: string): string {
    if (conditions.length === 0) {
        return defaultConditions;
    }
    if (conditions.length === 1) {
        return conditions[0];
    }
    return '(' + conditions.join(`) ${op} (`) + ')';
}

function qlIn(path: string, filter: any): string {
    const conditions = filter.map(value => qlOp(path, '==', value));
    return qlCombine(conditions, 'OR', 'false');
}

type ScalarOp = {
    ql(path: string, filter: any): string,
    test(value: any, filter: any): boolean,
}

const scalarEq: ScalarOp = {
    ql(path, filter) {
        return qlOp(path, '==', filter);
    },
    test(value, filter) {
        return value === filter;
    },
};

const scalarNe: ScalarOp = {
    ql(path, filter) {
        return qlOp(path, '!=', filter);
    },
    test(value, filter) {
        return value !== filter;
    },
};

const scalarLt: ScalarOp = {
    ql(path, filter) {
        return qlOp(path, '<', filter);
    },
    test(value, filter) {
        return value < filter;
    },
};

const scalarLe: ScalarOp = {
    ql(path, filter) {
        return qlOp(path, '<=', filter);
    },
    test(value, filter) {
        return value <= filter;
    },
};

const scalarGt: ScalarOp = {
    ql(path, filter) {
        return qlOp(path, '>', filter);
    },
    test(value, filter) {
        return value > filter;
    },
};

const scalarGe: ScalarOp = {
    ql(path, filter) {
        return qlOp(path, '>=', filter);
    },
    test(value, filter) {
        return value >= filter;
    },
};

const scalarIn: ScalarOp = {
    ql(path, filter) {
        return qlIn(path, filter);
    },
    test(value, filter) {
        return filter.includes(value);
    },
};

const scalarNotIn: ScalarOp = {
    ql(path, filter) {
        return `NOT (${qlIn(path, filter)})`;
    },
    test(value, filter) {
        return !filter.includes(value);
    }
};

export const scalar: FilterType = {
    dispatcher: {
        ql(path, filterKey, filterValue, op) {
            return op.ql(path, filterValue);
        },
        test(value, filterKey, filterValue, op) {
            return op.test(value, filterValue);
        }
    },
    fields: {
        eq: scalarEq,
        ne: scalarNe,
        lt: scalarLt,
        le: scalarLe,
        gt: scalarGt,
        ge: scalarGe,
        in: scalarIn,
        notIn: scalarNotIn,
    }
};

const structDispatcher: FilterDispatcher = {
    ql(path, filterKey, filterValue, field) {
        return qlFilter(combine(path, filterKey), filterValue, field);
    },
    test(value, filterKey, filterValue, field) {
        return testFilter(value[filterKey], filterValue, field);
    }
};

export function struct(fields: { [string]: FilterType }): FilterType {
    return {
        dispatcher: structDispatcher,
        fields,
    };
}

type ArrayOp = {
    ql(path: string, filter: any, itemType: FilterType): string,
    test(value: any, filter: any, itemType: FilterType): boolean,
}

const arrayAll: ArrayOp = {
    ql(path, filter, itemType) {
        const itemQl = qlFilter('CURRENT', filter, itemType);
        return `LENGTH(${path}[* FILTER ${itemQl}]) == LENGTH(${path})`;
    },
    test(value, filter, itemType) {
        const failedIndex = value.findIndex(x => !testFilter(x, filter, itemType));
        return failedIndex < 0;
    }
};

const arrayAny: ArrayOp = {
    ql(path, filter, itemType) {
        const itemQl = qlFilter('CURRENT', filter, itemType);
        return `LENGTH(${path}[* FILTER ${itemQl}]) > 0`;
    },
    test(value, filter, itemType) {
        const succeededIndex = value.findIndex(x => testFilter(x, filter, itemType));
        return succeededIndex >= 0;
    }
};

export function array(itemType: FilterType): FilterType {
    return {
        dispatcher: {
            ql(path, filterKey, filterValue, op: ArrayOp) {
                return op.ql(path, filterValue, itemType);
            },
            test(value, filterKey, filterValue, op: ArrayOp) {
                return op.test(value, filterValue, itemType);
            }
        },
        fields: {
            all: arrayAll,
            any: arrayAny,
        }
    }
}

export function qlFilter(path: string, filter: any, type: FilterType): string {
    const conditions: string[] = [];
    Object.entries(filter).forEach(([filterKey, filterValue]) => {
        const field = type.fields[filterKey];
        if (field) {
            conditions.push(type.dispatcher.ql(path, filterKey, filterValue, field))
        }
    });
    return qlCombine(conditions, 'AND', 'false');
}

export function testFilter(value: any, filter: any, type: FilterType): boolean {
    const failed = Object.entries(filter).find(([filterKey, filterValue]) => {
        const field = type.fields[filterKey];
        return !!(field && type.dispatcher.test(value, filterKey, filterValue, field));
    });
    return !failed;
}

export default class Arango {
    config: QConfig;
    log: QLog;
    serverAddress: string;
    databaseName: string;
    pubsub: PubSub;
    db: Database;
    transactions: DocumentCollection;
    messages: DocumentCollection;
    accounts: DocumentCollection;
    blocks: DocumentCollection;
    collections: DocumentCollection[];
    listener: any;

    constructor(config: QConfig, logs: QLogs) {
        this.config = config;
        this.log = logs.create('Arango');
        this.serverAddress = config.database.server;
        this.databaseName = config.database.name;

        this.pubsub = new PubSub();

        this.db = new Database(`http://${this.serverAddress}`);
        this.db.useDatabase(this.databaseName);

        this.transactions = this.db.collection('transactions');
        this.messages = this.db.collection('messages');
        this.accounts = this.db.collection('accounts');
        this.blocks = this.db.collection('blocks');
        this.collections = [
            this.transactions,
            this.messages,
            this.accounts,
            this.blocks
        ];
    }

    start() {
        const listenerUrl = `http://${this.serverAddress}/${this.databaseName}`;
        this.listener = new arangochair(listenerUrl);
        this.collections.forEach(collection => {
            const name = collection.name;
            this.listener.subscribe({ collection: name });
            this.listener.on(name, (docJson, type) => {
                if (type === 'insert/update') {
                    const doc = JSON.parse(docJson);
                    this.pubsub.publish(name, { [name]: doc });
                }
            });
        });
        this.listener.start();
        this.log.debug('Listen database', listenerUrl);
        this.listener.on('error', (err, httpStatus, headers, body) => {
            this.log.error('Listener failed: ', { err, httpStatus, headers, body });
            setTimeout(() => this.listener.start(), this.config.listener.restartTimeout);
        });
    }

    collectionQuery(collection: DocumentCollection, filter: any) {
        return async (parent: any, args: any) => {
            this.log.debug(`Query ${collection.name}`, args);
            return this.fetchDocs(collection, args, filter);
        }
    }

    selectQuery() {
        return async (parent: any, args: any) => {
            const query = args.query;
            const bindVars = JSON.parse(args.bindVarsJson);
            return JSON.stringify(await this.fetchQuery(query, bindVars));
        }
    }


    collectionSubscription(collection: DocumentCollection, filterType: FilterType) {
        return {
            subscribe: withFilter(
                () => {
                    return this.pubsub.asyncIterator(collection.name);
                },
                (data, args) => {
                    return testFilter(data[collection.name], args.filter, filterType);
                }
            ),
        }
    }

    async wrap<R>(fetch: () => Promise<R>) {
        try {
            return await fetch();
        } catch (err) {
            const error = {
                message: err.message || err.ArangoError || err.toString(),
                code: err.code
            };
            this.log.error('Db operation failed: ', err);
            throw error;
        }
    }

    async fetchDocs(collection: DocumentCollection, args: any, filterType: FilterType) {
        return this.wrap(async () => {
            const filter = args.filter || {};
            const filterSection = Object.keys(filter).length > 0
                ? `FILTER ${qlFilter('doc', filter, filterType)}`
                : '';
            const sortSection = '';
            const limitSection = 'LIMIT 50';

            const query = `
            FOR doc IN ${collection.name}
            ${filterSection}
            ${sortSection}
            ${limitSection}
            RETURN doc`;
            const cursor = await this.db.query({ query, bindVars: {} });
            return await cursor.all();
        });
    }

    async fetchDocByKey(collection: DocumentCollection, key: string): Promise<any> {
        if (!key) {
            return Promise.resolve(null);
        }
        return this.wrap(async () => {
            return collection.document(key, true);
        });
    }

    async fetchDocsByKeys(collection: DocumentCollection, keys: string[]): Promise<any[]> {
        if (!keys || keys.length === 0) {
            return Promise.resolve([]);
        }
        return Promise.all(keys.map(key => this.fetchDocByKey(collection, key)));
    }

    async fetchQuery(query: any, bindVars: any) {
        return this.wrap(async () => {
            const cursor = await this.db.query({ query, bindVars });
            return cursor.all();
        });
    }
}
