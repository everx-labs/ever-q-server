/*
 * Copyright 2018-2019 TON DEV SOLUTIONS LTD.
 *
 * Licensed under the SOFTWARE EVALUATION License (the "License"); you may not use
 * this file except in compliance with the License.  You may obtain a copy of the
 * License at:
 *
 * http://www.ton.dev/licenses
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific TON DEV software governing permissions and
 * limitations under the License.
 */

// @flow

export type QLog = {
    error: (...args: any) => void,
    debug: (...args: any) => void,
}

function str(arg: any): string {
    const s = typeof arg === 'string' ? arg : JSON.stringify(arg);
    return s.split('\n').join('\\n').split('\t').join('\\t');
}

function format(name: string, args: string[]) {
    return `${Date.now()}\t${name}\t${args.map(str).join('\t')}`;
}

export default class QLogs {
	create(name: string): QLog {
		return {
			error(...args) {
				console.error(format(name, args));
			},
			debug(...args) {
				console.debug(format(name, args));
			}
		}
	}
}
