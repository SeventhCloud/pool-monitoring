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
}

export class PoolMonitor {
  public id: string;
  private poolId: string;
  private minPrice: number;
  private maxPrice: number;
  private chain: string;
  private name: string;
  private interval: NodeJS.Timeout | null = null;

  constructor(options: PoolMonitorOptions) {
    this.id = hash("sha256", options.id);
    this.poolId = options.id;
    this.name = options.name;
    this.chain = options.chain;
    this.minPrice = options.minPrice;
    this.maxPrice = options.maxPrice;
  }

  public setRange(min: number, max: number) {
    this.minPrice = min;
    this.maxPrice = max;
  }

  public async getLivePool() {
    return await DexScreenerClient.getPair(this.chain, this.poolId) as DexPair;
  }

  public getPoolInfo() {
    return {
      id: this.id,
      poolId: this.poolId,
      name: this.name,
      chain: this.chain,
      minPrice: this.minPrice,
      maxPrice: this.maxPrice
    };
  }
}
