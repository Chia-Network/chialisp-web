---
id: cats
title: Chia Asset Tokens (CATs)
---

The **Chia Asset Token (CAT)** is an important puzzle in chia.
It allows for fungible token issuance.
Fungible tokens can be split up or merged together and they will maintain their property of being "marked".
These are often used as credits, or tokens - kind of like casino chips.

The CAT layer is an [outer puzzle](/docs/common_functions) and it wraps an inner puzzle which controls ownership.
Our CAT layer also includes another curryed program which controls issuance rules and allows for different CAT types with many different issuance. This is called the **Token and Asset Issuance Limiter (TAIL)** program.
The TAIL program is a curryed in program which controls issuance rules, and melting rules, and gives a CAT it's type.
Two CATs with the same TAIL program are of the same type.

We will cover the TAIL program in more detail later, but firstly lets cover what the CAT layer does.

## Design choices

* **CATs automatically turn their children into CATs with the same TAIL**  When an inner puzzle returns a CREATE_COIN condition the CAT layer will recognise this and change the condition to a CAT of the same type as itself.
A CREATE_COIN condition returned by the inner puzzle will look like this:
`(51 0xcafef00d amount)`
The CAT layer will then calculate a puzzle hash for a CAT, with the same TAIL as itself, and an inner puzzle of `0xcafef00d`.

* **A SpendBundle of CATs must not gain or lose any value (or be approved by the TAIL program)**  In order to ensure that people aren't printing CAT tokens or melting them without official authentication all CATs which do not use the TAIL program **MUST** be a part of a spend which outputs the same amount of value as its input.
We use a group accounting trick to guarantee this which we cover in more detail below.

* **A CAT must come from a CAT (or be approved by the TAIL program)**  Another way that we prevent CAT tokens being printed in unapproved methods, we must also ensure that a CAT's lineage is valid.
Commonly this is done by asserting that our CAT coin's parent was also a CAT of the same type as us.
We do this by passing in our coin's information, returning an `ASSERT_MY_ID` condition and then passing in our parent information and

* **CATs enforce prefixes for Coin Announcements**  In order to ensure that the CATs can communicate with eachother without interference from an inner puzzle.
They must prepend their coin announcements depending on whether or not they came from the CAT layer or the inner puzzle.
CAT layer coin announcements are prepended with `0xcb`.
Inner puzzle coin announcements are prepended with `0xca`.

* **CATs pass pre-calculated validated Truths to the inner puzzle**  For more complicated inner puzzles they often end up need information such as its coin ID and puzzlehash.
We already calculate many such thingss in the CAT layer, so we bundle together a group of pre-validated information called **Truths** and pass these into the inner puzzle as the first parameter in the solution.

The Truths are:
- My ID - The ID of the coin
- My Parent's ID - The ID of the coin's parent
- My Full Puzzle Hash - The puzzle hash contained inside the coin
- My Amount - The amount of the coin
- My Inner Puzzle Hash - The puzzle hash of the inner puzzle inside this coin's CAT layer
- My Lineage Proof - The optional proof that our parent is a CAT of the same type as us
- My TAIL Solution - The optional list of parameters passed into our TAIL program
- My CAT Struct - A struct containing


## Spend Accounting

Each coin has a truthful calculation of it's own "difference between my amount and my output amount", which is called **Delta** from here on.
Each coin is also told what the sum total of everyone else's Deltas is.

The CAT coins enforce the total Delta is zero using a complex method where they form a ring and communicate with the coin in front of them and behind them using coin announcements.
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

If the Extra Delta value is not `0` and does not cause the TAIL program to fail then it is automatically added on to our reported Delta which we use in our announcement ring.


## The Token and Asset Issuance Limiter (TAIL) Program

The TAIL program is a powerful and flexible program.
It has control over, and access to, many things.
This gives a programmer a lot of control but also a great deal of responsibility.
If the TAIL is not programmed correctly then tokens may be printed by attackers and your assett will become worthless.

The TAIL is passed in:
- Truths
- A flag of whether or not our parent has been validated to be a CAT of the same type as us
- The optional proof that our parent is a CAT of the same type as us
- The Extra Delta value
- The conditions returned by the inner puzzle
- An optional list of opaque parameters called the TAIL solution which is passed into the coin's solution
