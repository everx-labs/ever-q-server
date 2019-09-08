// @flow

export type QLog = {
    error: (...args: any) => void,
    debug: (...args: any) => void,
}

export default class QLogs {
	create(name: string): QLog {
		return {
			error(...args) {
				console.error(`[${name}]`, ...args);
			},
			debug(...args) {
				console.debug(`[${name}]`, ...args);
			}
		}
	}
}
