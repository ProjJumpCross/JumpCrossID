import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox-viem";

// read config.json
import fs from "fs";

const rawdata = fs.readFileSync('env.json');
const env = JSON.parse(rawdata.toString());

const config: HardhatUserConfig = {
  defaultNetwork: "hardhat",
  networks: {
    hardhat: {
    },
    sepolia: {
      url: `https://eth-sepolia.g.alchemy.com/v2/${env.alchemyApiKey}`,
      accounts: [env.privateKey]
    }
  },
  solidity: {
    version: "0.8.25",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  etherscan: {
    apiKey: env.etherscanApiKey
  }
};

export default config;
