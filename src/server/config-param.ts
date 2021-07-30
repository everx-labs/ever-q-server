import os from "os";

function toPascal(s: string): string {
    return `${s[0].toUpperCase()}${s.substr(1).toLowerCase()}`;
}

export type DeepPartial<T> = {
    [P in keyof T]?: DeepPartial<T[P]>;
};

type ValueParser<T extends ConfigValue> = (s: string) => T | undefined;

const parse = {
    boolean: (s: string): boolean | undefined => s.toLowerCase() === "true",
    integer(s: string): number | undefined {
        const n = Number.parseInt(s);
        return Number.isInteger(n) ? n : undefined;
    },
    string: (s: string): string | undefined => s,
    array: (s: string): string[] | undefined => s.split(","),
    map(s: string): Record<string, string> {
        return s.split(",").reduce((map, nameValue): Record<string, string> => {
            let i = nameValue.indexOf("=");
            if (i < 0) {
                i = nameValue.length;
            }
            return {
                ...map,
                [nameValue.substr(0, i)]: nameValue.substr(i + 1),
            };
        }, {} as Record<string, string>);
    },
};

export type ConfigValue = boolean | number | string | string[] | Record<string, string>;

type HotColdParams = {
    hot: ConfigParam<string[]>,
    cache: ConfigParam<string>,
    cold: ConfigParam<string[]>,
};

type BlockchainParams = {
    accounts: ConfigParam<string[]>,
    blocks: HotColdParams,
    transactions: HotColdParams,
};

export class ConfigParam<T extends ConfigValue> {
    optionName: string;
    env: string;
    description: string;

    private constructor(
        public option: string,
        public defaultValue: T,
        description: string,
        public parser: ValueParser<T>,
        public deprecated: boolean = false,
    ) {
        const words = option.split("-");
        this.env = `Q_${words.map(x => x.toUpperCase()).join("_")}`;
        this.optionName = `${words[0]}${words.slice(1).map(toPascal).join("")}`;
        this.description = `${description}${defaultValue && ` (default: "${defaultValue}")`}`;
    }

    static string(
        option: string,
        defaultValue: string,
        description: string,
        deprecated = false,
    ): ConfigParam<string> {
        return new ConfigParam(option, defaultValue, description, parse.string, deprecated);
    }

    static integer(
        option: string,
        defaultValue: number,
        description: string,
        deprecated = false,
    ): ConfigParam<number> {
        return new ConfigParam(option, defaultValue, description, parse.integer, deprecated);
    }

    static boolean(
        option: string,
        defaultValue: boolean,
        description: string,
        deprecated = false,
    ): ConfigParam<boolean> {
        return new ConfigParam(option, defaultValue, description, parse.boolean, deprecated);
    }

    static array(
        option: string,
        defaultValue: string[],
        description: string,
        deprecated = false,
    ): ConfigParam<string[]> {
        return new ConfigParam(option, defaultValue, description, parse.array, deprecated);
    }

    static map(
        option: string,
        defaultValue: Record<string, string>,
        description: string,
        deprecated = false,
    ): ConfigParam<Record<string, string>> {
        return new ConfigParam(option, defaultValue, description, parse.map, deprecated);
    }

    static dataDeprecated(prefix: string): {
        mut: ConfigParam<string>,
        hot: ConfigParam<string>,
        cold: ConfigParam<string[]>,
        cache: ConfigParam<string>,
        counterparties: ConfigParam<string>,
    } {
        function dataParam<T extends ConfigValue>(name: string, defaultValue: T, description: string, parser: ValueParser<T>) {
            return new ConfigParam<T>(
                `${prefix.toLowerCase().split(" ").join("-")}-${name}`,
                defaultValue,
                `${toPascal(prefix)} ${description}`,
                parser,
                true,
            );
        }

        return {
            mut: dataParam("mut", "arangodb", "mutable db config url", parse.string),
            hot: dataParam("hot", "arangodb", "hot db config url", parse.string),
            cold: dataParam("cold", [], "cold db config urls (comma separated)", parse.array),
            cache: dataParam("cache", "", "cache config url", parse.string),
            counterparties: dataParam("counterparties", "", "counterparties db config url", parse.string),
        };
    }

    static hotCold(prefix: string): HotColdParams {
        return {
            hot: ConfigParam.databases(`${prefix} hot`),
            cache: ConfigParam.string(
                `${prefix.toLowerCase().split(" ").join("-")}-cache`,
                "",
                `${toPascal(prefix)} cache server`,
            ),
            cold: ConfigParam.databases(`${prefix} cold`),
        };

    }

    static databases(prefix: string): ConfigParam<string[]> {
        return ConfigParam.array(
            `${prefix.toLowerCase().split(" ").join("-")}`,
            [],
            `${toPascal(prefix)} databases`,
        );
    }

    static blockchain(prefix: string): BlockchainParams {
        return {
            accounts: ConfigParam.databases(`${prefix} accounts`),
            blocks: ConfigParam.hotCold(`${prefix} blocks`),
            transactions: ConfigParam.hotCold(`${prefix} transactions`),
        };
    }

    static resolvePath(path: string[], value: Record<string, unknown>): unknown | undefined {
        let result: unknown | undefined = value;
        for (let i = 0; i < path.length && result !== undefined; i += 1) {
            result = (result as Record<string, unknown>)[path[i]];
        }
        return result;
    }

    /**
     * Converts value specified in program option or environment variable into param type.
     * Returns undefined if value can't be converted.
     */
    parse(value: string | number | boolean | undefined | null): ConfigValue | undefined {
        return (value !== undefined && value !== null)
            ? this.parser(value.toString().trim())
            : undefined;
    }

    resolve(
        path: string[],
        options: Record<string, ConfigValue>,
        json: Record<string, unknown>,
        env: Record<string, string>,
    ): unknown | undefined {
        let resolved: ConfigValue | undefined = options[this.optionName]
            ?? ConfigParam.resolvePath(path, json)
            ?? env[this.env];
        if (resolved !== undefined && !this.deprecated) {
            resolved = this.defaultValue;
        }
        if (resolved === "{ip}") {
            resolved = getIp();
        }
        return resolved;
    }

    static resolveConfig<T>(
        options: Record<string, ConfigValue>,
        json: DeepPartial<T>,
        env: Record<string, string>,
        params: Record<string, unknown>,
    ): T {
        const resolve = (path: string[], params: Record<string, unknown>): Record<string, unknown> | undefined => {
            let resolved: Record<string, unknown> | undefined = undefined;
            for (const [name, param] of Object.entries(params)) {
                const value = param instanceof ConfigParam
                    ? param.resolve(path, options, json, env)
                    : resolve([...path, name], param as Record<string, unknown>);
                if (value !== undefined) {
                    if (resolved === undefined) {
                        resolved = { [name]: value };
                    } else {
                        resolved[name] = value;
                    }
                }
            }
            return resolved;
        };
        return resolve([], params) as T;
    }

    static getAll(params: Record<string, unknown>): ConfigParam<ConfigValue>[] {
        const all: ConfigParam<ConfigValue>[] = [];
        const collect = (params: Record<string, unknown>) => {
            for (const param of Object.values(params)) {
                if (param instanceof ConfigParam) {
                    all.push(param);
                } else {
                    collect(param as Record<string, unknown>);
                }
            }
        };
        collect(params);
        return all;
    }
}


function getIp(): string {
    for (const networkInterfaces of Object.values(os.networkInterfaces())) {
        if (networkInterfaces !== undefined) {
            for (const networkInterface of networkInterfaces) {
                if (networkInterface.family === "IPv4" && !networkInterface.internal) {
                    return networkInterface.address;
                }
            }
        }
    }
    return "";
}


