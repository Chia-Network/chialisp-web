---
id: coins_spends_and_wallets
title: 2 - Coins, Spends and Wallets
---

This guide assumes knowledge of [the basics of CLVM](/docs/) so if you haven't read that page, please do so before reading this.

This section of the guide will cover evaluating a program inside a program, how ChiaLisp relates to transactions and coins on the Chia network, and cover some techniques to create smart transactions using ChiaLisp.
If there are any terms that you aren't sure of, be sure to check the [glossary](/docs/glossary).

## Puzzles and Solutions

When we refer Chialisp in the context of coins on the blockchain, we refer to the program as a **puzzle** and we refer to the environment or arguments as the **solution**.

```
brun <puzzle> <solution>
```

Whenever you want to spend a coin in Chia, you must reveal its puzzle and the solution you would like to use to run that puzzle.
If the puzzle runs without any errors and returns a valid list of **conditions** (more on conditions below) then the spend succeeds and the list of conditions is processed.

## Coins

The body of a coin is made up of 3 pieces of information.
Here is the actual code that defines a coin:

```python
class Coin:
    parent_coin_info: bytes32
    puzzle_hash: bytes32
    amount: uint64
```

1. The ID of its parent
2. The tree hash of its puzzle (AKA the puzzlehash)
3. The amount that it is worth

To construct a coin ID simply take the hash of these 3 pieces of information concatenated in order.

```
coinID == sha256(parent_ID + puzzlehash + amount)
```

This means that a coin's puzzle and amount are intrinsic parts of it.
You cannot change a coin's puzzle or amount, you can only spend a coin.

## Spends

When you spend a coin you destroy it.
Unless the behaviour of a puzzle designates what to do with the coin's value when it is spent, the value of the coin is also destroyed in the spend.

To spend a coin you need 3 pieces of information (and an optional 4th).

1. The coin's ID
2. The full source of the coin's puzzle
3. A solution to the coin's puzzle
4. (OPTIONAL) A collection of signatures grouped together, called an aggregated signature

Remember the puzzle and solution is the same as we covered in the basics, except the puzzle has already been stored inside the coin and anybody can submit a solution.

The network has no concept of coin ownership, anybody can attempt to spend any coin on the network.
It's up to the puzzles to prevent coins from being stolen or spent in unintended ways.

If anybody can submit a solution for a coin, you may be wondering how somebody can "own" a coin.
By the end of the next section of the guide, hopefully it should be clear.

## Puzzles and Solutions in Practice

So far we have covered ChiaLisp programs that will evaluate to some result.
Remember the first part represents a puzzle which is committed to locking up a coin, and the second part is a solution anybody can submit:

```chialisp
$ brun '(+ 2 5)' '(40 50)'
90

$ brun '(c (q . 800) 1)' '("some data" 0xdeadbeef)'
(800 "some data" 0xdeadbeef)
```

These are fun exercises in isolation, but this format can be used to communicate instructions to the blockchain network of how a coin should behave when it is spent.
This can be done by having the result of an evaluation be a list of **conditions**.

### Conditions

Conditions are split into two categories: *"this spend is only valid if X"* and *"if this spend is valid then X"*.

Here is the complete list of conditions along with their format and behaviour.

* **AGG_SIG_UNSAFE - [49] - (49 pubkey message)**: This spend is only valid if the attached aggregated signature contains a signature from the given public key of the given message. This is labeled unsafe because if you sign a message once, any other coins you have that require that signature may potentially also be unlocked. It's probably better just to use AGG_SIG_ME because of the natural entropy introduced by the coin ID.
* **AGG_SIG_ME - [50] - (50 pubkey message)**: This spend is only valid if the attached aggregated signature contains a signature from the specified public key of that message concatenated with the coin's ID and the network's genesis challenge.
* **CREATE_COIN - [51] - (51 puzzlehash amount)**: If this spend is valid, then create a new coin with the given puzzlehash and amount.
* **RESERVE_FEE - [52] - (52 amount)**: This spend is only valid if there is unused value in this transaction greater than or equal to *amount*, which is explicitly to be used as the fee.
* **CREATE_COIN_ANNOUNCEMENT - [60] - (60 message)**: If this spend is valid, this creates an ephemeral announcement with an ID dependent on the coin that creates it. Other coins can then assert an announcement exists for inter-coin communication inside a block.
* **ASSERT_COIN_ANNOUNCEMENT - [61] - (61 announcementID)**: This spend is only valid if there was an announcement in this block matching the announcementID.
The announcementID is the hash of the message that was announced concatenated with the coin ID of the coin that announced it `announcementID == sha256(coinID + message)`.
* **CREATE_PUZZLE_ANNOUNCEMENT - [62] - (62 message)**: If this spend is valid, this creates an ephemeral announcement with an ID dependent on the puzzle that creates it. Other coins can then assert an announcement exists for inter-coin communication inside a block.
* **ASSERT_PUZZLE_ANNOUNCEMENT - [63] - (63 announcementID)**: This spend is only valid if there was an announcement in this block matching the announcementID.
The announcementID is the message that was announced concatenated with the puzzle hash of the coin that announced it `announcementID == sha256(puzzle_hash + message)`.
* **ASSERT_MY_COIN_ID - [70] - (70 coinID)**: This spend is only valid if the presented coin ID is exactly the same as the ID of the coin that contains this puzzle.
* **ASSERT_MY_PARENT_ID - [71] - (71 parentID)**: This spend is only valid if the presented parent coin info is exactly the same as the parent coin info of the coin that contains this puzzle.
* **ASSERT_MY_PUZZLEHASH - [72] - (72 puzzlehash)**: This spend is only valid if the presented puzzle hash is exactly the same as the puzzle hash of the coin that contains this puzzle.
* **ASSERT_MY_AMOUNT - [73] - (73 amount)**: This spend is only valid if the presented amount is exactly the same as the amount of the coin that contains this puzzle.
* **ASSERT_SECONDS_RELATIVE - [80] - (80 seconds)**: This spend is only valid if the given time has passed since this coin was created. The coin's creation time or "birthday" is defined by the timestamp of the previous block *not* the actual block in which it was created. Similarly, the previous block's timestamp is used as the current time when evaluating these time locks.
* **ASSERT_SECONDS_ABSOLUTE - [81] - (81 time)**: This spend is only valid if the timestamp on this block is greater than the specified timestamp. Again, the coin's birthday and the current time are defined by the timestamp of the previous block.
* **ASSERT_HEIGHT_RELATIVE - [82] - (82 block_age)**: This spend is only valid if the specified number of blocks have passed since this coin was created.
* **ASSERT_HEIGHT_ABSOLUTE - [83] - (83 block_height)**: This spend is only valid if the given block_height has been reached.

Conditions are returned as a list of lists in the form:

```chialisp
((51 0xabcd1234 200) (50 0x1234abcd "hello") (60 0xdeadbeef))
```

*Remember: this is what a puzzle should evaluate to when presented with a solution so that a full-node can understand it.*

Let's create a few examples puzzles and solutions to demonstrate how this is used in practice.

### Example 1: Password Locked Coin

Let's create a coin that can be spent by anybody as long as they know the password.

To implement this we would have the hash of the password committed into the puzzle and, if presented with the correct password, the puzzle will return instructions to create a new coin with a puzzle hash given in the solution.
For the following example the password is "hello" which has the hash value 0x2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824.
The implementation for the above coin would be thus:

```chialisp
(i (= (sha256 2) (q . 0x2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824)) (c (q . 51) (c 5 (c (q . 100) ()))) (q . "wrong password"))
```

This program takes the hash, with `(sha256 )`, of the first element in the solution, with `2`, and compares that value with the already committed.
If the password is correct it will return `(c (q . 51) (c 5 (c (q . 100) ())))` which evaluates to `(51 0xmynewpuzzlehash 100)`.
Remember, `51` is the opcode for the condition to create a new coin with the specified puzzle hash and amount. `5` is equivalent to `(f (r 1))` and we use it to access the puzzle hash from the solution.

If the password is incorrect it will return the string "wrong password".

The format for a solution to this is expected to be formatted as `(password newpuzzlehash)`.
Remember, anybody can attempt to spend this coin as long as they know the coin's ID and the full puzzle code.

Let's test it out using clvm_tools.

```chialisp
$ brun '(i (= (sha256 2) (q . 0x2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824)) (c (c (q . 51) (c 5 (c (q . 100) ()))) (q ())) (q . "wrong password"))' '("let_me_in" 0xdeadbeef)'
"wrong password"

$ brun '(i (= (sha256 2) (q . 0x2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824)) (c (q . 51) (c 5 (c (q . 100) ()))) (q . "wrong password"))' '("incorrect" 0xdeadbeef)'
"wrong password"

$ brun '(i (= (sha256 2) (q . 0x2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824)) (c (q . 51) (c 5 (c (q . 100) ()))) (q . "wrong password"))' '("hello" 0xdeadbeef)'
((51 0xdeadbeef 100))
```

There is one final change we need to make before this is a complete smart transaction.

If you want to invalidate a spend then you need to raise an exception using `x`.
Otherwise you just have a valid spend that isn't returning any conditions, and that would destroy our coin and not create a new one!
So we need to change the fail condition to be `(x "wrong password")` which means the transaction fails and the coin is not spent.

If we're doing this then we should also change the `(i A B C)` pattern to `(a (i A (q . B) (q . C)) 1)`.
The reason for this is explained in [a later section](/docs/deeper_into_clvm/). For now don't worry about why.

Here is our completed password protected coin:

```chialisp
'(a (i (= (sha256 2) (q . 0x2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824)) (q . (c (c (q . 51) (c 5 (c (q . 100) ()))) ())) (q . (x (q . "wrong password")))) 1)'
```

Let's test it out using clvm_tools:

```chialisp
$ brun '(a (i (= (sha256 2) (q . 0x2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824)) (q . (c (c (q . 51) (c 5 (c (q . 100) ()))) ())) (q . (x (q . "wrong password")))) 1)' '("let_me_in" 0xdeadbeef)'
FAIL: clvm raise ("wrong password")

$ brun '(a (i (= (sha256 2) (q . 0x2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824)) (q . (c (c (q . 51) (c 5 (c (q . 100) ()))) ())) (q . (x (q . "wrong password")))) 1)' '("hello" 0xdeadbeef)'
((51 0xdeadbeef 100))
```

### Generating Conditions from the Puzzle vs. from the Solution

Let's take a moment to consider the balance of power between the send and the spender.
Another way of phrasing this is "how much control over the output should the solution have?"

Suppose we lock a coin up using the following puzzle:

```chialisp
(q . ((51 0x365bdd80582fcc2e4868076ab9f24b482a1f83f6d88fd795c362c43544380e7a 100)))
```

Regardless of what solution is passed this puzzle will *always* return instructions to create a new coin with the puzzlehash 0x365bdd80582fcc2e4868076ab9f24b482a1f83f6d88fd795c362c43544380e7a and the amount 100.

```chialisp
$ brun '(q . ((51 0x365bdd80582fcc2e4868076ab9f24b482a1f83f6d88fd795c362c43544380e7a 100)))' '(80 90 "hello")'
((51 0x365bdd80582fcc2e4868076ab9f24b482a1f83f6d88fd795c362c43544380e7a 100))

$ brun '(q . ((51 0x365bdd80582fcc2e4868076ab9f24b482a1f83f6d88fd795c362c43544380e7a 100)))' '("it doesn't matter what we put here")'
((51 0x365bdd80582fcc2e4868076ab9f24b482a1f83f6d88fd795c362c43544380e7a 100))
```

In this example the result of spending the coin is entirely determined from the puzzle.
Even though anybody could initiate the spend of the coin, the person that locked the coin up has all the power in the way that the coin is spent as the solution doesn't matter at all.

Conversely lets consider a coin locked up with the following puzzle:

```chialisp
1
```

This example may look a little weird, because most ChiaLisp programs are lists, and this is just an atom, but it is still a valid program.
This puzzle simply returns the entire solution.
You can think about this in terms of power and control.
The person that locked the coin up has given all the power to the person who provides the solution.

```chialisp
$ brun '1' '((51 0xf00dbabe 50) (51 0xfadeddab 50))'
((51 0xf00dbabe 50) (51 0xfadeddab 50))

$ brun '1' '((51 0xf00dbabe 75) (51 0xfadeddab 15) (51 0x1234abcd 10))'
((51 0xf00dbabe 75) (51 0xfadeddab 15) (51 0x1234abcd 10))
```

In this situation, not only can anybody spend the coin, they can spend it however they like!
This balance of power determines a lot of how puzzles are designed in ChiaLisp.

For example, let's create a puzzle that lets the spender choose the output, but with one stipulation.

```chialisp
(c (q . (51 0xcafef00d 200)) 1)
```
This will let the spender return any conditions they want via the solution but will always add the condition to create a coin with the puzzle hash 0xcafef00d and value 200.

```chialisp
$ brun '(c (q . (51 0xcafef00d 200)) 1)' '((51 0xf00dbabe 75) (51 0xfadeddab 15) (51 0x1234abcd 10))'
((51 0xcafef00d 200) (51 0xf00dbabe 75) (51 0xfadeddab 15) (51 0x1234abcd 10))
```

This section is intended to demonstrate the point that conditions can come from both the recipient's solution and from the sender's puzzle, and how that represents trust and the balance of power.

In the next exercise we will put everything we know together and create a basic, secure transaction in Chia that underpins how wallets are able to send money to each other.
Before we go there, let's explain signatures:

## BLS Aggregated Signatures

If you don't have a fundamental understanding of cryptographic signatures, it will be good to familiarize yourself with [the basic concepts](https://en.wikipedia.org/wiki/Digital_signature) before you continue.

You may have seen that one of the conditions above allows you to require a **signature** from the spender of the coin.
In Chia, we use [BLS Signatures](https://crypto.stanford.edu/~dabo/pubs/papers/BLSmultisig.html) to sign any relevant data.

One helpful feature of BLS signatures is that they can be *non-interactively aggregated*.  You can take a signature from a party you don't trust, and combine it with another signature to produce a single signature that verifies the combination of all of the messages they were signing.

For example, if a puzzle returns a set of conditions with multiple AGG_SIG conditions:
```
((AGG_SIG_UNSAFE <pubkey A> <msg A>) (AGG_SIG_UNSAFE <pubkey B> <msg B>))
```
the node processing this spend is going to look for an attached signature that is the **aggregation** of a signature from pubkey A on message A as well as a signature from pubkey B on message B.
The spend will not pass unless there is exactly that combination of signatures.  No more, no less.

### Example: Signature Locked Coin

To 'send a coin to somebody' you simply create a puzzle that requires the recipient's signature, but then allows them to return any other conditions that they like.
This means that the coin cannot be spent by anybody else, but the outputs are entirely decided by the recipient.

We can construct the following smart transaction where AGG_SIG_ME is 50 and the recipient's pubkey is `0xfadedcab`.

```chialisp
(c (c (q . 50) (c (q . 0xfadedcab) (c (sha256 2) (q . ())))) 3)
```

This puzzle forces the resultant evaluation to contain `(50 pubkey *hash_of_first_solution_arg*)` but then adds on all of the conditions presented in the solution.

Let's test it out in clvm_tools - for this example the recipient's pubkey will be represented as 0xdeadbeef.
The recipient wants to spend the coin to create a new coin which is locked up with the puzzle 0xcafef00d.

```chialisp
$ brun '(c (c (q . 50) (c (q . 0xdeadbeef) (c (sha256 2) ()))) 3)' '("hello" (51 0xcafef00d 200))'
((50 0xdeadbeef 0x2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824) (51 0xcafef00d 200))
```

Brilliant.

Let's pull back and add some context here.

## Wallets

A wallet is some software that has several features that make it easy for a user to interact with coins.

* A wallet keeps track of public and private keys
* A wallet can generate puzzles and solutions
* A wallet can sign things with its keys
* A wallet can identify and remember what coins that the user 'owns'
* A wallet can spend coins

You may be wondering how a wallet is able to identify what coins that the user 'owns' if any person can attempt to spend a coin.
This is because all wallets already know and agree on what the standard format for sending a coin to somebody is.
They know what their own pubkeys are, so when a new coin is created a wallet can check if the puzzle inside that coin is a 'standard send puzzle' to one of their pubkeys.
If it is, then that coin can be considered to be owned by that 'wallet' as nobody else can spend it.

If the wallet that 'owns' the coin then wanted to send that coin on again to somebody else, they ask for an address (which is a bech32m encoded puzzle hash) and then they could then spend the coin that they own, destroying it, and creating a new coin that is locked up with the new recipient's puzzle hash.
The new recipient can then identify that it 'owns' the coin and can send it on as they wish later.

### Change Making

Change making is simple.
If a wallet spends less than the total value of a coin, they can create another coin with the remaining portion of value, and lock it up with the standard puzzle for themselves again.
You can split a coin up into as many new coins with fractions of the original value as you'd like.

You cannot create two coins of the same value, with the same puzzlehash, from the same parent as this will lead to an ID collision and the spend will be rejected.

### Coin Aggregation and Spend Bundles

You can aggregate a bunch of smaller coins together into one large coin.
To do this, you can create a SpendBundle which groups together one or more spends with a single aggregated signature.

SpendBundles are particularly important when the using announcements.
Since created announcements are only good for the block they are created in, you want to make sure that the coins that are asserting those announcements get spent alongside the announcing coins.

We'll go more into SpendBundles and cohesion between coins in a later section.

### Example: Pay to "Delegated Puzzle"

We can construct an even more powerful version of the signature locked coin:

```chialisp
(c (c (q . 50) (c (q . 0xfadedcab) (c (sha256 2) ()))) (a 5 11))
```

The first part is mostly the same, the puzzle always returns an AGGSIG check for the pubkey `0xfadedcab`.
However it only checks for the first element of the solution.
This is because, instead of the solution for this puzzle being a list of Conditions to be printed out, the solution is a program/solution pair.
This means that the recipient can run their own program as part of the solution generation, or sign a puzzle and let somebody else provide the solution.
When we use program parameters to generate solutions, refer to that as a "delegated puzzle".

The new program and solution inside the solution are evaluated and the result of that is added to the condition output.
We will cover in more detail how this works in the [next part](/docs/deeper_into_clvm/) of this guide.

A basic solution for this standard transaction might look like:

```chialisp
("hello" (q . ((51 0xmynewpuzzlehash 50) (51 0xanothernewpuzzlehash 50))) ())
```

Running that in the clvm_tools looks like this:

```chialisp
$ brun '(c (c (q . 50) (c (q . 0xfadedcab) (c (sha256 2) ()))) (a 5 11))' '("hello" (q . ((51 0xdeadbeef 50) (51 0xf00dbabe 50))) ())'

((50 0xfadedcab 0x2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824) (51 0xdeadbeef 50) (51 0xf00dbabe 50))
```

## Conclusions

Coin ownership refers to the concept of creating a coin with a puzzle that means it can only be spent when signed by the private key of the coin's "owner".
The goal of wallet software is to generate, interpret and manage these kinds of coins and puzzles.

The next part of this guide will go further in depth in ChiaLisp, and cover how to write more complex puzzles.
If any of the material in this part of the guide has got you confused, try returning to it after the next part.
