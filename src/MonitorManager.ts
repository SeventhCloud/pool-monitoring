import { readFileSync } from "fs";
import { join } from "path";
import { PoolMonitor, PoolMonitorOptions } from "./PoolMonitor";
import { hash } from "crypto";


export class MonitorManager {
    private monitors: Map<string, PoolMonitor> = new Map();

    constructor() {
        try {
            const filePath = join(__dirname, "../data/pools.json"); // relative to compiled JS
            const data = readFileSync(filePath, "utf-8");
            const poolOptions = JSON.parse(data) as PoolMonitorOptions[];
            poolOptions.forEach(option => this.monitors.set(hash("sha256", option.id), new PoolMonitor(option)));
        } catch (error) {
            console.error("No Monitors found, continuing without Monitors", error);
        }
    }

    public saveMonitors() {
        const data = Array.from(this.monitors.values()).map(monitor => ({
            id: monitor.getPoolInfo().poolId,
            name: monitor.getPoolInfo().name,
            chain: monitor.getPoolInfo().chain,
            minPrice: monitor.getPoolInfo().minPrice,
            maxPrice: monitor.getPoolInfo().maxPrice,
            checkInterval: monitor.getPoolInfo().checkInterval
        }));
        try {
            const filePath = join(__dirname, "../data/pools.json");
            require("fs").writeFileSync(filePath, JSON.stringify(data, null, 2));
            console.log("Saved monitors to data/pools.json");
        } catch (error) {
            console.error("Error saving monitors:", error);
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