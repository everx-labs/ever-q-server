import { $$asyncIterator } from "iterall"
import { CollectionFilter, selectFields } from "../filter/filters"
import type { FieldSelection, QType } from "../filter/filters"
import { QDoc } from "./data-provider"

export class QDataListener {
    docType: QType
    filter: CollectionFilter

    constructor(docType: QType, filter: CollectionFilter) {
        this.docType = docType
        this.filter = filter
    }

    isFiltered(doc: QDoc): boolean {
        return this.docType.test(null, doc, this.filter)
    }
}

type QSubscriptionItem = {
    [collection: string]: QDoc
}

export class QDataSubscription
    extends QDataListener
    implements AsyncIterator<QSubscriptionItem>
{
    collectionName: string
    selection: FieldSelection[]
    pullQueue: ((result: IteratorResult<QSubscriptionItem>) => void)[]
    pushQueue: QSubscriptionItem[]
    running: boolean
    onClose: (() => void) | null

    constructor(
        collectionName: string,
        docType: QType,
        filter: CollectionFilter,
        selection: FieldSelection[],
    ) {
        super(docType, filter)
        this.collectionName = collectionName
        this.selection = selection
        this.pullQueue = []
        this.pushQueue = []
        this.running = true
        this.onClose = null
    }

    pushDocument(doc: QDoc) {
        if (this.isFiltered(doc) && !this.isQueueOverflow()) {
            const reduced = selectFields(doc, this.selection)
            this.pushValue({ [this.collectionName]: reduced as QDoc })
        }
    }

    isQueueOverflow(): boolean {
        return this.getQueueSize() >= 10
    }

    getQueueSize(): number {
        return this.pushQueue.length + this.pullQueue.length
    }

    pushValue(item: QSubscriptionItem) {
        if (this.pullQueue.length !== 0) {
            this.pullQueue.shift()?.(
                this.running
                    ? {
                          value: item,
                          done: false,
                      }
                    : {
                          value: item,
                          done: true,
                      },
            )
        } else {
            this.pushQueue.push(item)
        }
    }

    async next(): Promise<IteratorResult<QSubscriptionItem>> {
        return new Promise(resolve => {
            const dequeued = this.pushQueue.shift()
            if (dequeued !== undefined) {
                const item: IteratorResult<QSubscriptionItem> = this.running
                    ? {
                          value: dequeued,
                          done: false,
                      }
                    : {
                          value: undefined,
                          done: true,
                      }
                resolve(item)
            } else {
                this.pullQueue.push(resolve)
            }
        })
    }

    async return(): Promise<IteratorResult<QSubscriptionItem>> {
        if (this.onClose) {
            this.onClose()
        }
        await this.emptyQueue()
        return {
            value: undefined,
            done: true,
        }
    }

    async throw(error?: Error): Promise<IteratorResult<QSubscriptionItem>> {
        if (this.onClose) {
            this.onClose()
        }
        await this.emptyQueue()
        return Promise.reject(error)
    }

    [$$asyncIterator]() {
        return this
    }

    async emptyQueue() {
        if (this.running) {
            this.running = false
            this.pullQueue.forEach(resolve =>
                resolve({
                    value: undefined,
                    done: true,
                }),
            )
            this.pullQueue = []
            this.pushQueue = []
        }
    }
}
