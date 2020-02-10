// @flow

import type { QConfig } from "./config";
import fetch from 'node-fetch';

export type BlockchainAccessRights = {
    granted: bool,
    restrictToAccounts: string[],
}

const grantedBlockchainAccess: BlockchainAccessRights = Object.freeze({
    granted: true,
    restrictToAccounts: [],
});

const deniedBlockchainAccess: BlockchainAccessRights = Object.freeze({
    granted: false,
    restrictToAccounts: [],
});

export default class QAuth {
    config: QConfig;

    constructor(config: QConfig) {
        this.config = config;
    }

    static extractAccessKey(req: any): string {
        return (req && req.headers && req.headers.authorization) || ''
    }

    static error(code: number, message: string): Error {
        const error = new Error(message);
        (error: any).source = 'graphql';
        (error: any).code = code;
        return error;
    }

    async requireGrantedAccess(accessKey: string | typeof undefined): Promise<BlockchainAccessRights> {
        const access = await this.getBlockchainAccessRights(accessKey);
        if (!access.granted) {
            throw QAuth.error(401, 'Unauthorized');
        }
        if (access.restrictToAccounts.length > 0) {
            throw QAuth.error(500, 'Internal error: GraphQL services doesn\'t support account restrictions yet');
        }
        return access;
    }

    async getBlockchainAccessRights(accessKey: string | typeof undefined): Promise<BlockchainAccessRights> {
        if (!this.config.authorization.endpoint) {
            return grantedBlockchainAccess;
        }
        if ((accessKey || '') === '') {
            return deniedBlockchainAccess;
        }
        return this.invokeAuth('getBlockchainAccessRights', {
            accessKey,
        });
    }

    async registerAccessKeys(account: string, keys: string[], signature: string): Promise<number> {
        if (!this.config.authorization.endpoint) {
            throw QAuth.error(500, 'Auth service unavailable');
        }
        return this.invokeAuth('registerAccessKeys', {
            account,
            keys,
            signature
        });
    }

    async revokeAccessKeys(account: string, keys: string[], signature: string): Promise<number> {
        if (!this.config.authorization.endpoint) {
            throw QAuth.error(500, 'Auth service unavailable');
        }
        return this.invokeAuth('revokeAccessKeys', {
            account,
            keys,
            signature
        });
    }

    async invokeAuth(method: string, params: any): Promise<any> {
        const res = await fetch(this.config.authorization.endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                jsonrpc: '2.0',
                id: '1',
                method,
                params
            }),
        });

        if (res.status !== 200) {
            throw new Error(`Auth service failed: ${await res.text()}`);
        }

        const response = await res.json();
        if (response.error) {
            const error = new Error(response.error.message || response.error.description);
            (error: any).source = response.error.source || 'graphql';
            (error: any).code = response.error.code || 500;
            throw error;
        }

        return response.result;
    }

}
