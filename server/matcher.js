function valueMatched(match, value) {
    if (match === null) {
        return value === null || value === undefined;
    }
    if (Array.isArray(match)) {
        return arrayMatched(match, value);
    }
    if (typeof (match) === 'object') {
        return objectMatched(match, value);
    }
    return value === match;
}

function arrayMatched(match, value) {
    for (const variant of match) {
        if (valueMatched(variant, value)) {
            return true;
        }
    }
    return false;

}

function objectMatched(match, value) {
    const keys = Object.keys(match);
    if (keys.length === 0) {
        return true;
    }
    for (const key of keys) {
        if (!valueMatched(match[key], value[key])) {
            return false;
        }
    }
    return true;
}


function matcher(match) {
    return (doc) => objectMatched(match, doc);
}

module.exports = matcher;
