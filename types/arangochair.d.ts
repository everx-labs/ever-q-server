import EventEmitter from "events";

export type ArangoSubscription = {
    collection: string,
    events?: string[],
    keys?: string[],
}

export type ArangoEventHandler = (err: any, status: string, headers: { [name: string]: any }, body: string) => void;


export default class ArangoChair extends EventEmitter {
    _loggerStatePath: string;
    _loggerFollowPath: string;
    req: {
        opts: {
            headers: { [name: string]: any },
        }
    };

    constructor(adbUrl: string);

    start(): void;

    stop(): void;

    subscribe(options: string | ArangoSubscription | ArangoSubscription[]): void;

    unsubscribe(options: string | ArangoSubscription | ArangoSubscription[]): void;
}
