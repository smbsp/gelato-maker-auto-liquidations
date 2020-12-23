const { expect } = require("chai");

module.exports = async function (
  gelatoProvider,
  gelatoExecutorAddress,
  gelatoCore
) {
  //#region Provider choose a executor

  // Provider choose a executor who will execute futur task
  // for the provider, it will be compensated by the provider.

  const gelatoProviderAddress = await gelatoProvider.getAddress();

  await expect(
    gelatoCore
      .connect(gelatoProvider)
      .providerAssignsExecutor(gelatoExecutorAddress)
  ).to.emit(gelatoCore, "LogProviderAssignedExecutor");

  expect(
    await gelatoCore.executorByProvider(gelatoProviderAddress)
  ).to.be.equal(gelatoExecutorAddress);

  //#endregion
};
