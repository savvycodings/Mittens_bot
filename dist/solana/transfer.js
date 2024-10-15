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
exports.transferSol = transferSol;
const web3_js_1 = require("@solana/web3.js");
const data_1 = require("../data");
function transferSol(from, to, amount) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            if (!from || !to || isNaN(amount) || amount <= 0) {
                throw new Error("Invalid sender, recipient, or amount.");
            }
            const ix = web3_js_1.SystemProgram.transfer({
                fromPubkey: from,
                toPubkey: to,
                lamports: amount * web3_js_1.LAMPORTS_PER_SOL,
            });
            const { blockhash, lastValidBlockHeight } = yield data_1.connection.getLatestBlockhash();
            if (!blockhash || !lastValidBlockHeight) {
                throw new Error("Failed to fetch latest blockhash.");
            }
            const tx = new web3_js_1.Transaction({
                blockhash,
                lastValidBlockHeight,
                feePayer: from,
            });
            tx.add(ix);
            return tx;
        }
        catch (error) {
            console.error("Error creating transfer transaction:", error);
            return null;
        }
    });
}
