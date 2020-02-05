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
    granted: true,
    restrictToAccounts: [],
});

export default class QAuth {
    config: QConfig;

    constructor(config: QConfig) {
        this.config = config;
    }

    static extractToken(req: any): string {
        return (req && req.headers && req.headers.authorization) || ''
    }

    async requireGrantedAccess(token: string | typeof undefined): Promise<BlockchainAccessRights> {
        const access = await this.getBlockchainAccessRights(token);
        if (!access.granted) {
            const error = new Error('You have not access to GraphQL services');
            (error: any).code = 8000;
            throw error;
        }
        if (access.restrictToAccounts.length > 0) {
            const error = new Error('Internal error: GraphQL services doesn\'t support account restrictions yet');
            (error: any).code = 8001;
            throw error;
        }
        return access;
    }

    async getBlockchainAccessRights(token: string | typeof undefined): Promise<BlockchainAccessRights> {
        if (!this.config.authorization.endpoint) {
            return grantedBlockchainAccess;
        }
        if ((token || '') === '') {
            return deniedBlockchainAccess;
        }
        const res = await fetch(this.config.authorization.endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                jsonrpc: '2.0',
                id: '1',
                method: 'getBlockchainAccessRights',
                params: {
                    token: token || '',
                }
            }),
        });

        if (res.status !== 200) {
            throw new Error(`Auth service failed: ${await res.text()}`);
        }

        const response = await res.json();
        if (response.error) {
            throw response.error;
        }

        return response.result;
    }

}
