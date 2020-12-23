# Maker Auto Liquidations using Gelato Network and Instadapp

It is a simple implementation that automates liquidations of Maker Vault(ETH-A) when price of the collateral(ETH) moves unfavourably causing the risk of liquidation auctions by Market Keepers.

## Description

Liquidation is the process of selling collaterals to repay the amount of DAI a user has generated from their vault. When the vault’s Collateralization Ratio falls below the required minimum level (Liquidation Ratio), the vault position would be automatically liquidated through a collateral auction.<br>
<br>
When a vault breaches its Liquidation Ratio, Maker Keeper triggers the Liquidation process. All collaterals in this vault are put up for auction to be sold to pay back the outstanding DAI, the 13% liquidation penalty, and the stability fees. Once the auction completes, the bidder receives the sold collateral, and the vault owner gets the remaining collateral if there is any.

## General flow

1. Initiate a Dai flash loan equal to the value of the Vault<br>
2. Payback the Dai Vault debt using the Dai<br>
3. Withdraw the collateral from the Vault<br>
4. Convert the value of the collateral into Dai for the flash loan debt - To be done<br>
5. Pay Gelato Executor<br>
6. Payback Dai flash loan debt<br>

## Benefits

1. Saves liquidation penalty<br>
2. No central pont of failure for the liquidation tasks - it is done by an executor in Gelato Network<br>

## Test Scenario used for demonstration

1. Create a DSA using Instadapp and authorise Gelato to execute tasks <br>
2. A task is submitted to Gelato with<br>
a) Condition: Tracking vault collateral ratio
b) Actions: Auto liquidate the vault
3. Price of collateral moves from 400 to 250 and the vault is liquidated<br>
4. The executor is paid using ConnectGelatoExecutorPayment<br>

## Installation

Clone the repository, add Alchemy Id in the .env file and run the following commands.

```
npm install
npx hardhat test
```

## Improvements

1. Implement ETH to DAI conversion using a decentralised exchange to payback flash loan<br>
2. Better calculation of gas cost, have used the refinancing gas costs<br>
3. Creating a front-end to demonstrate the functionality