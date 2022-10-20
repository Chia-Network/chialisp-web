---
title: Singletons
slug: /singletons
---

Singletons allow you to keep track of the state of something on the blockchain, with the ability to verify and check any part of its history using a unique id. It proves that the puzzle is unique and cannot be duplicated. Singletons can use any arbitrary inner puzzle, and is used to make NFTs, DIDs, the pooling puzzle, and many other things possible.

## Chialisp Code

This is the source code of the singleton, which can also be found in the chia-blockchain repository in the puzzle [`singleton_top_layer_v1_1.clvm`](https://github.com/Chia-Network/chia-blockchain/blob/8b70466a70388d0fff437d138192ba38faf92be8/chia/wallet/puzzles/singleton_top_layer_v1_1.clvm).

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

</details>

This launcher puzzle hash (which is the same for all singletons) is curried into the singleton, which then asserts that it came from a parent whose puzzle hash matches the launcher. This prevents it from being falsified, and can be verified without crawling back up to the original coin.

In addition to creating the singleton, the launcher announces the tree hash of its solution, effectively ensuring that they are signed and cannot be tampered with by malicious full nodes. The reason this works is that the parent (which has a signature) asserts as being valid in the same block. If any of the values change, the parent of the launcher coin will fail, and thus it will never create the singleton.

## Conclusion

The singleton is a very useful primitive that is used to power higher level things such as NFTs and DIDs. It can be used to emulate state using a linear chain of coins. This is a less centralized version of a typical smart contract.
