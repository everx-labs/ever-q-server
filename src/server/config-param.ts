import os from 'os'
import { QError } from './utils'

function toPascal(s: string): string {
    return s !== '' ? `${s[0].toUpperCase()}${s.substr(1).toLowerCase()}` : ''
}

function splitNonEmpty(s: string, separator = ','): string[] {
    return s
        .split(separator)
        .map(x => x.trim())
        .filter(x => x !== '')
}

function toOption(s: string): string {
    return splitNonEmpty(s.toLowerCase(), ' ').join('-')
}

function withPrefix(prefix: string, s: string): string {
    return prefix !== '' ? `${prefix} ${s}` : s
}

export type DeepPartial<T> = {
    [P in keyof T]?: DeepPartial<T[P]>
}

type ValueParser<T extends ConfigValue> = (s: string) => T | undefined

const parse = {
    boolean: (s: string): boolean | undefined => s.toLowerCase() === 'true',
    integer(s: string): number | undefined {
        if (s.trim() === '') {
            return undefined
        }
        const n = Number(s)
        if (!Number.isInteger(n)) {
            throw new Error(`Not valid integer: ${s}`)
        }
        return n
    },
    string: (s: string): string | undefined => s,
    array: (s: string): string[] | undefined => splitNonEmpty(s),
    map(s: string): Record<string, string> {
        return splitNonEmpty(s).reduce(
            (map, nameValue): Record<string, string> => {
                let i = nameValue.indexOf('=')
                if (i < 0) {
                    i = nameValue.length
                }
                return {
                    ...map,
                    [nameValue.substr(0, i)]: nameValue.substr(i + 1),
                }
            },
            {} as Record<string, string>,
        )
    },
}

export type ConfigValue =
    | boolean
    | number
    | string
    | string[]
    | Record<string, string>

type HotColdParams = {
    hot: ConfigParam<string[]>
    cache: ConfigParam<string>
    cold: ConfigParam<string[]>
}

type BlockchainParams = {
    hotCache: ConfigParam<string>
    hotCacheExpiration: ConfigParam<number>
    hotCacheEmptyDataExpiration: ConfigParam<number>
    accounts: ConfigParam<string[]>
    blocks: HotColdParams
    transactions: HotColdParams
    zerostate: ConfigParam<string>
}

export class ConfigParam<T extends ConfigValue> {
    optionName: string
    env: string

    private constructor(
        public option: string,
        public defaultValue: T,
        public description: string,
        public parser: ValueParser<T>,
        public deprecated: boolean = false,
    ) {
        const words = option.split('-')
        this.env = `Q_${words.map(x => x.toUpperCase()).join('_')}`
        this.optionName = `${words[0]}${words.slice(1).map(toPascal).join('')}`
    }

    descriptionWithDefaults(): string {
        const defaultValueStr = this.defaultValueAsString()
        return `${this.description}${
            defaultValueStr !== '' ? ` (default: "${defaultValueStr}")` : ''
        }`
    }

    static string(
        option: string,
        defaultValue: string,
        description: string,
        deprecated = false,
    ): ConfigParam<string> {
        return new ConfigParam(
            option,
            defaultValue,
            description,
            parse.string,
            deprecated,
        )
    }

    static integer(
        option: string,
        defaultValue: number,
        description: string,
        deprecated = false,
    ): ConfigParam<number> {
        return new ConfigParam(
            option,
            defaultValue,
            description,
            parse.integer,
            deprecated,
        )
    }

    static boolean(
        option: string,
        defaultValue: boolean,
        description: string,
        deprecated = false,
    ): ConfigParam<boolean> {
        return new ConfigParam(
            option,
            defaultValue,
            description,
            parse.boolean,
            deprecated,
        )
    }

    static array(
        option: string,
        defaultValue: string[],
        description: string,
        deprecated = false,
    ): ConfigParam<string[]> {
        return new ConfigParam(
            option,
            defaultValue,
            description,
            parse.array,
            deprecated,
        )
    }

    static map(
        option: string,
        defaultValue: Record<string, string>,
        description: string,
        deprecated = false,
    ): ConfigParam<Record<string, string>> {
        return new ConfigParam(
            option,
            defaultValue,
            description,
            parse.map,
            deprecated,
        )
    }

    static dataDeprecated(prefix: string): {
        mut: ConfigParam<string>
        hot: ConfigParam<string>
        cold: ConfigParam<string[]>
        cache: ConfigParam<string>
        counterparties: ConfigParam<string>
    } {
        function dataParam<T extends ConfigValue>(
            name: string,
            defaultValue: T,
            description: string,
            parser: ValueParser<T>,
        ) {
            return new ConfigParam<T>(
                `${toOption(prefix)}-${name}`,
                defaultValue,
                withPrefix(toPascal(prefix), description),
                parser,
                true,
            )
        }

        return {
            mut: dataParam(
                'mut',
                'arangodb',
                'mutable db config url',
                parse.string,
            ),
            hot: dataParam(
                'hot',
                'arangodb',
                'hot db config url',
                parse.string,
            ),
            cold: dataParam(
                'cold',
                [],
                'cold db config urls (comma separated)',
                parse.array,
            ),
            cache: dataParam('cache', '', 'cache config url', parse.string),
            counterparties: dataParam(
                'counterparties',
                '',
                'counterparties db config url',
                parse.string,
            ),
        }
    }

    static hotCold(prefix: string, descriptionPrefix?: string): HotColdParams {
        descriptionPrefix ??= prefix
        return {
            hot: ConfigParam.databases(
                withPrefix(prefix, 'hot'),
                withPrefix(descriptionPrefix, 'hot'),
            ),
            cache: ConfigParam.string(
                `${toOption(prefix)}-cache`,
                '',
                withPrefix(toPascal(descriptionPrefix), 'cache server'),
            ),
            cold: ConfigParam.databases(
                withPrefix(prefix, 'cold'),
                withPrefix(descriptionPrefix, 'cold'),
            ),
        }
    }

    static databases(
        prefix: string,
        descriptionPrefix?: string,
    ): ConfigParam<string[]> {
        descriptionPrefix ??= prefix
        return ConfigParam.array(
            toOption(prefix),
            [],
            withPrefix(toPascal(descriptionPrefix), 'databases'),
        )
    }

    static blockchain(prefix: string): BlockchainParams {
        const zerostatePrefix = withPrefix(prefix, 'zerostate')
        return {
            hotCache: ConfigParam.string(
                `${prefix !== '' ? `${toOption(prefix)}-` : ''}hot-cache`,
                '',
                withPrefix(toPascal(prefix), 'hot cache server'),
            ),
            hotCacheExpiration: ConfigParam.integer(
                `${
                    prefix !== '' ? `${toOption(prefix)}-` : ''
                }hot-cache-expiration`,
                10,
                withPrefix(toPascal(prefix), 'hot cache expiration in seconds'),
            ),
            hotCacheEmptyDataExpiration: ConfigParam.integer(
                `${
                    prefix !== '' ? `${toOption(prefix)}-` : ''
                }hot-cache-empty-data-expiration`,
                2,
                withPrefix(
                    toPascal(prefix),
                    'hot cache empty entries expiration in seconds',
                ),
            ),
            accounts: ConfigParam.databases(withPrefix(prefix, 'accounts')),
            blocks: ConfigParam.hotCold(withPrefix(prefix, 'blocks')),
            transactions: ConfigParam.hotCold(
                withPrefix(prefix, 'transactions'),
                withPrefix(prefix, 'transactions and messages'),
            ),
            zerostate: ConfigParam.string(
                toOption(zerostatePrefix),
                '',
                withPrefix(toPascal(zerostatePrefix), 'database'),
            ),
        }
    }

    static resolvePath(
        path: string[],
        value: Record<string, unknown>,
    ): ConfigValue | undefined {
        let parent: Record<string, unknown> | undefined = value
        for (let i = 0; i < path.length - 1 && parent !== undefined; i += 1) {
            parent = parent[path[i]] as Record<string, unknown>
        }
        return parent !== undefined
            ? (parent[path[path.length - 1]] as ConfigValue | undefined)
            : undefined
    }

    /**
     * Converts value specified in program option or environment variable into param type.
     * Returns undefined if value can't be converted.
     */
    parse(value: ConfigValue | undefined | null): ConfigValue | undefined {
        if (value === undefined || value === null) {
            return undefined
        }
        try {
            return this.parser(value.toString().trim())
        } catch (error) {
            throw QError.invalidConfigValue(
                this.option,
                error.message ?? error.toString(),
            )
        }
    }

    resolve(
        path: string[],
        options: Record<string, ConfigValue>,
        json: Record<string, unknown>,
        env: Record<string, string>,
        specified?: ConfigParam<ConfigValue>[],
    ): unknown | undefined {
        let resolved: ConfigValue | undefined =
            this.parse(options[this.optionName]) ??
            ConfigParam.resolvePath(path, json) ??
            this.parse(env[this.env])
        if (resolved !== undefined && specified !== undefined) {
            specified.push(this)
        }
        if (resolved === undefined && !this.deprecated) {
            resolved = this.defaultValue
        }
        if (resolved === '{ip}') {
            resolved = getIp()
        }
        return resolved
    }

    static resolveConfig<T>(
        options: Record<string, ConfigValue>,
        json: DeepPartial<T>,
        env: Record<string, string>,
        params: Record<string, unknown>,
    ): {
        config: T
        specified: ConfigParam<ConfigValue>[]
    } {
        const specified: ConfigParam<ConfigValue>[] = []
        const resolve = (
            path: string[],
            params: Record<string, unknown>,
        ): Record<string, unknown> | undefined => {
            let resolved: Record<string, unknown> | undefined = undefined
            for (const [name, param] of Object.entries(params)) {
                const paramPath = [...path, name]
                const value =
                    param instanceof ConfigParam
                        ? param.resolve(
                              paramPath,
                              options,
                              json,
                              env,
                              specified,
                          )
                        : resolve(paramPath, param as Record<string, unknown>)
                if (value !== undefined) {
                    if (resolved === undefined) {
                        resolved = { [name]: value }
                    } else {
                        resolved[name] = value
                    }
                }
            }
            return resolved
        }
        return {
            config: resolve([], params) as T,
            specified,
        }
    }

    static getAll(params: Record<string, unknown>): ConfigParam<ConfigValue>[] {
        const all: ConfigParam<ConfigValue>[] = []
        const collect = (params: Record<string, unknown>) => {
            for (const param of Object.values(params)) {
                if (param instanceof ConfigParam) {
                    all.push(param)
                } else {
                    collect(param as Record<string, unknown>)
                }
            }
        }
        collect(params)
        return all
    }

    defaultValueAsString(): string {
        const v = this.defaultValue
        if (v === null || v === undefined || v === '') {
            return ''
        }
        if (
            typeof v === 'string' ||
            typeof v === 'number' ||
            typeof v === 'boolean'
        ) {
            return `${v}`
        }
        if (Array.isArray(v)) {
            return v.join(',')
        }
        if (
            typeof v === 'object' &&
            v !== null &&
            Object.keys(v).length === 0
        ) {
            return ''
        }
        return JSON.stringify(v)
    }
}

function getIp(): string {
    for (const networkInterfaces of Object.values(os.networkInterfaces())) {
        if (networkInterfaces !== undefined) {
            for (const networkInterface of networkInterfaces) {
                if (
                    networkInterface.family === 'IPv4' &&
                    !networkInterface.internal
                ) {
                    return networkInterface.address
                }
            }
        }
    }
    return ''
}
