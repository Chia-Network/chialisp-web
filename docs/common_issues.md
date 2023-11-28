---
id: common_issues
title: Common Issues
slug: /common_issues
---

This page contains a list of the most common issues you may encounter when developing applications in Chialisp. This list is by no means comprehensive, and we recommend putting each of your applications through a rigorous code review and audit before deploying them on mainnet. However, by following the guidelines laid out here, you will avoid some common pitfalls that can be easy to overlook.

## Password Coin

### Problem

Coins that are _only_ locked with a password are not secure.

### Cause

Farmers can see and modify coin solutions.

### Example

A simple password coin would use this as its primary function:

```chialisp
(if (= (sha256 password) PASSWORD_HASH)
  conditions
  (x)
)
```

Keep in mind that each node has its own mempool. When a farmer creates a new block, they can:
* Choose to include or exclude any spend from the mempool
* View each coin spend and solution in the mempool
* Modify any of the coin solutions (provided that the modified solution is valid)

Let's say a coin has been secured using only the above `if` statement. `PASSWORD_HASH` has been curried into the coin, so it cannot be modified. Therefore, in order for this coin to be spent, the solution must contain the original `password`, which must hash to `PASSWORD_HASH`. The solution will also contain `conditions`. This is a list of any Chialisp condition(s), one of which will presumably create a new coin to a puzzlehash the owner controls.

The problem with this puzzle is that whoever farms the coin will see the `password`, which is required to be included in the solution. The farmer could then ignore the original solution and spend the coin with new `conditions` that would create a new coin using a puzzlehash the farmer controls. In other words, the farmer could steal this coin as it was being spent.

### How to avoid

Password coins are easy to create, so they are often used in training materials (see [our documentation](https://docs.chia.net/guides/chialisp-first-smart-coin/#password-puzzle) for more info). However, coins locked with a password (and nothing else) are not secure. Instead, use announcements and the `AGG_SIG_ME` condition to secure your coins, as explained in the [standard transaction puzzle](https://chialisp.com/standard-transactions/).

Also keep in mind that a farmer can attempt to modify a coin's solution as it is being spent. If modifying any of the conditions from your coin's solution would result in the solution remaining valid, then you should assume the farmer will do exactly this.

---

## Unchecked Hashing

### Problem

Hash collisions could be used to modify coin values.

### Cause

Concatenating and hashing without verifying the length of items to be concatenated.

### Example

The CAT1 standard calculated coin IDs like this:

```bash
coin ID = sha256(parent coin ID + puzzlehash + amount)
```

This normally resulted in a correct `coin ID`, but the length of each component was never checked. An attacker therefore could shift the divider between the `puzzlehash` and the `amount` to the left by one or two bytes. Depending on the value of the extra byte(s), there was a 50% chance that this would result in an inflated value for the coin, and a 50% chance that the coin's value would be negative. In the latter case the current coin could not be modified, but the attacker could simply spend it and try again.

The `puzzlehash` would be shortened by one or two bytes, and the `amount` would be lengthened by one or two bytes, but the resulting hash would be identical. Every coin using the CAT1 standard was vulnerable to this attack.

### How to avoid

In the specific case of calculating a coin's ID, you are recommended to use the new [coinid](https://github.com/Chia-Network/chips/blob/main/CHIPs/chip-0011.md#coinid) operator, introduced in CHIP-11. This operator validates the length of each component of the coin's ID, as well as the coin's value. In addition the CLVM cost of this operator is lower than that of using `sha256` (800 versus 953), so there is no reason not to use it when calculating a coin's ID.

For use cases that involve hashing a concatenated string to do something _other than_ calculate a coin's ID, you will need to use `sha256`. In these cases, prior to running the `sha256` command, be sure to validate that the length of each component is correct.

In the case of CAT1, the vulnerability was discovered prior to the existence of the `coinid` operator. Therefore, `sha256` was still required in the patch, which called the following function to calculate a coin's ID:

```chialisp
(defun calculate_coin_id (parent puzzlehash amount)
  (if (all (size_b32 parent) (size_b32 puzzlehash) (> amount -1))
    (sha256 parent puzzlehash amount)
    (x)
  )
)
```

This function verifies that the `parent coin ID` and `puzzlehash` are each 32 bytes, and that the `amount` is at least zero (negative value coins are not allowed). With this function call in place, if an attacker attempts to shift any of the components, the Chialisp program will exit and raise an exception.

For more information, see our [blog post discussing this issue](https://www.chia.net/2022/07/29/cat1-vulnerability-explained-cve-and-cwe/).

---

## Unprotected Announcements

### Problem

Multiple coins can assert the same announcement.

### Cause

Creating a coin announcement that does not include the ID of the coin being spent. This allows multiple coin spends to assert the same announcement, resulting in a replay attack.

### Example

TibetSwap v1 was an AMM that stored liquidity for coin pairs in a singleton with a liquidity TAIL. Upon spending this coin, a `CREATE_COIN_ANNOUNCEMENT` condition was created. This coin used a keyword of either "mint" or "burn" (and nothing else) as its announcement. In this case, an attacker could burn the same liquidity twice by asserting the same coin announcement twice. This attack could be repeated until all funds were drained.

The [original liquidity TAIL with the vulnerability](https://github.com/Yakuhito/tibet/blob/ee9223e8fa91a3258ea972dd7401f5b59f69323e/clsp/liquidity_tail.clsp#L46C39-L46C39) is available in GitHub's history.

### How to avoid

Whenever you create a coin that uses a `CREATE_COIN_ANNOUNCEMENT` condition, remember that the condition can be asserted multiple times in the same block when the coin is being spent.

You can prevent this replay attack by including the ID of the coin being spent in the announcement, as can be found in the [patched version of the liquidity TAIL](https://github.com/Yakuhito/tibet/blob/b37c51f38dbdd5f4426ac4fa55c76fcef0f522d0/clsp/liquidity_tail.clsp#L55C22-L55C22) used in [TibetSwap v2](https://v2.tibetswap.io/). In this case, the `singleton_coin_id` is included with the `CREATE_COIN_ANNOUNCEMENT` condition, which prevents the announcement from being asserted multiple times. TibetSwap v2 has been running since May 2023 without incident.

For more information about the vulnerability, how it was discovered, and how it was patched, see the [postmortem](https://blog.kuhi.to/tibetswap-v1-post-mortem).

---

## Unprotected Solution

### Problem

Anyone is free to change the solution provided in the spend bundle in any way they want that still satisfies the puzzle.

### How to avoid

Ensure that all elements of the solution are either signed, or in some other way protected, so that only the desired spend is possible.

---

## Replace By Fee

### Feature description

"Replace by Fee" (RBF) is a technique that allows a new spend bundle to be added to the mempool that replaces an existing spend bundle. The rule is that all of the coins in the first spend bundle must exist in the replacement spend bundle, and that the fee attached to the new spend bundle must be greater than that in the original. In general, this is a very useful feature. For example, TibetSwap uses this feature to enable multiple swaps of a single pair in a single transaction block. 

### Problem

An attacker can "piggyback" some coin spends of their own on top of your spend bundle by resubmitting it with a greater fee. The solutions for the coins in the original spend bundle may be different in the replacement spend bundle, depending on how they were protected. And new coin spends can be introduced in the replacement spend bundle.

### How to avoid

As stated above, ensure that if an attacker attempts to modify the solution to your spend bundle, the transaction will fail.

---

## Flash Loans

### Description

Ephemeral coins are created and spent in the same block. Because these coins are immediately spent, there is no output value, which means that the input can be any arbitrary amount.

### Problem

Within a spend bundle, it is valid to create a coin of any XCH value, as long as the total XCH value of the unspent coins created in the spend bundle is less than or equal to the total XCH value of the spent coins. This is known as a "flash loan," and it leaves unprotected coins vulnerable to being attacked.

### How to avoid

Ensure that if an ephemeral coin is added to your spend bundle, such as with the aforementioned RBF spend, the coin(s) you are attempting to spend cannot be stolen or spent in a nefarious way. Always assume an attacker will attempt to modify your solution and/or add an ephemeral spend, and protect your coin spends accordingly.

---

## Puzzles containing `ASSERT_COIN_ANNOUNCEMENT`

### Problem

If an `ASSERT_COIN_ANNOUNCEMENT` condition is used in a coin's puzzle, the coin will be bricked (unable to be spent) if the coin being asserted has already been spent.

For example, say `coin A` uses this condition in its puzzle, and it asserts a coin announcement from `coin B`. In this case, `coin A` requires `coin B` to be spent in the same block as it is spent. If `coin B` is spent before `coin A`, then `coin A` can never be spent.

In addition, if `ASSERT_PUZZLE_ANNOUNCEMENT` is used in a coin's puzzle, a coin with the same puzzle must be spent in the same block. This assertion is less risky because it only relies on a coin with a specific puzzle, and many such coins might exist.

### How to avoid

Only use `ASSERT_COIN_ANNOUNCEMENT` and `ASSERT_PUZZLE_ANNOUNCEMENT` in a puzzle's solution, and not in the puzzle itself. If one of these conditions are used in the solution for `coin A`, and `coin B` has already been spent, then `coin A` can still be spent later, albeit with a different solution.

---

## Spend Bundle Splitting

### Problem

Spend bundles are not signed. So unless all of the coin spends in a spend bundle are linked together, the spend bundle can be split such that only part of the spend bundle is executed as submitted. The resulting smaller spend bundle can then be submitted, possibly with additional coin spends replacing the portion of the original spend bundle that was dropped.

Note that Replace By Fee cannot be used for spend bundle splitting. The spend bundle must be split before it gets to the mempool, or by a malicious node that splits it before gossiping it, or by a malicious farmer when farming the block that will include the spend bundle. A malicious node that splits a spend bundle before gossiping it will set up a race condition: each peer node will only accept one version of the spend bundle or the other, depending on which version it receives first.

### How to avoid

If your spend bundle would be vulnerable to being split in a malicious way, you can link all coin spends together with [announcements](https://docs.chia.net/conditions#assert-coin-announcement). This will ensure that the spend bundle must remain intact when spent.

---

## Signature Replay / Signature Subtraction

Replay attacks on signatures are possible, if a malicious farmer can find a way to isolate a useful signature. All the BLS signatures in a spend bundle are aggregated by arithmetically adding them together. Therefore, if a malicious farmer sees one aggregated signature that includes messages `A`, `B` and `C` signed with public keys `A'`, `B'` and `C'`, and then subsequently sees a spend bundle with an aggregated signature that includes messages `B` and `C`, with public keys `B'` and `C'`, then the farmer can subtract the latter aggregated signature from the former and derive the signature of message `A` with public key `A'`. The malicious farmer can then attempt to use that derived signature to initiate spends with a key they don't have.
