const customResolvers = {
    BlockExtra: ['out_msg_descr'],
};


function attachCustomResolvers(resolvers) {
    const attached = Object.assign({}, resolvers);
    Object.entries(customResolvers).forEach(([name, fields]) => {
        let resolver = attached[name];
        if (!resolver) {
            resolver = {};
            attached[name] = resolver;
        }
        fields.forEach((field) => {
            resolver[field] = (parent) => {
                const value = parent[field];
                return typeof value === 'string' ? { [value]: {} } : value;
            };
        });
    });
    return attached;
}

export {
    attachCustomResolvers
}
