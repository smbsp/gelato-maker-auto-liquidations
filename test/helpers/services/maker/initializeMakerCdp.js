const { expect } = require("chai");
const hre = require("hardhat");

module.exports = async function (
  userAddress,
  DAI,
  dsa,
  getCdps,
  dssCdpManager,
  makerInitialEth,
  makerInitialDebt,
  connectMakerABI
) {
  //#region Step 8 User open a Vault, put some ether on it and borrow some dai

  // User open a maker vault
  // He deposit 10 Eth on it
  // He borrow a 1000 DAI
  const openVault = await hre.run("abi-encode-withselector", {
    abi: connectMakerABI,
    functionname: "open",
    inputs: ["ETH-A"],
  });

  await dsa.cast([hre.network.config.ConnectMaker], [openVault], userAddress);

  const cdps = await getCdps.getCdpsAsc(dssCdpManager.address, dsa.address);
  let vaultId = String(cdps.ids[0]);
  expect(cdps.ids[0].isZero()).to.be.false;

  await dsa.cast(
    [hre.network.config.ConnectMaker],
    [
      await hre.run("abi-encode-withselector", {
        abi: connectMakerABI,
        functionname: "deposit",
        inputs: [vaultId, makerInitialEth, 0, 0],
      }),
    ],
    userAddress,
    {
      value: makerInitialEth,
    }
  );

  await dsa.cast(
    [hre.network.config.ConnectMaker],
    [
      await hre.run("abi-encode-withselector", {
        abi: connectMakerABI,
        functionname: "borrow",
        inputs: [vaultId, makerInitialDebt, 0, 0],
      }),
    ],
    userAddress
  );

  expect(await DAI.balanceOf(dsa.address)).to.be.equal(makerInitialDebt);

  //#endregion

  return vaultId;
};
