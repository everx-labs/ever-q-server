import type { QConfig } from "./config";
import fetch from "node-fetch";
import { QError } from "./utils";

export type AccessKey = {
    key: string,
    restrictToAccounts?: string[],
}

export type AccessRights = {
    granted: boolean,
    restrictToAccounts: string[],
}

export const grantedAccess: AccessRights = Object.freeze({
    granted: true,
    restrictToAccounts: [],
});

export const deniedAccess: AccessRights = Object.freeze({
    granted: false,
    restrictToAccounts: [],
});

export type RequestWithAccessHeaders = {
    headers?: {
        accesskey?: string,
        accessKey?: string,
    }
}

type GraphQLConnection = {
    context?: {
        accessKey?: string,
    }
}

export class Auth {
    config: QConfig;

    constructor(config: QConfig) {
        this.config = config;
    }

    static extractAccessKey(req: RequestWithAccessHeaders | undefined, connection: GraphQLConnection | undefined): string {
        return req?.headers?.accessKey ??
            req?.headers?.accesskey ??
            connection?.context?.accessKey ?? "";
    }

    static unauthorizedError(): Error {
        return QError.unauthorized();
    }

    authServiceRequired() {
        if (!this.config.authorization.endpoint) {
            throw QError.authServiceUnavailable();
        }
    }

    async requireGrantedAccess(accessKey: string | typeof undefined): Promise<AccessRights> {
        const access = await this.getAccessRights(accessKey);
        if (!access.granted) {
            throw Auth.unauthorizedError();
        }
        return access;
    }

    async getAccessRights(accessKey: string | typeof undefined): Promise<AccessRights> {
        if (!this.config.authorization.endpoint) {
            return grantedAccess;
        }
        if ((accessKey || "") === "") {
            return deniedAccess;
        }
        const rights: AccessRights = await this.invokeAuth("getAccessRights", {
            accessKey,
        });
        if (!rights.restrictToAccounts) {
            rights.restrictToAccounts = [];
        }
        return rights;
    }

    async getManagementAccessKey(): Promise<string> {
        this.authServiceRequired();
        return this.invokeAuth("getManagementAccessKey", {});
    }

    async registerAccessKeys(
        account: string,
        keys: AccessKey[],
        signedManagementAccessKey: string,
    ): Promise<number> {
        this.authServiceRequired();
        return this.invokeAuth("registerAccessKeys", {
            account,
            keys,
            signedManagementAccessKey,
        });
    }

    async revokeAccessKeys(
        account: string,
        keys: string[],
        signedManagementAccessKey: string,
    ): Promise<number> {
        this.authServiceRequired();
        return this.invokeAuth("revokeAccessKeys", {
            account,
            keys,
            signedManagementAccessKey,
        });
    }

    async invokeAuth<T>(method: string, params: unknown): Promise<T> {
        const res = await fetch(this.config.authorization.endpoint, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                jsonrpc: "2.0",
                id: "1",
                method,
                params,
            }),
        });

        if (res.status !== 200) {
            throw new Error(`Auth service failed: ${await res.text()}`);
        }

        const response = await res.json();
        if (response.error) {
            throw QError.auth(response.error);
        }

        return response.result;
    }

}
