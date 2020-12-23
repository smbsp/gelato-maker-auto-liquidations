module.exports = async function (token, tokenDebtToMove, instaPoolResolver) {
  const rData = await instaPoolResolver.getTokenLimit(token);

  if (rData.dydx > tokenDebtToMove) return 0;
  if (rData.maker > tokenDebtToMove) return 1;
  if (rData.compound > tokenDebtToMove) return 2;
  if (rData.aave > tokenDebtToMove) return 3;
};
