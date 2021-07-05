const http = require("http");

function httpGetJson(url) {
    return new Promise((resolve, reject) => {
        const tryUrl = (url) => {
            http
                .get(url, function (res) {
                    let body = "";

                    res.on("data", function (chunk) {
                        body += chunk;
                    });

                    res.on("end", function () {
                        if (res.statusCode === 301) {
                            const redirectUrl = res.headers["location"];
                            if (redirectUrl) {
                                tryUrl(redirectUrl);
                            } else {
                                reject(new Error("Redirect response has no `location` header."));
                            }
                            return;
                        }
                        const response = JSON.parse(body);
                        resolve(response);
                    });
                })
                .on("error", error => {
                    reject(error);
                });
        };
        tryUrl(url);
    });
}

function httpPostJson(url, query) {
    const data = JSON.stringify({
        query,
    });
    return new Promise((resolve, reject) => {
        const tryUrl = (url) => {
            const req = http.request(url, {
                method: "POST",
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': data.length
                }
            }, function (res) {
                let body = "";

                res.on("data", function (chunk) {
                    body += chunk;
                });

                res.on("end", function () {
                    if (res.statusCode === 301) {
                        const redirectUrl = res.headers["location"];
                        if (redirectUrl) {
                            tryUrl(redirectUrl);
                        } else {
                            reject(new Error("Redirect response has no `location` header."));
                        }
                        return;
                    }
                    const response = JSON.parse(body);
                    resolve(response);
                });
            })
                .on("error", error => {
                    reject(error);
                });
            req.write(data);
            req.end();
        };
        tryUrl(url);
    });
}

async function printLatency(port) {
    try {
        const response = await httpGetJson(`http://localhost:${port}/graphql?query=${encodeURIComponent("{info{latency}}")}`);
        console.log(`localhost:${port} has latency ${response.data.info.latency}`);
    } catch {
        console.log(`localhost:${port} broken`);
    }
}

async function updateLatency(port, latency) {
    await httpPostJson(`http://localhost:${port}/graphql/mam`, `
        mutation {
          updateConfig(config: { debugLatency: ${latency}}, accessKey:"bypass")
        }
    `);
}

const MAX_STRING_LENGTH = 10000;
function JSON_stringify(data) {
    const strings = [];
    const reduce = (value) => {
        if (typeof value === 'object' && value !== null) {
            const r = {};
            for ([n, v] of Object.entries(value)) {
                r[n] = reduce(v);
            }
            return r;
        } else if (typeof value === "string" && value.length > MAX_STRING_LENGTH) {
            strings.push(value);
            return "\0";
        }
        return value;
    };
    const parts = JSON.stringify(reduce(data)).split(`\\u0000`);
    let s = parts[0];
    for (let i = 1; i < parts.length; i += 1) {
        s += strings.shift();
        s += parts[i];
    }
    return s;
}

function JSON_parse(s) {
    const strings = [];
    const parts = s.split("\"");
    for (let i = 0; i < parts.length; i += 1) {
        if (parts[i].length > MAX_STRING_LENGTH) {
            strings.push(parts[i])
            parts[i] = `\\u0000`;
        }
    }
    const restore = (value) => {
        if (typeof value === 'object' && value !== null) {
            const r = {};
            for ([n, v] of Object.entries(value)) {
                r[n] = restore(v);
            }
            return r;
        } else if (value === "\0") {
            return strings.shift();
        }
        return value;
    }
    return restore(JSON.parse(parts.join("\"")));
}

(async () => {
    const argv = process.argv.slice(2);
    if (argv.length > 1) {
        await updateLatency(argv[0], argv[1]);
    }

    const data = { buf: Buffer.from("FF".repeat(100000000), "hex").toString("base64") };
    console.log('>>>', data.buf.length);
    const start = Date.now();
    for (let i = 0; i < 10; i += 1) {
        const s = JSON_stringify(data);
        JSON_parse(s);
    }
    console.log('>>>', (Date.now() - start)/1000);

    await printLatency(2001);
    await printLatency(2002);
    await printLatency(2003);
})();
