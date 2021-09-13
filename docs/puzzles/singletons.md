---
id: singletons
title: Singletons
---

One of the most important puzzles in the Chia ecosystem is the **singleton**.
This is a puzzle that assures anyone who looks at can see that it has a unique ID that no other coin has.
Parties can decide to accept messages or commitments from that unique ID with the assurance that the party who controls the singleton is not double dipping or impersonating someone else.

This puzzle is an [outer puzzle](/docs/common_functions) and is used to wrap pooling puzzles, NFTs, and decentralized identities.
Any inner puzzle can be wrapped with this puzzle if it has necessity for uniqueness.

## Design choices

A few design choices were made in the creation of this puzzle so let's go over them now:

* **Singletons are always odd.**  In order to assure that a singleton does not duplicate itself, it needs some way to verify that its children do not consist of more than one new singleton.
It does this by verifying that only one of its children is odd.
It is either a new singleton, or it is the **melt value** and will be ignored (more on that later).
Odd was chosen over even because you may want to have singletons create other, non-singleton coins at times (like 0 amount messages for the DID) and having the singleton be odd just makes this easier.
Coins can be multiples of 10 so you can send a full XCH rather than an XCH and a mojo.
No matter how many even amounts you subtract from an odd amount, the end result will always be odd.
* **Singletons always wrap their odd child.** This abstracts some of the singleton functionality away from the inner puzzles.
If an inner puzzle creates an odd coin, it doesn't have to worry about making it a singleton, the [outer puzzle will take care of that](https://chialisp.com/docs/common_functions/#outer-and-inner-puzzles).
It also prevents an inner puzzle from accidentally melting the singleton by forgetting to wrap its odd output.
* **A specific magic melt value determines whether the singleton wraps its child.** If you would like to destroy a singleton and use its amount to create a new non-singleton coin, you need to output a `CREATE_COIN` condition that uses the amount `-113`.
When the singleton outer puzzle sees that condition, it filters it out.
This amount was arbitrarily chosen and is negative because a coin with negative amount cannot exist. Therefore, it is an unlikely accidental output of an inner puzzle.
This is chosen to prevent an inner puzzle from accidentally melting a singleton by forgetting to create an odd output.
It must deliberately specify to melt the singleton.
Keep in mind that the melt value *does* count as the odd output, but is ignored, creating the need to burn one mojo of coin value in order to melt (all of the outputs must be even).
Usually there will be a transaction fee anyways so it likely just becomes part of that.
You should also be wary of the amount of control you give to people who you partially lend your singleton to.
If they can freely create conditions, it may be possible for them to melt your singleton against your wishes.

## The Launcher

We need to ensure that only one singleton is created with the same ID.
This is surprisingly difficult.
The crux of the issue is that we have no control over the coin that creates the singleton.
We could rely on a curried in id, but it's easy enough for someone to create the exact same singleton by currying in the same id.
Instead, we could use the parent coin ID which would be unique to all of its descendants, however, you could still create multiple singletons in that first spend.

This is technically detectable by crawling up the chain and checking the first non-singleton coin to see if it had multiple singleton children, but this is inefficient and we would like all of our logic to be contained to the puzzles.

Instead, what we can use is a **launcher** which is a specific puzzle that does exactly one thing: create a single singleton.
We then need to curry this launcher puzzle hash into our singleton and have the first singleton assert that it, in fact, came from a parent whose puzzle hash was the launcher puzzle hash.
Then, when people look at our singleton, they can see that the launcher puzzle hash is the hash of what they know to be a puzzle that creates only one singleton.
They don't need to go back to the original parent and verify because the singleton puzzle takes care of that right from the start!

So what does the launcher look like?  Here's the source:

```chialisp
(mod (singleton_full_puzzle_hash amount key_value_list)

  (include condition_codes.clvm)

  (defun sha256tree (TREE)
      (if (l TREE)
          (sha256 2 (sha256tree (f TREE)) (sha256tree (r TREE)))
          (sha256 1 TREE)
      )
  )

  ; main
  (list (list CREATE_COIN singleton_full_puzzle_hash amount)
        (list CREATE_COIN_ANNOUNCEMENT (sha256tree (list singleton_full_puzzle_hash amount key_value_list))))
)
```

Essentially two lines, so not too bad right?  One of the first things you may notice is that we don't curry anything in.
We actually cannot curry anything in because we want this puzzle hash to be constant among all singletons.
That way, even if someone isn't familiar with us, they know that if we came from this specific launcher puzzle hash, we can be trusted to be a unique singleton.

For the most part, you simply put in `CREATE_COIN` parameters and the puzzle creates the singleton for you.
The tricky part is the announcement creation.
Since these parameters are not curried in, we somehow need them to be immune from the manipulations of malicious full nodes.
We cannot curry in a pubkey to sign them, or else our puzzle hash is no longer static. Our solution to this conundrum is to create an announcement from this puzzle that its parent asserts in the same block.
Usually, the parent is going to be a standard coin. In the standard coin, we sign the puzzle that makes the conditions.
If we create an `ASSERT_COIN_ANNOUNCEMENT` condition, we implicitly sign that too. That means we can implicitly sign all of the launcher solution values through asserting this announcement.
If any of those values are changed, the coin that creates the launcher will fail and thus the launcher will never be created!

The last thing to note is the seemingly useless `key_value_list` that is passed in as an argument and announced.
The purpose for this is to communicate information to blockchain observers.
Sometimes you want to be able to know information about a puzzle before it is revealed.
The only way we can get this information on chain is from the parent's puzzle reveal so sometimes it is useful to have useless parameters be part of the solution in order to make it easier to follow the puzzle's on chain state.
Remember that you pay cost for every byte though so keep it concise.

## The Singleton Top Layer

Here's the full source, we'll break it down after:

```chialisp
(mod (
       SINGLETON_STRUCT
       INNER_PUZZLE
       lineage_proof
       my_amount
       inner_solution
     )

     ;; SINGLETON_STRUCT = (MOD_HASH . (LAUNCHER_ID . LAUNCHER_PUZZLE_HASH))

     ; SINGLETON_STRUCT, INNER_PUZZLE are curried in by the wallet

  ; This puzzle is a wrapper around an inner smart puzzle which guarantees uniqueness.
  ; It takes its singleton identity from a coin with a launcher puzzle which guarantees that it is unique.

  (include condition_codes.clib)
  (include curry-and-treehash.clib)
  (include singleton_truths.clib)

  ; takes a lisp tree and returns the hash of it
  (defun sha256tree (TREE)
      (if (l TREE)
          (sha256 2 (sha256tree (f TREE)) (sha256tree (r TREE)))
          (sha256 1 TREE)
      )
  )

  ; "assert" is a macro that wraps repeated instances of "if"
  ; usage: (assert A0 A1 ... An R)
  ; all of A0, A1, ... An must evaluate to non-null, or an exception is raised
  ; return the value of R (if we get that far)

  (defmacro assert items
    (if (r items)
        (list if (f items) (c assert (r items)) (q . (x)))
        (f items)
    )
  )

  (defun-inline mod_hash_for_singleton_struct (SINGLETON_STRUCT) (f SINGLETON_STRUCT))
  (defun-inline launcher_id_for_singleton_struct (SINGLETON_STRUCT) (f (r SINGLETON_STRUCT)))
  (defun-inline launcher_puzzle_hash_for_singleton_struct (SINGLETON_STRUCT) (r (r SINGLETON_STRUCT)))

  ;; return the full puzzlehash for a singleton with the innerpuzzle curried in
  ; puzzle-hash-of-curried-function is imported from curry-and-treehash.clinc
  (defun-inline calculate_full_puzzle_hash (SINGLETON_STRUCT inner_puzzle_hash)
     (puzzle-hash-of-curried-function (mod_hash_for_singleton_struct SINGLETON_STRUCT)
                                      inner_puzzle_hash
                                      (sha256tree SINGLETON_STRUCT)
     )
  )

  ; assembles information from the solution to create our own full ID including asserting our parent is a singleton
  (defun create_my_ID (SINGLETON_STRUCT full_puzzle_hash parent_parent parent_inner_puzzle_hash parent_amount my_amount)
    (sha256 (sha256 parent_parent (calculate_full_puzzle_hash SINGLETON_STRUCT parent_inner_puzzle_hash) parent_amount)
            full_puzzle_hash
            my_amount)
  )

  ;; take a boolean and a non-empty list of conditions
  ;; strip off the first condition if a boolean is set
  ;; this is used to remove `(CREATE_COIN xxx -113)`
  ;; pretty sneaky, eh?
  (defun strip_first_condition_if (boolean condition_list)
    (if boolean
      (r condition_list)
      condition_list
    )
  )

  (defun-inline morph_condition (condition SINGLETON_STRUCT)
    (list (f condition) (calculate_full_puzzle_hash SINGLETON_STRUCT (f (r condition))) (f (r (r condition))))
  )

  ;; return the value of the coin created if this is a `CREATE_COIN` condition, or 0 otherwise
  (defun-inline created_coin_value_or_0 (condition)
    (if (= (f condition) CREATE_COIN)
        (f (r (r condition)))
        0
    )
  )

  ;; Returns a (bool . bool)
  (defun odd_cons_m113 (output_amount)
    (c
      (= (logand output_amount 1) 1) ;; is it odd?
      (= output_amount -113) ;; is it the escape value?
    )
  )

  ; Assert exactly one output with odd value exists - ignore it if value is -113

  ;; this function iterates over the output conditions from the inner puzzle & solution
  ;; and both checks that exactly one unique singleton child is created (with odd valued output),
  ;; and wraps the inner puzzle with this same singleton wrapper puzzle
  ;;
  ;; The special case where the output value is -113 means a child singleton is intentionally
  ;; *NOT* being created, thus forever ending this singleton's existence

  (defun check_and_morph_conditions_for_singleton (SINGLETON_STRUCT conditions has_odd_output_been_found)
      (if conditions
        (morph_next_condition SINGLETON_STRUCT conditions has_odd_output_been_found (odd_cons_m113 (created_coin_value_or_0 (f conditions))))
        (if has_odd_output_been_found
            0
            (x)  ;; no odd output found
        )
      )
   )

   ;; a continuation of `check_and_morph_conditions_for_singleton` with booleans `is_output_odd` and `is_output_m113`
   ;; precalculated
   (defun morph_next_condition (SINGLETON_STRUCT conditions has_odd_output_been_found (is_output_odd . is_output_m113))
       (assert
          (not (all is_output_odd has_odd_output_been_found))
          (strip_first_condition_if
             is_output_m113
             (c (if is_output_odd
                    (morph_condition (f conditions) SINGLETON_STRUCT)
                    (f conditions)
                )
                (check_and_morph_conditions_for_singleton SINGLETON_STRUCT (r conditions) (any is_output_odd has_odd_output_been_found))
             )
          )
      )
   )

  ; this final stager asserts our ID
  ; it also runs the innerpuz with the innersolution with the "truths" added
  ; it then passes that output conditions from the innerpuz to the morph conditions function
  (defun stager_three (SINGLETON_STRUCT lineage_proof my_id full_puzhash innerpuzhash my_amount INNER_PUZZLE inner_solution)
    (c (list ASSERT_MY_COIN_ID my_id) (check_and_morph_conditions_for_singleton SINGLETON_STRUCT (a INNER_PUZZLE (c (truth_data_to_truth_struct my_id full_puzhash innerpuzhash my_amount lineage_proof SINGLETON_STRUCT) inner_solution)) 0))
  )

  ; this checks whether we are an eve spend or not and calculates our full coin ID appropriately and passes it on to the final stager
  ; if we are the eve spend it also adds the additional checks that our parent's puzzle is the standard launcher format and that out parent ID is the same as our singleton ID

  (defun stager_two (SINGLETON_STRUCT lineage_proof full_puzhash innerpuzhash my_amount INNER_PUZZLE inner_solution)
    (stager_three
      SINGLETON_STRUCT
      lineage_proof
      (if (is_not_eve_proof lineage_proof)
          (create_my_ID
            SINGLETON_STRUCT
            full_puzhash
            (parent_info_for_lineage_proof lineage_proof)
            (puzzle_hash_for_lineage_proof lineage_proof)
            (amount_for_lineage_proof lineage_proof)
            my_amount
          )
          (if (=
                (launcher_id_for_singleton_struct SINGLETON_STRUCT)
                (sha256 (parent_info_for_eve_proof lineage_proof) (launcher_puzzle_hash_for_singleton_struct SINGLETON_STRUCT) (amount_for_eve_proof lineage_proof))
              )
              (sha256 (launcher_id_for_singleton_struct SINGLETON_STRUCT) full_puzhash my_amount)
              (x)
          )
      )
      full_puzhash
      innerpuzhash
      my_amount
      INNER_PUZZLE
      inner_solution
    )
  )

  ; this calculates our current full puzzle hash and passes it to stager two
  (defun stager_one (SINGLETON_STRUCT lineage_proof my_innerpuzhash my_amount INNER_PUZZLE inner_solution)
    (stager_two SINGLETON_STRUCT lineage_proof (calculate_full_puzzle_hash SINGLETON_STRUCT my_innerpuzhash) my_innerpuzhash my_amount INNER_PUZZLE inner_solution)
  )


  ; main

  ; if our value is not an odd amount then we are invalid
  ; this calculates my_innerpuzhash and passes all values to stager_one
  (if (logand my_amount 1)
    (stager_one SINGLETON_STRUCT lineage_proof (sha256tree INNER_PUZZLE) my_amount INNER_PUZZLE inner_solution)
    (x)
  )
)
```

Quite a bit isn't it?  Let's start with the arguments:

```chialisp
(
  SINGLETON_STRUCT
  INNER_PUZZLE
  lineage_proof
  my_amount
  inner_solution
)
```

`SINGLETON_STRUCT` is a collection of three things:
* The tree hash of this module
* The launcher coin ID (this acts as the unique ID for the singleton)
* The launcher puzzle hash

The reason they are grouped into a single structure is because they are passed through almost every function. It increases readability and optimization if they are passed through as a single variable until it is time to deconstruct them.

`INNER_PUZZLE` is the inner puzzle to this wrapper puzzle.

`lineage_proof` takes one of two formats:
* `(parent_parent_coin_info parent_inner_puzzle_hash parent_amount)`
* `(parent_parent_coin_info parent_amount)`
You may wonder, given the similarity, why not just use the first format?  We use the separate formats because we use the length of the structure to tip us off to whether or not this is the **eve spend**.
The eve spend is the first spend of a singleton after its creation.
We use this lineage proof to verify that our parent was a singleton.
However, in the first spend, the parent is not a singleton and we actually execute a different path where we verify that our parent was a singleton launcher instead.

`my_amount` is the amount of the coin being spent and will be asserted implicitly through ASSERT_MY_COIN_ID.

`inner_solution` is the solution the to inner puzzle.

Next, let's look at our main entry point:

```chialisp
(if (logand my_amount 1)
  (stager_one SINGLETON_STRUCT lineage_proof (sha256tree INNER_PUZZLE) my_amount INNER_PUZZLE inner_solution)
  (x)
)
```

The control flow here is very simple.
If we're not odd, we raise, if we are, we pass everything through to the next stage (with the additional hash of the inner puzzle).
One small thing to note is that a singleton can actually be even, but it will never be able to be spent.
Either the person will pass in the true amount and the puzzle will raise, or they will pass in a phony amount and the ASSERT_MY_ID will fail. If an attacker were to launch an even singleton or create one as one the even children of the singleton, it would succeed, but be stuck forever.

```chialisp
(defun stager_one (SINGLETON_STRUCT lineage_proof my_innerpuzhash my_amount INNER_PUZZLE inner_solution)
  (stager_two SINGLETON_STRUCT lineage_proof (calculate_full_puzzle_hash SINGLETON_STRUCT my_innerpuzhash) my_innerpuzhash my_amount INNER_PUZZLE inner_solution)
)
```

We now move on to the first of a few "stagers". The purpose of these functions is to calculate values that are used multiple times only once.
In the next stage we use our full puzzle hash three times so it's best to calculate it once and pass it to the next function instead.

```chialisp
(defun stager_two (SINGLETON_STRUCT lineage_proof full_puzhash innerpuzhash my_amount INNER_PUZZLE inner_solution)
  (stager_three
    SINGLETON_STRUCT
    lineage_proof
    (if (is_not_eve_proof lineage_proof)
        (create_my_ID
          SINGLETON_STRUCT
          full_puzhash
          (parent_info_for_lineage_proof lineage_proof)
          (puzzle_hash_for_lineage_proof lineage_proof)
          (amount_for_lineage_proof lineage_proof)
          my_amount
        )
        (if (=
              (launcher_id_for_singleton_struct SINGLETON_STRUCT)
              (sha256 (parent_info_for_eve_proof lineage_proof) (launcher_puzzle_hash_for_singleton_struct SINGLETON_STRUCT) (amount_for_eve_proof lineage_proof))
            )
            (sha256 (launcher_id_for_singleton_struct SINGLETON_STRUCT) full_puzhash my_amount)
            (x)
        )
    )
    full_puzhash
    innerpuzhash
    my_amount
    INNER_PUZZLE
    inner_solution
  )
)
```

This stage looks like a lot, but really all it's doing is calculating the current coin ID for the next function to use.
Note before we start looking at it that the lineage proof is frequently being passed to functions that are not part of this file.
These are part of the `singleton_truths.clib` library which we will discuss in the next stage.
For now, just know that it is accessing the correct values from the lineage proof and is a lot cleaner than writing things like `(f (r lineage_proof)) (f (r (r lineage_proof)))` with no indication of what they mean.

The first if statement checks if `lineage_proof` indicates that this is not the eve spend (three proof elements instead of two).
If it is not the eve spend, it calculates our ID using the information in the `lineage_proof` to generate our parent ID.

If it *is* the eve spend, there is an extra check which verifies that the launcher ID and launcher puzzle hash we have (both inside the `SINGLETON_STRUCT`) are correct. We do so by calculating the launcher ID from information in our lineage proof and the launcher puzzle hash.
We then assert that it is equal to the curried in value.
This is an extremely important step because it ensures that every singleton after this singleton can trust the launcher ID and puzzle hash since it will be forcefully curried in from this "eve" singleton and every child singleton knows that the eve singleton checked it.

After the eve singleton has verified the launcher info, it can now trust the launcher ID as its parent ID and create its own ID by hashing in the `full_puzhash` from the last stage and `my_amount`.
Let's talk about the final "stager":

```chialisp
(defun stager_three (SINGLETON_STRUCT lineage_proof my_id full_puzhash innerpuzhash my_amount INNER_PUZZLE inner_solution)
  (c (list ASSERT_MY_COIN_ID my_id) (check_and_morph_conditions_for_singleton SINGLETON_STRUCT (a INNER_PUZZLE (c (truth_data_to_truth_struct my_id full_puzhash innerpuzhash my_amount lineage_proof SINGLETON_STRUCT) inner_solution)) 0))
)
```

This stage is where the conditions will end up coming out of.
First, it prepends an `ASSERT_MY_COIN_ID` so that all of the solution values we have been assuming to be true up until this point are implicitly asserted by the network.
We prepend this condition to the output of `check_and_morph_conditions_for_singleton` which will take the output from the inner puzzle and check for singleton specific things (only one odd output, wrap the child singleton, etc.)

Notice that we are prepending something to the solution before we use it to solve the inner puzzle.
We are using a function from `singleton_truths.clib` that takes all of the listed information and combines it into a single structure to pass to the inner puzzle.
This allows the inner puzzle to use information that the singleton has already calculated and verified in its own puzzle at almost no additional cost!

Keep in mind that this means an inner puzzle needs to know that it is going inside a singleton or else all of its solution arguments will be shifted to the right.
An existing inner puzzle can be very easily adapted, however, to fit inside a singleton using a shallow outer layer of: `(a (q . INNER_PUZZLE) (r 1))` which strips off the first value of the solution before solving the inner puzzle.

```chialisp
(defun check_and_morph_conditions_for_singleton (SINGLETON_STRUCT conditions has_odd_output_been_found)
  (if conditions
    (morph_next_condition SINGLETON_STRUCT conditions has_odd_output_been_found (odd_cons_m113 (created_coin_value_or_0 (f conditions))))
    (if has_odd_output_been_found
        0
        (x)  ;; no odd output found
    )
  )
)

(defun morph_next_condition (SINGLETON_STRUCT conditions has_odd_output_been_found (is_output_odd . is_output_m113))
   (assert
      (not (all is_output_odd has_odd_output_been_found))
      (strip_first_condition_if
         is_output_m113
         (c (if is_output_odd
                (morph_condition (f conditions) SINGLETON_STRUCT)
                (f conditions)
            )
            (check_and_morph_conditions_for_singleton SINGLETON_STRUCT (r conditions) (any is_output_odd has_odd_output_been_found))
         )
      )
  )
)
```

This section is a bit unique in that it recurses by handing values back and forth to each other.
Our main entry point is through the first block: `check_and_morph_conditions_for_singleton` which checks first if we still have conditions.
If we don't, we check to see if the `has_odd_output_been_found` flag has been set and raise if it hasn't been.

If we do have remaining conditions, we pass them to the next function along with the results of checking the first condition to see if it is a `CREATE_COIN` whose output is odd or the melt value.

In `morph_next_condition` we first assert that we have not found a second odd output.
If we have, we raise.
If we have not already run into an odd output, we head to a rather confusing section of the control flow.
The outermost function call essentially waits for the final recursive output and strips out the melt condition if it was found.
That recursive output is generated by taking the first condition, wrapping it in a singleton outer puzzle if it's odd, and then passing the rest of the conditions back to `check_and_morph_conditions_for_singleton` with the `has_odd_output_been_found` flag set if relevant.

## Pay to Singleton

Now that you understand how a singleton functions, we can now look at an example of "paying to" a singleton or locking up a coin in such a way that only the owner of a specific singleton can unlock it.
The idea is that you curry in the necessary information to calculate the singleton's puzzle hash and then assert an announcement from the singleton that says that it is time to claim the funds locked up in the puzzle. Since the puzzle hash will be unique to that singleton (due to the launcher ID being curried in), only that singleton will be able to create the appropriate announcement. Here's the puzzle:

```chialisp
(mod (
       SINGLETON_MOD_HASH
       LAUNCHER_ID
       LAUNCHER_PUZZLE_HASH
       singleton_inner_puzzle_hash
       my_id
     )

  ; SINGLETON_MOD_HASH is the mod-hash for the singleton_top_layer puzzle
  ; LAUNCHER_ID is the ID of the singleton we are commited to paying to
  ; LAUNCHER_PUZZLE_HASH is the puzzle hash of the launcher
  ; singleton_inner_puzzle_hash is the innerpuzzlehash for our singleton at the current time
  ; my_id is the coin_id of the coin that this puzzle is locked into

  (include condition_codes.clvm)
  (include curry-and-treehash.clinc)

  ; takes a lisp tree and returns the hash of it
  (defun sha256tree (TREE)
      (if (l TREE)
          (sha256 2 (sha256tree (f TREE)) (sha256tree (r TREE)))
          (sha256 1 TREE)
      )
  )

  ;; return the full puzzlehash for a singleton with the innerpuzzle curried in
  ; puzzle-hash-of-curried-function is imported from curry-and-treehash.clinc
  (defun-inline calculate_full_puzzle_hash (SINGLETON_MOD_HASH LAUNCHER_ID LAUNCHER_PUZZLE_HASH inner_puzzle_hash)
     (puzzle-hash-of-curried-function SINGLETON_MOD_HASH
                                      inner_puzzle_hash
                                      (sha256tree (c SINGLETON_MOD_HASH (c LAUNCHER_ID LAUNCHER_PUZZLE_HASH)))
     )
  )

  (defun-inline claim_rewards (SINGLETON_MOD_HASH LAUNCHER_ID LAUNCHER_PUZZLE_HASH singleton_inner_puzzle_hash my_id)
    (list
        (list ASSERT_PUZZLE_ANNOUNCEMENT (sha256 (calculate_full_puzzle_hash SINGLETON_MOD_HASH LAUNCHER_ID LAUNCHER_PUZZLE_HASH singleton_inner_puzzle_hash) my_id))
        (list CREATE_COIN_ANNOUNCEMENT '$')
        (list ASSERT_MY_COIN_ID my_id))
  )

  ; main
  (claim_rewards SINGLETON_MOD_HASH LAUNCHER_ID LAUNCHER_PUZZLE_HASH singleton_inner_puzzle_hash my_id)
)
```

Most of this puzzle should be self explanatory especially if you've gone through the puzzles above.
Let focus on just the conditions we are creating from the `claim_rewards` function:

```chialisp
(list
    (list ASSERT_PUZZLE_ANNOUNCEMENT (sha256 (calculate_full_puzzle_hash SINGLETON_MOD_HASH LAUNCHER_ID LAUNCHER_PUZZLE_HASH singleton_inner_puzzle_hash) my_id))
    (list CREATE_COIN_ANNOUNCEMENT '$')
    (list ASSERT_MY_COIN_ID my_id)
)
```

We are both asserting an announcement from the singleton and creating one for it.
The assertion is fundamental to the fact that we only want to be claimed by a very specific singleton.
Due to the launcher ID being curried into the singleton's puzzle hash, it will be unique to every singleton and can thereby only be claimed by the singleton whose launcher ID we specify.
We cannot use the singleton's coin ID, because if we curried that in, the singleton could spend and then this puzzle becomes unsolvable!

The announcement that we create is simply for the singleton to assert that we are also being spent.
This is necessary due to the fact that [nodes may try and exclude this spend](https://chialisp.com/docs/security#replay-attacks) causing the singleton to spend without claiming these rewards.
Since this coin cannot be signed, we must ensure somehow that if it is excluded, the whole spend bundle fails.
We use `'$'` because it's one byte and somewhat relevant.

The coin ID assertion is simply to ensure that we are being told the truth about our id. Otherwise, we could piggy back on another claim by using that coin's ID and asserting the announcement that the singleton creates for it.
