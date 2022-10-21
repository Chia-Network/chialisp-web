---
title: Singletons
slug: /singletons
---

Singletons allow you to keep track of the state of something on the blockchain, with the ability to verify and check any part of its history using a unique id. It proves that the puzzle is unique and cannot be duplicated. Singletons can use any arbitrary inner puzzle, and is used to make NFTs, DIDs, the pooling puzzle, and many other things possible.

## Singleton Code {#code}

This is the source code of the singleton, which can also be found in the chia-blockchain repository in the puzzle [`singleton_top_layer_v1_1.clvm`](https://github.com/Chia-Network/chia-blockchain/blob/8b70466a70388d0fff437d138192ba38faf92be8/chia/wallet/puzzles/singleton_top_layer_v1_1.clvm).

An explanation is provided within the dropdown:

<details>
  <summary>Expand Singleton Puzzle</summary>

```chialisp title="singleton_top_layer_v1_1.clvm"
(mod (SINGLETON_STRUCT INNER_PUZZLE lineage_proof my_amount inner_solution)

;; SINGLETON_STRUCT = (MOD_HASH . (LAUNCHER_ID . LAUNCHER_PUZZLE_HASH))

; SINGLETON_STRUCT, INNER_PUZZLE are curried in by the wallet

; EXAMPLE SOLUTION '(0xfadeddab 0xdeadbeef 1 (0xdeadbeef 200) 50 ((51 0xfadeddab 100) (60 "trash") (51 deadbeef 0)))'


; This puzzle is a wrapper around an inner smart puzzle which guarantees uniqueness.
; It takes its singleton identity from a coin with a launcher puzzle which guarantees that it is unique.

  (include condition_codes.clvm)
  (include curry-and-treehash.clinc)  ; also imports the constant ONE == 1
  (include singleton_truths.clib)
  (include utility_macros.clib)

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

  (defun-inline morph_condition (condition SINGLETON_STRUCT)
    (c (f condition) (c (calculate_full_puzzle_hash SINGLETON_STRUCT (f (r condition))) (r (r condition))))
  )

  (defun is_odd_create_coin (condition)
    (and (= (f condition) CREATE_COIN) (logand (f (r (r condition))) 1))
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
        ; check if it's an odd create coin
        (if (is_odd_create_coin (f conditions))
            ; check that we haven't already found one
            (assert (not has_odd_output_been_found)
              ; then
              (if (= (f (r (r (f conditions)))) -113)
                  ; If it's the melt condition we don't bother prepending this condition
                  (check_and_morph_conditions_for_singleton SINGLETON_STRUCT (r conditions) ONE)
                  ; If it isn't the melt condition, we morph it and prepend it
                  (c (morph_condition (f conditions) SINGLETON_STRUCT) (check_and_morph_conditions_for_singleton SINGLETON_STRUCT (r conditions) ONE))
              )
            )
            (c (f conditions) (check_and_morph_conditions_for_singleton SINGLETON_STRUCT (r conditions) has_odd_output_been_found))
        )
        (assert has_odd_output_been_found ())
    )
   )

 ; assert that either the lineage proof is for a parent singleton, or, if it's for the launcher, verify it matched our launcher ID
 ; then return a condition asserting it actually is our parent ID
 (defun verify_lineage_proof (SINGLETON_STRUCT parent_id is_not_launcher)
    (assert (any is_not_launcher (= parent_id (launcher_id_for_singleton_struct SINGLETON_STRUCT)))
      ; then
      (list ASSERT_MY_PARENT_ID parent_id)
    )
 )

  ; main

  ; if our value is not an odd amount then we are invalid
  (assert (logand my_amount ONE)
    ; then
    (c
      (list ASSERT_MY_AMOUNT my_amount)
      (c
        ; Verify the lineage proof by asserting our parent's ID
        (verify_lineage_proof
          SINGLETON_STRUCT
          ; calculate our parent's ID
          (calculate_coin_id
            (parent_info_for_lineage_proof lineage_proof)
            (if (is_not_eve_proof lineage_proof)  ; The PH calculation changes based on the lineage proof
              (calculate_full_puzzle_hash SINGLETON_STRUCT (puzzle_hash_for_lineage_proof lineage_proof))  ; wrap the innerpuz in a singleton
              (launcher_puzzle_hash_for_singleton_struct SINGLETON_STRUCT) ; Use the static launcher puzzle hash
            )
            (if (is_not_eve_proof lineage_proof)  ; The position of "amount" changes based on the type on lineage proof
              (amount_for_lineage_proof lineage_proof)
              (amount_for_eve_proof lineage_proof)
            )
          )
          (is_not_eve_proof lineage_proof)
        )
        ; finally check all of the conditions for a single odd output to wrap
        (check_and_morph_conditions_for_singleton SINGLETON_STRUCT (a INNER_PUZZLE inner_solution) 0)
      )
    )
  )
)
```

Quite a bit isn't it? Let's start with the arguments:

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

- The tree hash of this module
- The launcher coin id (this acts as the unique id for the singleton)
- The launcher puzzle hash

The reason they are grouped into a single structure is because they are passed through almost every function. It increases readability and optimization if they are passed through as a single variable until it is time to deconstruct them.

`INNER_PUZZLE` is the inner puzzle to this wrapper puzzle.

`lineage_proof` takes one of two formats:

- `(parent_parent_coin_info parent_inner_puzzle_hash parent_amount)`
- `(parent_parent_coin_info parent_amount)`
  You may wonder, given the similarity, why not just use the first format? We use the separate formats because we use the length of the structure to tip us off to whether or not this is the **eve spend**.
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

This stage looks like a lot, but really all it's doing is calculating the current coin id for the next function to use.
Note before we start looking at it that the lineage proof is frequently being passed to functions that are not part of this file.
These are part of the `singleton_truths.clib` library which we will discuss in the next stage.
For now, just know that it is accessing the correct values from the lineage proof and is a lot cleaner than writing things like `(f (r lineage_proof)) (f (r (r lineage_proof)))` with no indication of what they mean.

The first if statement checks if `lineage_proof` indicates that this is not the eve spend (three proof elements instead of two).
If it is not the eve spend, it calculates our id using the information in the `lineage_proof` to generate our parent id.

If it _is_ the eve spend, there is an extra check which verifies that the launcher id and launcher puzzle hash we have (both inside the `SINGLETON_STRUCT`) are correct. We do so by calculating the launcher id from information in our lineage proof and the launcher puzzle hash.
We then assert that it is equal to the curried in value.
This is an extremely important step because it ensures that every singleton after this singleton can trust the launcher id and puzzle hash since it will be forcefully curried in from this "eve" singleton and every child singleton knows that the eve singleton checked it.

After the eve singleton has verified the launcher info, it can now trust the launcher id as its parent id and create its own id by hashing in the `full_puzhash` from the last stage and `my_amount`.
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

</details>

## Design Decisions

#### Singleton amount is odd {#odd}

In order to assure that a singleton does not duplicate itself, it needs some way to verify that its children do not consist of more than one new singleton. It does this by verifying that only one of its children is odd. It can either be the new singleton coin or the value to be melted. It's odd so that you can output other non-singleton coins that are multiples of 10, such as a full XCH.

#### Odd child is wrapped {#wrapped}

This abstracts some of the singleton functionality away from the inner puzzles. If an inner puzzle creates an odd coin, it doesn't have to worry about making it a singleton. It also prevents an inner puzzle from accidentally melting the singleton by forgetting to wrap its output.

#### Melt condition determines wrapping {#melt}

If you would like to melt a singleton and use its amount to create a new coin, you need to output a `CREATE_COIN` condition that uses the amount `-113`. When the singleton outer puzzle sees that condition, it filters it out.

## Launcher

The singleton launcher is used to ensure only one is created with the same id, since usually any coin could create the singleton, or multiple thereof. It does exactly one thing, which is creating a single singleton.

Additionally, the singleton's id is used for referencing it, as well as any metadata associated with it that is stored and can't be changed later.

This is the source code, which can also be found in the chia-blockchain repository in the puzzle [`singleton_launcher.clvm`](https://github.com/Chia-Network/chia-blockchain/blob/fad414132e6950e79e805629427af76bf9ddcbc5/chia/wallet/puzzles/singleton_launcher.clvm).

An explanation is provided within the dropdown:

<details>
  <summary>Singleton Launcher</summary>

```chialisp title="singleton_launcher.clvm"
(mod (singleton_full_puzzle_hash amount key_value_list)

(include condition_codes.clvm)

; takes a lisp tree and returns the hash of it
(defun sha256tree1 (TREE)
(if (l TREE)
(sha256 2 (sha256tree1 (f TREE)) (sha256tree1 (r TREE)))
(sha256 1 TREE)
)
)

; main
(list (list CREATE_COIN singleton_full_puzzle_hash amount)
(list CREATE_COIN_ANNOUNCEMENT (sha256tree1 (list singleton_full_puzzle_hash amount key_value_list))))
)

```

Essentially two lines, so not too bad right? One of the first things you may notice is that we don't curry anything in.
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

</details>

This launcher puzzle hash (which is the same for all singletons) is curried into the singleton, which then asserts that it came from a parent whose puzzle hash matches the launcher. This prevents it from being falsified, and can be verified without crawling back up to the original coin.

In addition to creating the singleton, the launcher announces the tree hash of its solution, effectively ensuring that they are signed and cannot be tampered with by malicious full nodes. The reason this works is that the parent (which has a signature) asserts as being valid in the same block. If any of the values change, the parent of the launcher coin will fail, and thus it will never create the singleton.

## Pay to Singleton

Now that you understand how a singleton functions, we can now look at an example of paying to a singleton (locking up a coin in such a way that only the owner of a specific singleton can unlock it).

The idea is that you curry in the necessary information to calculate the singleton's puzzle hash and then assert an announcement from the singleton that says that it is time to claim the funds locked up in the puzzle. Since the puzzle hash will be unique to that singleton (due to the launcher id being curried in), only that singleton will be able to create the appropriate announcement.

This is the source code, which can also be found in the chia-blockchain repository in the puzzle [`p2_singleton`](https://github.com/Chia-Network/chia-blockchain/blob/fad414132e6950e79e805629427af76bf9ddcbc5/chia/wallet/puzzles/p2_singleton.clvm).

<details>
  <summary>Singleton Launcher</summary>

```chialisp title="p2_singleton.clvm"
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
Due to the launcher id being curried into the singleton's puzzle hash, it will be unique to every singleton and can thereby only be claimed by the singleton whose launcher id we specify.
We cannot use the singleton's coin id, because if we curried that in, the singleton could spend and then this puzzle becomes unsolvable!

The announcement that we create is simply for the singleton to assert that we are also being spent.
This is necessary due to the fact that [nodes may try and exclude this spend](https://docs.chia.net/coin-set-security#replay) causing the singleton to spend without claiming these rewards.
Since this coin cannot be signed, we must ensure somehow that if it is excluded, the whole spend bundle fails.
We use `'$'` because it's one byte and somewhat relevant.

The coin id assertion is simply to ensure that we are being told the truth about our id. Otherwise, we could piggy back on another claim by using that coin's id and asserting the announcement that the singleton creates for it.

</details>

## Conclusion

The singleton is a very useful primitive that is used to power higher level things such as NFTs and DIDs. It can be used to emulate state using a linear chain of coins. This is a less centralized version of a typical smart contract.
