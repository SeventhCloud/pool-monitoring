import { Telegraf } from "telegraf";
import { message } from "telegraf/filters";
import { SceneContext, Stage, WizardContext } from "telegraf/scenes";
import { session } from "telegraf/session";
import setRangeWizard from "./scenes/SetRange";
import { MonitorManager } from "./MonitorManager";
import { DexPair } from "./models/DexScreenerModels";

export class TelegramBot {

    private bot: Telegraf<WizardContext>;
    private monitorManager: MonitorManager;
    private allowedUsers: Set<string> = new Set();

    constructor(token: string, monitorManager: MonitorManager) {
        this.bot = new Telegraf<WizardContext>(token);
        this.monitorManager = monitorManager;
        this.allowedUsers = new Set(process.env.ALLOWED_USER_IDS?.trim().split(',') || []); // store your ID in env

        this.bot.use(async (ctx, next) => {
            if (!ctx.from) return; // ignore system updates
            if (!this.allowedUsers.has(ctx.from.id.toString())) {
                console.log(`Blocked message from ${ctx.from.username} (${ctx.from.id})`);
                return; // 🚫 stop processing for other users
            }
            return next(); // ✅ continue for you
        });

        const stage = new Stage([setRangeWizard(this.monitorManager)]);
        this.bot.use(session()); // Required for scenes
        this.bot.use(stage.middleware());


        this.setupListeners();
        this.setupCommands();
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

        this.allowedUsers.forEach(userId => {
            console.log(`Setting up listeners for user: ${userId}`);
            this.monitorManager.listMonitors().forEach(monitor => {
                monitor.on('priceOutOfRange', (pool) => this.handlePriceOutOfRange(userId, pool));
                monitor.start();
            });
        });
    }

    handlePriceOutOfRange(userId: string, pool: DexPair) {
        console.log(`Price out of range for pool: \n name: ${pool.baseToken.symbol}/${pool.quoteToken.symbol} \n price: ${pool.priceNative} \n info: ${pool.dexId} - ${pool.chainId}`);
        this.bot.telegram.sendMessage(userId, `Price out of range for pool: 
        \nName: ${pool.baseToken.symbol}/${pool.quoteToken.symbol}
        \nPrice: ${pool.priceNative}
        \nDex-Chain: ${pool.dexId}-${pool.chainId}
        \nLink: ${pool.url}`);
    }

    setupActions() {

        this.bot.action('color_red', async (ctx) => {
            await ctx.reply('You chose Red!');
            ctx.answerCbQuery(); // removes the loading spinner
        });

    }
}