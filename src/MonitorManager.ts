import { hash } from "crypto";
import { readFileSync } from "fs";
import { join } from "path";
import { PoolMonitor, PoolMonitorOptions } from "./PoolMonitor";
import { DexPair } from "./models/DexScreenerModels";
import { EventEmitter } from "stream";

export class MonitorManager {
  private monitors: Map<string, PoolMonitor> = new Map();
  public poolNotifier: EventEmitter = new EventEmitter();
  public checkInterval: number = 60_000 * 5; // 5 minutes
  public interval: NodeJS.Timeout | null = null;

  constructor() {
    try {
      const filePath = join(__dirname, "../data/pools.json"); // relative to compiled JS
      const data = readFileSync(filePath, "utf-8");
      const poolOptions = JSON.parse(data) as PoolMonitorOptions[];
      poolOptions.forEach((option) =>
        this.monitors.set(hash("sha256", option.id), new PoolMonitor(option))
      );
      this.interval = setInterval(() => this.checkAllMonitors(), this.checkInterval); // check all monitors every checkInterval

    } catch (error) {
      console.error("No Monitors found, continuing without Monitors", error);
    }
  }

  async checkAllMonitors() {
    this.monitors.forEach(async (monitor) => {
      const poolInfo = monitor.getPoolInfo();
      const pool = await monitor.getLivePool();
      const price = parseFloat(pool.priceNative);
      if (price < poolInfo.minPrice || price > poolInfo.maxPrice) {
        this.poolNotifier.emit("priceOutOfRange", pool);
      }
    });
  }

  public saveMonitors() {
    const data = Array.from(this.monitors.values()).map((monitor) => ({
      id: monitor.getPoolInfo().poolId,
      name: monitor.getPoolInfo().name,
      chain: monitor.getPoolInfo().chain,
      minPrice: monitor.getPoolInfo().minPrice,
      maxPrice: monitor.getPoolInfo().maxPrice
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

  public changeInterval(newInterval: number) {
    this.checkInterval = newInterval;
    if (this.interval) {
      clearInterval(this.interval);
      console.log(`Cleared Interval ${this.interval}`);
    }
    this.interval = setInterval(() => this.checkAllMonitors(), this.checkInterval);
  }

  public addMonitor(dexPair: DexPair, [min, max]: number[]) {
    const monitor = new PoolMonitor({
      id: dexPair.pairAddress,
      chain: dexPair.chainId,
      name: `${dexPair.baseToken.symbol}/${dexPair.quoteToken.symbol}`,
      minPrice: min,
      maxPrice: max
    });
    this.monitors.set(monitor.id, monitor);
    this.saveMonitors();
  }

  public removeMonitor(poolHashID: string) {
    const result = this.monitors.delete(poolHashID);
    this.saveMonitors();
    return result;
  }

  public getPools() {
    return this.monitors;
  }
}
