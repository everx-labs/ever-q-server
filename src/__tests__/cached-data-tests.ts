import { CachedData } from "../server/cached-data"

function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
}

class TestCache extends CachedData<string> {
    refreshCount = 0
    next = ["A", "B", "C", "D"]
    constructor() {
        super({ ttlMs: 50 })
    }

    async loadActual(): Promise<string> {
        await sleep(10)
        this.refreshCount += 1
        return this.next.shift() ?? "ERROR"
    }
}

test("Cached data", async () => {
    const data = new TestCache()
    expect(await Promise.all([data.get(), data.get()])).toStrictEqual([
        "A",
        "A",
    ])
    await sleep(100)
    expect(await data.get()).toBe("B")
    await sleep(10)
    expect(await data.get()).toBe("B")
    await sleep(100)
    expect(await Promise.all([data.get(), data.get()])).toStrictEqual([
        "D",
        "D",
    ])
    await sleep(10)
    expect(await Promise.all([data.get(), data.get()])).toStrictEqual([
        "D",
        "D",
    ])
    expect(data.refreshCount).toBe(4)
})
