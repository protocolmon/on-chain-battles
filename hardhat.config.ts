import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@openzeppelin/hardhat-upgrades";
import "@nomicfoundation/hardhat-verify";
require("hardhat-contract-sizer");

const PMON_CHAIN_ID = 16890849095;
const PMON_RPC = "https://polychain-monsters.alt.technology";
const PMON_EXPLORER = "https://polychain-monsters-explorer.alt.technology";

const config: HardhatUserConfig = {
  etherscan: {
    customChains: [
      {
        network: "pmon",
        chainId: PMON_CHAIN_ID,
        urls: {
          apiURL: `${PMON_EXPLORER}/api`,
          browserURL: PMON_EXPLORER,
        },
      },
      {
        network: "nova",
        chainId: 42170,
        urls: {
          apiURL: "https://api-nova.arbiscan.io/api",
          browserURL: "https://nova.arbiscan.io",
        },
      },
      {
        network: "sapphire-test",
        chainId: 23295,
        urls: {
          apiURL: "https://testnet.explorer.sapphire.oasis.dev/api",
          browserURL: "https://testnet.explorer.sapphire.oasis.dev/",
        },
      },
    ],
    apiKey: process.env.ETHERSCAN_API_KEY || "customkey",
  },
  networks: {
    pmon: {
      url: PMON_RPC,
      chainId: PMON_CHAIN_ID,
      ...(process.env.PK && {
        accounts: [process.env.PK || ""],
      }),
    },
    hardhat: {
      forking: {
        enabled: process.env.FORKING_ENABLED === "true",
        url: "https://nova.arbitrum.io/rpc",
      },
    },
    nova: {
      url: "https://nova.arbitrum.io/rpc",
      ...(process.env.PK && {
        accounts: [process.env.PK || ""],
      }),
      chainId: 42170,
    },
    "sapphire-test": {
      url: "https://testnet.sapphire.oasis.dev",
      ...(process.env.PK && {
        accounts: [process.env.PK || ""],
      }),
      chainId: 23295,
    },
  },
  solidity: {
    compilers: [
      {
        version: "0.8.21",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
    ],
  },
};

export default config;
