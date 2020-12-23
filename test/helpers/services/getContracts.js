const hre = require("hardhat");
const { ethers } = hre;
const GelatoCoreLib = require("@gelatonetwork/core");

const InstaIndex = require("../../../pre-compiles/InstaIndex.json");
const InstaList = require("../../../pre-compiles/InstaList.json");
const ConnectMaker = require("../../../pre-compiles/ConnectMaker.json");
const ConnectInstaPool = require("../../../pre-compiles/ConnectInstaPool.json");

const InstaConnector = require("../../../pre-compiles/InstaConnectors.json");
const InstaMapping = require("../../../pre-compiles/InstaMapping.json");
const DssCdpManager = require("../../../pre-compiles/DssCdpManager.json");
const GetCdps = require("../../../pre-compiles/GetCdps.json");
const IERC20 = require("../../../pre-compiles/IERC20.json");
const InstaPoolResolver = require("../../../artifacts/contracts/interfaces/InstaDapp/resolvers/IInstaPoolResolver.sol/IInstaPoolResolver.json");

module.exports = async function () {
  const instaMaster = await ethers.provider.getSigner(
    hre.network.config.InstaMaster
  );

  // ===== Get Deployed Contract Instance ==================
  const instaIndex = await ethers.getContractAt(
    InstaIndex.abi,
    hre.network.config.InstaIndex
  );
  const instaMapping = await ethers.getContractAt(
    InstaMapping.abi,
    hre.network.config.InstaMapping
  );
  const instaList = await ethers.getContractAt(
    InstaList.abi,
    hre.network.config.InstaList
  );
  const connectMaker = await ethers.getContractAt(
    ConnectMaker.abi,
    hre.network.config.ConnectMaker
  );
  const connectInstaPool = await ethers.getContractAt(
    ConnectInstaPool.abi,
    hre.network.config.ConnectInstaPool
  );
  const dssCdpManager = await ethers.getContractAt(
    DssCdpManager.abi,
    hre.network.config.DssCdpManager
  );
  const getCdps = await ethers.getContractAt(
    GetCdps.abi,
    hre.network.config.GetCdps
  );
  const DAI = await ethers.getContractAt(IERC20.abi, hre.network.config.DAI);
  const gelatoCore = await ethers.getContractAt(
    GelatoCoreLib.GelatoCore.abi,
    hre.network.config.GelatoCore
  );
  const instaConnectors = await ethers.getContractAt(
    InstaConnector.abi,
    hre.network.config.InstaConnectors
  );
  const instaPoolResolver = await ethers.getContractAt(
    InstaPoolResolver.abi,
    hre.network.config.InstaPoolResolver
  );

  // ===== Get deployed contracts ==================
  const connectGelato = await ethers.getContract("ConnectGelato");
  const connectorAutoLiquidate = await ethers.getContract(
    "ConnectorAutoLiquidate"
  );
  const connectGelatoExecutorPayment = await ethers.getContract(
    "ConnectGelatoExecutorPayment"
  );

  const providerModuleDSA = await ethers.getContract("ProviderModuleDSA");

  const conditionMakerVaultUnsafe = await ethers.getContract(
    "ConditionMakerVaultUnsafe"
  );

  const priceOracleResolver = await ethers.getContract("PriceOracleResolver");
  const makerResolver = await ethers.getContract("MakerResolver");

  return {
    connectGelato,
    connectMaker,
    connectInstaPool,
    connectorAutoLiquidate,
    instaIndex,
    instaList,
    instaMapping,
    dssCdpManager,
    getCdps,
    DAI,
    gelatoCore,
    instaMaster,
    instaConnectors,
    conditionMakerVaultUnsafe,
    connectGelatoExecutorPayment,
    priceOracleResolver,
    dsa: ethers.constants.AddressZero,
    makerResolver,
    instaPoolResolver,
    providerModuleDSA,
  };
};
