pragma solidity 0.6.6;

// import files from common directory
interface TokenInterface {
    function allowance(address, address) external view returns (uint256);

    function balanceOf(address) external view returns (uint256);

    function approve(address, uint256) external;

    function transfer(address, uint256) external returns (bool);

    function transferFrom(
        address,
        address,
        uint256
    ) external returns (bool);
}

interface AaveInterface {
    function deposit(
        address _reserve,
        uint256 _amount,
        uint16 _referralCode
    ) external payable;

    function redeemUnderlying(
        address _reserve,
        address payable _user,
        uint256 _amount,
        uint256 _aTokenBalanceAfterRedeem
    ) external;

    function setUserUseReserveAsCollateral(
        address _reserve,
        bool _useAsCollateral
    ) external;

    function getUserReserveData(address _reserve, address _user)
        external
        view
        returns (
            uint256 currentATokenBalance,
            uint256 currentBorrowBalance,
            uint256 principalBorrowBalance,
            uint256 borrowRateMode,
            uint256 borrowRate,
            uint256 liquidityRate,
            uint256 originationFee,
            uint256 variableBorrowIndex,
            uint256 lastUpdateTimestamp,
            bool usageAsCollateralEnabled
        );

    function borrow(
        address _reserve,
        uint256 _amount,
        uint256 _interestRateMode,
        uint16 _referralCode
    ) external;

    function repay(
        address _reserve,
        uint256 _amount,
        address payable _onBehalfOf
    ) external payable;
}

interface AaveProviderInterface {
    function getLendingPool() external view returns (address);

    function getLendingPoolCore() external view returns (address);
}

interface AaveCoreInterface {
    function getReserveATokenAddress(address _reserve)
        external
        view
        returns (address);
}

interface ATokenInterface {
    function redeem(uint256 _amount) external;

    function balanceOf(address _user) external view returns (uint256);

    function principalBalanceOf(address _user) external view returns (uint256);
}

contract DSMath {
    function add(uint256 x, uint256 y) internal pure returns (uint256 z) {
        require((z = x + y) >= x, "math-not-safe");
    }

    function mul(uint256 x, uint256 y) internal pure returns (uint256 z) {
        require(y == 0 || (z = x * y) / y == x, "math-not-safe");
    }

    uint256 constant WAD = 10**18;

    function wmul(uint256 x, uint256 y) internal pure returns (uint256 z) {
        z = add(mul(x, y), WAD / 2) / WAD;
    }

    function wdiv(uint256 x, uint256 y) internal pure returns (uint256 z) {
        z = add(mul(x, WAD), y / 2) / y;
    }

    function sub(uint256 x, uint256 y) internal pure returns (uint256 z) {
        require((z = x - y) <= x, "ds-math-sub-underflow");
    }
}

contract Helpers is DSMath {
    /**
     * @dev Return ethereum address
     */
    function getAddressETH() internal pure returns (address) {
        return 0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE; // ETH Address
    }

    function getAddressWETH() internal pure returns (address) {
        // return 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2; // mainnet
        return 0xd0A1E359811322d97991E03f863a0C30C2cF029C; // kovan
    }

    function isETH(address token) internal pure returns (bool) {
        return token == getAddressETH() || token == getAddressWETH();
    }
}

contract AaveHelpers is DSMath, Helpers {
    /**
     * @dev get Aave Provider
     */
    function getAaveProvider() internal pure returns (AaveProviderInterface) {
        return
            AaveProviderInterface(0x24a42fD28C976A61Df5D00D0599C34c4f90748c8); //mainnet
        // return AaveProviderInterface(0x506B0B2CF20FAA8f38a4E2B524EE43e1f4458Cc5); //kovan
    }

    /**
     * @dev get Referral Code
     */
    function getReferralCode() internal pure returns (uint16) {
        return 3228;
    }

    function getIsColl(AaveInterface aave, address token)
        internal
        view
        returns (bool isCol)
    {
        (, , , , , , , , , isCol) = aave.getUserReserveData(
            token,
            address(this)
        );
    }

    function getWithdrawBalance(address token)
        internal
        view
        returns (uint256 bal)
    {
        AaveInterface aave = AaveInterface(getAaveProvider().getLendingPool());
        (bal, , , , , , , , , ) = aave.getUserReserveData(token, address(this));
    }

    function getPaybackBalance(AaveInterface aave, address token)
        internal
        view
        returns (uint256 bal, uint256 fee)
    {
        (, bal, , , , , fee, , , ) = aave.getUserReserveData(
            token,
            address(this)
        );
    }
}

contract BasicResolver is AaveHelpers {
    event LogDeposit(address indexed token, uint256 tokenAmt);
    event LogWithdraw(address indexed token);
    event LogBorrow(address indexed token, uint256 tokenAmt);
    event LogPayback(address indexed token, uint256 tokenAmt);

    /**
     * @dev Deposit ETH/ERC20_Token.
     * @param token token address to deposit.(For ETH: 0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE)
     * @param amt token amount to deposit.
     */
    function deposit(address token, uint256 amt) external payable {
        uint256 _amt = amt;
        AaveInterface aave = AaveInterface(getAaveProvider().getLendingPool());

        uint256 ethAmt;
        if (isETH(token)) {
            _amt = _amt == uint256(-1) ? address(this).balance : _amt;
            ethAmt = _amt;
        } else {
            TokenInterface tokenContract = TokenInterface(token);
            _amt = _amt == uint256(-1)
                ? tokenContract.balanceOf(address(this))
                : _amt;
            tokenContract.approve(getAaveProvider().getLendingPoolCore(), _amt);
        }

        aave.deposit.value(ethAmt)(token, _amt, getReferralCode());

        if (!getIsColl(aave, token))
            aave.setUserUseReserveAsCollateral(token, true);

        emit LogDeposit(token, _amt);
    }

    /**
     * @dev Withdraw ETH/ERC20_Token.
     * @param token token address to withdraw.(For ETH: 0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE)
     * @param amt token amount to withdraw.
     */
    function withdraw(address token, uint256 amt) external payable {
        AaveCoreInterface aaveCore =
            AaveCoreInterface(getAaveProvider().getLendingPoolCore());
        ATokenInterface atoken =
            ATokenInterface(aaveCore.getReserveATokenAddress(token));

        atoken.redeem(amt);

        emit LogWithdraw(token);
    }

    /**
     * @dev Borrow ETH/ERC20_Token.
     * @param token token address to borrow.(For ETH: 0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE)
     * @param amt token amount to borrow.
     */
    function borrow(address token, uint256 amt) external payable {
        uint256 _amt = amt;
        AaveInterface aave = AaveInterface(getAaveProvider().getLendingPool());
        aave.borrow(token, _amt, 2, getReferralCode());

        emit LogBorrow(token, _amt);
    }

    /**
     * @dev Payback borrowed ETH/ERC20_Token.
     * @param token token address to payback.(For ETH: 0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE)
     * @param amt token amount to payback.
     */
    function payback(address token, uint256 amt) external payable {
        uint256 _amt = amt;
        AaveInterface aave = AaveInterface(getAaveProvider().getLendingPool());

        if (_amt == uint256(-1)) {
            uint256 fee;
            (_amt, fee) = getPaybackBalance(aave, token);
            _amt = add(_amt, fee);
        }
        uint256 ethAmt;
        if (isETH(token)) {
            ethAmt = _amt;
        } else {
            TokenInterface(token).approve(
                getAaveProvider().getLendingPoolCore(),
                _amt
            );
        }

        aave.repay.value(ethAmt)(token, _amt, payable(address(this)));

        emit LogPayback(token, _amt);
    }
}

contract ConnectAave is BasicResolver {
    string public name = "Aave-v1";
}
