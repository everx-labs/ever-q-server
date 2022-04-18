/*
 * Copyright 2018-2020 TON DEV SOLUTIONS LTD.
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

import { toJSON } from './utils'

export interface QLog {
  error(...args: unknown[]): void

  debug(...args: unknown[]): void
}

function str(arg: unknown): string {
  let s
  if (arg instanceof Error) {
    s = arg.message || arg.toString()
  } else if (typeof arg === 'string') {
    s = arg
  } else {
    s = toJSON(arg)
  }
  return s.split('\n').join('\\n').split('\t').join('\\t')
}

function format(name: string, args: unknown[]) {
  return `${Date.now()}\t${name}\t${args.map(str).join('\t')}`
}

export default class QLogs {
  static stopped: boolean

  static error(...args: unknown[]) {
    if (QLogs.stopped) {
      return
    }
    console.error(...args)
  }

  static debug(...args: unknown[]) {
    if (QLogs.stopped) {
      return
    }
    console.debug(...args)
  }

  create(name: string): QLog {
    return {
      error(...args) {
        QLogs.error(format(name, args))
      },
      debug(...args) {
        QLogs.debug(format(name, args))
      },
    }
  }

  start() {
    QLogs.stopped = false
  }

  stop() {
    QLogs.stopped = true
  }
}

QLogs.stopped = false
