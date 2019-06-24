module.exports = {
	create(name) {
		return {
			error(...args) {
				console.error(`[${name}]`, ...args);
			},
			debug(...args) {
				console.debug(`[${name}]`, ...args);
			}
		}
	}
};
