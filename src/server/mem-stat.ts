import v8 from "v8";
import { IStats } from "./tracer";

export class MemStats {
    stats: IStats;

    constructor(stats: IStats) {
        this.stats = stats;
    }

    report() {
        v8.getHeapSpaceStatistics().forEach((space: { space_name: string; physical_space_size: number; space_available_size: number; space_size: number; space_used_size: number; }) => {
            const spaceName = space.space_name
                .replace("space_", "")
                .replace("_space", "");
            const gauge = (metric: string, value: number) => {
                this.stats.gauge(`heap.space.${spaceName}.${metric}`, value, []).then(() => {
                });
            };
            gauge("physical_size", space.physical_space_size);
            gauge("available_size", space.space_available_size);
            gauge("size", space.space_size);
            gauge("used_size", space.space_used_size);
        });
    }

    start() {
        //TODO: this.checkMemReport();
        //TODO: this.checkGc();
    }

    checkMemReport() {
        setTimeout(() => {
            this.report();
            this.checkMemReport();
        }, 5000);
    }

    checkGc() {
        setTimeout(() => {
            global.gc();
            this.checkGc();
        }, 60000);
    }
}

