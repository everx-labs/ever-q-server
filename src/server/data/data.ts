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

import {
    QDataCollection,
} from "./collection";
import { Auth } from "../auth";
import { STATS } from "../config";
import type { QLog } from "../logs";
import QLogs from "../logs";
import type {
    OrderBy,
    QType,
} from "../filter/filters";
import { Tracer } from "opentracing";
import { StatsCounter } from "../tracer";
import type { IStats } from "../tracer";
import { wrap } from "../utils";
import type {
    QDataProvider,
    QIndexInfo,
} from "./data-provider";
import { QRequestContext } from "../request";

export type QBlockchainDataProvider = {
    blocks?: QDataProvider,
    transactions?: QDataProvider,
    accounts?: QDataProvider,
    zerostate?: QDataProvider,
};

export type QDataProviders = {
    blockchain?: QBlockchainDataProvider,
    counterparties?: QDataProvider,
    chainRangesVerification?: QDataProvider,
};

export type QDataOptions = {
    providers: QDataProviders,
    slowQueriesProviders?: QBlockchainDataProvider,

    logs: QLogs,
    auth: Auth,
    tracer: Tracer,
    stats: IStats,
    isTests: boolean,
};

function collectProviders(source: (QDataProvider | undefined)[]): QDataProvider[] {
    const providers: QDataProvider[] = [];
    for (const provider of source) {
        if (provider !== undefined && !providers.includes(provider)) {
            providers.push(provider);
        }
    }
    return providers;
}

export default class QData {
    // Dependencies
    providers: QDataProviders;
    slowQueriesProviders?: QBlockchainDataProvider;
    logs: QLogs;
    stats: IStats;
    auth: Auth;
    tracer: Tracer;
    isTests: boolean;

    // Own
    log: QLog;
    statPostCount: StatsCounter;
    statPostFailed: StatsCounter;

    dataProviders: QDataProvider[];
    slowQueriesDataProviders: QDataProvider[];

    collections: QDataCollection[];
    collectionsByName: Map<string, QDataCollection>;

    constructor(options: QDataOptions) {
        this.providers = options.providers;
        this.slowQueriesProviders = options.slowQueriesProviders;
        this.logs = options.logs;
        this.stats = options.stats;
        this.auth = options.auth;
        this.tracer = options.tracer;
        this.isTests = options.isTests;

        this.log = this.logs.create("data");

        this.statPostCount = new StatsCounter(this.stats, STATS.post.count, []);
        this.statPostFailed = new StatsCounter(this.stats, STATS.post.failed, []);

        this.collections = [];
        this.collectionsByName = new Map();

        this.dataProviders = collectProviders([
            this.providers.blockchain?.blocks,
            this.providers.blockchain?.transactions,
            this.providers.blockchain?.accounts,
            this.providers.blockchain?.zerostate,
            this.providers.counterparties,
        ]);

        this.slowQueriesDataProviders = collectProviders([
            this.slowQueriesProviders?.blocks,
            this.slowQueriesProviders?.transactions,
            this.slowQueriesProviders?.accounts,
            this.slowQueriesProviders?.zerostate,
        ]);
    }

    addCollection(
        name: string,
        docType: QType,
        provider: QDataProvider | undefined,
        slowQueriesProvider: QDataProvider | undefined,
        indexes: QIndexInfo[],
    ) {
        const collection = new QDataCollection({
            name,
            docType,
            indexes,
            provider,
            slowQueriesProvider,
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
        for (const provider of this.dataProviders) {
            const collectionsForSubscribe = this.collections
                .filter(x => x.provider === provider)
                .map(x => x.name);
            await provider.start(collectionsForSubscribe);
            await provider.hotUpdate();
        }
        for (const provider of this.slowQueriesDataProviders) {
            await provider.start([]);
        }
    }

    async stop() {
        for (const provider of [...this.dataProviders, ...this.slowQueriesDataProviders]) {
            await provider.stop();
        }
    }

    async dropCachedDbInfo() {
        this.collections.forEach((x: QDataCollection) => x.dropCachedDbInfo());
        for (const provider of this.dataProviders) {
            await provider.hotUpdate();
        }
    }

    async query(provider: QDataProvider, text: string, vars: Record<string, unknown>, orderBy: OrderBy[], request: QRequestContext) {
        return wrap(this.log, "QUERY", {
            text,
            vars,
        }, async () => {
            return provider.query(text, vars, orderBy, request);
        });
    }

    async finishOperations(operationIds: Set<string>): Promise<number> {
        let count = 0;
        this.collections.forEach(x => (count += x.finishOperations(operationIds)));
        return count;
    }
}
