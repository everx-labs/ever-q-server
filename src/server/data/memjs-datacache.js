// @flow

import { createHash } from 'crypto'
import { Client as MemcachedClient } from 'memjs'
import type { QMemCachedConfig } from '../config';
import type { QLog } from '../logs';
import type { QDataCache } from './data-provider';

export class MemjsDataCache implements QDataCache {
    memcached: MemcachedClient;
    log: QLog;

    constructor(log: QLog, config: QMemCachedConfig) {
        this.log = log;
        this.memcached = new MemcachedClient.create(config.server, {
            logger: { log: () => {} },
            retries: 0, // don't retry
            expires: 0, // keepForever
            timeout: 0.1, // 100ms
            conntimeout: 0.2, // twice of timeout
            keepAlive: true,
            keepAliveDelay: 15
        })
    }

    get(key: string): Promise<any> {
        const hashedKey = createHash('md5').update(key).digest("hex");
        return new Promise((resolve, reject) => {
            this.memcached.get(hashedKey, (err, data) => {
                if (!err) {
                    try {
                        const value = data ? JSON.parse(data.toString()) : null;
                        this.log.debug('GET', hashedKey)
                        resolve(value)
                    } catch (e) {
                        this.log.error('FAILED', 'MEMCACHED', 'GET', hashedKey, e.message, data.toString()), 
                        resolve(null);
                    }
                } else {
                    this.log.error('FAILED', 'MEMCACHED', 'GET', hashedKey, err.message);
                    resolve(null);
                }
            });
        });
    };

    set(key: string, value: any): Promise<void> {
        const hashedKey = createHash('md5').update(key).digest("hex");
        return new Promise((resolve, reject) => {
            this.memcached.set(hashedKey, JSON.stringify(value), {}, (err) => {
                if (!err) {
                    this.log.debug('SET', hashedKey)
                } else {
                    this.log.error('FAILED', 'MEMCACHED', 'SET', hashedKey, err.message);
                }
                resolve()
            });
        });
    };
}

export function isCacheEnabled(config: QMemCachedConfig) {
    return config.server !== '';
}
