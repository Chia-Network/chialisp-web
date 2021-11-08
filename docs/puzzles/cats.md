---
id: cats
title: Chia Asset Tokens (CATs)
---

The **Chia Asset Token (CAT)** is an important puzzle in chia -- CATs allow for fungible token issuance.

    REMINDER: Fungible tokens can be split apart, or merged together.
    They can also be substitued for a token of equal value.
    Some common examples include gold, oil, and dollars.
    
    Non-fungible tokens (NFTs), on the other hand, are indivisible and cannot be merged.
    They are unique, so they cannot be substituted.
    Some common examples include cars, baseball cards, and cloakroom tickets.

CATs have the property of being "marked" in a way that makes them unusable as regular XCH. However, it is usually possible to "melt" CATs back into XCH later. CATs are often used as credits, or tokens - kind of like casino chips.

The CAT layer is an [outer puzzle](https://github.com/Chia-Network/chialisp-web/blob/main/docs/common_functions.md), which contains two curryed parameters:
1. An inner puzzle, which controls the CAT's ownership.
2. The puzzlehash of a **Token and Asset Issuance Limiter (TAIL)**. This puzzle defines three aspects of the CAT:
   * The CAT's type. (Two CATs with the same TAIL are of the same type, even if they contain different inner puzzles.)
   * The CAT's issuance rules.
   * The CAT's melting rules.

We will cover the TAIL program in more detail later, but first let's cover what the CAT layer does.


## Design choices

* **When a CAT is spent, any coins created automatically become CATs with the same TAIL**
  
  When an inner puzzle returns a CREATE_COIN condition, the CAT layer will recognise this and change the condition to a CAT of the same type as itself.
  
  For example, let's say the inner puzzle returns the following CREATE_COIN condition:
`(51 0xcafef00d amount)`

  In this case, the CAT layer will calculate a puzzle hash for a CAT with the same TAIL as itself, and an inner puzzle of `0xcafef00d`.

* **If a CAT does not use a TAIL, then a SpendBundle of CATs must not gain or lose any value**

  In order to ensure that a CAT cannot be printed or melted without official authentication, all CATs that do not use a TAIL program **MUST** be a part of a spendbundle that outputs the same amount of value as its input.
We use a group accounting trick to guarantee this, which we will cover in more detail below.

* **If a CAT is not approved by a TAIL program, then its parent must be a CAT of the same type**

  Another way we prevent CAT tokens being printed in unapproved methods is to ensure that it has a valid lineage. Commonly this is done by asserting that the CAT coin's parent was also a CAT of the same type.

  This is accomplished by passing in the coin's information, returning an `ASSERT_MY_ID` condition, and then passing in the parent information.

* **CATs enforce prefixes for Coin Announcements**

  In order to ensure that the CATs can communicate with each other without interference from an inner puzzle, they must prepend an appropriate coin announcement with the following rules:
  * If the announcement comes from the CAT layer, it is prepended with `0xcb`.
  * If the announcement comes from the inner puzzle, it is prepended with `0xca`.

* **CATs pass a list of pre-calculated Truths to the inner puzzle**

  Many inner puzzles require information such as their coin ID and puzzlehash. Luckily, we already calculate much of this information in the CAT layer, so we bundle it together as a pre-validated collection of **Truths**. We then pass these Truths into the inner puzzle as the first parameter in the solution.

  The Truths are:
  - My ID - The ID of the coin
  - My Parent's ID - The ID of the coin's parent
  - My Full Puzzle Hash - The puzzle hash contained inside the coin
  - My Amount - The value of the coin
  - My Inner Puzzle Hash - The puzzle hash of the inner puzzle inside this coin's CAT layer
  - My Lineage Proof - (optional) Proof that the CAT's parent is of the same type as the CAT
  - My TAIL Solution - (optional) A list of parameters passed into the TAIL program
  - My CAT Struct
  - My Coin Info
  - CAT Mod Hash - The hash of the CAT before anything is curryed
  - CAT Mod Hash Hash - The hash of the Mod Hash
  - CAT TAIL Program Hash - The hash of the TAIL program that was curryed into the CAT


## Spend Accounting

Each coin has a truthful calculation of it's own "difference between my amount and my output amount", which is called **Delta** from here on.
Each coin is also told what the sum total of everyone else's Deltas is.

The CAT coins enforce the total Delta is zero using a complex method where they form a ring.
Each coin has a next and previous neighbour, and then their neighbour has a neighbour.
This loops, so in a spend bundle with 2 coins Coin A would use Coin B as both its next and previous neighbour.

In this ring they communicate with the coin in front of them and behind them using coin announcements.
Coin Announcements implicitly contain the information about which coin created them, however for our usecase we want to also ensure that the announcement's message contains a coin ID of its intended recipient as a part of the message.
This prevents attacks where coins can receive messages that weren't intended for them.

To form the ring every coin outputs the following conditions:
```
(
  (CREATE_COIN_ANNOUNCEMENT previous_coin_ID + sum_of_deltas_before_me)
  (ASSERT_COIN_ANNOUNCEMENT sha256(next_coin_id + my_coin_id + sum_of_deltas_including_me))
)
```
Where `+` represents concatenation of bytes and announcement assertions take the hash of the announcement creator's ID and message.

As part of this ring we also calculate the `next_coin_id` using the next coin's inner puzzle and wrapping it with our CAT informamtion so we can guarantee that that coin ID is a CAT of the same type as us, and therefore acting by the same rules and telling the truth.
This, in turn, guarantees that the whole ring is telling the truth and if the ring of sums of deltas connects then that means that the total delta must be 0.

For a formal proof of this see [Lipa's paper](TODO: ADD LIPAS PAPER)


## Extra Delta

There are a couple of exceptional cases for spends.
- Minting coins
- Melting coins
To allow for these cases we allow misreporting of your coin's delta if the amount that you are misreporting by is approved by the TAIL program.
We the name for this permitted difference is called the **Extra Delta**.
This is on of many parameters passed to the TAIL program, and it is up to the TAIL program to evaluate whether to permit it or fail out with an `(x)` call.

If the Extra Delta value in the solution does not cause the TAIL program to fail then it is automatically added on to our reported Delta which we use in our announcement ring.
For safety we force the TAIL program to be run in the case that Extra Delta is anything other than `0`.
If the TAIL program is not revealed and Extra Delta is not `0` then the puzzle will fail.


## The Token and Asset Issuance Limiter (TAIL) Program

The TAIL program is a powerful and flexible program.
It has control over, and access to, many things.
This gives a programmer a lot of control but also a great deal of responsibility.
If the TAIL is not programmed correctly then tokens may be printed by attackers and your assett will become worthless.

The TAIL is passed in:
- Truths
- A flag of whether or not our parent has been validated to be a CAT of the same type as us
- The optional proof that our parent is a CAT of the same type as me
- The Extra Delta value
- The conditions returned by the inner puzzle
- An optional list of opaque parameters called the TAIL solution which is passed into the coin's solution

Although the TAIL is powerful, it is **not necessarily** run every time the coin is spent.
It is run if it is revealed in the solution.
It is required if extra_delta is not `0` or if the lineage_proof is not present.

The TAIL should check diligently for the following things:
- Is the Extra Delta minting or melting any coins, and if so do I approve?
- If this coin's parent is not a CAT of the same as me, do I approve?
- Do I want to add any conditions?
- Do I want to change any of the conditions returned by the inner puzzle?
