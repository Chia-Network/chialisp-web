---
title: Standard Transactions
slug: /standard-transactions
---

The standard transaction is a puzzle used by the Chia wallet to generate its addresses and spend coins within them. It is also used for CATs and NFTs, which simply wrap the standard transaction inside to enforce ownership by the wallet.

:::tip
Before you read this page, it may be worth checking out this [Agg Sigs, Taproot, and Graftroot blog post](https://www.chia.net/2021/05/27/Agrgregated-Sigs-Taproot-Graftroot.html) by Bram Cohen on why the standard transaction is the way it is.
:::

## Terminology

**Hidden Puzzle** -
A puzzle that is initially hidden and can be revealed and used as an alternate way to unlock the underlying funds.

**Original Public Key** - A public key, where knowledge of the corresponding private key represents ownership of the coin.

**Synthetic Key Offset** - A private key cryptographically generated using the hidden puzzle and `original_public_key` as inputs.

**Synthetic Public Key** - The public key (curried in) that is the sum of `original_public_key` and the public key corresponding to `synthetic_key_offset`.

**Delegated Puzzle** - A graftroot puzzle which should return the desired conditions for the spend when executed with its solution.

**Solution** - The solution to the delegated or hidden puzzle.

## Standard Transaction Code {#code}

This is the source code of the standard transaction, which can also be found in the `chia-blockchain` repository in the puzzle [`p2_delegated_puzzle_or_hidden_puzzle.clvm`](https://github.com/Chia-Network/chia-blockchain/blob/fad414132e6950e79e805629427af76bf9ddcbc5/chia/wallet/puzzles/p2_delegated_puzzle_or_hidden_puzzle.clvm).

```chialisp title="p2_delegated_puzzle_or_hidden_puzzle.clvm"
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

That's probably a lot to digest so let's break it down piece by piece.
First, let's talk about the arguments:

```chialisp
(SYNTHETIC_PUBLIC_KEY original_public_key delegated_puzzle solution)
```

All of these terms are defined above.
When we solve this puzzle:

- `SYNTHETIC_PUBLIC_KEY` is curried in
- We pass in `original_public_key` if it's the hidden spend or `()` if it's the delegated spend
- `delegated_puzzle` is the hidden puzzle if it's the hidden spend, or the delegated puzzle if it's the delegated spend
- `solution` is the solution to whatever is passed into `delegated_puzzle`

As with most Chialisp programs, we'll start looking at the implementation from the bottom:

```chialisp
(possibly_prepend_aggsig
    SYNTHETIC_PUBLIC_KEY original_public_key delegated_puzzle
    (a delegated_puzzle solution))
```

There's nothing much going on here, we're mostly just passing arguments to `possibly_prepend_aggsig` to start the program.
The only thing to note is that we're evaluating the delegated puzzle with the solution before passing it in.
This will result in a list of conditions that we will output as long as the rest of the puzzle checks out.

```chialisp
(defun-inline possibly_prepend_aggsig (SYNTHETIC_PUBLIC_KEY original_public_key delegated_puzzle conditions)
  (if original_public_key
      (assert
          (is_hidden_puzzle_correct SYNTHETIC_PUBLIC_KEY original_public_key delegated_puzzle) ; hidden case
          conditions
      )
      (c (list AGG_SIG_ME SYNTHETIC_PUBLIC_KEY (sha256tree delegated_puzzle)) conditions) ; delegated case
  )
)
```

This function is the main control flow logic that determines whether we're doing the "hidden" or "delegated" spend.
The first line just checks if an `original_public_key` was passed in.
In the delegated spend, we pass `()` for that argument, and since that evaluates to false, it works great as a switch to determine what we're doing.

If the spend is the hidden spend, we pass most of our parameters to `is_hidden_puzzle_correct` and, as long as it doesn't fail, we just return whatever conditions are given to us.
If the spend is the delegated spend, we prepend a signature requirement from the curried in public key on the hash of the delegated puzzle.

```chialisp
(defun-inline is_hidden_puzzle_correct (SYNTHETIC_PUBLIC_KEY original_public_key delegated_puzzle)
  (=
      SYNTHETIC_PUBLIC_KEY
      (point_add
          original_public_key
          (pubkey_for_exp (sha256 original_public_key (sha256tree delegated_puzzle)))
      )
  )
)
```

This is the Chialisp representation of what was explained in the section above.
A private key is any 32 bytes so we're going to use `sha256` (whose output is 32 bytes) to make sure our private key is derived from the `original_public_key` and the hash of the hidden puzzle.
We pass the resulting hash to `pubkey_for_exp` which turns our private key into a public key.
Then, we `point_add` this generated public key to our original pubkey to get our synthetic public key.
If it equals the curried in one, this function passes, otherwise it returns `()` and the `assert` from the previous function raises.

## Delegated Puzzle

A delegated puzzle is pretty simple. It allows the solver to specify the puzzle and solution they would like to run when the coin is spent, rather than when the coin is created. This creates the most flexibility, but additional measures need to be taken to make it secure. In the case of the standard transaction, a signature is required to spend the coin.

The output of the delegated puzzle may include things such as creating a coin, adding announcements to interact with other spends, and reserving fees.

## Hidden Puzzle

:::note
The hidden puzzle functionality is not used by the official wallet. It is there to allow for future functionality as needed.
:::

We also want the ability to pre-commit to a puzzle without revealing it, and let anybody with the knowledge of that hidden puzzle spend it.

If this hidden puzzle were to be curried it in, any spend (even the delegated spend case) would reveal the full puzzle including the hidden puzzle. This would defeat the purpose, as it would no longer be hidden. Because of this, we wouldn't be able to lock up a coin with the same puzzle anymore, or people would be able to tell that the puzzle hash is the same and spend it without our consent. Additionally, our delegated spend might not even make it to the network. A malicious node could just deny our transaction after seeing it, then publish the hidden spend case on their own.

We can attempt to solve this problem by hashing the hidden puzzle. However, this has a similar problem in that if you spend the hidden case even once, people could see any identical puzzle hashes later and spend them without your consent. Furthermore, people may try to use the same hidden puzzle. If anyone reveals it, all coins locked up with that same puzzle can also be identified and spent.

We need the puzzle to be hidden, but also have some entropy that keeps it unique to us.

The solution that the standard transaction uses is to derive a new private key from the hidden puzzle and the public key that can sign for the delegated spend case.

This is known as the `synthetic_offset`:

```
synthetic_offset = sha256(original_public_key + hidden_puzzle_hash);
```

We then calculate the public key of this new private key, and add it to our existing original public key.

This is known as the `synthetic_public_key`:

```
synthentic_public_key = original_public_key + synthetic_offset_pubkey
```

If the solver can correctly reveal both the hidden puzzle and the original public key, then our puzzle can derive the synthetic public key and make sure that it matches the one that is curried in.

You may wonder why we add the public key from our derived private key to the original public key when it's already part of the derivation. This is because we use the synthetic public key to verify the signature of our delegated spends as well.

When you add two public keys, the sum of their private keys gives the private key for the resulting public key.
If we didn't add the original public key then anyone who knew the hidden puzzle could derive the synthetic private key and could then perform delegated spends! Adding the original public key ensures that there is still a secret component of the synthetic private key, even though half of it can be known.

This secret component is the private key for the original public key.

This technique is also neat because it allows us to hide the hidden puzzle in a piece of information that was already necessary for the delegated spend. It's impossible to guess what the hidden puzzle is, even if it's a standard hidden puzzle. It's even hard to tell if there's a hidden puzzle at all. All of this can contribute to the overall privacy.

For example, if two parties agree to lock up some coins with a hidden puzzle together, you can share pubkeys and verify that information on the blockchain without revealing anything to the network. Then, if you both agree that the coins _can_ be spent with the hidden puzzle if either party is dishonest, you can trustlessly delegated spend the coins to the correct destinations and it's impossible to tell that they are not just normal everyday spends.

### Default Hidden Puzzle

This is the default hidden puzzle, used when calculating the synthetic public key for normal addresses:

```chialisp
(=)
```

This program will always terminate, which effectively means the delegated spend is the only way to spend standard coins created by the wallet.

## Conclusion

Almost every coin on the Chia blockchain uses this primitive (or as an inner puzzle). When you use the official Chia wallet software, it is crawling the blockchain looking for coins locked up with this specific format. The `SYNTHETIC_PUBLIC_KEY` it is looking for is actually using a hidden puzzle of `(=)` which is obviously invalid and fails immediately. This is because most users of Chia don't need the hidden puzzle functionality for vanilla transactions. But by having the capabilities built in, it enables much cooler functionality later on. This puzzle also makes for a fantastic inner puzzle of any smart coins you may write.
