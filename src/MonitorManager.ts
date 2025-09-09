import { readFileSync } from "fs";
import { PoolMonitor, PoolMonitorOptions } from "./PoolMonitor";
import { TelegramBot } from "./Bot";

export class MonitorManager {
    private monitors: Map<string, PoolMonitor> = new Map();

    constructor() {
        
        try {
            const data = readFileSync("data/pools.json", "utf-8");
            const poolOptions = JSON.parse(data) as PoolMonitorOptions[];
            poolOptions.forEach(option => this.monitors.set(option.id, new PoolMonitor(option)));
        } catch (error) {
            console.error("No Monitors found, continuing without Monitors", error);
        }
    }

    public listMonitors() {
        return Array.from(this.monitors.values());
    }

    public addMonitor(monitor: PoolMonitor) {
        this.monitors.set(monitor.id, monitor);
    }

    public removeMonitor(monitor: PoolMonitor) {
        this.monitors.delete(monitor.id);
    }

    public getPools() {
        return this.monitors;
    }
}