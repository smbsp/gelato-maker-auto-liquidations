const { expect } = require("chai");

module.exports = async function (
  gelatoProvider,
  gelatoCore,
  dsaProviderModuleAddr
) {
  //#region Provider will add a module

  // By adding a module the provider will format future task's
  // payload by adding some specificity like his address to the
  // Payment connector for receiving payment of User.

  const gelatoProviderAddress = await gelatoProvider.getAddress();

  await expect(
    gelatoCore
      .connect(gelatoProvider)
      .addProviderModules([dsaProviderModuleAddr])
  ).to.emit(gelatoCore, "LogProviderModuleAdded");

  expect(
    await gelatoCore
      .connect(gelatoProvider)
      .isModuleProvided(gelatoProviderAddress, dsaProviderModuleAddr)
  ).to.be.true;

  //#endregion
};
