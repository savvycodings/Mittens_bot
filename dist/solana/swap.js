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
exports.fetchTokenAccountData = void 0;
exports.swap = swap;
exports.getTokenDecimals = getTokenDecimals;
const web3_js_1 = require("@solana/web3.js");
const spl_token_1 = require("@solana/spl-token");
const axios_1 = __importDefault(require("axios"));
const raydium_sdk_v2_1 = require("@raydium-io/raydium-sdk-v2");
const raydium_sdk_v2_2 = require("@raydium-io/raydium-sdk-v2");
const data_1 = require("../data");
/**
 * @param address solana address
 * @param inputMint mint address
 * @param outputMint mint address
 * @param amount amount to swap no in decimals
 */
function swap(address, inputMint, outputMint, amount) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b;
        try {
            const slippage = 0.5;
            const txVersion = "V0";
            const isV0Tx = txVersion === "V0";
            const [isInputSol, isOutputSol] = [
                inputMint === spl_token_1.NATIVE_MINT.toBase58(),
                outputMint === spl_token_1.NATIVE_MINT.toBase58(),
            ];
            const { tokenAccounts } = yield (0, exports.fetchTokenAccountData)(address);
            const inputTokenAcc = (_a = tokenAccounts.find((a) => a.mint.toBase58() === inputMint)) === null || _a === void 0 ? void 0 : _a.publicKey;
            const outputTokenAcc = (_b = tokenAccounts.find((a) => a.mint.toBase58() === outputMint)) === null || _b === void 0 ? void 0 : _b.publicKey;
            if (!inputTokenAcc && !isInputSol) {
                console.error("do not have input token account");
                return;
            }
            const { data: swapResponse } = yield axios_1.default.get(`${raydium_sdk_v2_1.API_URLS.SWAP_HOST}/compute/swap-base-in?inputMint=${inputMint}&outputMint=${outputMint}&amount=${amount}&slippageBps=${slippage * 100}&txVersion=${txVersion}`);
            if (!swapResponse.success) {
                console.error("Error Getting Swap");
                return;
            }
            const { data } = yield axios_1.default.get(`${raydium_sdk_v2_1.API_URLS.BASE_HOST}${raydium_sdk_v2_1.API_URLS.PRIORITY_FEE}`);
            const { data: swapTransactions } = yield axios_1.default.post(`${raydium_sdk_v2_1.API_URLS.SWAP_HOST}/transaction/swap-base-in`, {
                computeUnitPriceMicroLamports: String(data.data.default.m),
                swapResponse,
                txVersion,
                wallet: new web3_js_1.PublicKey(address).toBase58(),
                wrapSol: isInputSol,
                unwrapSol: isOutputSol, // true means output mint receive sol, false means output mint received wsol
                inputAccount: isInputSol ? undefined : inputTokenAcc === null || inputTokenAcc === void 0 ? void 0 : inputTokenAcc.toBase58(),
                outputAccount: isOutputSol ? undefined : outputTokenAcc === null || outputTokenAcc === void 0 ? void 0 : outputTokenAcc.toBase58(),
            });
            const allTxBuf = swapTransactions.data.map((tx) => Buffer.from(tx.transaction, "base64"));
            const allTransactions = allTxBuf.map((txBuf) => isV0Tx
                ? web3_js_1.VersionedTransaction.deserialize(txBuf)
                : web3_js_1.Transaction.from(txBuf));
            return allTransactions;
        }
        catch (err) {
            console.log(err);
        }
    });
}
const fetchTokenAccountData = (address) => __awaiter(void 0, void 0, void 0, function* () {
    const solAccountResp = yield data_1.connection.getAccountInfo(address);
    const tokenAccountResp = yield data_1.connection.getTokenAccountsByOwner(address, {
        programId: spl_token_1.TOKEN_PROGRAM_ID,
    });
    const token2022Req = yield data_1.connection.getTokenAccountsByOwner(address, {
        programId: spl_token_1.TOKEN_2022_PROGRAM_ID,
    });
    const tokenAccountData = (0, raydium_sdk_v2_2.parseTokenAccountResp)({
        owner: address,
        solAccountResp,
        tokenAccountResp: {
            context: tokenAccountResp.context,
            value: [...tokenAccountResp.value, ...token2022Req.value],
        },
    });
    return tokenAccountData;
});
exports.fetchTokenAccountData = fetchTokenAccountData;
function getTokenDecimals(mintAddress) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const mintPublicKey = new web3_js_1.PublicKey(mintAddress);
            const mintInfo = yield data_1.connection.getParsedAccountInfo(mintPublicKey);
            if (!mintInfo.value || !mintInfo.value.data) {
                throw new Error("Invalid mint account");
            }
            // @ts-ignore
            const decimals = mintInfo.value.data.parsed.info.decimals;
            return decimals;
        }
        catch (error) {
            console.error("Error getting token decimals:", error);
            throw error;
        }
    });
}
getTokenDecimals(new web3_js_1.PublicKey("DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263"));
