import { Scenes } from "telegraf";
import { WizardScene } from "telegraf/scenes";
import { DexPair } from "../models/DexScreenerModels";
import { MonitorManager } from "../MonitorManager";
import { DexScreenerClient } from "../services/DexScreenerClient";

interface addPoolState {
  poolInfo: DexPair;
}

const addPoolWizard = (monitorManager: MonitorManager) => {
  return new WizardScene<Scenes.WizardContext>(
    "add-pool-wizard",
    // Step 1: Ask user to input chainID, Pool ID
    (ctx: any) => {
      ctx.reply(
        "Please enter the chainID,Pool ID (e.g., ethereum, 0xabc123...):"
      );
      return ctx.wizard.next();
    },
    // Step 2: Wait for Pool ID input
    async (ctx) => {
      const [chainID, poolID] = ctx.text?.replace(/\s/g, "").split(",") || [];
      const pool = await DexScreenerClient.getPair(chainID, poolID);

      if (!pool) {
        await ctx.reply(
          "Couldn't find pool. Please check the Chain ID and Pool ID. Aborting wizard."
        );
        return ctx.scene.leave();
      }

      const state = ctx.wizard.state as addPoolState;
      state.poolInfo = pool;

      await ctx.reply("Please enter the range (e.g., 1.001-1.0003):");
      return ctx.wizard.next();
    },
    // Step 3: Wait for range input
    async (ctx) => {
      const input = ctx.text;
      const state = ctx.wizard.state as addPoolState;
      if (!input || !/^\d+(\.\d+)?-\d+(\.\d+)?$/.test(input)) {
        await ctx.reply("Invalid format. Aborting wizard.");
        return ctx.scene.leave();
      }

      const minMaxArray = input.split("-").map(parseFloat);
      monitorManager.addMonitor(state.poolInfo, minMaxArray);

      await ctx.reply(
        `Added pool "${state.poolInfo.baseToken.symbol}/${state.poolInfo.quoteToken.symbol}" on ${state.poolInfo.chainId} with range ${input}`
      );
      return ctx.scene.leave();
    }
  );
};

export default addPoolWizard;
