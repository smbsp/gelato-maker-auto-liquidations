const { expect } = require("chai");
const hre = require("hardhat");
const { deployments, ethers } = hre;

const GelatoCoreLib = require("@gelatonetwork/core");

const setupMakerAutoLiquidation = require("../helpers/setupMakerAutoLiquidation");
const getInstaPoolV2Route = require("../../../../../helpers/services/InstaDapp/getInstaPoolV2Route");
const getGasCost = require("../helpers/services/getGasCost");

// This test showcases how to submit a task to auto liquidate an ETH-A Maker vault using Gelato
describe.only("Auto Liquidating a Maker vault using Gelato", function () {
  this.timeout(0);
  if (hre.network.name !== "hardhat") {
    console.error("Test Suite is meant to be run on hardhat only");
    process.exit(1);
  }

  let contracts;
  let wallets;
  let constants;
  let ABI;

  // Payload Params for ConnectGelatoFullDebtBridgeFromMaker and ConditionMakerVaultUnsafe
  let vaultId;

  // For TaskSpec and for Task
  let autoLiquidationSpells = [];

  // Cross test var
  let taskReceipt;

  before(async function () {
    await deployments.fixture();

    const result = await setupMakerAutoLiquidation();
    wallets = result.wallets;
    contracts = result.contracts;
    vaultId = result.vaultId;
    autoLiquidationSpells = result.spells;
    ABI = result.ABI;
    constants = result.constants;
  });

  it("#1: DSA give Authorization to Gelato to execute action his behalf.", async function () {
    //#region User give authorization to gelato to use his DSA on his behalf.

    // Instadapp DSA contract give the possibility to the user to delegate
    // action by giving authorization.
    // In this case user give authorization to gelato to execute
    // task for him if needed.

    await contracts.dsa.cast(
      [hre.network.config.ConnectAuth],
      [
        await hre.run("abi-encode-withselector", {
          abi: ABI.ConnectAuthABI,
          functionname: "add",
          inputs: [contracts.gelatoCore.address],
        }),
      ],
      wallets.userAddress
    );

    expect(await contracts.dsa.isAuth(contracts.gelatoCore.address)).to.be.true;

    //#endregion
  });

  it("#2: User submits auto liquidation task if market move to Gelato via DSA", async function () {
    //#region User submit an Auto Liquidation task if market move against him

    // So in this case if the maker vault go to the unsafe area
    // the auto liquidation task will be executed

    const conditionMakerVaultUnsafeObj = new GelatoCoreLib.Condition({
      inst: contracts.conditionMakerVaultUnsafe.address,
      data: await contracts.conditionMakerVaultUnsafe.getConditionData(
        vaultId,
        contracts.priceOracleResolver.address,
        await hre.run("abi-encode-withselector", {
          abi: (await deployments.getArtifact("PriceOracleResolver")).abi,
          functionname: "getMockPrice",
          inputs: [wallets.userAddress],
        }),
        constants.MIN_COL_RATIO_MAKER
      ),
    });

    // ======= GELATO TASK SETUP ======
    const liquidateIfVaultUnsafe = new GelatoCoreLib.Task({
      conditions: [conditionMakerVaultUnsafeObj],
      actions: autoLiquidationSpells,
    });

    const gelatoExternalProvider = new GelatoCoreLib.GelatoProvider({
      addr: wallets.gelatoProviderAddress, // Gelato Provider Address
      module: contracts.providerModuleDSA.address, // Gelato DSA module
    });

    const expiryDate = 0;
    await expect(
      contracts.dsa.cast(
        [contracts.connectGelato.address], // targets
        [
          await hre.run("abi-encode-withselector", {
            abi: ABI.ConnectGelatoABI,
            functionname: "submitTask",
            inputs: [
              gelatoExternalProvider,
              liquidateIfVaultUnsafe,
              expiryDate,
            ],
          }),
        ], // datas
        wallets.userAddress, // origin
        {
          gasLimit: 5000000,
        }
      )
    ).to.emit(contracts.gelatoCore, "LogTaskSubmitted");

    taskReceipt = new GelatoCoreLib.TaskReceipt({
      id: await contracts.gelatoCore.currentTaskReceiptId(),
      userProxy: contracts.dsa.address,
      provider: gelatoExternalProvider,
      tasks: [liquidateIfVaultUnsafe],
      expiryDate,
    });

    //#endregion
  });

  // This test showcases the part which is automatically done by the Gelato Executor Network on mainnet
  // Bots constatly check whether the submitted task is executable (by calling canExec)
  // If the task becomes executable (returns "OK"), the "exec" function will be called
  // which will execute the auto liquidtion on behalf of the user
  it("#3: Use Maker auto liquidation if the maker vault become unsafe after a market move.", async function () {
    // Steps
    // Step 1: Market Move against the user (Mock)
    // Step 2: Executor execute the user's task

    //#region Step 1 Market Move against the user (Mock)

    // Ether market price went from the current price to 250$

    const gelatoGasPrice = await hre.run("fetchGelatoGasPrice");
    expect(gelatoGasPrice).to.be.lte(constants.GAS_PRICE_CEIL);

    // TO DO: base mock price off of real price data
    await contracts.priceOracleResolver.setMockPrice(
      ethers.utils.parseUnits("400", 18)
    );

    expect(
      await contracts.gelatoCore
        .connect(wallets.executor)
        .canExec(taskReceipt, constants.GAS_LIMIT, gelatoGasPrice)
    ).to.be.equal("ConditionNotOk:MakerVaultNotUnsafe");

    // TO DO: base mock price off of real price data
    await contracts.priceOracleResolver.setMockPrice(
      ethers.utils.parseUnits("250", 18)
    );

    expect(
      await contracts.gelatoCore
        .connect(wallets.executor)
        .canExec(taskReceipt, constants.GAS_LIMIT, gelatoGasPrice)
    ).to.be.equal("OK");

    //#endregion

    //#region Step 2 Executor execute the user's task

    // The market move make the vault unsafe, so the executor
    // will execute the user's task to make the user position safe
    // by auto liquidating.

    //#region EXPECTED OUTCOME

    const debtOnMakerBefore = await contracts.makerResolver.getMakerVaultDebt(
      vaultId
    );

    const route = await getInstaPoolV2Route(
      contracts.DAI.address,
      debtOnMakerBefore,
      contracts.instaPoolResolver
    );

    const gasCost = await getGasCost(route);

    const gasFeesPaidFromCol = ethers.BigNumber.from(gasCost).mul(
      gelatoGasPrice
    );

    const pricedCollateral = (
      await contracts.makerResolver.getMakerVaultCollateralBalance(vaultId)
    ).sub(gasFeesPaidFromCol);

    //#endregion
    const executorBalanceBeforeExecution = await wallets.executor.getBalance();

    await expect(
      contracts.gelatoCore.connect(wallets.executor).exec(taskReceipt, {
        gasPrice: gelatoGasPrice, // Exectutor must use gelatoGasPrice (Chainlink fast gwei)
        gasLimit: constants.GAS_LIMIT,
      })
    ).to.emit(contracts.gelatoCore, "LogExecSuccess");

    // 🚧 For Debugging:
    // const txResponse2 = await contracts.gelatoCore
    //   .connect(wallets.executor)
    //   .exec(taskReceipt, {
    //     gasPrice: gelatoGasPrice,
    //     gasLimit: constants.GAS_LIMIT,
    //   });
    // const {blockHash} = await txResponse2.wait();
    // const logs = await ethers.provider.getLogs({blockHash});
    // const iFace = new ethers.utils.Interface(GelatoCoreLib.GelatoCore.abi);
    // for (const log of logs) {
    //   console.log(iFace.parseLog(log).args.reason);
    // }
    // await GelatoCoreLib.sleep(10000);

    expect(await wallets.executor.getBalance()).to.be.gt(
      executorBalanceBeforeExecution
    );

    const collateralOnMakerOnVaultAAfter = await contracts.makerResolver.getMakerVaultCollateralBalance(
      vaultId
    ); // in Ether.
    const debtOnMakerOnVaultAAfter = await contracts.makerResolver.getMakerVaultDebt(
      vaultId
    );

    // We should not have deposited ether or borrowed DAI on maker.
    expect(collateralOnMakerOnVaultAAfter).to.be.equal(ethers.constants.Zero);
    expect(debtOnMakerOnVaultAAfter).to.be.equal(ethers.constants.Zero);

    //#endregion
  });
});
