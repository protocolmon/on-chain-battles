import { defineChain } from "viem";

export const pmonChain = defineChain({
  id: 42001,
  name: "PMON Chain",
  network: "pmon",
  nativeCurrency: {
    decimals: 18,
    name: "PMON Token",
    symbol: "PMON",
  },
  rpcUrls: {
    default: {
      http: ["https://rpc.pmon.xyz"],
      webSocket: ["wss://rpc.pmon.xyz/ws"],
    },
    public: {
      http: ["https://rpc.pmon.xyz"],
      webSocket: ["wss://rpc.pmon.xyz/ws"],
    },
  },
  blockExplorers: {
    default: {
      name: "Explorer",
      url: "https://explorer.pmon.xyz",
    },
  },
  contracts: {},
});
