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
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTokenBalances = getTokenBalances;
exports.formatPortfolioMessage = formatPortfolioMessage;
const spl_token_1 = require("@solana/spl-token");
const web3_js_1 = require("@solana/web3.js");
const connection = new web3_js_1.Connection("https://mainnet.helius-rpc.com/?api-key=7032ddd2-6b08-4f4d-9368-1e616c222480", {
    commitment: "confirmed",
});
function getTokenBalances(addr) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!addr)
            return [];
        const tokenAccounts = yield connection.getTokenAccountsByOwner(new web3_js_1.PublicKey(addr), { programId: spl_token_1.TOKEN_PROGRAM_ID });
        const tokenBalances = [];
        for (const { account } of tokenAccounts.value) {
            const accountData = spl_token_1.AccountLayout.decode(account.data);
            const mintAddress = new web3_js_1.PublicKey(accountData.mint).toString();
            const amount = accountData.amount;
            const mintInfo = yield connection.getParsedAccountInfo(new web3_js_1.PublicKey(accountData.mint));
            if (mintInfo.value && "parsed" in mintInfo.value.data) {
                const decimals = mintInfo.value.data["parsed"].info.decimals;
                if (decimals === 0 && amount === BigInt(1))
                    continue;
                const tokenInfoRes = yield fetch(`https://api.dexscreener.com/tokens/v1/solana/${mintAddress}`);
                const tokenInfo = yield tokenInfoRes.json();
                const balance = Number(amount) / Math.pow(10, decimals);
                const balanceUSD = balance * tokenInfo[0].priceUsd;
                tokenBalances.push({
                    mintAddress,
                    balanceUSD,
                    ticker: tokenInfo[0].baseToken.symbol,
                    amount: balance,
                });
            }
        }
        return tokenBalances;
    });
}
function formatBalance(amount) {
    return amount.toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 4,
    });
}
function formatUSD(amount) {
    return amount.toLocaleString("en-US", {
        style: "currency",
        currency: "USD",
    });
}
function formatPortfolioMessage(publicKey, solBalance, tokens) {
    let message = `🔑 **Wallet Address**\n\`${publicKey}\`\n\n`;
    message += `💰 **Portfolio Summary**\n`;
    message += `• SOL: ${solBalance} SOL\n`;
    let totalUSD = 0;
    if (tokens.length > 0) {
        message += "\n**Token Balances**\n";
        tokens.forEach((token) => {
            if (token.balanceUSD > 0) {
                message += `• ${token.ticker}: ${formatBalance(token.amount)} `;
                message += `(${formatUSD(token.balanceUSD)})\n`;
                totalUSD += token.balanceUSD;
            }
        });
        message += `\n📊 **Total Portfolio Value**: ${formatUSD(totalUSD)}`;
    }
    return message;
}
