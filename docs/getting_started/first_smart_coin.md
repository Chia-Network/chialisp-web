---
id: first_smart_coin
title: First Smart Coin
---

By now, you should understand what Chialisp is and how you can use it to write simple programs and modules that can be run on the command-line. In this guide, we are going to write a simple **puzzle**, lock a coin with it, and finally spend the coin following the rules we specified.

## Prerequisites

The previous guide detailed how to set up the testnet. You will need to follow it to continue.

:::tip

While this guide can be followed on the command-line like the first, we recommend writing more complicated Chialisp programs like this one that you plan on reusing in a text editor of your choice, then using the command-line to compile it and use the RPC commands.

:::

## Puzzles

We've mentioned previously that Chialisp can be used to write puzzles, but you may be wondering what exactly a puzzle is. A puzzle is a special module that is used to lock a **coin** with a set of rules. These rules affect how and when they can be spent, and what happens when they are.

## Coins

Everything on the Chia Blockchain, including the standard transactions used to move money between wallets, is a coin. Coins are identified by their id, which is just a [sha256 hashed](https://en.wikipedia.org/wiki/Cryptographic_hash_function) representation of the following three components:

-   `parent_coin_id`, which is the id of the coin that created this one.
-   `puzzle_hash`, which is the hash of the puzzle used to spend the coin.
-   `amount`, which is the amount of money locked with the coin, in mojos (a trillionth of an XCH).

A coin can be spent by revealing its puzzle and providing a solution. The solution is then passed to its puzzle to output a list of **conditions**.

## Conditions

A condition is a condition code followed by its arguments. They can do a variety of things, from the creation of new coins and requiring other spends to happen at the same time, to various assertions related to the state of the blockchain.

A complete list of conditions can be found [here](https://chialisp.com/docs/coins_spends_and_wallets#conditions), but we will only be using one in this tutorial: condition `51`, or `CREATE_COIN`, creates a new coin with the given `puzzle_hash` and `amount` if the spend is valid. It is used to send money to another puzzle hash (which is analagous to an address).

## Putting it Together

We will now put those concepts to use to write a puzzle that will lock coins with a simple password. While this is insecure for a variety of reasons which will be explained after, it's a good example to try out on the Testnet just to get a feel for how coins work.

Write the following Chialisp in a file named `password.clsp`:

```chialisp
;;; This puzzle locks coins with a password.
;;; It should not be used for production purposes.
;;; Use a password that has no meaning to you, preferably random.

(mod (
        PASSWORD_HASH ; This is the sha256 hash of the password.

        password ; This is the original password used in the password hash.
        conditions ; An arbitrary list of conditions to output.
    )

    ; If the hash of the password matches,
    (if (= (sha256 password) PASSWORD_HASH)
        ; Output the conditions list.
        conditions

        ; Otherwise, throw an error.
        (x)
    )
)
```

1. The puzzle takes in a **curried in** value `PUZZLE_HASH`.
2. The solution takes in the `password` and desired `conditions`.
3. If the hash of the password matches the curried in value, output the `conditions`.
4. Otherwise, throw an error to prevent the spend from occurring.

### But What is Currying?

Currying is similar to creating a constant in the puzzle, except that it can be redefined as something else either programmatically or on the command-line with every use. It's the ideal pattern when creating a general purpose puzzle that requires external information, since you wouldn't want to hard code it and change it every time.

## Potential Questions

Here are some questions you may have had when creating and spending the coin. If you have any others, feel free to ask on our [Keybase](https://keybase.io/team/chia_network.public) and we will answer as soon as we can.

### Why Allow Arbitrary Conditions?

We allow any conditions to be passed in the solution. While you might think that for this example we would only need to create a single coin, this allows us to reserve network fees, or to enable more complicated functionality later such as interacting with other spends. In this example, we will only use the create coin condition in this list.

### Why are Password Coins Insecure?

When you spend one or more coins, the puzzle and its solution go into the [mempool](https://docs.chia.net/docs/06mempool/mempool) until the block is inevitably farmed. This means that anyone can read the password in plain text during this time, or after the coin is spent.

A simple solution to that would be to use a new random password every time you create a coin. However, a malicious farmer can actually change the solution to spends however they would like before adding it to their block. In doing so, they could change where the money will go in order to steal the coin.

While there are other ways, the most common solution to that is to simply require a [digital signature](https://en.wikipedia.org/wiki/BLS_digital_signature) instead of a password. This is a cryptographically secure way of ensuring that the solution is not tampered with. If it is, the spend will no longer be valid. We will worry about this in a future guide, so you can safely ignore this concept for now.

So, while a password example is a good idea for learning and testing purposes, it is certainly not feasible for real-world use.
