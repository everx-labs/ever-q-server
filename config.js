function getIp() {
    const ipv4 = Object.values(require('os').networkInterfaces())
        .flatMap(x => x)
        .find(x => x.family === 'IPv4' && !x.internal);
    return ipv4 && ipv4.address;
}

const MODE = {
    production: 'production',
    development: 'development',
};

const env = {
    mode: process.env.Q_MODE || MODE.production,
    ssl: (process.env.Q_SSL || '') === 'true',
    database_server: process.env.Q_DATABASE_SERVER || 'arangodb:8529',
    database_name: process.env.Q_DATABASE_NAME || 'blockchain',
    server_host: process.env.Q_SERVER_HOST || getIp(),
    server_port: process.env.Q_SERVER_PORT || 4000,
};

module.exports = {
    MODE,
    mode: env.mode,
    server: {
        host: env.server_host,
        port: env.server_port,
        ssl: env.ssl
            ? {
                port: 4001,
                key: 'server/ssl/server.key',
                cert: 'server/ssl/server.crt',
            }
            : null,
    },
    database: {
        server: env.mode === MODE.production ? env.database_server : 'services.tonlabs.io:8529',
        name: env.database_name
    },
    listener: {
        restartTimeout: 1000
    }
};
