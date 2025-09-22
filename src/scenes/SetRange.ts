import { Markup, Scenes } from "telegraf";
import { WizardScene } from "telegraf/scenes";
import { MonitorManager } from "../MonitorManager";
import { PoolMonitor } from "../PoolMonitor";

interface SetRangeState {
  chosenPoolId: string;
}

const setRangeWizard = (monitorManager: MonitorManager) => {
  return new WizardScene<Scenes.WizardContext>(
    "set-range-wizard",
    // Step 0: Ask user to select a pool
    (ctx: any) => {
      ctx.reply(
        "Select a pool:",
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
      (ctx.wizard.state as SetRangeState).chosenPoolId = chosenPoolId;

      await ctx.answerCbQuery();
      await ctx.reply("Please enter the range (e.g., 1.001-1.0003):");
      return ctx.wizard.next();
    },

    // Step 2: Wait for range input
    async (ctx) => {
      const input = ctx.text;
      const state = ctx.wizard.state as SetRangeState;
      if (!input || !/^\d+(\.\d+)?-\d+(\.\d+)?$/.test(input)) {
        await ctx.reply("Invalid format. Aborting wizard.");
        return ctx.scene.leave();
      }

      const [min, max] = input.split("-").map(parseFloat);
      const pool: PoolMonitor = monitorManager
        .getPools()
        .get(state.chosenPoolId)!;
      pool.setRange(min, max);

      await ctx.reply(`Range for pool "${state.chosenPoolId}" set to ${input}`);
      monitorManager.saveMonitors();

      return ctx.scene.leave();
    }
  );
};

export default setRangeWizard;
