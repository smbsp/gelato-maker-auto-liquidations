const { expect } = require("chai");
const hre = require("hardhat");
const { ethers } = hre;

module.exports = async function (userWallet, instaMapping, instaMaster) {
  await userWallet.sendTransaction({
    to: hre.network.config.InstaMaster,
    value: ethers.utils.parseEther("0.1"),
  });

  await hre.network.provider.request({
    method: "hardhat_impersonateAccount",
    params: [await instaMaster.getAddress()],
  });

  const ethBGemJoin = "0x08638eF1A205bE6762A8b935F5da9b700Cf7322c";
  await expect(
    instaMapping.connect(instaMaster).addGemJoinMapping([ethBGemJoin])
  ).to.emit(instaMapping, "LogAddGemJoinMapping");

  await hre.network.provider.request({
    method: "hardhat_stopImpersonatingAccount",
    params: [await instaMaster.getAddress()],
  });
};
