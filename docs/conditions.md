---
slug: /conditions
title: Conditions
---

When a coin is spent, its puzzle is executed on the Chialisp Virtual Machine (CLVM). If the program does not fail, it returns a list of conditions. These conditions determine what the outcome of the spend is, and whether or not the spend is valid.

Puzzles have no access to the outside world, or even to blockchain parameters like block height. Therefore, to interact with the outside environment, they return a list of conditions, each of which must be valid in order for the spend itself to be valid.

There are two kinds of conditions. Some require something to be true (such as time passing) in order for the spend to be valid. And others cause something to happen if the spend is valid (such as the creation of new coins).

## Condition List {#list}

:::warning

Be vigilant when using `ASSERT_MY_COIN_ID` as a shortcut for validating the parent coin ID, puzzle hash, and amount. If they are passed into the solution separately, then validated all at once by hashing them together, it is possible to shift the bytes to the left or right and manipulate the values.

You are recommended to use the `coinid` operator when computing coin IDs. This operator was introduced with [CHIP-11](https://github.com/Chia-Network/chips/blob/main/CHIPs/chip-0011.md). It verifies that hashes are indeed 32 bytes in length, at no extra CLVM cost versus verifying the parent ID, puzzle hash, and amount individually. The `coinid` operator, as well as the other CHIP-11 operators, are included on the [operators page](/operators).

:::

:::warning

While `ASSERT_COIN_ANNOUNCEMENT` and `ASSERT_PUZZLE_ANNOUNCEMENT` will continue to be supported, they are no longer recommended. Instead, you should consider using the [SEND_MESSAGE](#66-send_message) and [RECEIVE_MESSAGE](#67-receive_message) conditions.

When you do need to use `ASSERT_COIN_ANNOUNCEMENT` and `ASSERT_PUZZLE_ANNOUNCEMENT` (for example, when spending coins that were created prior to the existence of `SEND_MESSAGE` and `RECEIVE_MESSAGE`), typically you should only use the conditions in a puzzle's _solution_, and not in the puzzle itself. This is especially important when using `ASSERT_COIN_ANNOUNCEMENT`, because it refers to a specific coin.

To illustrate the danger, let's say `coin A` uses this condition in its puzzle, and it asserts a coin announcement from `coin B`.
In this case, `coin A` requires `coin B` to be spent in the same block as it is spent.
If `coin B` is spent before `coin A`, then `coin A` can _never_ be spent.

However, if this condition is instead used in the _solution_ for `coin A`, and `coin B` has already been spent, then `coin A` can still be spent later, albeit with a different solution.

It is somewhat less dangerous to use `ASSERT_PUZZLE_ANNOUNCEMENT` in a coin's puzzle because it only relies on a coin with a specific puzzle, and many such coins might exist.
However, it is still best practice to only use this condition in a coin's solution.

:::

### About MESSAGE conditions' `mode` parameter

The [SEND_MESSAGE](#66-send_message) and [RECEIVE_MESSAGE](#67-receive_message) conditions require a 1-byte `mode` parameter to commit to the sender and receiver of the message. This parameter is a bitmask of three bits for the sender, and three bits for the receiver. Only the lowest six bits are used (the highest two bits are unused).

Each bit represents whether an attribute from the coin is required (`1`) or not (`0`):

- The first bit represents the parent coin.
- The second bit represents the puzzle hash of the coin.
- The third bit represents the amount (value) of the coin.

The sender and receiver bits each use the following convention:

| Type          | Bits | Parent | Puzzle | Amount |
| :------------ | :--- | :----- | :----- | :----- |
| Coin          | 111  | True   | True   | True   |
| Parent        | 100  | True   | False  | False  |
| Puzzle        | 010  | False  | True   | False  |
| Amount        | 001  | False  | False  | True   |
| Parent-Puzzle | 110  | True   | True   | False  |
| Parent-Amount | 101  | True   | False  | True   |
| Puzzle-Amount | 011  | False  | True   | True   |
| None          | 000  | False  | False  | False  |

The eight conditions from this table apply to both the sender and receiver coins. Therefore, there are 64 possible combinations (8 \* 8). For example, if a specific coin sends a message, and a coin with a specific parent coin and puzzle hash receives it, the bitmask would be `111` concatenated with `110`, or `111110`.

Additional parameters will depend on these six bits. This enables a coin that can send a message to another coin based on a parent/puzzle/amount combination of that destination coin. The recipient coin can receive that message if it also specifies which coin sent it.

Note 1: The `mode` parameter must be identical for both the `SEND_MESSAGE` and the corresponding `RECEIVE_MESSAGE`. In the above example, the sender's `mode` parameter was `111110`. In this case, the receiver's mode parameter must also be `111110` in order for the spend to succeed.

Note 2: The consensus and the mempool will each allow any of the eight possible combinations from the above table.

### About MESSAGE conditions' `varargs` parameter

The [SEND_MESSAGE](#66-send_message) and [RECEIVE_MESSAGE](#67-receive_message) conditions include a varargs (`...`) parameter. This parameter is required for asserting the parent coin ID, puzzle hash, and/or amount of the coin that sent or received the message, depending on the condition:

- When using `SEND_MESSAGE`, the `...` parameter refers to the coin that will receive the message.
- When using `RECEIVE_MESSAGE`, the `...` parameter refers to the coin that sent the message.

The length of this parameter depends on `mode`. Continuing with the table from the previous section, the following arguments are required in the `...` parameter:

| Type          | Bits | Arguments required in `...`        |
| :------------ | :--- | :--------------------------------- |
| Coin          | 111  | `<coin ID>`                        |
| Parent        | 100  | `<parent coin ID>`                 |
| Puzzle        | 010  | `<puzzle hash>`                    |
| Amount        | 001  | `<amount>`                         |
| Parent-Puzzle | 110  | `<parent coin ID>` `<puzzle hash>` |
| Parent-Amount | 101  | `<parent coin ID>` `<amount>`      |
| Puzzle-Amount | 011  | `<puzzle hash>` `<amount>`         |
| None          | 000  | Not used                           |

Note that when all three bits are set, the `coin ID` will be passed instead of its components parts.

### 1 `REMARK` {#remark}

Format: `(1)`

This condition is always considered valid by the mempool.

This condition has no parameters.

---

### 43 `AGG_SIG_PARENT` {#agg-sig-parent}

:::info
This condition is part of [CHIP-0011](https://github.com/Chia-Network/chips/blob/main/CHIPs/chip-0011.md), and will be available at block height 5,496,000.
:::

:::note
This condition adds an additional [CLVM cost](https://docs.chia.net/coin-set-costs/) of 1,200,000.
:::

Format: `(43 public_key message)`

Verifies a signature for a given message which is concatenated with the following values:

- The parent coin id of the coin being spent.
- The domain string, `sha256(genesis_id + 43)`.

The following parameters are expected:

| Name         | Type      |
| ------------ | --------- |
| `public_key` | G1Element |
| `message`    | Bytes     |

---

### 44 `AGG_SIG_PUZZLE` {#agg-sig-puzzle}

:::info
This condition is part of [CHIP-0011](https://github.com/Chia-Network/chips/blob/main/CHIPs/chip-0011.md), and will be available at block height 5,496,000.
:::

:::note
This condition adds an additional [CLVM cost](https://docs.chia.net/coin-set-costs/) of 1,200,000.
:::

Format: `(44 public_key message)`

Verifies a signature for a given message which is concatenated with the following values:

- The puzzle hash of the coin being spent.
- The domain string, `sha256(genesis_id + 44)`.

The following parameters are expected:

| Name         | Type      |
| ------------ | --------- |
| `public_key` | G1Element |
| `message`    | Bytes     |

---

### 45 `AGG_SIG_AMOUNT` {#agg-sig-amount}

:::info
This condition is part of [CHIP-0011](https://github.com/Chia-Network/chips/blob/main/CHIPs/chip-0011.md), and will be available at block height 5,496,000.
:::

:::note
This condition adds an additional [CLVM cost](https://docs.chia.net/coin-set-costs/) of 1,200,000.
:::

Format: `(45 public_key message)`

Verifies a signature for a given message which is concatenated with the following values:

- The amount of the coin being spent.
- The domain string, `sha256(genesis_id + 45)`.

The following parameters are expected:

| Name         | Type      |
| ------------ | --------- |
| `public_key` | G1Element |
| `message`    | Bytes     |

---

### 46 `AGG_SIG_PUZZLE_AMOUNT` {#agg-sig-puzzle-amount}

:::info
This condition is part of [CHIP-0011](https://github.com/Chia-Network/chips/blob/main/CHIPs/chip-0011.md), and will be available at block height 5,496,000.
:::

:::note
This condition adds an additional [CLVM cost](https://docs.chia.net/coin-set-costs/) of 1,200,000.
:::

Format: `(46 public_key message)`

Verifies a signature for a given message which is concatenated with the following values:

- The puzzle hash of the coin being spent.
- The amount of the coin being spent.
- The domain string, `sha256(genesis_id + 46)`.

The following parameters are expected:

| Name         | Type      |
| ------------ | --------- |
| `public_key` | G1Element |
| `message`    | Bytes     |

---

### 47 `AGG_SIG_PARENT_AMOUNT` {#agg-sig-parent-amount}

:::info
This condition is part of [CHIP-0011](https://github.com/Chia-Network/chips/blob/main/CHIPs/chip-0011.md), and will be available at block height 5,496,000.
:::

:::note
This condition adds an additional [CLVM cost](https://docs.chia.net/coin-set-costs/) of 1,200,000.
:::

Format: `(47 public_key message)`

Verifies a signature for a given message which is concatenated with the following values:

- The parent coin id of the coin being spent.
- The amount of the coin being spent.
- The domain string, `sha256(genesis_id + 47)`.

The following parameters are expected:

| Name         | Type      |
| ------------ | --------- |
| `public_key` | G1Element |
| `message`    | Bytes     |

---

### 48 `AGG_SIG_PARENT_PUZZLE` {#agg-sig-parent-puzzle}

:::info
This condition is part of [CHIP-0011](https://github.com/Chia-Network/chips/blob/main/CHIPs/chip-0011.md), and will be available at block height 5,496,000.
:::

:::note
This condition adds an additional [CLVM cost](https://docs.chia.net/coin-set-costs/) of 1,200,000.
:::

Format: `(48 public_key message)`

Verifies a signature for a given message which is concatenated with the following values:

- The parent coin id of the coin being spent.
- The puzzle hash of the coin being spent.
- The domain string, `sha256(genesis_id + 48)`.

The following parameters are expected:

| Name         | Type      |
| ------------ | --------- |
| `public_key` | G1Element |
| `message`    | Bytes     |

---

### 49 `AGG_SIG_UNSAFE` {#agg-sig-unsafe}

:::note
This condition adds an additional [CLVM cost](https://docs.chia.net/coin-set-costs/) of 1,200,000.
:::

Format: `(49 public_key message)`

Verifies a signature for a given message. For [security reasons](https://github.com/Chia-Network/post-mortem/blob/main/2023-05/2023-05-08-AGG_SIG_UNSAFE-can-mimic-AGG_SIG_ME-condition.md), domain strings are not permitted at the end of `AGG_SIG_UNSAFE` messages.

The following parameters are expected:

| Name         | Type      |
| ------------ | --------- |
| `public_key` | G1Element |
| `message`    | Bytes     |

---

### 50 `AGG_SIG_ME` {#agg-sig-me}

:::tip
In most cases, `AGG_SIG_ME` is the recommended condition for requiring signatures. Signatures created for a specific coin spend will only be valid for that exact coin, which prevents an attacker from reusing the signature for other spends.
:::

:::note
This condition adds an additional [CLVM cost](https://docs.chia.net/coin-set-costs/) of 1,200,000.
:::

Format: `(50 public_key message)`

Verifies a signature for a given message which is concatenated with the following values:

- The id of the coin being spent.
- The domain string, `genesis_id`.

The following parameters are expected:

| Name         | Type      |
| ------------ | --------- |
| `public_key` | G1Element |
| `message`    | Bytes     |

---

### 51 `CREATE_COIN` {#create-coin}

:::note
This condition adds an additional [CLVM cost](https://docs.chia.net/coin-set-costs/) of 1,800,000.
:::

Format: `(51 puzzle_hash amount (...memos)?)`

Creates a new coin output with a given puzzle hash and amount. This coin is its parent.

For more information on the `memos` parameter, see the section on [Memos and Hinting](#memos).

The following parameters are expected:

| Name                 | Type         |
| -------------------- | ------------ |
| `puzzle_hash`        | Bytes32      |
| `amount`             | Unsigned Int |
| `memos` _(optional)_ | Bytes32 List |

---

### 52 `RESERVE_FEE` {#reserve-fee}

Format: `(52 amount)`

Requires that the total amount remaining in the transaction after all outputs have been created is no less than the reserved fee amount.

The following parameters are expected:

| Name     | Type         |
| -------- | ------------ |
| `amount` | Unsigned Int |

---

### 60 `CREATE_COIN_ANNOUNCEMENT` {#create-coin-announcement}

:::warning

While this condition will be supported going forward, it is no longer recommended. Consider using [SEND_MESSAGE](#66-send_message) instead.

:::

Format: `(60 message)`

Creates an announcement of a given message, tied to this coin's id. For more details, see the section on [Announcements](#announcements).

The following parameters are expected:

| Name      | Type  |
| --------- | ----- |
| `message` | Bytes |

---

### 61 `ASSERT_COIN_ANNOUNCEMENT` {#assert-coin-announcement}

:::warning

While this condition will be supported going forward, it is no longer recommended. Consider using [RECEIVE_MESSAGE](#67-receive_message) instead.

:::

Format: `(61 announcement_id)`

Asserts an announcement with a given id, which is calculated as `sha256(coin_id + message)`. For more details, see the section on [Announcements](#announcements).

The following parameters are expected:

| Name              | Type    |
| ----------------- | ------- |
| `announcement_id` | Bytes32 |

---

### 62 `CREATE_PUZZLE_ANNOUNCEMENT` {#create-puzzle-announcement}

:::warning

This condition will be supported going forward, but it is no longer recommended. Consider using [`SEND_MESSAGE`](#66-send_message) instead.

:::

Format: `(62 message)`

Creates an announcement of a given message, tied to this coin's puzzle hash. For more details, see the section on [Announcements](#announcements).

The following parameters are expected:

| Name      | Type  |
| --------- | ----- |
| `message` | Bytes |

---

### 63 `ASSERT_PUZZLE_ANNOUNCEMENT` {#assert-puzzle-announcement}

:::warning

This condition will be supported going forward, but it is no longer recommended. Consider using [`RECEIVE_MESSAGE`](#67-receive_message) instead.

:::

Format: `(63 announcement_id)`

Asserts an announcement with a given id, which is calculated as `sha256(puzzle_hash + message)`. For more details, see the section on [Announcements](#announcements).

The following parameters are expected:

| Name              | Type    |
| ----------------- | ------- |
| `announcement_id` | Bytes32 |

---

### 64 `ASSERT_CONCURRENT_SPEND` {#assert-concurrent-spend}

Format: `(64 coin_id)`

Asserts that this coin is spent within the same block as the spend of a given coin.

The following parameters are expected:

| Name      | Type    |
| --------- | ------- |
| `coin_id` | Bytes32 |

---

### 65 `ASSERT_CONCURRENT_PUZZLE` {#assert-concurrent-puzzle}

Format: `(65 puzzle_hash)`

Asserts that this coin is in the same block as the spend of another coin with a given puzzle hash.

The following parameters are expected:

| Name          | Type    |
| ------------- | ------- |
| `puzzle_hash` | Bytes32 |

---

### 66 `SEND_MESSAGE`

:::info
This condition is part of [CHIP-0025](https://github.com/Chia-Network/chips/blob/main/CHIPs/chip-0025.md), and became available at block height 5,716,000.
:::

Format: `(66 mode message ...)`

Sends a `message` using the specified `mode` and `...` parameters. See the sections on the [mode](#about-message-conditions-mode-parameter) and [varargs](#about-message-conditions-varargs-parameter) parameters for more info.

For more info about the thought process that led to the creation of this condition, see [CHIP-25](https://github.com/Chia-Network/chips/blob/main/CHIPs/chip-0025.md#mode-parameter).

Note 1: If this condition's `message` is not received in the same block where this condition is used, the spend bundle containing this condition will fail.

Note 2: This condition can be issued multiple times, to send identical messages in a single block. In this case, there must be a separate `RECEIVE_MESSAGE` condition to match each `SEND_MESSAGE` condition, and the `RECEIVE_MESSAGE` condition(s) must be issued in the same block where the messages are sent. If the number of messages sent does not equal the number of messages received, the condition will fail.

Note 3: The `message` parameter has a maximum size of 1024 bytes.

The following parameters are expected:

| Name          | Type         |
| ------------- | ------------ |
| `mode`        | Unsigned Int |
| `message`     | Bytes        |
| `destination` | ...          |

`mode` may only have bits 0-5 set.

`message` may not be greater than 1024 bytes long.

The parameters after `message` depends on which bits are set in `mode`. They identify the receiving spend.

---

### 67 `RECEIVE_MESSAGE`

:::info
This condition is part of [CHIP-0025](https://github.com/Chia-Network/chips/blob/main/CHIPs/chip-0025.md), and became available at block height 5,716,000.
:::

Format: `(67 mode message ...)`

Asserts that exactly one of the source coin issues exactly one corresponding `SEND_MESSAGE` condition.

See the sections on the [mode](#about-message-conditions-mode-parameter) and [varargs](#about-message-conditions-varargs-parameter) parameters

For more info about the thought process that led to the creation of this condition, see [CHIP-25](https://github.com/Chia-Network/chips/blob/main/CHIPs/chip-0025.md#mode-parameter).

The following parameters are expected:

| Name      | Type         |
| --------- | ------------ |
| `mode`    | Unsigned Int |
| `message` | Bytes        |
| `source`  | ...          |

`mode` may only have bits 0-5 set.

`message` may not be greater than 1024 bytes long.

The parameters after `message` depend on which bits are set in `mode`. They identify the sending spend.

---

### 70 `ASSERT_MY_COIN_ID` {#assert-my-coin-id}

Format: `(70 coin_id)`

Asserts that id of this coin matches a given value.

The following parameters are expected:

| Name      | Type    |
| --------- | ------- |
| `coin_id` | Bytes32 |

---

### 71 `ASSERT_MY_PARENT_ID` {#assert-my-parent-id}

Format: `(71 parent_id)`

Asserts that the parent id of this coin matches a given value.

The following parameters are expected:

| Name        | Type    |
| ----------- | ------- |
| `parent_id` | Bytes32 |

---

### 72 `ASSERT_MY_PUZZLEHASH` {#assert-my-puzzlehash}

Format: `(72 puzzle_hash)`

Asserts that the puzzle hash of this coin matches a given value.

The following parameters are expected:

| Name          | Type    |
| ------------- | ------- |
| `puzzle_hash` | Bytes32 |

---

### 73 `ASSERT_MY_AMOUNT` {#assert-my-amount}

Format: `(73 amount)`

Asserts that the amount of this coin matches a given value.

The following parameters are expected:

| Name     | Type         |
| -------- | ------------ |
| `amount` | Unsigned Int |

---

### 74 `ASSERT_MY_BIRTH_SECONDS` {#assert-my-birth-seconds}

Format: `(74 seconds)`

Asserts that this coin was created at a given timestamp.

The following parameters are expected:

| Name      | Type         |
| --------- | ------------ |
| `seconds` | Unsigned Int |

---

### 75 `ASSERT_MY_BIRTH_HEIGHT` {#assert-my-birth-height}

Format: `(75 block_height)`

Asserts that this coin was created at a given block height.

The following parameters are expected:

| Name           | Type         |
| -------------- | ------------ |
| `block_height` | Unsigned Int |

---

### 76 `ASSERT_EPHEMERAL` {#assert-ephemeral}

Format: `(76)`

Asserts that this coin was created within the current block.

This condition has no parameters.

---

### 80 `ASSERT_SECONDS_RELATIVE` {#assert-seconds-relative}

Format: `(80 seconds_passed)`

Asserts that the previous transaction block was created at least a given number of seconds after this coin was created.

The following parameters are expected:

| Name             | Type         |
| ---------------- | ------------ |
| `seconds_passed` | Unsigned Int |

---

### 81 `ASSERT_SECONDS_ABSOLUTE` {#assert-seconds-absolute}

Format: `(81 seconds)`

Asserts that the previous transaction block was created at at least a given timestamp, in seconds.

The following parameters are expected:

| Name      | Type         |
| --------- | ------------ |
| `seconds` | Unsigned Int |

---

### 82 `ASSERT_HEIGHT_RELATIVE` {#assert-height-relative}

Format: `(82 block_height_passed)`

Asserts that the previous transaction block was created at least a given number of blocks after this coin was created.

The following parameters are expected:

| Name                  | Type         |
| --------------------- | ------------ |
| `block_height_passed` | Unsigned Int |

---

### 83 `ASSERT_HEIGHT_ABSOLUTE` {#assert-height-absolute}

Format: `(83 block_height)`

Asserts that the previous transaction block was created at at least a given height.

The following parameters are expected:

| Name           | Type         |
| -------------- | ------------ |
| `block_height` | Unsigned Int |

---

### 84 `ASSERT_BEFORE_SECONDS_RELATIVE` {#assert-before-seconds-relative}

Format: `(84 seconds_passed)`

Asserts that the previous transaction block was created before a given number of seconds after this coin was created.

The following parameters are expected:

| Name             | Type         |
| ---------------- | ------------ |
| `seconds_passed` | Unsigned Int |

---

### 85 `ASSERT_BEFORE_SECONDS_ABSOLUTE` {#assert-before-seconds-absolute}

Format: `(85 seconds)`

Asserts that the previous transaction block was created before a given timestamp, in seconds.

The following parameters are expected:

| Name      | Type         |
| --------- | ------------ |
| `seconds` | Unsigned Int |

---

### 86 `ASSERT_BEFORE_HEIGHT_RELATIVE` {#assert-before-height-relative}

Format: `(86 block_height_passed)`

Asserts that the previous transaction block was created before a given number of blocks after this coin was created.

The following parameters are expected:

| Name                  | Type         |
| --------------------- | ------------ |
| `block_height_passed` | Unsigned Int |

---

### 87 `ASSERT_BEFORE_HEIGHT_ABSOLUTE` {#assert-before-height-absolute}

Format: `(87 block_height)`

Asserts that the previous transaction block was created before a given height.

The following parameters are expected:

| Name           | Type         |
| -------------- | ------------ |
| `block_height` | Unsigned Int |

---

### 90 `SOFTFORK` {#softfork}

:::info
This condition is part of [CHIP-0011](https://github.com/Chia-Network/chips/blob/main/CHIPs/chip-0011.md), and will be available at block height 5,496,000.
:::

:::note
This condition adds an additional [CLVM cost](https://docs.chia.net/coin-set-costs/) equal to whatever the value of the first argument is.
:::

Format: `(90 cost ...args)`

Allows future conditions with non-zero CLVM costs to be added as soft forks. This functionality was previously only possible as a hard fork.

The cost of the condition is specified in ten-thousands, and further arguments are not specified (the soft-forked condition defines these). The reason to scale the cost by 10,000 is to make the argument smaller. For example, a cost of 100 in this condition would equate to an actual cost of 1 million (1,000,000). The cost argument is two bytes, with a maximum size of 65,535 (an actual cost of 655,350,000).

The following parameters are expected:

| Name      | Type         |
| --------- | ------------ |
| `cost`    | Unsigned Int |
| `...args` | Any          |

## Memos and Hinting {#memos}

When a coin uses one or more outer puzzles that change their puzzle hash, it's challenging for wallets to know which coins they have the ability to spend. The memos field allows you to hint the inner puzzle hash of created coins, which consequently lets the wallet know that the coin belongs to it. Coins can be looked up by the inner puzzle hash rather than the outer puzzle hash.

The `CREATE_COIN` condition is defined as a list containing the opcode `51` and the following arguments:

```chialisp
; The third parameter is optional.
(51 puzzle_hash amount (...memos))
```

The `memos` parameter is an optional list, which must be null terminated.

If `memos` is present, and the first memo is exactly 32 bytes long, it's used as the hint and the rest of the list are memos. Otherwise, values in the entire list are memos.

As an example, the following inner solution for the [standard transaction](/standard-transactions) would create an unhinted coin:

```chialisp
(() (q . ((51 target_puzzle_hash amount))) ())
```

The following solution would instead create a coin with the hint matching the inner puzzle hash:

```chialisp
(() (q . ((51 target_puzzle_hash amount (target_puzzle_hash)))) ())
```

This `CREATE_COIN` condition creates the same coin as before, but now it specifies the hint with which the receiving wallet can look up to find this coin.

Hints are only necessary for outer puzzles, of which the inner puzzle hash matches the hint. For example, coins using the standard transaction itself with no outer puzzle do not need a hint.

## Announcements

Announcements are ephemeral, meaning that they don't last forever. They can only be asserted within the block they are created. Their purpose is to ensure multiple coins are spent together, either for fees, verification, or as a security measure.

For coin announcements, the id is the `coin_id` and `message` sha256 hashed together. Likewise, for puzzle announcements, it's the `puzzle_hash` and `message` sha256 hashed together.
