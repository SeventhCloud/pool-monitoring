import { EventEmitter } from 'events';
import { DexScreenerClient } from './services/DexScreenerClient';

export interface PoolMonitorOptions {
    id: string;
    chain: string;
    name: string;
    minPrice: number;
    maxPrice: number;
    checkInterval?: number;
}

export class PoolMonitor extends EventEmitter {
    public id: string;
    private minPrice: number;
    private maxPrice: number;
    private chain: string;
    private name: string;
    private interval: NodeJS.Timeout | null = null;
    private checkInterval: number;

    constructor(options: PoolMonitorOptions) {
        super();
        this.id = options.id;
        this.name = options.name;
        this.chain = options.chain;
        this.minPrice = options.minPrice;
        this.maxPrice = options.maxPrice;
        this.checkInterval = options.checkInterval ?? 10000;
    }

    public start() {
        if (this.interval) return;
        this.interval = setInterval(async () => {
            const price = await this.getPoolPrice();
            if (price < this.minPrice || price > this.maxPrice) {
                this.emit('priceOutOfRange', { id: this.id, price });
            }
        }, this.checkInterval);
    }

    public stop() {
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
        }
    }

    public setRange(min: number, max: number) {
        this.minPrice = min;
        this.maxPrice = max;
    }

    private async getPoolPrice(){
        const response = await DexScreenerClient.getPair(this.chain, this.id);
        return Number(response.priceNative) || 0;
    }

    public getPoolInfo() {
        return {
            id: this.id,
            name: this.name,
            chain: this.chain,
            minPrice: this.minPrice,
            maxPrice: this.maxPrice,
            checkInterval: this.checkInterval
        };
    }
}
