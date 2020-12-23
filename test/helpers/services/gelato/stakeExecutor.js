const { expect } = require("chai");

module.exports = async function (executor, gelatoCore) {
  //#region Executor Stake on Gelato

  // For task execution provider will ask a executor to watch the
  // blockchain for possible execution autorization given by
  // the condition that user choose when submitting the task.
  // And if all condition are meet executor will execute the task.
  // For safety measure Gelato ask the executor to stake a minimum
  // amount.

  const gelatoExecutorAddress = await executor.getAddress();

  await gelatoCore.connect(executor).stakeExecutor({
    value: await gelatoCore.minExecutorStake(),
  });

  expect(await gelatoCore.isExecutorMinStaked(gelatoExecutorAddress)).to.be
    .true;

  //#endregion
};
