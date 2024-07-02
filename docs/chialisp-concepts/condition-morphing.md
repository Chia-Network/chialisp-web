---
slug: /chialisp-condition-morphing
title: Condition Morphing
---

You've seen how you can use inner puzzles to output conditions and append them to the output of the outer puzzle. However, sometimes you want to change the output of the inner puzzle to enforce certain rules. This is called **condition morphing**.

An example of this is the singleton - every coin that its inner puzzle creates which has an odd output, is turned into an inner puzzle of itself. It changes the puzzle in the condition to the singleton with the original puzzle as its new inner puzzle. This can be a bit confusing to think about, but it allows for many things such as keeping track of state.

## Example

Let's try a simpler example of condition morphing that doubles the amount of created coins.

Write the following in a file named `coin-doubler.clsp`:

```chialisp title="coin-double.clsp"
; Using the dot here means that the inner solution is the rest of the parameters. This avoids the need to nest parentheses.
(mod (INNER_PUZZLE . inner_solution)

    ; Doubles the amount of CREATE_COIN conditions.
    (defun morph-condition (condition)

        ; Checks if the opcode is 51, which is CREATE_COIN.
        (if (= (f condition) 51)

            ; Create a new condition similar to the original.
            (list
                ; It's still the same opcode.
                51

                ; The second value, the puzzle hash, is also the same.
                (f (r condition))

                ; The third value, the amount, is doubled.
                (* (f (r (r condition))) 2)
            )

            ; If it's not the right opcode, leave it untouched.
            condition
        )
    )

    ; Goes through every condition and morphs it.
    (defun morph-conditions (conditions)

        ; If there are conditions left in the list.
        (if (l conditions)
            (c
                ; Morph the first condition.
                (morph-condition (f conditions))

                ; Then morph the rest and form a list.
                (morph-conditions (r conditions))
            )

            ; Otherwise, the output has ended.
            ()
        )
    )

    ; Morph the conditions output from the inner puzzle.
    (morph-conditions (a INNER_PUZZLE inner_solution))
)
```

Make sure you read the comments and understand it fully before continuing.

### Inner Puzzle

Now we need an inner puzzle to morph the conditions of.

Write the following in a file named `any-with-signature.clsp`:

```chialisp title="any-with-signature.clsp"
(mod (PUBLIC_KEY conditions)
    (include condition_codes.clib)
    (include sha256tree.clib)

    (c
        (list AGG_SIG_ME PUBLIC_KEY (sha256tree conditions))
        conditions
    )
)
```

Retrieve the libraries used in this example:

```bash
cdv clsp retrieve condition_codes sha256tree
```

:::info
Similarly to [the example in the Inner Puzzles guide](/chialisp-inner-puzzles#inner-puzzle), this allows the spender to pick any conditions. However, it also requires a signature. It's essentially the inner and outer puzzle from that example combined.
:::

### Public Key

You can refer to the [signature guide](/chialisp-bls-signatures) to learn about key pairs and how to use your wallet to sign messages. We will be using similar steps here to get the derived public key.

Run this to get the derived public key:

```bash
chia keys derive child-key --derive-from-hd-path "m/12381/8444/2/0"
```

You will use this public key in the next step.

### Currying

Now, we will wrap this inner puzzle in the outer puzzle we wrote previously. This will require the spend to be signed by a given key, and any coins created will have double the amount.

First, run this command to curry in the public key previously calculated:

```bash
cdv clsp curry any-with-signature.clsp -a "0xPublicKey" -i include
```

The output should look like this:

```chialisp
(a (q 2 (q 4 (c 4 (c 5 (c (a 6 (c 2 (c 11 ()))) ()))) 11) (c (q 50 2 (i (l 5) (q 11 (q . 2) (a 6 (c 2 (c 9 ()))) (a 6 (c 2 (c 13 ())))) (q 11 (q . 1) 5)) 1) 1)) (c (q . 0xPublicKey) 1))
```

You can run this command to curry in the inner puzzle above:

```bash
cdv clsp curry coin-doubler.clsp -a "(a (q 2 (q 4 (c 4 (c 5 (c (a 6 (c 2 (c 11 ()))) ()))) 11) (c (q 50 2 (i (l 5) (q 11 (q . 2) (a 6 (c 2 (c 9 ()))) (a 6 (c 2 (c 13 ())))) (q 11 (q . 1) 5)) 1) 1)) (c (q . 0xPublicKey) 1))" 
```

That should produce an output similar to this:

```chialisp
(a (q 2 (q 2 6 (c 2 (c (a 5 7) ()))) (c (q (a (i (= 9 (q . 51)) (q 4 (q . 51) (c 21 (c (* 45 (q . 2)) ()))) (q . 5)) 1) 2 (i (l 5) (q 4 (a 4 (c 2 (c 9 ()))) (a 6 (c 2 (c 13 ())))) ()) 1) 1)) (c (q 2 (q 2 (q 4 (c 4 (c 5 (c (a 6 (c 2 (c 11 ()))) ()))) 11) (c (q 50 2 (i (l 5) (q 11 (q . 2) (a 6 (c 2 (c 9 ()))) (a 6 (c 2 (c 13 ())))) (q 11 (q . 1) 5)) 1) 1)) (c (q . 0xPublicKey) 1)) 1))
```

Now the inner puzzle and outer puzzle have been combined together.

## Conclusion

This combined puzzle would allow you to spend coins created with it with your public key, but any create coin conditions would have their amounts doubled in the output. Feel free to ask questions you may have on our [Discord](https://discord.gg/chia).
