## Functions

### constructor

```solidity
  function constructor(
  ) public
```

### addBeneficiaries

```solidity
  function addBeneficiaries(
    address[] addresses,
    struct TokenVesting.Vesting[] vestings
  ) external
```

Adds beneficiaries

#### Parameters:

| Name        | Type                          | Description                            |
| :---------- | :---------------------------- | :------------------------------------- |
| `addresses` | address[]                     | Beneficiary addresses                  |
| `vestings`  | struct TokenVesting.Vesting[] | Vesting data for beneficiary addresses |

### claim

```solidity
  function claim(
  ) external
```

Claims tokens

### getVesting

```solidity
  function getVesting(
    address beneficiary
  ) external returns (struct TokenVesting.Vesting vesting)
```

Returns vesting data for `beneficiary`

#### Parameters:

| Name          | Type    | Description         |
| :------------ | :------ | :------------------ |
| `beneficiary` | address | Beneficiary address |

#### Return Values:

| Name      | Type                        | Description   |
| :-------- | :-------------------------- | :------------ |
| `vesting` | struct TokenVesting.Vesting | See {Vesting} |

### getAvailableAmountToClaim

```solidity
  function getAvailableAmountToClaim(
    address beneficiary
  ) public returns (uint256 amount)
```

Returns available amount to claim

#### Parameters:

| Name          | Type    | Description         |
| :------------ | :------ | :------------------ |
| `beneficiary` | address | Beneficiary address |

#### Return Values:

| Name     | Type    | Description               |
| :------- | :------ | :------------------------ |
| `amount` | uint256 | available amount to claim |

## Events

### Claimed

```solidity
  event Claimed(
    address beneficiary,
    uint256 amount
  )
```

Emitted when the tokens are claimed

#### Parameters:

| Name          | Type    | Description                    |
| :------------ | :------ | :----------------------------- |
| `beneficiary` | address | The address of the beneficiary |
| `amount`      | uint256 | The claimed amount of tokens   |
