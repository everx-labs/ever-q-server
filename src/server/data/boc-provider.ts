import { parseArangoConfig, QBocResolverConfig } from "../config"
import { S3 } from "@aws-sdk/client-s3"
import { Database } from "arangojs"
import { createDatabase } from "./database-provider"

export interface IBocProvider {
    getBocs(
        bocHashes: { hash: string; boc: string | null | undefined }[],
    ): Promise<Map<string, string>>
}

class PatternProvider implements IBocProvider {
    constructor(public pattern: string) {}
    async getBocs(
        bocHashes: {
            hash: string
            boc: string | undefined
        }[],
    ): Promise<Map<string, string>> {
        const resolved = new Map()
        for (const { hash } of bocHashes) {
            resolved.set(hash, this.pattern.replace("{hash}", hash))
        }
        return resolved
    }
}

class S3Provider implements IBocProvider {
    private readonly client: S3
    constructor(
        public config: {
            endpoint: string
            region: string
            bucket: string
            accessKey: string
            secretKey: string
            timeout?: number
        },
    ) {
        this.client = new S3({
            endpoint: config.endpoint,
            region: config.region,
            credentials: {
                accessKeyId: config.accessKey,
                secretAccessKey: config.secretKey,
            },
        })
    }
    async getBocs(
        bocHashes: {
            hash: string
            boc: string | undefined
        }[],
    ): Promise<Map<string, string>> {
        const resolved = new Map()
        // TODO: fetch bocs in parallel
        for (const { hash, boc } of bocHashes) {
            const getObjectResult = await this.client.getObject(
                {
                    Bucket: this.config.bucket,
                    Key: hash,
                },
                {
                    requestTimeout: this.config.timeout,
                },
            )
            const body = getObjectResult.Body
            const bodyAsString = await body?.transformToString("base64")
            resolved.set(hash, bodyAsString ?? boc)
        }
        return resolved
    }
}

class ArangoProvider implements IBocProvider {
    private readonly database: Database
    constructor(
        public config: {
            database: string
            collection: string
        },
    ) {
        this.database = createDatabase(parseArangoConfig(config.database))
    }

    async getBocs(
        bocHashes: {
            hash: string
            boc: string | undefined
        }[],
    ): Promise<Map<string, string>> {
        const resolved = new Map()
        const cursor = await this.database.query(
            `
            FOR doc IN ${this.config.collection}
            FILTER doc._key IN @hashes
            RETURN {
                hash: doc._key,
                boc: doc.boc
            }
            `,
            {
                hashes: bocHashes.map(x => x.hash),
            },
        )
        const docs: { hash: string; boc: string }[] = await cursor.all()
        for (const doc of docs) {
            resolved.set(doc.hash, doc.boc)
        }
        return resolved
    }
}

export function createBocProvider(
    config: QBocResolverConfig,
): IBocProvider | undefined {
    const s3endpoint = config.s3?.endpoint ?? ""
    if (s3endpoint !== "") {
        return new S3Provider({
            endpoint: s3endpoint,
            bucket: config.s3?.bucket ?? "",
            region: config.s3?.region ?? "",
            accessKey: config.s3?.accessKey ?? "",
            secretKey: config.s3?.secretKey ?? "",
            timeout: config.s3?.timeout,
        })
    }
    const pattern = config.pattern ?? ""
    if (pattern) {
        return new PatternProvider(pattern)
    }
    if (config.arango && (config.arango.database ?? "" !== "")) {
        return new ArangoProvider(config.arango)
    }
    return undefined
}
