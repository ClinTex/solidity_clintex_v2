// SPDX-License-Identifier: MIT
pragma solidity ^0.8.6;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract TokenSwap {
    using SafeERC20 for IERC20;

    IERC20 public immutable tokenSwapFrom;
    IERC20 public immutable tokenSwapTo;

    //TODO: add events

    constructor(address addressTokenSwapFrom, address addressTokenSwapTo) {
        //TODO: null address check
        tokenSwapFrom = IERC20(addressTokenSwapFrom);
        tokenSwapTo = IERC20(addressTokenSwapTo);
    }

    function swap(uint256 amount) external {
        tokenSwapFrom.safeTransferFrom(msg.sender, address(this), amount);

        uint256 contractBalance = tokenSwapTo.balanceOf(address(this));
        require(contractBalance >= amount, "TokenSwap: contract balance is not enough to perform swap");

        tokenSwapTo.safeTransfer(msg.sender, amount);
    }
}
