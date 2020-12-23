const { expect } = require("chai");
const hre = require("hardhat");
const { ethers } = hre;

module.exports = async function () {
  let userWallet;
  let userAddress;
  let gelatoProvider;
  let gelatoProviderAddress;
  let executor;
  let gelatoExecutorAddress;

  [userWallet, gelatoProvider, executor] = await ethers.getSigners();
  userAddress = await userWallet.getAddress();
  gelatoProviderAddress = await gelatoProvider.getAddress();
  gelatoExecutorAddress = await executor.getAddress();

  // Hardhat default wallets prefilled with 100 ETH
  expect(await userWallet.getBalance()).to.be.gt(ethers.utils.parseEther("10"));

  return {
    userWallet: userWallet,
    userAddress: userAddress,
    gelatoProvider: gelatoProvider,
    gelatoProviderAddress: gelatoProviderAddress,
    executor: executor,
    gelatoExecutorAddress: gelatoExecutorAddress,
  };
};
