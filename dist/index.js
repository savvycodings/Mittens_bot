"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const discord_js_1 = require("discord.js");
const commands_1 = require("./commands");
const tokens_1 = require("./solana/tokens");
const data_1 = require("./data");
const web3_js_1 = require("@solana/web3.js");
const transfer_1 = require("./solana/transfer");
const privy_1 = require("./privy");
const swap_1 = require("./solana/swap");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const prisma = new client_1.PrismaClient();
const client = new discord_js_1.Client({
    intents: [
        discord_js_1.GatewayIntentBits.Guilds,
        discord_js_1.GatewayIntentBits.GuildMessages,
        discord_js_1.GatewayIntentBits.MessageContent,
    ],
});
const rest = new discord_js_1.REST({ version: "10" }).setToken(process.env.DISCORD_BOT_TOKEN);
(() => __awaiter(void 0, void 0, void 0, function* () {
    try {
        console.log("Started refreshing application (/) commands.");
        yield rest.put(discord_js_1.Routes.applicationCommands(process.env.DISCORD_CLIENT_ID), {
            body: commands_1.commands,
        });
        console.log("Successfully reloaded application (/) commands.");
    }
    catch (error) {
        console.error(error);
    }
}))();
client.on("interactionCreate", (interaction) => __awaiter(void 0, void 0, void 0, function* () {
    if (!interaction.isCommand())
        return;
    const { commandName, options, user } = interaction;
    const discordId = user.id;
    const wallet = yield prisma.user.findUnique({
        where: { discordId },
    });
    try {
        switch (commandName) {
            case "login":
                if (!wallet) {
                    const { id, address } = yield privy_1.privy.walletApi.create({
                        chainType: "solana",
                    });
                    yield prisma.user.create({
                        data: {
                            discordId,
                            privyId: id,
                            solAddress: address,
                        },
                    });
                    yield interaction.reply({
                        content: `Wallet created successfully: ${address}`,
                        ephemeral: true,
                    });
                    break;
                }
                else {
                    const addr = wallet.solAddress;
                    yield interaction.reply({
                        content: `Login Successful. Your address is \`${addr}\`. Top up your wallet with SOL to cover gas fees.`,
                        ephemeral: true,
                    });
                    break;
                }
            case "wallet":
                yield interaction.deferReply();
                if (!wallet) {
                    return interaction.reply({
                        content: "Please log in first using `/login`.",
                        ephemeral: true,
                    });
                }
                const publicKey = wallet.solAddress;
                const tokens = yield (0, tokens_1.getTokenBalances)(publicKey);
                const sol = yield data_1.connection.getBalance(new web3_js_1.PublicKey(publicKey));
                yield interaction.editReply({
                    content: (0, tokens_1.formatPortfolioMessage)(publicKey, sol / web3_js_1.LAMPORTS_PER_SOL, tokens),
                });
                break;
            case "transfer":
                try {
                    yield interaction.deferReply();
                    if (!wallet) {
                        return interaction.reply({
                            content: "Please log in first using `/login`.",
                        });
                    }
                    const toAddress = options.data[0].value;
                    const amount = options.data[1].value;
                    if (!toAddress ||
                        !amount ||
                        isNaN(Number(amount)) ||
                        Number(amount) <= 0) {
                        return interaction.editReply({
                            content: "Invalid recipient address or amount. Please check your input.",
                        });
                    }
                    const transaction = yield (0, transfer_1.transferSol)(new web3_js_1.PublicKey(wallet.solAddress), new web3_js_1.PublicKey(toAddress), Number(amount));
                    if (!transaction) {
                        return interaction.editReply({
                            content: "Transaction creation failed. Please try again later.",
                        });
                    }
                    const signature = yield (0, privy_1.privysign)(wallet.privyId, transaction);
                    if (!signature) {
                        return interaction.editReply({
                            content: "Transaction signing failed. Please check your wallet and try again.",
                        });
                    }
                    const url = `https://solscan.io/tx/${signature}`;
                    yield interaction.editReply({ content: url });
                }
                catch (error) {
                    console.error("Error processing transfer command:", error);
                    yield interaction.editReply({
                        content: "An error occurred while processing your transfer. Please try again later.",
                    });
                }
                break;
            case "swap":
                yield interaction.deferReply();
                try {
                    if (!wallet) {
                        return interaction.reply({
                            content: "Please log in first using `/login`.",
                        });
                    }
                    const input_mint = options.data[0].value;
                    const output_mint = options.data[1].value;
                    const quantity = options.data[2].value;
                    const decimals = yield (0, swap_1.getTokenDecimals)(new web3_js_1.PublicKey(input_mint));
                    const tx = yield (0, swap_1.swap)(new web3_js_1.PublicKey(wallet.solAddress), input_mint, output_mint, Number(quantity) * Math.pow(10, decimals));
                    if (!tx) {
                        return interaction.editReply({
                            content: "Swap transaction failed. Please try again.",
                        });
                    }
                    const sign = yield (0, privy_1.privysign)(wallet.privyId, tx);
                    yield interaction.editReply({
                        content: `https://solscan.io/tx/${sign}`,
                    });
                }
                catch (error) {
                    console.error("Error processing swap command:", error);
                    yield interaction.editReply({
                        content: "An error occurred while processing your swap request. Please try again later.",
                    });
                }
        }
    }
    catch (e) {
        console.error(e);
    }
}));
process.on("SIGINT", () => __awaiter(void 0, void 0, void 0, function* () {
    console.log("Received SIGINT. Cleaning up...");
    yield prisma.$disconnect();
    client.destroy();
    process.exit(0);
}));
process.on("SIGTERM", () => __awaiter(void 0, void 0, void 0, function* () {
    console.log("Received SIGTERM. Cleaning up...");
    yield prisma.$disconnect();
    client.destroy();
    process.exit(0);
}));
client.once("ready", () => {
    var _a;
    console.log(`Logged in as ${(_a = client.user) === null || _a === void 0 ? void 0 : _a.tag}`);
});
client.login(process.env.DISCORD_BOT_TOKEN);
