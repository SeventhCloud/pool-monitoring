import { hash } from "crypto";
import { readFileSync } from "fs";
import { join } from "path";
import { PoolMonitor, PoolMonitorOptions } from "./PoolMonitor";
import { DexPair } from "./models/DexScreenerModels";

export class MonitorManager {
  private monitors: Map<string, PoolMonitor> = new Map();

  constructor() {
    try {
      const filePath = join(__dirname, "../data/pools.json"); // relative to compiled JS
      const data = readFileSync(filePath, "utf-8");
      const poolOptions = JSON.parse(data) as PoolMonitorOptions[];
      poolOptions.forEach((option) =>
        this.monitors.set(hash("sha256", option.id), new PoolMonitor(option))
      );
    } catch (error) {
      console.error("No Monitors found, continuing without Monitors", error);
    }
  }

  public saveMonitors() {
    const data = Array.from(this.monitors.values()).map((monitor) => ({
      id: monitor.getPoolInfo().poolId,
      name: monitor.getPoolInfo().name,
      chain: monitor.getPoolInfo().chain,
      minPrice: monitor.getPoolInfo().minPrice,
      maxPrice: monitor.getPoolInfo().maxPrice,
      checkInterval: monitor.getPoolInfo().checkInterval,
    }));
    try {
      const filePath = join(__dirname, "../data/pools.json");
      require("fs").writeFileSync(filePath, JSON.stringify(data, null, 2));
    } catch (error) {
      console.error("Error saving monitors:", error);
    }
  }

  public listMonitors() {
    return Array.from(this.monitors.values());
  }

  public addMonitor(dexPair: DexPair, [min, max]: number[]) {
    const monitor = new PoolMonitor({
      id: dexPair.pairAddress,
      chain: dexPair.chainId,
      name: `${dexPair.baseToken.symbol}/${dexPair.quoteToken.symbol}`,
      minPrice: min,
      maxPrice: max,
      checkInterval: 300000,
    });
    this.monitors.set(monitor.id, monitor);
    this.saveMonitors();
  }

  public removeMonitor(poolHashID: string) {
    this.monitors.get(poolHashID)?.stop();
    const result = this.monitors.delete(poolHashID);
    this.saveMonitors();
    return result;
  }

  public getPools() {
    return this.monitors;
  }
}
