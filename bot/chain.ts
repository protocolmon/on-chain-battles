import { Chain } from "viem";

export const polychainMonstersTestnet = {
  id: 16890849097,
  name: "Polychain Monsters Testnet",
  network: "polymonTest",
  nativeCurrency: {
    decimals: 18,
    name: "Ether",
    symbol: "ETH",
  },
  rpcUrls: {
    public: {
      http: ["https://polychain-monsters.alt.technology"],
      webSocket: ["wss://polychain-monsters.alt.technology/ws"],
    },
    default: {
      http: ["https://polychain-monsters.alt.technology"],
      webSocket: ["wss://polychain-monsters.alt.technology/ws"],
    },
  },
  blockExplorers: {
    default: {
      name: "Blockscout",
      url: "https://polychain-monsters-explorer.alt.technology",
    },
  },
} as const satisfies Chain;
