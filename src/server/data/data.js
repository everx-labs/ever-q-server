/*
 * Copyright 2018-2020 TON DEV SOLUTIONS LTD.
 *
 * Licensed under the SOFTWARE EVALUATION License (the "License"); you may not use
 * this file except in compliance with the License.  You may obtain a copy of the
 * License at:
 *
 * http://www.ton.dev/licenses
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific TON DEV software governing permissions and
 * limitations under the License.
 */

// @flow

import { ArangoProvider } from './arango-provider';
import { QCollection } from './collection';
import { Auth } from '../auth';
import type { QConfig, QDataBrokerConfig, QArangoConfig } from '../config'
import { STATS } from '../config';
import type { QLog } from '../logs';
import QLogs from '../logs'
import type { OrderBy, QType } from '../filter/data-types';
import { Account, Block, BlockSignatures, Message, Transaction } from '../graphql/resolvers-generated';
import { Tracer } from 'opentracing';
import { StatsCounter } from '../tracer';
import type { IStats } from '../tracer';
import { wrap } from '../utils';
import { QDataBroker } from './data-broker';
import type { QDataSegment } from './data-provider';
import { dataSegment, missingDataCache } from './data-provider';


function createBroker(
    brokerName: string,
    logs: QLogs,
    config: QDataBrokerConfig,
): QDataBroker {
    const arangoDb = (dbName: string, segment: QDataSegment, config: QArangoConfig): ArangoProvider => (
        new ArangoProvider(logs.create(`${brokerName}_${dbName}`), segment, config)
    );
    return new QDataBroker({
        mutable: arangoDb('mutable', dataSegment.MUTABLE, config.mutable),
        immutableHot: arangoDb('hot', dataSegment.IMMUTABLE, config.immutableHot),
        immutableCold: config.immutableCold.map(x => arangoDb('cold', dataSegment.IMMUTABLE, x)),
        immutableColdCache: missingDataCache,
    })
}


export default class QData {
    config: QConfig;
    log: QLog;

    broker: QDataBroker;
    slowQueriesBroker: QDataBroker;

    auth: Auth;
    tracer: Tracer;
    statPostCount: StatsCounter;
    statPostFailed: StatsCounter;

    transactions: QCollection;
    messages: QCollection;
    accounts: QCollection;
    blocks: QCollection;
    blocks_signatures: QCollection;

    collections: QCollection[];
    collectionsByName: Map<string, QCollection>;

    constructor(
        config: QConfig,
        logs: QLogs,
        auth: Auth,
        tracer: Tracer,
        stats: IStats,
    ) {
        this.config = config;
        this.log = logs.create('data');
        this.auth = auth;
        this.tracer = tracer;

        this.statPostCount = new StatsCounter(stats, STATS.post.count, []);
        this.statPostFailed = new StatsCounter(stats, STATS.post.failed, []);

        this.broker = createBroker('fast', logs, config.data)
        this.slowQueriesBroker = createBroker('slow', logs, config.slowQueriesData);

        this.collections = [];
        this.collectionsByName = new Map();

        const addCollection = (name: string, docType: QType) => {
            const collection = new QCollection({
                name,
                docType,
                logs,
                auth,
                tracer,
                stats,
                broker: this.broker,
                slowQueriesBroker: this.slowQueriesBroker,
                isTests: config.isTests || false,
            });
            this.collections.push(collection);
            this.collectionsByName.set(name, collection);
            return collection;
        };

        this.transactions = addCollection('transactions', Transaction);
        this.messages = addCollection('messages', Message);
        this.accounts = addCollection('accounts', Account);
        this.blocks = addCollection('blocks', Block);
        this.blocks_signatures = addCollection('blocks_signatures', BlockSignatures);
    }

    start() {
        this.broker.start();
        this.slowQueriesBroker.start();
    }

    dropCachedDbInfo() {
        this.collections.forEach((x: QCollection) => x.dropCachedDbInfo());
    }

    async query(segment: QDataSegment, text: string, vars: { [string]: any }, orderBy: OrderBy[]) {
        return wrap(this.log, 'QUERY', { text, vars }, async () => {
            return this.broker.query({
                segment,
                text,
                vars,
                orderBy,
            });
        });
    }

    async finishOperations(operationIds: Set<string>): Promise<number> {
        let count = 0;
        this.collections.forEach(x => (count += x.finishOperations(operationIds)));
        return count;
    }
}
