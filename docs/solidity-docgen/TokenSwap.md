## Functions

### constructor

```solidity
  function constructor(
  ) public
```

### swap

```solidity
  function swap(
    uint256 amount
  ) external
```

Swaps tokens from one contract to another

#### Parameters:

| Name     | Type    | Description                                      |
| :------- | :------ | :----------------------------------------------- |
| `amount` | uint256 | The amount of tokens that is going to be swapped |

### pause

```solidity
  function pause(
  ) external
```

Pauses certain functions. See {Pausable-\_pause}

### unpause

```solidity
  function unpause(
  ) external
```

Unpauses certain functions. See {Pausable-\_unpause}

## Events

### Swapped

```solidity
  event Swapped(
    address swapper,
    uint256 amount
  )
```

Emitted when tokens are swapped

#### Parameters:

| Name      | Type    | Description                                |
| :-------- | :------ | :----------------------------------------- |
| `swapper` | address | The token swapper address                  |
| `amount`  | uint256 | The amount of tokens that had been swapped |
