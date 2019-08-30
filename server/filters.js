/*
type FilterDispatcher {
    ql: (path: string, filterKey: string, filterValue: any, field: any) => string,
    test: (value: any, filterKey: string, filterValue: any, field: any) => boolean,
}
type Filter {
    dispatcher: FilterDispatch,
    fields: { [string]: any }
}
 */
function combine(path, key) {
    return key !== '' ? (path + '.' + key) : path;
}

function qlOp(path, op, filter) {
    return `${path} ${op} ${JSON.stringify(filter)}`;
}

function qlCombine(conditions, op, defaultConditions) {
    if (conditions.length === 0) {
        return defaultConditions;
    }
    if (conditions.length === 1) {
        return conditions[0];
    }
    return '(' + conditions.join(`) ${op} (`) + ')';
}

function qlIn(path, filter) {
    const conditions = filter.map(value => qlOp(path, '==', value));
    return qlCombine(conditions, 'OR', false);
}


const scalarEq = {
    ql(path, filter) {
        return qlOp(path, '==', filter);
    },
    test(value, filter) {
        return value === filter;
    },
};

const scalarNe = {
    ql(path, filter) {
        return qlOp(path, '!=', filter);
    },
    test(value, filter) {
        return value !== filter;
    },
};

const scalarLt = {
    ql(path, filter) {
        return qlOp(path, '<', filter);
    },
    test(value, filter) {
        return value < filter;
    },
};

const scalarLe = {
    ql(path, filter) {
        return qlOp(path, '<=', filter);
    },
    test(value, filter) {
        return value <= filter;
    },
};

const scalarGt = {
    ql(path, filter) {
        return qlOp(path, '>', filter);
    },
    test(value, filter) {
        return value > filter;
    },
};

const scalarGe = {
    ql(path, filter) {
        return qlOp(path, '>=', filter);
    },
    test(value, filter) {
        return value >= filter;
    },
};

const scalarIn = {
    ql(path, filter) {
        return qlIn(path, filter);
    },
    test(value, filter) {
        return filter.includes(value);
    },
};

const scalarNotIn = {
    ql(path, filter) {
        return `NOT (${qlIn(path, filter)})`;
    },
    test(value, filter) {
        return !filter.includes(value);
    }
};

const scalar = {
    dispatcher: {
        ql(path, filterKey, filterValue, op) {
            return op.ql(path, filterValue);
        },
        test(value, filterKey, filterValue, op) {
            return op.test(value, filterValue);
        }
    },
    fields: {
        eq: scalarEq,
        ne: scalarNe,
        lt: scalarLt,
        le: scalarLe,
        gt: scalarGt,
        ge: scalarGe,
        in: scalarIn,
        notIn: scalarNotIn,
    }
};

const struct = {
    ql(path, filterKey, filterValue, field) {
        return qlFilter(combine(path, filterKey), filterValue, field);
    },
    test(value, filterKey, filterValue, field) {
        return testFilter(value[filterKey], filterValue, field);
    }
};

const array = {
    ql(path, filterKey, filterValue, field) {
        switch (filterKey) {
        case 'all':
            break;
        case 'any':
            break;
        }
        return 'true';
    },
    test(value, filterKey, filterValue, field) {
        switch (filterKey) {
        case 'all':
            break;
        case 'any':
            break;
        }
        return true;
    }
};

function qlFilter(path, filter, type) {
    const conditions = [];
    Object.entries(filter).forEach(([filterKey, filterValue]) => {
        const field = type.fields[filterKey];
        if (field) {
            conditions.push(type.dispatcher.ql(path, filterKey, filterValue, field))
        }
    });
    return qlCombine(conditions, 'AND', 'false');
}

function testFilter(value, filter, type) {
    const failed = Object.entries(filter).find(([filterKey, filterValue]) => {
        const field = type.fields[filterKey];
        return !!(field && type.dispatcher.test(value, filterKey, filterValue, field));
    });
    return !failed;
}

module.exports = {
    scalar,
    struct,
    qlFilter,
    testFilter,
};
