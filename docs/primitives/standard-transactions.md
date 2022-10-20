---
title: Standard Transactions
slug: /standard-transactions
---

The standard transaction is a puzzle used by the Chia wallet to generate its addresses and spend coins within them. It is also used for CATs and NFTs, which simply wrap the standard transaction inside to enforce ownership by the wallet.

## Chialisp Code

This is the source code of the standard transaction, which can also be found in the `chia-blockchain` repository in the puzzle [`p2_delegated_puzzle_or_hidden_puzzle.clvm`](https://github.com/Chia-Network/chia-blockchain/blob/fad414132e6950e79e805629427af76bf9ddcbc5/chia/wallet/puzzles/p2_delegated_puzzle_or_hidden_puzzle.clvm):

<details>
  <summary>Expand Chialisp Puzzle</summary>

```chialisp title="p2_delegated_puzzle_or_hidden_puzzle.clvm"
; build a pay-to delegated puzzle or hidden puzzle
; coins can be unlocked by signing a delegated puzzle and its solution
; OR by revealing the hidden puzzle and the underlying original key

; glossary of parameter names:

; hidden_puzzle: a "hidden puzzle" that can be revealed and used as an alternate
;   way to unlock the underlying funds
;
; synthetic_key_offset: a private key cryptographically generated using the hidden
;   puzzle and as inputs `original_public_key`
;
; SYNTHETIC_PUBLIC_KEY: the public key that is the sum of `original_public_key` and the
;   public key corresponding to `synthetic_key_offset`
;
; original_public_key: a public key, where knowledge of the corresponding private key
;   represents ownership of the file
;
; delegated_puzzle: a delegated puzzle, as in "graftroot", which should return the
;   desired conditions.
;
; solution: the solution to the delegated puzzle


(mod
    ; A puzzle should commit to `SYNTHETIC_PUBLIC_KEY`
    ;
    ; The solution should pass in 0 for `original_public_key` if it wants to use
    ; an arbitrary `delegated_puzzle` (and `solution`) signed by the
    ; `SYNTHETIC_PUBLIC_KEY` (whose corresponding private key can be calculated
    ; if you know the private key for `original_public_key`)
    ;
    ; Or you can solve the hidden puzzle by revealing the `original_public_key`,
    ; the hidden puzzle in `delegated_puzzle`, and a solution to the hidden puzzle.

    (SYNTHETIC_PUBLIC_KEY original_public_key delegated_puzzle solution)

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

    (include condition_codes.clvm)

    ;; hash a tree
    ;; This is used to calculate a puzzle hash given a puzzle program.
    (defun sha256tree1
           (TREE)
           (if (l TREE)
               (sha256 2 (sha256tree1 (f TREE)) (sha256tree1 (r TREE)))
               (sha256 1 TREE)
           )
    )

    ; "is_hidden_puzzle_correct" returns true iff the hidden puzzle is correctly encoded

    (defun-inline is_hidden_puzzle_correct (SYNTHETIC_PUBLIC_KEY original_public_key delegated_puzzle)
      (=
          SYNTHETIC_PUBLIC_KEY
          (point_add
              original_public_key
              (pubkey_for_exp (sha256 original_public_key (sha256tree1 delegated_puzzle)))
          )
      )
    )

    ; "possibly_prepend_aggsig" is the main entry point

    (defun-inline possibly_prepend_aggsig (SYNTHETIC_PUBLIC_KEY original_public_key delegated_puzzle conditions)
      (if original_public_key
          (assert
              (is_hidden_puzzle_correct SYNTHETIC_PUBLIC_KEY original_public_key delegated_puzzle)
              conditions
          )
          (c (list AGG_SIG_ME SYNTHETIC_PUBLIC_KEY (sha256tree1 delegated_puzzle)) conditions)
      )
    )

    ; main entry point

    (possibly_prepend_aggsig
        SYNTHETIC_PUBLIC_KEY original_public_key delegated_puzzle
        (a delegated_puzzle solution))
)
```

</details>

This is the default hidden puzzle, used when calculating the synthetic public key for normal addresses.

```chialisp
(=)
```

## Synthetic Key

The code for calculating the synthetic public key can be found in the [`p2_delegated_puzzle_or_hidden_puzzle.py`](https://github.com/Chia-Network/chia-blockchain/blob/67b45c92eaab014c9c77a83b42e14e5f5fa6e28b/chia/wallet/puzzles/p2_delegated_puzzle_or_hidden_puzzle.py#L88) puzzle program:

<details>
  <summary>Expand Python code</summary>

```python title="p2_delegated_puzzle_or_hidden_puzzle.py"
def calculate_synthetic_public_key(public_key: G1Element, hidden_puzzle_hash: bytes32) -> G1Element:
    synthetic_offset: PrivateKey = PrivateKey.from_bytes(
        calculate_synthetic_offset(public_key, hidden_puzzle_hash).to_bytes(32, "big")
    )
    return public_key + synthetic_offset.get_g1()
```

</details>

The synthetic public key is calculated using a child of the root key. It contains a hidden puzzle which can be executed instead of revealing the original public key when spending the standard transaction. This is extra functionality that can be used for other wallets.

## Hidden Puzzle

Because the hidden puzzle doesn't need to be revealed in every spend, it allows a secret to be retained until you want to spend it (even if you use the address to spend other coins normally). Essentially, it can act as a backup plan or an alternative way to spend a coin.

The default hidden puzzle simply fails when executed, preventing anything other than a typical transaction from being carried out with coins using it.

In other words, we don't currently make use of this hidden puzzle in the official wallet, but it may be used for additional functionality in the future.

## Addresses

As mentioned, the standard transaction can be used to create addresses. Here is how it works.

First, use the root key from a mnemonic to derive an unhardened (observer) public key at a given index. Use that to calculate the synthetic public key.

Next, create an instance of the standard transaction puzzle using the synthetic public key just calculated. Run the following command to get the puzzle hash:

```bash
opc -H "puzzle"
```

Finally, convert the puzzle hash to a [bech32m address](/addresses) using the following command:

```bash
cdv encode -p xch "hash"
```

## Conclusion

Almost every coin on the Chia blockchain uses this primitive (or as an inner puzzle). The official wallet looks for coins locked with the standard transaction that you can spend. The `(=)` hidden puzzle fails immediately, since most users won't need the extra functionality for typical transactions. We have it built in simply to enable more possibilities in the future.
