require('dotenv').config();

import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";

const config: HardhatUserConfig = {
  solidity: "0.8.28",
  networks: {
    hardhat: {
      accounts: [
        {
          privateKey: '0xc638cebdc25ced92f0911b466904ac1277ce66a04b0f0554a29980b28e4411d5',  // 你的私钥
          balance: '1000000000000000000000' // 1000 ETH
        }
      ]
    },
    monad_testnet: {
      url: 'https://testnet-rpc.monad.xyz/',
      accounts: [`0x${process.env.PRIVATE_KEY}`] // 你的私钥，建议使用环境变量来存储
    }
  },
};

export default config;
