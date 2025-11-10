---
id: attacks-and-countermeasures
title: Attacks and Countermeasures
slug: /attacks-and-countermeasures
---

## Replay Attacks

Fundamentally, the concern with a replay attack on a Chia transaction is that you could use the same signature as a previous coin spend to spend a new coin that it wasn't intended for. For example, if the [standard transaction](/standard-transactions) were to use [`AGG_SIG_PUZZLE`](/conditions#agg-sig-puzzle) instead of [`AGG_SIG_ME`](/conditions#agg-sig-me), you would be able to use a signature to spend multiple coins with the same puzzle hash.

However, what a replay attack doesn't allow you to do is change the delegated puzzle. The signature is verified against a message (the tree hash of the delegated puzzle) concatenated with the coin info (i.e. a coin id or puzzle hash) and often the genesis challenge. So, if you used [`AGG_SIG_PUZZLE`](/conditions#agg-sig-puzzle), you'd be able to spend multiple coins with the same puzzle hash, but they would all have to output the same conditions.

If the conditions of a spend aren't met, it will be rejected by consensus. This means that you could use other means to prevent replay attacks than simply requiring a specific coin id. For example, if you were to have an [`AGG_SIG_PUZZLE`](/conditions#agg-sig-puzzle) but the conditions included a [`SEND_MESSAGE`](/conditions#66-send_message) being sent to a specific coin id, that other coin would have to be spent for this message to be received. And since messages are 1:1, there's no way to spend multiple coins with this signature even if they were included in the same block.

### Vault Spends

When you spend a vault, you're typically doing one of two things:

1. **Changing the custody configuration** (i.e. modifying the custody signers or recovery signers)
2. **Spending coins that are "owned by" the vault** (p2 coins)

When you change the custody configuration, the puzzle hash of the vault inherently changes. This means that the signature that was used to perform the rekey is no longer valid to spend the coin, since it committed to a specific puzzle hash.

When you spend other p2 coins (including fee coins or other XCH, [CATs](/cats), [NFTs](/nfts), etc) that are owned by the vault, the vault's delegated puzzle will include a [`SEND_MESSAGE`](/conditions#66-send_message) condition send to each coin id. Similarly to the [`AGG_SIG_PUZZLE`](/conditions#agg-sig-puzzle) example, this message's presence prevents it from being replayed since the message will only be valid for a single spend.

## Fast Forward

The reason to use [`AGG_SIG_PUZZLE`](/conditions#agg-sig-puzzle) or [`ASSERT_MY_PUZZLE_HASH`](/conditions#assert-my-puzzlehash) instead of [`AGG_SIG_ME`](/conditions#agg-sig-me) or [`ASSERT_MY_COIN_ID`](/conditions#assert-my-coin-id) in a vault spend is that you don't want to restrict a spend to a specific coin id.

The most common scenarios are:

- You have a transaction pending in the mempool already but want to make another
- You want to create multiple [offer files](/offers) that spend the vault to spend different p2 coins

There's a feature called **singleton fast forward** (used by [singletons](/singletons)), which allows the mempool to "rebase" transactions on top of each other if they spend the same coin. This is only possible if certain conditions are met, such as not relying on the coin id, not changing the puzzle hash or amount, etc.

So the idea is that you can assert the puzzle hash, but not the coin id, and instead use messages to specific coins to prevent replay attacks. This way multiple concurrent transactions can co-exist, including outstanding offer files, and they won't conflict in the mempool.

## Edge Case

Almost all vault transactions, including rekeys and p2 coin spends, are safe from replay attacks. However, there is one rare scenario where a replay attack is possible and steps in the wallet must be taken to prevent this from happening. Note that this type of transaction (rekeying without recovery) is not currently possible in Cloud Wallet, so this attack is not possible at this time, and can be mitigated properly when it is supported later.

### The Attack Scenario

If you start with custody config A, and complete a rekey to custody config B, you've changed the vault's puzzle hash. As described previously, the vault can't be spent using the old signature since the puzzle hash won't match. Additionally, if you included a fee spend, the message would also prevent this from happening.

However, if the vault is ever rekeyed back into custody config A (i.e. it now has the old puzzle hash again), and there was no p2 coin spend to pay for fees in the original transaction (thus no message was sent), then it's possible for an attacker to spend the vault using the old signature. This would give any unauthorized third party the ability to re-perform the same rekey into custody config B.

### Prevention Methods

The way to prevent this is to either:

1. **Require a p2 coin spend when performing a rekey** - This ensures a message is sent, preventing replay
2. **Increment the nonce when you go back to an old custody config** - This prevents the puzzle hash from reverting to its original state
3. **Include other invalidating conditions** - Such as [`ASSERT_BEFORE_SECONDS_ABSOLUTE`](/conditions#assert-before-seconds-absolute) (which would make the signature "expire" after some time has passed)
4. **Include an [`ASSERT_MY_COIN_ID`](/conditions#assert-my-coin-id) condition** - Using the current coin id, since rekeys aren't fast forwardable anyways (nor should they be)

Perhaps the cleanest approach is to simply include an [`ASSERT_MY_COIN_ID`](/conditions#assert-my-coin-id) condition using the current coin id, since rekeys aren't fast forwardable anyways (nor should they be).

