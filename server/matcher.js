function valueMatched(match, value) {
    if (match === null) {
        return value === null || value === undefined;
    }
    if (Array.isArray(match)) {
        for (const item of match) {
            if (valueMatched(item, value)) {
                return true;
            }
        }
        return false;
    }
    if (typeof(match) === 'object') {
        return matcher(match)(value);
    }
    return value === match;
}

function matcher(match) {
    const keys = Object.keys(match);
    if (keys.length === 0) {
        return () => true;
    }
    return (doc) => {
        for (const key of keys) {
            if (!valueMatched(match[key], doc[key])) {
                return false;
            }
        }
        return true;
    };
}


module.exports = matcher;
