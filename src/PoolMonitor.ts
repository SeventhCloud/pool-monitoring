import { EventEmitter } from "events";
import { DexScreenerClient } from "./services/DexScreenerClient";
import { hash } from "crypto";
import { DexPair } from "./models/DexScreenerModels";

export interface PoolMonitorOptions {
  id: string;
  chain: string;
  name: string;
  minPrice: number;
  maxPrice: number;
  checkInterval?: number;
}

export class PoolMonitor extends EventEmitter {
  static intervalDelay = 0;
  public id: string;
  private poolId: string;
  private minPrice: number;
  private maxPrice: number;
  private chain: string;
  private name: string;
  private interval: NodeJS.Timeout | null = null;
  private checkInterval: number;

  constructor(options: PoolMonitorOptions) {
    super();
    this.id = hash("sha256", options.id);
    this.poolId = options.id;
    this.name = options.name;
    this.chain = options.chain;
    this.minPrice = options.minPrice;
    this.maxPrice = options.maxPrice;
    this.checkInterval = (options.checkInterval ?? 10000) + ++PoolMonitor.intervalDelay * 2000;
    console.log(`PoolMonitor for ${this.name} will check every ${this.checkInterval} ms`);
  }

  public start() {
    if (this.interval) return;
    this.interval = setInterval(async () => {
      const pool = await this.getPool();
      const price = parseFloat(pool.priceNative);
      if (price < this.minPrice || price > this.maxPrice) {
        this.emit("priceOutOfRange", pool);
      }
    }, this.checkInterval);
  }

  public stop() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
      this.removeAllListeners();
    }
  }

  public setRange(min: number, max: number) {
    this.minPrice = min;
    this.maxPrice = max;
  }

  private async getPool() {
    return await DexScreenerClient.getPair(this.chain, this.poolId) as DexPair;
  }

  public getPoolInfo() {
    return {
      id: this.id,
      poolId: this.poolId,
      name: this.name,
      chain: this.chain,
      minPrice: this.minPrice,
      maxPrice: this.maxPrice,
      checkInterval: this.checkInterval,
    };
  }
}
