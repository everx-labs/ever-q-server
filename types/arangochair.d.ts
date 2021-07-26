import EventEmitter from "events";

export type ArangoSubscription = {
    collection: string,
    events?: string[],
    keys?: string[],
}

export type ArangoEventHandler = (err: Error, status: string, headers: { [name: string]: string }, body: string) => void;


export default class ArangoChair extends EventEmitter {
    _loggerStatePath: string;
    _loggerFollowPath: string;
    req: {
        opts: {
            headers: { [name: string]: string },
        }
    };

    constructor(adbUrl: string);

    start(): void;

    stop(): void;

    subscribe(options: string | ArangoSubscription | ArangoSubscription[]): void;

    unsubscribe(options: string | ArangoSubscription | ArangoSubscription[]): void;
}
