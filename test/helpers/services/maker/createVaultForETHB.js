const { expect } = require("chai");
const hre = require("hardhat");

const ConnectMaker = require("../../../../pre-compiles/ConnectMaker.json");

module.exports = async function (
  userAddress,
  DAI,
  dsa,
  getCdps,
  dssCdpManager
) {
  //#region Step 8 User open a Vault, put some ether on it and borrow some dai

  // User open a maker vault
  // He deposit 10 Eth on it
  // He borrow a 1000 DAI
  const openVault = await hre.run("abi-encode-withselector", {
    abi: ConnectMaker.abi,
    functionname: "open",
    inputs: ["ETH-B"],
  });

  await dsa.cast([hre.network.config.ConnectMaker], [openVault], userAddress);

  const cdps = await getCdps.getCdpsAsc(dssCdpManager.address, dsa.address);
  let vaultId = String(cdps.ids[1]);
  expect(cdps.ids[1].isZero()).to.be.false;

  //#endregion

  return vaultId;
};
