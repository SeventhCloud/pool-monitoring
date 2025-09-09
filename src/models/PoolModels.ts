export type PoolConfig = {
  id: string; // uuid or generated id
  chain: string; // e.g. "ethereum", "bsc", "solana"
  pairId: string; // pairId or token address depending on endpoint
  lower?: number; // lower bound - notify if price < lower
  upper?: number; // upper bound - notify if price > upper
  intervalSec: number; // poll interval
  lastNotifiedAt?: number;
};


