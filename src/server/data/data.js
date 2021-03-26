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

import type { QDataScopeType } from "./collection";
import { QDataCollection, QDataScope } from './collection';
import { Auth } from '../auth';
import { STATS } from '../config';
import type { QLog } from '../logs';
import QLogs from '../logs'
import type { OrderBy, QType } from '../filter/filters';
import { Tracer } from 'opentracing';
import { StatsCounter } from '../tracer';
import type { IStats } from '../tracer';
import { wrap } from '../utils';
import type { QDataProvider, QIndexInfo } from './data-provider';

export type QDataProviders = {
    mutable: QDataProvider,
    immutable: QDataProvider,
    counterparties: QDataProvider,
}

export type QDataOptions = {
    providers: QDataProviders,
    slowQueriesProviders?: QDataProviders,

    logs: QLogs,
    auth: Auth,
    tracer: Tracer,
    stats: IStats,
    isTests: boolean,
}

export default class QData {
    // Dependencies
    providers: QDataProviders;
    slowQueriesProviders: QDataProviders;
    logs: QLogs;
    stats: IStats;
    auth: Auth;
    tracer: Tracer;
    isTests: boolean;

    // Own
    log: QLog;
    statPostCount: StatsCounter;
    statPostFailed: StatsCounter;

    collections: QDataCollection[];
    collectionsByName: Map<string, QDataCollection>;

    constructor(options: QDataOptions) {
        this.providers = options.providers;
        this.slowQueriesProviders = options.slowQueriesProviders || options.providers;
        this.logs = options.logs;
        this.stats = options.stats;
        this.auth = options.auth;
        this.tracer = options.tracer;
        this.isTests = options.isTests;

        this.log = this.logs.create('data');

        this.statPostCount = new StatsCounter(this.stats, STATS.post.count, []);
        this.statPostFailed = new StatsCounter(this.stats, STATS.post.failed, []);

        this.collections = [];
        this.collectionsByName = new Map();
    }

    addCollection(name: string, docType: QType, scope: QDataScopeType, indexes: QIndexInfo[]) {
        const collection = new QDataCollection({
            name,
            docType,
            scope,
            indexes,
            provider: this.providers[scope],
            slowQueriesProvider: this.slowQueriesProviders[scope],
            logs: this.logs,
            auth: this.auth,
            tracer: this.tracer,
            stats: this.stats,
            isTests: this.isTests,
        });
        this.collections.push(collection);
        this.collectionsByName.set(name, collection);
        return collection;
    }

    async start() {
        for (const scope of Object.keys(QDataScope)) {
            const collectionsForSubscribe = this.collections
                .filter(x => x.scope === scope)
                .map(x => x.name);
            await this.providers[scope].start(collectionsForSubscribe);
            await this.slowQueriesProviders[scope].start([]);
        }
        await this.providers.immutable.hotUpdate();
    }

    async dropCachedDbInfo() {
        this.collections.forEach((x: QDataCollection) => x.dropCachedDbInfo());
        await this.providers.immutable.hotUpdate();
    }

    async query(provider: QDataProvider, text: string, vars: { [string]: any }, orderBy: OrderBy[]) {
        return wrap(this.log, 'QUERY', { text, vars }, async () => {
            return provider.query(text, vars, orderBy);
        });
    }

    async finishOperations(operationIds: Set<string>): Promise<number> {
        let count = 0;
        this.collections.forEach(x => (count += x.finishOperations(operationIds)));
        return count;
    }
}
