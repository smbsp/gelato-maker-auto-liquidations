const { expect } = require("chai");
const hre = require("hardhat");
const { ethers } = hre;

const InstaAccount = require("../../../../pre-compiles/InstaAccount.json");

module.exports = async function (userAddress, instaIndex, instaList) {
  //#region User create a DeFi Smart Account

  // User create a Instadapp DeFi Smart Account
  // who give him the possibility to interact
  // with a large list of DeFi protocol through one
  // Proxy account.

  const dsaAccountCount = await instaList.accounts();

  await expect(instaIndex.build(userAddress, 1, userAddress)).to.emit(
    instaIndex,
    "LogAccountCreated"
  );
  const dsaID = dsaAccountCount.add(1);
  expect(await instaList.accounts()).to.be.equal(dsaID);

  // Instantiate the DSA
  const dsa = await ethers.getContractAt(
    InstaAccount.abi,
    await instaList.accountAddr(dsaID)
  );

  return dsa;

  //#endregion
};
