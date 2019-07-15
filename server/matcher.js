function valueMatched(key, match, value) {
    if (key === '<') {
        return value < match;
    }
    if (key === '<=') {
        return value <= match;
    }
    if (key === '>') {
        return value > match;
    }
    if (key === '>=') {
        return value >= match;
    }
    const field = value[key];
    if (match === null) {
        return field === null || field === undefined;
    }
    if (Array.isArray(match)) {
        return anyMatched(match, field);
    }
    if (typeof (match) === 'object') {
        return allMatched(match, field);
    }
    return field === match;
}

function anyMatched(matches, value) {
    for (const variant of matches) {
        if (valueMatched('', variant, value)) {
            return true;
        }
    }
    return false;

}

function allMatched(matches, value) {
    const keys = Object.keys(matches);
    if (keys.length === 0) {
        return true;
    }
    for (const key of keys) {
        if (!valueMatched(key, matches[key], value)) {
            return false;
        }
    }
    return true;
}


function matcher(match) {
    return (doc) => allMatched(match, doc);
}

function combine(path, key) {
    return key !== '' ? (path + '.' + key) : path;
}

function generateComparision(match, path, op) {
    return `${path} ${op} ${JSON.stringify(match)}` ;
}

function generateMatch(key, match, path) {
    if (key === '<') {
        return generateComparision(match, path, '<');
    }
    if (key === '<=') {
        return generateComparision(match, path, '<=');
    }
    if (key === '>') {
        return generateComparision(match, path, '>');
    }
    if (key === '>=') {
        return generateComparision(match, path, '>=');
    }
    if (match === null) {
        return `NOT NOT ${path}`;
    }
    if (Array.isArray(match)) {
        return generateAny(match, combine(path, key));
    }
    if (typeof (match) === 'object') {
        return generateAll(match, combine(path, key));
    }
    return generateComparision(match, combine(path, key), '==');
}


function generateAny(matches, path) {
    const conditions = matches.map(match => generateMatch('', match, path));
    if (conditions.length === 0) {
        return 'false';
    }
    if (conditions.length === 1) {
        return conditions[0];
    }
    return '(' + conditions.join(') OR (') + ')';
}


function generateAll(matches, path) {
    const conditions = [];
    const keys = Object.keys(matches);
    for (const key of keys) {
        conditions.push(generateMatch(key, matches[key], path));
    }
    if (conditions.length === 0) {
        return 'true';
    }
    if (conditions.length === 1) {
        return conditions[0];
    }
    return '(' + conditions.join(') AND (') + ')';
}

matcher.generateCondition = (match, path) => {
    return generateAll(match, path);
};

module.exports = matcher;
