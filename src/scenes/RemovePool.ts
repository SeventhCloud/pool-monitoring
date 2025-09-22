import { Markup, Scenes } from "telegraf";
import { WizardScene } from "telegraf/scenes";
import { MonitorManager } from "../MonitorManager";

const removePoolWizard = (monitorManager: MonitorManager) => {
  return new WizardScene<Scenes.WizardContext>(
    "remove-pool-wizard",
    // Step 0: Ask user to select a pool
    (ctx: any) => {
      ctx.reply(
        "Select a pool to remove:",
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

      await ctx.answerCbQuery();
      await ctx.reply(
        monitorManager.removeMonitor(chosenPoolId)
          ? "Pool removed."
          : "Couldn't find pool."
      );
      return ctx.scene.leave();
    }
  );
};

export default removePoolWizard;
