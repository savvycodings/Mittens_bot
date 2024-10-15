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
exports.privy = void 0;
exports.privysign = privysign;
const server_auth_1 = require("@privy-io/server-auth");
exports.privy = new server_auth_1.PrivyClient("cm6ngonn302x1eultxl3yj869", "5mvmFLEhiVEMhUoZBktErqdeTMVdbFYV4cuvRX4yymyJmFypwagrn9WVfVygCQU2QZW1DTu4yMR4rvwUVroejvY5");
function privysign(id, transaction) {
    return __awaiter(this, void 0, void 0, function* () {
        const { hash } = yield exports.privy.walletApi.solana.signAndSendTransaction({
            walletId: id,
            caip2: "solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp",
            transaction: transaction,
        });
        return hash;
    });
}
