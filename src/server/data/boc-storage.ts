import { QBocResolverConfig } from "../config"
import { S3 } from "@aws-sdk/client-s3"

interface IBocResolver {
    resolveBocs(
        bocHashes: { hash: string; boc: string | null | undefined }[],
    ): Promise<Map<string, string>>
}

class PatternResolver implements IBocResolver {
    constructor(public pattern: string) {}
    async resolveBocs(
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

class S3Resolver implements IBocResolver {
    private readonly client: S3
    constructor(
        public config: {
            endpoint: string
            region: string
            bucket: string
            accessKey: string
            secretKey: string
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
    async resolveBocs(
        bocHashes: {
            hash: string
            boc: string | undefined
        }[],
    ): Promise<Map<string, string>> {
        const resolved = new Map()
        for (const { hash, boc } of bocHashes) {
            const getObjectResult = await this.client.getObject({
                Bucket: this.config.bucket,
                Key: hash,
            })
            const body = getObjectResult.Body
            const bodyAsString = await body?.transformToString("base64")
            resolved.set(hash, bodyAsString ?? boc)
        }
        return resolved
    }
}

function createBocResolver(
    config: QBocResolverConfig,
): IBocResolver | undefined {
    const s3endpoint = config.s3?.endpoint ?? ""
    if (s3endpoint !== "") {
        return new S3Resolver({
            endpoint: s3endpoint,
            bucket: config.s3?.bucket ?? "",
            region: config.s3?.region ?? "",
            accessKey: config.s3?.accessKey ?? "",
            secretKey: config.s3?.secretKey ?? "",
        })
    }
    const pattern = config.pattern ?? ""
    if (pattern) {
        return new PatternResolver(pattern)
    }
    return undefined
}

export class BocStorage {
    readonly blocks: IBocResolver | undefined

    constructor(blocksConfig: QBocResolverConfig) {
        this.blocks = createBocResolver(blocksConfig)
    }
}
