import { Telegraf } from "telegraf";
import { message } from "telegraf/filters";
import { SceneContext, Stage, WizardContext } from "telegraf/scenes";
import { session } from "telegraf/session";
import setRangeWizard from "./scenes/SetRange";
import { MonitorManager } from "./MonitorManager";

export class TelegramBot {

    private bot: Telegraf<WizardContext>;
    private monitorManager: MonitorManager;

    constructor(token: string, monitorManager: MonitorManager) {
        this.bot = new Telegraf<WizardContext>(token);
        this.monitorManager = monitorManager;

        const stage = new Stage([setRangeWizard]);
        this.bot.use(session()); // Required for scenes
        this.bot.use(stage.middleware());


        this.setupCommands();
        this.setupListeners();
        this.setupActions();

        this.bot.launch();
    }

    setupCommands() {
        this.bot.start((ctx) => ctx.reply('Welcome! Use /setrange to set price ranges for pools.'));

        this.bot.command('setrange', (ctx) => {

            return ctx.scene.enter('set-range-wizard', { pools: this.monitorManager.getPools() });
        });

        this.bot.help((ctx) => ctx.reply('Send me a sticker'));
        process.once('SIGINT', () => this.bot.stop('SIGINT'))
        process.once('SIGTERM', () => this.bot.stop('SIGTERM'))
    }

    setupListeners() {
        this.monitorManager.listMonitors().forEach(monitor => {

            monitor.on('priceOutOfRange', ({ id, price }) => this.handlePriceOutOfRange(id, price));
            monitor.start();
        });
    }

    handlePriceOutOfRange(poolId: string, price: number) {
        console.log(`Price out of range for pool ${poolId}: ${price}`);
        this.bot.telegram.sendMessage(process.env.ADMIN_CHAT_IDS || "", `Price out of range for pool ${poolId}: ${price}`);
    }

    setupActions() {
        this.bot.action('color_red', async (ctx) => {
            await ctx.reply('You chose Red!');
            ctx.answerCbQuery(); // removes the loading spinner
        });
    }
}