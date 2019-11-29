// @flow
const customResolvers = {
    MessageHeaderIntMsgInfo: ['src', 'dst'],
    MessageHeaderExtInMsgInfo: ['src','dst'],
    MessageHeaderExtOutMsgInfo: ['src', 'dst'],
    Account: ['addr'],
    AccountStorage: ['state'],
    BlockExtra: ['out_msg_descr'],
    TransactionDescriptionOrdinary: ['bounce']
};


export function attachCustomResolvers(resolvers: any): any {
    const attached = Object.assign({}, resolvers);
    Object.entries(customResolvers).forEach(([name, fields]) => {
        let resolver = attached[name];
        if (!resolver) {
            resolver = {};
            attached[name] = resolver;
        }
        (fields:any).forEach((field) => {
            resolver[field] = (parent) => {
                const value = parent[field];
                return typeof value === 'string' ? { [value]: {} } : value;
            };
        });
    });
    return attached;
}

