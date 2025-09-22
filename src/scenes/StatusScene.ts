import { Markup, Scenes } from "telegraf";
import { WizardScene } from "telegraf/scenes";
import { MonitorManager } from "../MonitorManager";
import { DexScreenerClient } from "../services/DexScreenerClient";

const getStatusWizard = (monitorManager: MonitorManager) => {
  return new WizardScene<Scenes.WizardContext>(
    "get-status-wizard",
    // Step 0: Ask user to select a pool
    (ctx: any) => {
      ctx.reply(
        "Select a pool to get status:",
        Markup.inlineKeyboard(
          Array.from(monitorManager.getPools().values()).map((pool) =>
            Markup.button.callback(
              `${pool.getPoolInfo().name} | ${pool.getPoolInfo().chain}`,
              pool.id
            )
          )
        )
      );
      return ctx.wizard.next();
    },
    // Step 1: Wait for pool selection
    async (ctx: any) => {
      if (!("callback_query" in ctx.update)) {
        await ctx.reply(
          "Please select a pool using the buttons above. Cancelling...."
        );
        return ctx.scene.leave();
      }

      const chosenPoolId = ctx.update.callback_query.data;
      const poolMonitor = monitorManager.getPools().get(chosenPoolId);
      const poolInfo = poolMonitor?.getPoolInfo();
      if (!poolMonitor || !poolInfo) {
        await ctx.reply("Couldn't find pool. Cancelling....");
        return ctx.scene.leave();
      }
      
      const dexPair = await DexScreenerClient.getPair(
        poolInfo.chain,
        poolInfo.poolId
      );

      await ctx.answerCbQuery();
      await ctx.reply(
        dexPair
          ? `Pool Info:
        Name: ${dexPair.baseToken.symbol}/${dexPair.quoteToken.symbol}
        Chain: ${dexPair.chainId}
        Volume 24h: ${dexPair.volume.h24}
        Liquidity in $: ${dexPair.liquidity.usd}
        Current Price: ${dexPair.priceNative}
        Set Range: ${poolMonitor.getPoolInfo().minPrice} - ${poolMonitor.getPoolInfo().maxPrice}`
          : "Couldn't fetch pool info."
      );
      return ctx.scene.leave();
    }
  );
};

export default getStatusWizard;
