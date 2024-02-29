import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@openzeppelin/hardhat-upgrades";
import "@nomicfoundation/hardhat-verify";
require("hardhat-contract-sizer");

const BLAST_TESTNET_CHAIN_ID = 168587773;
const PMON_TESTNET_CHAIN_ID = 16890849097;
const PMON_TESTNET_RPC = "https://polychain-monsters.alt.technology";
const PMON_TESTNET_EXPLORER =
  "https://polychain-monsters-explorer.alt.technology";
const PMON_CHAIN_ID = 42001;
const PMON_RPC = "https://rpc.pmon.xyz";
const PMON_EXPLORER = "https://explorer.pmon.xyz";

const config: HardhatUserConfig = {
  etherscan: {
    customChains: [
      {
        network: "arbitrum-sepolia",
        chainId: 421614,
        urls: {
          apiURL: "https://sepolia-explorer.arbitrum.io/api",
          browserURL: "https://sepolia-explorer.arbitrum.io",
        },
      },
      {
        network: "pmon-testnet",
        chainId: PMON_TESTNET_CHAIN_ID,
        urls: {
          apiURL: `${PMON_TESTNET_EXPLORER}/api`,
          browserURL: PMON_TESTNET_EXPLORER,
        },
      },
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
      {
        network: "sapphire",
        chainId: 23294,
        urls: {
          apiURL: "https://explorer.sapphire.oasis.io/api",
          browserURL: "https://explorer.sapphire.oasis.io",
        },
      },
      {
        network: "blast-testnet",
        chainId: BLAST_TESTNET_CHAIN_ID,
        urls: {
          apiURL:
            "https://api.routescan.io/v2/network/testnet/evm/168587773/etherscan",
          browserURL: "https://testnet.blastscan.io",
        },
      },
    ],
    apiKey: process.env.ETHERSCAN_API_KEY || "customkey",
  },
  networks: {
    ["arbitrum-sepolia"]: {
      url: "https://sepolia-rollup.arbitrum.io/rpc",
      ...(process.env.PK && {
        accounts: [process.env.PK || ""],
      }),
    },
    pmon: {
      url: PMON_RPC,
      chainId: PMON_CHAIN_ID,
      ...(process.env.PK && {
        accounts:
          typeof process.env.PKS_LIST === "undefined"
            ? [process.env.PK || ""]
            : process.env.PKS_LIST.split(","),
      }),
    },
    pmonTestnet: {
      url: PMON_TESTNET_RPC,
      chainId: PMON_TESTNET_CHAIN_ID,
      ...(process.env.PK && {
        accounts:
          typeof process.env.PKS_LIST === "undefined"
            ? [process.env.PK || ""]
            : process.env.PKS_LIST.split(","),
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
    sapphire: {
      url: "https://sapphire.oasis.io",
      ...(process.env.PK && {
        accounts: [process.env.PK || ""],
      }),
      chainId: 23294,
    },
    ["blast-testnet"]: {
      url: "https://blue-proud-needle.blast-sepolia.quiknode.pro/335c888c23d0e251450b3918d77aa2513cf82b14/",
      chainId: BLAST_TESTNET_CHAIN_ID,
      ...(process.env.PK && {
        accounts: [process.env.PK!],
      }),
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
  sourcify: {
    enabled: true,
    apiUrl: "https://sourcify.dev/server",
    browserUrl: "https://repo.sourcify.dev",
  },
};

export default config;
