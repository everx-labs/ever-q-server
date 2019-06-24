function matcher(match) {
	const keys = Object.keys(match);
	if (keys.length === 0) {
		return () => true;
	}
	return (doc) => {
		for (const key of keys) {
			if (doc[key] !== match[key]) {
				return false;
			}
		}
		return true;
	};
}


module.exports = matcher;
