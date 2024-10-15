"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.connection = void 0;
const web3_js_1 = require("@solana/web3.js");
/* export const connection = new Connection(
  "https://mainnet.helius-rpc.com/?api-key=7032ddd2-6b08-4f4d-9368-1e616c222480",
  {
    commitment: "confirmed",
  },
); */
exports.connection = new web3_js_1.Connection((0, web3_js_1.clusterApiUrl)("mainnet-beta"));
