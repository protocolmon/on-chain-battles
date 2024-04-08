import { Chain } from "viem";

export const pmon = {
  id: 42001,
  name: "PMON Chain",
  network: "pmon",
  nativeCurrency: {
    decimals: 18,
    name: "PMON",
    symbol: "PMON",
  },
  rpcUrls: {
    public: {
      http: ["https://rpc.pmon.xyz"],
      webSocket: ["wss://rpc.pmon.xyz/ws"],
    },
    default: {
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
} as const satisfies Chain;

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

export const sapphire = {
  id: 23294,
  name: "Oasis Sapphire",
  network: "sapphire",
  nativeCurrency: {
    decimals: 18,
    name: "Rose",
    symbol: "ROSE",
  },
  rpcUrls: {
    public: {
      http: ["https://sapphire.oasis.io"],
      webSocket: ["wss://sapphire.oasis.io/ws"],
    },
    default: {
      http: ["https://sapphire.oasis.io"],
      webSocket: ["wss://sapphire.oasis.io/ws"],
    },
  },
  blockExplorers: {
    default: {
      name: "Oasis Foundation",
      url: "https://explorer.sapphire.oasis.io/",
    },
  },
} as const satisfies Chain;
