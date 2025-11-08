import { Scenes } from "telegraf";
import { WizardScene } from "telegraf/scenes";
import { MonitorManager } from "../MonitorManager";

const setIntervalWizard = (monitorManager: MonitorManager) => {
  return new WizardScene<Scenes.WizardContext>(
    "set-interval-wizard",
    // Step 0: Ask user to select a pool
    (ctx: any) => {
      ctx.reply(
        "Change interval in seconds (max: 3600):"
      );
      return ctx.wizard.next();
    },
    // Step 1: Wait for pool selection
    async (ctx: any) => {
      
      const chosenInterval = parseInt(ctx.text?.trim() || "0");
      //check if chosenInterval is a number and greater than 0
      if (isNaN(chosenInterval) || chosenInterval <= 0 || !Number.isInteger(chosenInterval) || chosenInterval > 3_600) {
        await ctx.reply(
          "Invalid interval. Cancelling...."
        );
        return ctx.scene.leave();
      }

      monitorManager.changeInterval(chosenInterval * 1000); // convert to milliseconds
      await ctx.reply(
        `Changed interval to ${chosenInterval} seconds.`);
      return ctx.scene.leave();
    }
  );
};

export default setIntervalWizard;
