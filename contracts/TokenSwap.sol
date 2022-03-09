// SPDX-License-Identifier: MIT
pragma solidity ^0.8.6;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract TokenSwap {
    using SafeERC20 for IERC20;

    IERC20 public immutable tokenSwapFrom;
    IERC20 public immutable tokenSwapTo;

    event Swapped(address indexed swapper, uint256 amount);

    constructor(address addressTokenSwapFrom, address addressTokenSwapTo) {
        require(addressTokenSwapFrom != address(0), "TokenSwap: tokenSwapFrom address cannot be zero");
        require(addressTokenSwapTo != address(0), "TokenSwap: tokenSwapTo address cannot be zero");

        tokenSwapFrom = IERC20(addressTokenSwapFrom);
        tokenSwapTo = IERC20(addressTokenSwapTo);
    }

    function swap(uint256 amount) external {
        tokenSwapFrom.safeTransferFrom(msg.sender, address(this), amount);

        uint256 contractBalance = tokenSwapTo.balanceOf(address(this));
        require(contractBalance >= amount, "TokenSwap: contract balance is not enough to perform swap");

        tokenSwapTo.safeTransfer(msg.sender, amount);

        emit Swapped(msg.sender, amount);
    }
}
