import axios, { AxiosInstance } from 'axios';
import { DexscreenerResponse } from '../models/DexScreenerModels';

export class DexScreenerClient {
  static baseUrl = process.env.DEX_SCREENER_BASE || 'https://api.dexscreener.com';

  /**
   * Get pair info: uses /latest/dex/pairs/{chainId}/{pairId}
   * Response includes priceUsd and priceNative (see DexScreener docs).
   */
  static async getPair(chainId: string, pairId: string) {
    const path = this.baseUrl + `/latest/dex/pairs/${encodeURIComponent(chainId)}/${encodeURIComponent(pairId)}`;
    const res = await axios.get<DexscreenerResponse>(path);
    // DexScreener returns { schemaVersion, pairs: [ ... ] }
    return res.data.pair;
  }

  /**
   * Optional convenience: get pools for a token
   * /token-pairs/v1/{chainId}/{tokenAddress}
   */
  static async getTokenPairs(chainId: string, tokenAddress: string) {
    const path = this.baseUrl + `/token-pairs/v1/${encodeURIComponent(chainId)}/${encodeURIComponent(tokenAddress)}`;
    const res = await axios.get<DexscreenerResponse>(path);
    return res.data;
  }
}
