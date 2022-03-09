// SPDX-License-Identifier: MIT
pragma solidity ^0.8.6;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract TokenVesting is Ownable {
    using SafeERC20 for IERC20;

    IERC20 public immutable token;

    uint256 public immutable firstUnlockTime;
    uint256 public immutable secondUnlockTime;
    uint256 public immutable thirdUnlockTime;

    struct Vesting {
        uint256 amountToClaimOnFirstUnlockTime;
        uint256 amountToClaimOnSecondUnlockTime;
        uint256 amountToClaimOnThirdUnlockTime;
        uint256 totalClaimed;
    }

    mapping(address => Vesting) private _addressVesting;

    event Claimed(address indexed beneficiary, uint256 amount);

    constructor(
        address addressToken,
        uint256 _firstUnlockTime,
        uint256 _secondUnlockTime,
        uint256 _thirdUnlockTime
    ) {
        //TODO: null address check
        require(_firstUnlockTime > block.timestamp, "TokenVesting: unlock time is before current time");
        require(_secondUnlockTime > _firstUnlockTime, "TokenVesting: second unlock time is before first unlock time");
        require(_thirdUnlockTime > _secondUnlockTime, "TokenVesting: third unlock time is before second unlock time");

        token = IERC20(addressToken);
        firstUnlockTime = _firstUnlockTime;
        secondUnlockTime = _secondUnlockTime;
        thirdUnlockTime = _thirdUnlockTime;
    }

    modifier onlyBeneficiary(address addressBeneficiary) {
        Vesting memory vesting = _addressVesting[addressBeneficiary];
        require(_isContainsAnyLockedToken(vesting), "TokenVesting: address is not beneficiary");
        _;
    }

    function addBeneficiaries(address[] memory addresses, Vesting[] memory vestings) external onlyOwner {
        require(addresses.length == vestings.length, "TokenVesting: arrays of incorrect length");

        for (uint256 i = 0; i < addresses.length; i++) {
            Vesting memory vesting = vestings[i];
            address beneficiaryAddress = addresses[i];

            require(
                _isContainsAnyLockedToken(vesting),
                string(abi.encodePacked("TokenVesting: ", beneficiaryAddress, " does not contains any locked tokens"))
            );

            _setBeneficiaryVestingData(beneficiaryAddress, vesting);
        }
    }

    function claim() external onlyBeneficiary(msg.sender) {
        require(block.timestamp >= firstUnlockTime, "TokenVesting: given time is before first unlock time");

        Vesting storage vesting = _addressVesting[msg.sender];

        uint256 availableAmountToClaim = _getAmountToClaim(msg.sender) - vesting.totalClaimed;
        require(availableAmountToClaim > 0, "TokenVesting: no tokens to claim");

        uint256 contractBalance = token.balanceOf(address(this));
        require(
            contractBalance >= availableAmountToClaim,
            "TokenVesting: contract balance is not enough to perform claim"
        );

        vesting.totalClaimed += availableAmountToClaim;
        token.safeTransfer(msg.sender, availableAmountToClaim);

        emit Claimed(msg.sender, availableAmountToClaim);
    }

    function _getAmountToClaim(address addressBeneficiary) private view returns (uint256 amount) {
        Vesting memory vesting = _addressVesting[addressBeneficiary];

        if (block.timestamp >= thirdUnlockTime) {
            amount +=
                vesting.amountToClaimOnFirstUnlockTime +
                vesting.amountToClaimOnSecondUnlockTime +
                vesting.amountToClaimOnThirdUnlockTime;
        } else if (block.timestamp >= secondUnlockTime) {
            amount += vesting.amountToClaimOnFirstUnlockTime + vesting.amountToClaimOnSecondUnlockTime;
        } else if (block.timestamp >= firstUnlockTime) {
            amount += vesting.amountToClaimOnFirstUnlockTime;
        }
    }

    function _setBeneficiaryVestingData(address addressBeneficiary, Vesting memory vesting) private {
        Vesting storage beneficiaryVesting = _addressVesting[addressBeneficiary];

        beneficiaryVesting.amountToClaimOnFirstUnlockTime = vesting.amountToClaimOnFirstUnlockTime;
        beneficiaryVesting.amountToClaimOnSecondUnlockTime = vesting.amountToClaimOnSecondUnlockTime;
        beneficiaryVesting.amountToClaimOnThirdUnlockTime = vesting.amountToClaimOnThirdUnlockTime;
    }

    function _isContainsAnyLockedToken(Vesting memory vesting) private pure returns (bool) {
        return
            vesting.amountToClaimOnFirstUnlockTime > 0 ||
            vesting.amountToClaimOnSecondUnlockTime > 0 ||
            vesting.amountToClaimOnThirdUnlockTime > 0;
    }
}
