import { defineChain } from "viem";

export const pmonChain = defineChain({
  id: 16890849097,
  name: "Polychain Monsters Testnet",
  network: "pmon",
  nativeCurrency: {
    decimals: 18,
    name: "Ether",
    symbol: "ETH",
  },
  rpcUrls: {
    default: {
      http: ["https://polychain-monsters.alt.technology"],
      // webSocket: ["wss://rpc.zora.energy"],
    },
    public: {
      http: ["https://polychain-monsters.alt.technology"],
      webSocket: ["wss://rpc.zora.energy"],
    },
  },
  blockExplorers: {
    default: {
      name: "Explorer",
      url: "https://polychain-monsters-explorer.alt.technology",
    },
  },
  contracts: {},
});
