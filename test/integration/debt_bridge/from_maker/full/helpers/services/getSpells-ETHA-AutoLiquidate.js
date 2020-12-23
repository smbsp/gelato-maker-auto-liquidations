const { expect } = require("chai");
const hre = require("hardhat");
const { ethers, deployments } = hre;
const GelatoCoreLib = require("@gelatonetwork/core");

// Instadapp UI should do the same implementation for submitting debt bridge task
module.exports = async function (wallets, contracts, constants, vaultId) {
  //#region Step 9 Provider should whitelist task

  // By WhiteList task, the provider can constrain the type
  // of task the user can submitting.

  //#region Actions

  const spells = [];

  const makerAutoLiquidate = new GelatoCoreLib.Action({
    addr: contracts.connectorAutoLiquidate.address,
    data: await hre.run("abi-encode-withselector", {
      abi: (
        await deployments.getArtifact("ConnectorAutoLiquidate")
      ).abi,
      functionname: "getDataAndCastAutoLiquidation",
      inputs: [vaultId, constants.ETH],
    }),
    operation: GelatoCoreLib.Operation.Delegatecall,
    termsOkCheck: true,
  });
  spells.push(makerAutoLiquidate);

  const gasPriceCeil = ethers.constants.MaxUint256;

  const connectAutoLiquidateMakerTaskSpec = new GelatoCoreLib.TaskSpec(
    {
      conditions: [contracts.conditionMakerVaultUnsafe.address],
      actions: spells,
      gasPriceCeil,
    }
  );

  await expect(
    contracts.gelatoCore
      .connect(wallets.gelatoProvider)
      .provideTaskSpecs([connectAutoLiquidateMakerTaskSpec])
  ).to.emit(contracts.gelatoCore, "LogTaskSpecProvided");

  expect(
    await contracts.gelatoCore
      .connect(wallets.gelatoProvider)
      .isTaskSpecProvided(
        wallets.gelatoProviderAddress,
        connectAutoLiquidateMakerTaskSpec
      )
  ).to.be.equal("OK");

  expect(
    await contracts.gelatoCore
      .connect(wallets.gelatoProvider)
      .taskSpecGasPriceCeil(
        wallets.gelatoProviderAddress,
        await contracts.gelatoCore
          .connect(wallets.gelatoProvider)
          .hashTaskSpec(connectAutoLiquidateMakerTaskSpec)
      )
  ).to.be.equal(gasPriceCeil);

  //#endregion

  return spells;
};
