const fs = require("fs");
const path = require("path");

const toPascal = (s) => `${s[0].toUpperCase()}${s.substr(1).toLowerCase()}`;

/**
 * @typedef {{
 *     name: string,
 *     option: string,
 *     env: string,
 *     json: string,
 *     defaultValue: string,
 *     description: string,
 *     isArray: boolean,
 * }} ConfigParam
 */

/**
 *
 * @param {string} option
 * @param {string} defaultValue
 * @param {string} description
 * @param {boolean} [isArray]
 * @return {ConfigParam}
 */
function param(option, defaultValue, description, isArray) {
    const words = option.split("-");
    const env = `Q_${words.map(x => x.toUpperCase()).join("_")}`;
    return {
        name: `${words[0]}${words.slice(1).map(toPascal).join("")}`,
        option,
        env,
        defaultValue,
        description: `${description}${defaultValue && ` (default: "${defaultValue}")`}`,
        isArray: isArray ?? false,
    };
}

function dataParams(prefix) {
    function dataParam(name, defaultValue, description, isArray) {
        return param(
            `${prefix.toLowerCase().split(" ").join("-")}-${name}`,
            defaultValue,
            `${toPascal(prefix)} ${description}`,
            isArray,
        );
    }

    return {
        mut: dataParam(`mut`, "arangodb", "mutable db config url"),
        hot: dataParam(`hot`, "arangodb", "hot db config url"),
        cold: dataParam(`cold`, "", "cold db config urls (comma separated)", true),
        cache: dataParam(`cache`, "", "cache config url"),
        counterparties: dataParam(`counterparties`, "", "counterparties db config url"),
    };
}

const configSchema = {
    config: param("config", "", "Path to JSON configuration file"),
    filter: {
        orConversion: param(
            "filter-or-conversion",
            "sub-queries",
            "Filter OR conversion (or-operator | sub-queries)",
        ),
    },
    server: {
        host: param("host", "{ip}", "Listening address"),
        port: param("port", "4000", "Listening port"),
        keepAlive: param("keep-alive", "60000", "GraphQL keep alive ms", ""),
    },
    requests: {
        mode: param("requests-mode", "kafka", "Requests mode (kafka | rest)"),
        server: param("requests-server", "kafka:9092", "Requests server url"),
        topic: param("requests-topic", "requests", "Requests topic name"),
        maxSize: param("requests-max-size", "16383", "Maximum request message size in bytes"),
    },
    data: dataParams("data"),
    slowQueries: param(
        "slow-queries",
        "redirect",
        "Slow queries handling (enable | redirect | disable)",
    ),
    slowQueriesData: dataParams("slow-queries"),
    authorization: {
        endpoint: param("auth-endpoint", "", "Auth endpoint"),
    },
    jaeger: {
        endpoint: param("jaeger-endpoint", "", "Jaeger endpoint"),
        service: param("trace-service", "Q Server", "Trace service name"),
        tags: param(
            "trace-tags",
            "",
            "Additional trace tags (comma separated name=value pairs)",
            true,
        ),
    },
    statsd: {
        server: param("statsd-server", "", "StatsD server (host:port)"),
        tags: param(
            "statsd-tags",
            "",
            "Additional StatsD tags (comma separated name=value pairs)",
            true,
        ),
        resetInterval: param(
            "statsd-reset-interval",
            "",
            "Interval in ms between recreations of the StatsD socket",
        ),
    },
    mamAccessKeys: param(
        "mam-access-keys",
        "",
        "Access keys used to authorize mam endpoint access",
    ),
    isTests: param("is-tests", "false", ""),
    networkName: param(
        "network-name",
        "cinet.tonlabs.io",
        "Define the name of the network q-server is working with",
    ),
    cacheKeyPrefix: param(
        "cache-key-prefix",
        "Q_",
        "Prefix string to identify q-server keys in data cache",
    ),
    endpoints: param(
        "endpoints",
        "",
        "Alternative endpoints of q-server (comma separated addresses)",
        true,
    ),
};

/** @type {ConfigParam[]} */
const configParams = [];

function isParam(source) {
    return "name" in source && "option" in source;
}

function collectParams(source, path) {
    if (isParam(source)) {
        source.json = path.map((x, i) => `${x}${i < path.length - 1 ? "?." : ""}`).join("");
        configParams.push(source);
    } else {
        for (const [name, value] of Object.entries(source)) {
            collectParams(value, [...path, name]);
        }
    }
}

collectParams(configSchema, []);

const captions = ["Option", "ENV", "Default", "Description"];
const widths = [0, 0, 0, 0];
const rows = configParams.map(x => [`--${x.option} <value>`, x.env, x.defaultValue, x.description]);

const MAX_WIDTH = 80;

function adjustWidths(row) {
    for (let i = 0; i < row.length; i += 1) {
        const width = breakWords(row[i], MAX_WIDTH).reduce((w, s) => Math.max(w, s.length), 0);
        if (width > widths[i]) {
            widths[i] = width;
        }
    }
}

function breakWords(s, width) {
    const words = s.split(" ");
    const result = [];
    let line = "";
    words.forEach((w) => {
        if (line.length + w.length > width) {
            result.push(line);
            line = "";
        }
        if (line !== "") {
            line += " ";
        }
        line += w;
    });
    if (line !== "") {
        result.push(line);
    }
    return result;
}

function printLine(columns, row, lines) {
    const line = columns
        .map(x => row < x.length ? x[row] : "")
        .map((x, i) => x.padEnd(widths[i]))
        .join("  ");
    if (line.trim().length === 0) {
        return false;
    }
    lines.push(line.trim());
    return true;
}

function printRow(row, lines) {
    const columns = row.map((x, i) => breakWords(x, widths[i]));
    let i = 0;
    while (printLine(columns, i, lines)) {
        i += 1;
    }
}

function genReadme() {
    adjustWidths(captions);
    rows.forEach(adjustWidths);
    const lines = [];
    printRow(captions, lines);
    printRow(widths.map(x => "-".repeat(x)), lines);
    rows.forEach((row) => {
        printRow(row, lines);
    });
    fs.writeFileSync(path.resolve(__dirname, "README_.md"), lines.join("\n"));
}

function genStruct(name, keys) {
    let js = `export type ${name} = {\n`;
    for (const key of keys) {
        js += `\t${key}?: string,\n`;
    }
    return `${js}};\n\n`;
}

function genConfigSource() {
    let js = "";
    js += genStruct("QConfigEnv", configParams.map(x => x.env));
    js += genStruct("QConfigOptions", configParams.map(x => x.name));

    js += `export type QConfigJson = {\n`;
    const genFields = (source, indent) => {
        for (const [name, value] of Object.entries(source)) {
            js += `${indent}${name}?: `;
            if (isParam(value)) {
                js += `string${value.isArray ? "[]" : ""},\n`;
            } else {
                js += `{\n`;
                genFields(value, `${indent}\t`);
                js += `${indent}},\n`;
            }
        }
    };
    genFields(configSchema, "\t");
    js += `};\n\n`;

    js +=
`export interface QConfigParam {
    option(config: QConfigOptions): string | string[] | undefined,
    json(source: QConfigJson): string | string[] | undefined,
    env(source: QConfigEnv): string | string[] | undefined,
    defaultValue: string | string[],
}
`;
    js += `export type QConfigParams = Record<keyof QConfigOptions, QConfigParam>;\n`;
    js += `export const configParams: QConfigParams = {\n`;
    for (const param of configParams) {
        js +=
`    ${param.name}: {
        option: x => x.${param.name}${param.isArray ? `?.split(",")` : ""},
        env: x => x.${param.env}${param.isArray ? `?.split(",")` : ""},
        json: x => x.${param.json},
        defaultValue: ${JSON.stringify(param.defaultValue)} 
    },\n`;
    }
    js += `};\n\n`;

    fs.writeFileSync(path.resolve(__dirname, "src", "server", "config-source.ts"), js);
}

genReadme();
genConfigSource();
