import { Markup, Scenes } from "telegraf";
import { WizardScene } from "telegraf/scenes";
import { PoolMonitor } from "../PoolMonitor";

interface SetRangeState {
  pools: Map<string, PoolMonitor>;
  pool: string;
  range: string;
}

export const setRangeWizard = new WizardScene<Scenes.WizardContext>(
  "set-range-wizard",

  // Step 0: Ask user to select a pool
  (ctx: any) => {
    const state = ctx.scene.state as SetRangeState;
    ctx.reply(
      "Select a pool:",
      Markup.inlineKeyboard(
        Array.from(state.pools.values()).map((pool) =>
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
      await ctx.reply("Please select a pool using the buttons above.");
      return; // stay here
    }

    const chosenPoolId = ctx.update.callback_query.data;
    (ctx.wizard.state as SetRangeState).pool = chosenPoolId;

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

    state.range = input;
    const [min, max] = input.split("-").map(parseFloat);
    const pool: PoolMonitor = state.pools.get(state.pool)!;
    pool.setRange(min, max);
    
    await ctx.reply(
      `Range for pool "${state.pool}" set to ${input}`
    );

    return ctx.scene.leave();
  }
);

export default setRangeWizard;
