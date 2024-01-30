---
slug: /chialisp-inner-puzzles
title: Inner Puzzles
---

Sometimes you want the behavior of your puzzles to be composable, so that you can reuse code in multiple ways. An example of this is the [Chia Asset Token](/cats) puzzle, which allows you to specify an **inner puzzle**.

This allows the outer puzzle to enforce certain rules on how it can be spent, while the inner puzzle can do whatever it wants within those rules. In this case, the CAT enforces that it maintains a constant amount in mojos, while the inner puzzle (typically the [Standard Transaction primitive](/standard-transactions/)) decides how it can be spent.

This is typically used in combination with a variety of other concepts, which we will talk about later. However, for the purpose of this guide and to make it easier to follow, we will provide a simple example that only incorporates currying and inner puzzles.

## Example

We're going to write a simple example to try inner puzzles on the command line.

Write this in a file named `require-signature.clsp`:

```chialisp title="require-signature.clsp"
; Using the dot here means that the inner solution is the rest of the parameters. This avoids the need to nest parentheses.
(mod (PUBLIC_KEY INNER_PUZZLE . inner_solution)
    (include condition_codes.clib)
    (include sha256tree.clib)

    (c
        (list AGG_SIG_ME PUBLIC_KEY (sha256tree inner_solution))
        (a INNER_PUZZLE inner_solution)
    )
)
```

Retrieve the libraries used in this example:

```bash
cdv clsp retrieve condition_codes sha256tree
```

First, note that `PUBLIC_KEY` and `INNER_PUZZLE` are both all caps. Because of this you can tell that they are meant to be [curried](/chialisp-currying) in before used as a puzzle.

The `c` operator creates a cons pair with two values. Here, it is essentially prepending the `AGG_SIG_ME` condition to the output of the inner puzzle.

The `a` operator executes a program with its parameters. Here, it is used to run the curried inner puzzle with the inner solution passed in during the spend. It outputs a list of conditions which will get appended to the first condition.

The `AGG_SIG_ME` condition will verify the `PUBLIC_KEY` signed the message, which is the tree hash of the inner solution.

### Inner Puzzle

Next, we need to write the inner puzzle that will be curried into the example.

Write this in a file named `any-conditions.clsp`:

```chialisp title="any-conditions.clsp"
(mod (conditions)
    conditions
)
```

:::info
This is an exceedingly simple puzzle that just returns any conditions passed into the solution. It is insecure on its own, as it allows anyone to spend it however they want.
:::

### Public Key

You can refer to the [BLS Signatures guide](/chialisp-bls-signatures) to learn about key pairs and how to use your wallet to sign messages. We will be using similar steps here to get the derived public key.

Run this to get the derived public key:

```bash
chia keys derive child-key --derive-from-hd-path "m/12381/8444/2/0"
```

You will use this public key in the next step.

### Currying

Now, we will wrap this inner puzzle in the outer puzzle we wrote previously. This will require the spend to be signed by a given key, which effectively secures the inner puzzle so that only you can spend it, instead of anyone.

First, run this command to get the compiled form of the inner puzzle:

```bash
run any-conditions.clsp
```

Yes, the output is just `2`.

You can run this command to curry in the public key previously calculated and the inner puzzle:

```bash
cdv clsp curry require-signature.clsp -a "0xPublicKey" -a 2
```

That should produce an output similar to this:

```chialisp
(a (q 2 (q 4 (c 4 (c 5 (c (a 6 (c 2 (c 15 ()))) ()))) (a 11 15)) (c (q 50 2 (i (l 5) (q 11 (q . 2) (a 6 (c 2 (c 9 ()))) (a 6 (c 2 (c 13 ())))) (q 11 (q . 1) 5)) 1) 1)) (c (q . 0xPublicKey) (c (q . 2) 1)))
```

Now the inner puzzle and outer puzzle have been combined.

## Conclusion

The concept of inner puzzles allows for the composition of puzzles. This is commonly used in the wallet, where CATs, DIDs, and NFTs wrap the standard transaction. That way they have the ability to be transferred, yet also have their own set of rules that control their use. If you have any questions about inner puzzles, feel free to ask on our [Discord](https://discord.gg/chia).
