import { QDataCache } from '../data-provider'

export class InMemoryDataCache implements QDataCache {
  data: Map<string, unknown>
  getCount: number
  setCount: number
  lastKey: string

  constructor() {
    this.data = new Map()
    this.getCount = 0
    this.setCount = 0
    this.lastKey = ''
  }

  async get(key: string): Promise<unknown | undefined> {
    this.lastKey = key
    this.getCount += 1
    return this.data.get(key)
  }

  async set(key: string, value: unknown): Promise<void> {
    this.lastKey = key
    this.setCount += 1
    this.data.set(key, value)
  }
}
