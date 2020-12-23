const ConnectGelatoABI = require("../../../artifacts/contracts/contracts/connectors/ConnectGelato.sol/ConnectGelato.json")
  .abi;
const ConnectAuthABI = require("../../../pre-compiles/ConnectAuth.json").abi;
const ConnectMakerABI = require("../../../pre-compiles/ConnectMaker.json").abi;

module.exports = function () {
  return {
    ConnectGelatoABI: ConnectGelatoABI,
    ConnectAuthABI: ConnectAuthABI,
    ConnectMakerABI: ConnectMakerABI,
  };
};
