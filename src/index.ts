import { Telegraf, Telegram } from "telegraf";
import { TelegramBot } from "./Bot";
import { MonitorManager } from "./MonitorManager";

process.loadEnvFile(".env");

console.log("Starting bot...", process.env.TELEGRAM_BOT_TOKEN);

const monitorManager = new MonitorManager();
const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN || "", monitorManager);




process.once('SIGINT', () => {
  console.log('Received SIGINT. Shutting down...');
  process.exit(0);
});

process.once('SIGTERM', () => {
  console.log('Received SIGTERM. Shutting down...');
  process.exit(0);
});