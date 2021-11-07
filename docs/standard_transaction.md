---
id: standard_transaction
title: 6 - The Standard Transaction
---

You should now be well versed in a number of ways to lock up a coin using a Chialisp puzzle.
We have all the tools we need now to talk about the standard transaction format on the Chia network.

Before you go through this section, it may be worth it to check out this [blog post](https://www.chia.net/2021/05/27/Agrgregated-Sigs-Taproot-Graftroot.html) by Bram Cohen on why the standard transaction is the way it is.

## Pay to "Delegated Puzzle" or "Hidden Puzzle"

If you remember from [our discussion of coins, spends, and wallets](/docs/coins_spends_and_wallets) we created a puzzle that paid to a "delegated puzzle": a puzzle that allows the solver to pass in a puzzle and solution to create their own conditions for the output.
This is one half of the functionality we want our standard transaction to have.

However, we also want the ability to pre-commit to a puzzle without revealing it, and let anybody with the knowledge of the "hidden" puzzle spend it.

But how do we pre-commit to this hidden puzzle?  We can curry it in, but if we perform the delegated spend case we will have to reveal the full puzzle including the curried in hidden puzzle and it will no longer be hidden.
We can't lock up a coin with the same puzzle anymore, or else people will be able to tell that the puzzle hash is the same and spend it without our consent.
Our delegated spend might not even make it to the network; a malicious node can just deny our transaction after seeing it and then publish the hidden spend case on their own.

We can attempt to solve this by hashing the hidden puzzle.
This has some similar problems.
If you spend the hidden case even once, people can see any identical puzzle hashes later and spend them without your consent.
Furthermore, many people may try to use the same hidden puzzle.
If anyone reveals it, all coins locked up with that same puzzle can also be identified and spent.
We need the puzzle to be hidden, but also have some entropy that keeps it unique to us.

The solution that the standard transaction uses is to derive a new private key from a) the hidden puzzle and b) the public key that can sign for the delegated spend case:

`synthetic_offset == sha256(hidden_puzzle_hash + original_public_key)`

We then calculate the public key of this new private key, and add it to our existing original public key:

`synthentic_public_key == original_public_key + synthetic_offset_pubkey`

If the solver can correctly reveal BOTH the hidden puzzle and the original public key, then our puzzle can derive the synthetic public key and make sure that it matches the one that is curried in.

You may wonder why we add the public key from our derived private key to the original public key when it's already part of the derivation.
This is because we use the synthetic public key to sign for our delegated spends as well.
When you add two public keys, the private key for the resulting public key is the sum of the original private keys.
If we didn't add the original public key then anyone who knew the hidden puzzle could derive the synthetic private key and could then perform delegated spends!  Adding original public key ensures that there is still a secret component of the synthetic private key, even though half of can be known.

This technique is also neat because it allows us to hide the hidden puzzle in a piece of information that was already necessary for the delegated spend.
It's impossible to guess what the hidden puzzle is, even if it's a standard hidden puzzle!  It's even hard to tell if there's a hidden puzzle at all.
This can also contribute to privacy.
For example, if two parties agree to lock up some coins with a hidden puzzle together, you can share pubkeys and verify that information on the blockchain without revealing anything to the network.
Then, if you both agree that the coins *can* be spent with the hidden puzzle if either party is dishonest, you can trustlessly delegated spend the coins to the correct destinations and it's impossible to tell that they are not just normal everyday spends.

We'll look at the code in a moment, but here's a few terms to know before you look at it:

* **hidden puzzle**: a "hidden puzzle" that can be revealed and used as an alternate way to unlock the underlying funds
* **synthetic key offset**: a private key cryptographically generated using the hidden puzzle and `original_public_key` as inputs
* **synthetic public key**: the public key (curried in) that is the sum of `original_public_key` and the public key corresponding to `synthetic_key_offset`
* **original public key**: a public key, where knowledge of the corresponding private key represents ownership of the coin
* **delegated puzzle**: a delegated puzzle, as in "graftroot", which should return the desired conditions.
* **solution**: the solution to the delegated or hidden puzzle

## The Chialisp

Here's the full source and then we'll break it down:

```chialisp
(mod

    (SYNTHETIC_PUBLIC_KEY original_public_key delegated_puzzle solution)

    ; "assert" is a macro that wraps repeated instances of "if"
    ; usage: (assert A0 A1 ... An R)
    ; all of A0, A1, ... An must evaluate to non-null, or an exception is raised
    ; return the last item (if we get that far)

    (defmacro assert (items)
        (if (r items)
            (list if (f items) (c assert (r items)) (q . (x)))
            (f items)
        )
    )

    (include condition_codes.clvm)
    (include sha256tree.clvm)

    ; "is_hidden_puzzle_correct" returns true iff the hidden puzzle is correctly encoded

    (defun-inline is_hidden_puzzle_correct (SYNTHETIC_PUBLIC_KEY original_public_key delegated_puzzle)
      (=
          SYNTHETIC_PUBLIC_KEY
          (point_add
              original_public_key
              (pubkey_for_exp (sha256 original_public_key (sha256tree delegated_puzzle)))
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
          (c (list AGG_SIG_ME SYNTHETIC_PUBLIC_KEY (sha256tree delegated_puzzle)) conditions)
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

```
(SYNTHETIC_PUBLIC_KEY original_public_key delegated_puzzle solution)
```

All of these terms are defined above.
When we solve this puzzle:
* `SYNTHETIC_PUBLIC_KEY` is curried in
* We pass in `original_public_key` if it's the hidden spend or `()` if it's the delegated spend
* `delegated_puzzle` is the hidden puzzle if it's the hidden spend, or the delegated puzzle if it's the delegated spend
* `solution` is the solution to whatever is passed into `delegated_puzzle`

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


## Conclusion
This puzzle secures almost all of the coins on the Chia network.
When you use the Chia Network wallet software, it is crawling the blockchain looking for coins locked up with this specific format.
The `SYNTHETIC_PUBLIC_KEY` it is looking for is actually using a hidden puzzle of `(=)` which is obviously invalid and fails immediately.
This is because most users of Chia don't need the hidden puzzle functionality for vanilla transactions.
But, by having the capabilities built in, it enables much cooler functionality later on.
This puzzle also makes for a fantastic inner puzzle of any smart coins you may write.
