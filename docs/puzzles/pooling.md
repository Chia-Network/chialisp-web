---
id: pooling
title: Pooling
---

The way that Chia Network does pooling is unlike many blockchains that have come before it. Pool operators actually rely on an on-chain smart coin to verify that they will be able to directly claim any potential pool rewards that farmers create.
This allows pools to trust farmers enough to pay them out, while still keeping the power of making the blocks in the hands of the farmer.
This means that the decentralization of the network remains the same, even as the rewards get concentrated to the pool!

In this section, we're going to break down how all of this works in Chialisp.
This section assumes you have already read the section about [singletons](https://chialisp.com/docs/puzzles/singletons) (or at least understand how they work) as that is the outer puzzle that wraps the pooling puzzles.

## Design Requirements

There are a few requirements that were set for how the pooling protocol would work on the Chia Network. Let's go over them now:

* **The farmer farms the blocks, not the pool.** This is incredibly important for network decentralization. If this is not true, then the bigger a pool gets, the closer it is to gaining 51% of the network resources.
We still want the farmers to create the blocks, but we need some way to assure the pool that the farmer will give them the reward when they do.
We do this by creating plots that farm directly to a specific puzzle hash, and ensuring that puzzle hash is something that the pool can claim.
* **The farmer must be able to change pools.** Initially, this seems to conflict with the first requirement.
Plots can be made to send rewards directly to a puzzle hash, but you cannot change that puzzle hash once they are plotted.
If you want to switch pools, you'll have to remake all of your plots! We solve this by having our plots create payments that a specific singleton (also called a "plot nft") can claim.
Then, we can lend partial control of that singleton to a pool, but still retain the ability to reclaim our singleton and lend it instead to a different pool.
Our plots will remain effective as long as we retain control of the singleton.
* **The farmer cannot leave the pool immediately.** This requirement prevents attacks common to other blockchains where a miner will send partials to a pool until they win a block, then leave the pool immediately and claim that block for themselves.
To prevent this, we have implemented something called a **waiting room** puzzle which is nearly the same as the puzzle for farming to a pool, except that the farmer can reclaim their singleton after a specified amount of time (in blocks).

## The Pool Member

We call the standard puzzle that we use to lend away partial control of our singleton the **pool member** inner puzzle.
Our goal here is threefold:
* Allow the pool to claim [pay-to-singleton coins](https://chialisp.com/docs/puzzles/singletons#pay-to-singleton)
* Disallow the farmer from claiming any coins
* Allow the farmer to begin the process of reclaiming full control of the singleton

Let's take a look at the full source now:

```chialisp
(mod (
       POOL_PUZZLE_HASH
       P2_SINGLETON_PUZZLE_HASH
       OWNER_PUBKEY
       POOL_REWARD_PREFIX
       WAITINGROOM_PUZHASH
       Truths
       p1
       pool_reward_height
     )


  ; POOL_PUZZLE_HASH is commitment to the pool's puzzle hash
  ; P2_SINGLETON_PUZZLE_HASH is the puzzle hash for your pay to singleton puzzle
  ; OWNER_PUBKEY is the farmer pubkey which authorises a travel
  ; POOL_REWARD_PREFIX is network-specific data (mainnet vs testnet) that helps determine if a coin is a pool reward
  ; WAITINGROOM_PUZHASH is the puzzle_hash you'll go to when you iniate the leaving process

  ; Absorbing money if pool_reward_height is an atom
  ; Escaping if pool_reward_height is ()

  ; p1 is pool_reward_amount if absorbing money
  ; p1 is key_value_list if escaping

  ; pool_reward_amount is the value of the coin reward - this is passed in so that this puzzle will still work after halvenings
  ; pool_reward_height is the block height that the reward was generated at. This is used to calculate the coin ID.
  ; key_value_list is signed extra data that the wallet may want to publicly announce for syncing purposes

  (include condition_codes.clib)
  (include singleton_truths.clib)

  ; takes a lisp tree and returns the hash of it
  (defun sha256tree (TREE)
      (if (l TREE)
          (sha256 2 (sha256tree (f TREE)) (sha256tree (r TREE)))
          (sha256 1 TREE)
      )
  )

  (defun-inline calculate_pool_reward (pool_reward_height P2_SINGLETON_PUZZLE_HASH POOL_REWARD_PREFIX pool_reward_amount)
    (sha256 (logior POOL_REWARD_PREFIX (logand (- (lsh (q . 1) (q . 128)) (q . 1)) pool_reward_height)) P2_SINGLETON_PUZZLE_HASH pool_reward_amount)
  )

  (defun absorb_pool_reward (POOL_PUZZLE_HASH my_inner_puzzle_hash my_amount pool_reward_amount pool_reward_id)
    (list
        (list CREATE_COIN my_inner_puzzle_hash my_amount)
        (list CREATE_COIN POOL_PUZZLE_HASH pool_reward_amount)
        (list CREATE_PUZZLE_ANNOUNCEMENT pool_reward_id)
        (list ASSERT_COIN_ANNOUNCEMENT (sha256 pool_reward_id '$'))
    )
  )

  (defun-inline travel_to_waitingroom (OWNER_PUBKEY WAITINGROOM_PUZHASH my_amount extra_data)
    (list (list AGG_SIG_ME OWNER_PUBKEY (sha256tree extra_data))
          (list CREATE_COIN WAITINGROOM_PUZHASH my_amount)
    )
  )

  ; main

  (if pool_reward_height
    (absorb_pool_reward POOL_PUZZLE_HASH
                        (my_inner_puzzle_hash_truth Truths)
                        (my_amount_truth Truths)
                        p1
                        (calculate_pool_reward pool_reward_height P2_SINGLETON_PUZZLE_HASH POOL_REWARD_PREFIX p1)
    )
    (travel_to_waitingroom OWNER_PUBKEY WAITINGROOM_PUZHASH (my_amount_truth Truths) p1)
  )
)
```

As always, let's begin with the arguments:

`POOL_PUZZLE_HASH` is the address to which we want to pay the pool when we win a block reward.
The pool uses this to verify that the singleton has been lent to them.

`P2_SINGLETON_PUZZLE_HASH` is the puzzle hash that payments to this singleton will have.
This is the hash that farmers make their plots to.

`OWNER_PUBKEY` is the public key that will sign the decision to leave the pool.
This is likely owned by the farmer.

`POOL_REWARD_PREFIX` is a bit of a unique argument.
On the chia mainnet, this will always be `ccd5bb71183532bff220ba46c268991a00000000000000000000000000000000`.
It is the beginning of the `parent_coin_id` of pool reward coins. Because those coins do not have a parent, their ID is derived from a combination of the network ID in the left half of the ID, and an incrementing identifier in the right.
That first half is followed by 32 zeroes to make it the length of a standard hash.
We'll talk more about why this is needed when we go over the segment of code that uses it.

`WAITINGROOM_PUZHASH` is the puzzle hash of the waiting room puzzle that we will go to when we attempt to leave the pool.
We will go over that puzzle later, but what's important to know is that we commit to the puzzle we leave to before we join the pool.
This is so the pool can have certain assurances about how long it will take you to leave.

`Truths` is the data structure that is forcefully added to this puzzle as part of the singleton top layer.
It contains some data we will use in the puzzle which we will access by using some functions from the `singleton_truths.clib` library.

There are two spend cases for this puzzle.
The **absorb case** will most likely be triggered by the pool and is how they claim the rewards that the farmers receive.
The **escape case** will be initiated by the farmer to begin the process of leaving the pool by heading to the waiting room.
The following two arguments change depending on the case we are executing:

`p1` is named the way it is because it is going to be different depending on the spend type we are using.
It is either:
 * The amount of the pool reward that is being claimed (1750000000000 during the first three years)
 * A list of key value pairs that is used to reveal important information to the blockchain for wallets to use (similar to the [singleton launcher](https://chialisp.com/docs/puzzles/singletons#the-launcher))

`pool_reward_height` is also different depending on the spend case, but in the escape case it is just `()` so we leave it named the way it is.
In the absorb case, it is the height of the pool reward that is being absorbed.
This is used along with `POOL_REWARD_PREFIX` to calculate the `parent_coin_id` of the reward coin so that we can calculate its ID.

Let's talk about our main entry point:

```chialisp
(if pool_reward_height
  (absorb_pool_reward POOL_PUZZLE_HASH
                      (my_inner_puzzle_hash_truth Truths)
                      (my_amount_truth Truths)
                      p1
                      (calculate_pool_reward pool_reward_height P2_SINGLETON_PUZZLE_HASH POOL_REWARD_PREFIX p1)
  )
  (travel_to_waitingroom OWNER_PUBKEY WAITINGROOM_PUZHASH (my_amount_truth Truths) p1)
)
```

The main control flow here is whether or not the height is passed in as `()`. This is how we determine the spend type to execute. After that we just head to the appropriate function that generates the conditions we will need for the type of spend we are executing. You'll notice that we are extracting the relevant data from the `Truths` object before we pass them to the inner functions.

We are also calculating one additional piece of information.
Let's look at it now:

```chialisp
(defun-inline calculate_pool_reward (pool_reward_height P2_SINGLETON_PUZZLE_HASH POOL_REWARD_PREFIX pool_reward_amount)
  (sha256 (logior POOL_REWARD_PREFIX (logand (- (lsh (q . 1) (q . 128)) (q . 1)) pool_reward_height)) P2_SINGLETON_PUZZLE_HASH pool_reward_amount)
)
```

This line may look complex, but it's doing something fairly simplistic.
It is calculating the coin ID of the reward coin it is claiming by manually calculating the parent id from the `POOL_REWARD_PREFIX` and `pool_reward_height`.

Why do we have to do this? The manual calculation is due to the fact that this singleton may have other payments made to it.
Right now, since we are lending our singleton to the pool, we don't want the singleton to be able to claim those rewards. We specifically only want the pool to be able to claim pool rewards that are generated from farming.
Since we know these rewards have a `parent_coin_id` that is a [special format](https://chialisp.com/docs/coin_lifecycle#farming-rewards), we can manually calculate it to ensure that the pool can't lie to us and pass in the ID of a non-reward coin.

Let's take a look at this section here:

```chialisp
(logior POOL_REWARD_PREFIX (logand (- (lsh (q . 1) (q . 128)) (q . 1)) pool_reward_height))
```

`(- (lsh (q . 1) (q . 128)) (q . 1))` is simply a way of generating a sequence of 32 `f`s. We then use `logand` on that with the pool reward height, which in an honest scenario should leave it unchanged.
Finally, we use `logior` to combine the two values into one string.
Let's say we have a height of `abcdef`.
Our final product will be `ccd5bb71183532bff220ba46c268991a00000000000000000000000000abcdef`.

Why do we need this extra `logand` with the string of `f`s?  It's to prevent a relatively obscure, but possible attack.
Remember that an attacker can pass whatever they want in through the solution.
For example, a 32 byte hex string.
If they passed through the right hex string, they could completely control the output of our calculation *except* for the bits that happen to be set to 1 in the genesis challenge half of the `POOL_REWARD_PREFIX` (62/128 of them).
The idea is that a pool could grind out a coin whose parent ID has all of those bits set, create the coin, and then use the singleton to claim it.
Why claim a coin that you already had control of? This will become more apparent in the waiting room puzzle, but they could hypothetically "freeze" the singleton in their pool if they were able to reset the puzzle.
It's not as important in the pool member puzzle, but it is still probably best to prevent the pool from spending the singleton in an unintended way.
The `logand` ensures that only bits on the right can change, every bit on left gets set to 0 before it is evaluated with the `logior`.

Okay let's move onto the conditions for the absorb spend case:

```chialisp
(defun absorb_pool_reward (POOL_PUZZLE_HASH my_inner_puzzle_hash my_amount pool_reward_amount pool_reward_id)
  (list
      (list CREATE_COIN my_inner_puzzle_hash my_amount)
      (list CREATE_COIN POOL_PUZZLE_HASH pool_reward_amount)
      (list CREATE_PUZZLE_ANNOUNCEMENT pool_reward_id)
      (list ASSERT_COIN_ANNOUNCEMENT (sha256 pool_reward_id '$'))
  )
)
```

The first `CREATE_COIN` condition ensures that our singleton is recreated exactly as it is. Remember that we get `my_inner_puzzle_hash` and `my_amount` from our singleton outer puzzle, so we don't need to assert them.

The next `CREATE_COIN` condition creates the coin that uses the excess value from spending the pay-to-singleton coin to pay the pool.
Keep in mind that this puzzle hash is curried into the puzzle and cannot change.
This is because there is no signature required from the pool to spend the coin.
If we didn't pre-commit to the puzzle hash, anyone could solve with their own puzzle hash and spend the rewards to themselves.

The announcement conditions are the other side of the [pay-to-singleton announcements](https://chialisp.com/docs/puzzles/singletons#pay-to-singleton). The announcement creation allows the pay-to-singleton to assert that it has received the instruction to pay out.
The announcement assertion ensures that the pay-to-singleton is actually spent (otherwise we run into the singleton "freezing" problem from above again).

Finally, let's look at the escape conditions:

```chialisp
(defun-inline travel_to_waitingroom (OWNER_PUBKEY WAITINGROOM_PUZHASH my_amount extra_data)
  (list (list AGG_SIG_ME OWNER_PUBKEY (sha256tree extra_data))
        (list CREATE_COIN WAITINGROOM_PUZHASH my_amount)
  )
)
```

Simple enough. We first require a signature on the key/value list that is being passed in through the solution to secure it and to signal that this spend is indeed triggered by the owner of the singleton. The only other thing we do is send ourselves to the waiting room.

Let's talk about that puzzle now.

## The Waiting Room

Before we start talking about this puzzle, let's examine the full source as usual:

```chialisp
(mod (
        POOL_PUZZLE_HASH
        P2_SINGLETON_PUZZLE_HASH
        OWNER_PUBKEY
        POOL_REWARD_PREFIX
        RELATIVE_LOCK_HEIGHT
        Truths
        spend_type
        p1
        p2
      )

  ; POOL_PUZZLE_HASH is commitment to the pool's puzzle hash
  ; P2_SINGLETON_PUZZLE_HASH is the puzzlehash for your pay_to_singleton puzzle
  ; OWNER_PUBKEY is the farmer pubkey which signs the exit puzzle_hash
  ; POOL_REWARD_PREFIX is network-specific data (mainnet vs testnet) that helps determine if a coin is a pool reward
  ; RELATIVE_LOCK_HEIGHT is how long it takes to leave

  ; spend_type is: 0 for absorbing money, 1 to escape
  ; if spend_type is 0
    ; p1 is pool_reward_amount - the value of the coin reward - this is passed in so that this puzzle will still work after halvenings
    ; p2 is pool_reward_height - the block height that the reward was generated at. This is used to calculate the coin ID.
  ; if spend_type is 1
    ; p1 is key_value_list - signed extra data that the wallet may want to publicly announce for syncing purposes
    ; p2 is destination_puzhash - the location that the escape spend wants to create itself to

  (include condition_codes.clvm)
  (include singleton_truths.clib)

  ; takes a lisp tree and returns the hash of it
  (defun sha256tree (TREE)
      (if (l TREE)
          (sha256 2 (sha256tree (f TREE)) (sha256tree (r TREE)))
          (sha256 1 TREE)
      )
  )

  (defun-inline calculate_pool_reward (pool_reward_height P2_SINGLETON_PUZZLE_HASH POOL_REWARD_PREFIX pool_reward_amount)
    (sha256 (logior POOL_REWARD_PREFIX (logand (- (lsh (q . 1) (q . 128)) (q . 1)) pool_reward_height)) P2_SINGLETON_PUZZLE_HASH pool_reward_amount)
  )

  (defun absorb_pool_reward (POOL_PUZZLE_HASH my_inner_puzzle_hash my_amount pool_reward_amount pool_reward_id)
    (list
        (list CREATE_COIN my_inner_puzzle_hash my_amount)
        (list CREATE_COIN POOL_PUZZLE_HASH pool_reward_amount)
        (list CREATE_PUZZLE_ANNOUNCEMENT pool_reward_id)
        (list ASSERT_COIN_ANNOUNCEMENT (sha256 pool_reward_id '$'))
    )
  )

  (defun-inline travel_spend (RELATIVE_LOCK_HEIGHT new_puzzle_hash my_amount extra_data)
    (list (list ASSERT_HEIGHT_RELATIVE RELATIVE_LOCK_HEIGHT)
          (list CREATE_COIN new_puzzle_hash my_amount)
          (list AGG_SIG_ME OWNER_PUBKEY (sha256tree (list new_puzzle_hash extra_data)))
    )
  )

  ; main

  (if spend_type
    (travel_spend RELATIVE_LOCK_HEIGHT p2 (my_amount_truth Truths) p1)
    (absorb_pool_reward POOL_PUZZLE_HASH
                        (my_inner_puzzle_hash_truth Truths)
                        (my_amount_truth Truths)
                        p1
                        (calculate_pool_reward p2 P2_SINGLETON_PUZZLE_HASH POOL_REWARD_PREFIX p1)
    )
  )
)
```

You may notice that is looks nearly identical to the one above.
Instead of breaking this down piece by piece, we're just going to focus on the differences.
First, the parameters:

```chialisp
(
  POOL_PUZZLE_HASH
  P2_SINGLETON_PUZZLE_HASH
  OWNER_PUBKEY
  POOL_REWARD_PREFIX
  RELATIVE_LOCK_HEIGHT
  Truths
  spend_type
  p1
  p2
)
```

We still have `POOL_PUZZLE_HASH`, `P2_SINGLETON_PUZZLE_HASH`, `OWNER_PUBKEY`, and `POOL_REWARD_PREFIX`.
However, now we also have a new curried in parameter called `RELATIVE_LOCK_HEIGHT`. This indicates the amount of time after entering this waiting room that we have to wait before we can spend away to something else.

Note that relative lock heights are calculated from the time of the coin's creation.
If the coin is spent as part of an absorb, this lock height resets.
Theoretically, with a large enough lock height and a big enough farmer who wins frequently, this singleton can be "frozen" until the farmer is lucky enough not to win a block within the specified timeframe.

We still have `Truths`, since this is still a singleton inner puzzle.
However, the final three arguments are almost completely different.

`spend_type` is now necessary because we can no longer choose which spend case we are executing based on the last argument.

`p1` is different based on the spend type:
* If we're doing the absorb spend, it's the amount of the pool reward coin.
* If we're traveling to a new puzzle, it's the key/value list that we use to record data in the blockchain.

`p2` is also different based on the spend type:
* If we're doing the absorb spend, it's the height at which the pool reward coin was created.
* If we're traveling to a new puzzle, it's the puzzle hash of that puzzle

After the argument differences, the only other major change is in the travel function:

```chialisp
(defun-inline travel_spend (RELATIVE_LOCK_HEIGHT new_puzzle_hash my_amount extra_data)
  (list (list ASSERT_HEIGHT_RELATIVE RELATIVE_LOCK_HEIGHT)
        (list CREATE_COIN new_puzzle_hash my_amount)
        (list AGG_SIG_ME OWNER_PUBKEY (sha256tree (list new_puzzle_hash extra_data)))
  )
)
```

First, we assert that the required amount of time has passed (this is for the pool's safety).
Then, we create the new specified coin.
Note that we don't get to choose the amount and, therefore, must escape to a new singleton.

Finally, we sign the extra data, just like before, but this time we include the `destination_puzhash` so that someone malicious cannot steal our singleton by substituting in a value.

Those are the only changes!

It may seem pretty irregular to have these as separate but similar puzzles.
There's a lot of code duplication which is usually bad practice.
It's very possible that there is a way to combine these two puzzles into a single puzzle, but the cost would increase dramatically.
At the end of the day, it's better to have duplicated code than to bog down the blockchain with needlessly expensive transactions.

Interestingly enough, we actually want to be in the waiting room state with a lock height of zero when we are pooling by ourselves.
The reasoning is that since we are "lending" the singleton to ourselves, we don't really need the insurance that we leave early, which is the entire point of the waiting room.
This cuts down on unnecessary spends, and saves us even more cost in the long run.