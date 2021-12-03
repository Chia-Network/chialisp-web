---
id: cats
title: Chia Asset Tokens (CATs)
---

Contents:

* [Introduction to CATs](#introduction-to-cats)
* [Design choices](#design-choices)
* [Spend Accounting](#spend-accounting)
* [Extra Delta](#extra-delta)
* [The Token and Asset Issuance Limiter (TAIL) Program](#the-token-and-asset-issuance-limiter-tail-program)
* [The limits of a TAIL's power](#the-limits-of-a-tails-power)
* [TAIL Examples](#tail-examples)
* [CAT denominations, value, and retirement rules](#cat-denominations-value-and-retirement-rules)
* [Conclusion](#conclusion)

-----
## Introduction to CATs

**Chia Asset Tokens (CATs)** are fungible tokens that are issued from XCH.
The CAT1 Standard is the first (and so far only) CAT Standard. CAT1 is a draft standard as of Nov 16, 2021. After a comment period from the Chia community, CAT1 will be finalized. This may include additional capabilities, and could result in some breaking changes to existing CATs. More information on the naming conventions used in this document can be found [here](https://www.chia.net/2021/09/23/chia-token-standard-naming.en.html "Blog entry explaining CAT1 naming conventions").

>**Reminder:**
>
>>**Fungible tokens** can be split apart, or merged together.
>>They can also be substituted for a token of equal value.
>>Some common examples include gold, oil, and dollars.
>    
>>**Non-fungible tokens**, on the other hand, are indivisible and cannot be merged.
>>They are unique, so they cannot be substituted.
>>Some common examples include cars, baseball cards, and cloakroom tickets.

CATs have the property of being "marked" in a way that makes them unusable as regular XCH. However, it is usually possible to "melt" CATs back into XCH later. CATs are often used as credits, or tokens - kind of like casino chips.

The chialisp code that **all CATs** share is [here](https://github.com/Chia-Network/chia-blockchain/blob/protocol_and_cats_rebased/chia/wallet/puzzles/cat.clvm "cat.clvm - the source code that all CATs share"). Without following this puzzle format, wallets will not be able to recognize a token as a CAT.

The entire purpose of the code linked above is to ensure that the supply of a specific CAT never changes unless a specific set of “rules of issuance” is followed. Each CAT has its own unique rules of issuance, **which is the only distinction between different types of CATs**. These issuance rules take the form of an arbitrary Chialisp program that follows a specific structure.  We call that program the **Token and Asset Issuance Limitations (TAIL)**.

The CAT layer is an [outer puzzle](https://chialisp.com/docs/common_functions#outer-and-inner-puzzles "Chialisp documentation for how to create outer and inner puzzles"), which contains two curried parameters:
1. An inner puzzle, which controls the CAT's ownership.
2. The puzzlehash of a TAIL, which defines three aspects of a CAT:
   * The CAT's type. (Two CATs with the same TAIL are of the same type, even if they contain different inner puzzles.)
   * The CAT's issuance rules.
   * The CAT's melting rules.

Some examples of issuance requirements that different TAILs could accommodate include:
  * Stablecoins - The creator will want to mint new tokens as they gain funds to back them.
  * Limited supply tokens - The creator will want to run a single issuance, with the guarantee that no more tokens of the same type can ever be minted.
  * Asset redemption tokens - The creator will want to allow the CAT's owners to melt the tokens into standard XCH, as long as they follow certain rules.

In all of these cases, the TAIL program is run when a coin is spent to check if the issuance is valid.

We will cover the TAIL program in more detail later, but first let's cover what the CAT layer does.


## Design choices

* **When a CAT is spent, any coins created automatically become CATs with the same TAIL**
  
  When an inner puzzle returns a CREATE_COIN condition, the CAT layer will recognize this and change the condition to a CAT of the same type as itself.
  
  For example, let's say the inner puzzle returns the following CREATE_COIN condition:
`(51 0xcafef00d amount)`

  In this case, the CAT layer will calculate a puzzlehash for a CAT with the same TAIL as itself, and an inner puzzle of `0xcafef00d`.

* **If a CAT does not use a TAIL, then a SpendBundle of CATs must not gain or lose any value**

  In order to ensure that a CAT cannot be minted or retired without official authentication, all CATs that do not use a TAIL program **MUST** be a part of a spendbundle that outputs the same amount of value as its input.
We use a group accounting trick to guarantee this, which we will cover in more detail below.

* **If a CAT is not approved by a TAIL program, then its parent must be a CAT of the same type**

  Another way we prevent CATs from being minted in unapproved methods is by ensuring that the tokens have a valid lineage. Commonly this is done by asserting that the CAT's parent was also a CAT of the same type.

  This is accomplished by passing in the coin's information, returning an `ASSERT_MY_ID` condition, and then passing in the parent information.

* **CATs enforce prefixes for Coin Announcements**

  In order to ensure that the CATs can communicate with each other without interference from an inner puzzle, they must prepend an appropriate coin announcement with the following rules:
  * If the announcement comes from the CAT layer, it is prepended with `0xcb`.
  * If the announcement comes from the inner puzzle, it is prepended with `0xca`.

* **CATs pass a list of pre-calculated Truths to the inner puzzle**

  Many inner puzzles require information such as their coin ID and puzzlehash. Luckily, we already calculate much of this information in the CAT layer, so we bundle it together as a pre-validated collection of **Truths**. We then pass these Truths into the inner puzzle as the first parameter in the solution.

  The Truths are:
  * My ID - The ID of the coin
  * My Parent's ID - The ID of the coin's parent
  * My Full Puzzle Hash - The puzzlehash contained inside the coin
  * My Amount - The value of the coin
  * My Inner Puzzle Hash - The puzzlehash of the inner puzzle inside this coin's CAT layer
  * My Lineage Proof - (optional) Proof that the CAT's parent is of the same type as the CAT
  * My TAIL Solution - (optional) A list of parameters passed into the TAIL program
  * My Coin Info
  * CAT Mod Hash - The hash of the CAT before anything is curried
  * CAT Mod Hash Hash - The hash of the CAT Mod Hash
  * CAT TAIL Program Hash - The hash of the TAIL program that was curried into the CAT


## Spend Accounting

Each CAT coin has a truthful calculation of the difference between its amount and its output amount, called its **Delta**.

The CAT coins also are given the sum of every other coin's Deltas, which must be zero. In order to enforce this zero-Delta rule, each CAT coin is assigned a Next and Previous neighbor, which ultimately forms a ring.

The coins use Coin Announcements to communicate with their neighbors. For our use case, the announcements must contain two pieces of information:
  * The ID of the coin that created this coin. This is already implicitly contained in the Coin Announcement.
  * The intended recipient's coin ID. The announcement's message must contain this information in order to prevent attacks where coins can receive messages that weren't intended for them.

To form the ring, every coin outputs the following conditions:
```
(
  (CREATE_COIN_ANNOUNCEMENT previous_coin_ID + sum_of_deltas_before_me)
  (ASSERT_COIN_ANNOUNCEMENT sha256(next_coin_id + my_coin_id + sum_of_deltas_including_me))
)
```
Where `+` represents concatenation of bytes, and announcement assertions take the hash of the announcement creator's ID and message.

In order to create the `next_coin_id`, we wrap the next coin's inner puzzle with the current coin's CAT information. This guarantees that the next_coin_id is a CAT of the same type as the current coin.

Because both coins follow the same CAT module code, they must comply with the same set of truths. This, in turn, guarantees that the whole ring is telling the truth. As long as the ring is connected, the total Delta must be zero.


## Extra Delta

There are two exceptions to the aforementioned zero-Delta rule:
  * Minting coins (creating CATs from XCH)
  * Retiring coins (melting CATs to their original XCH form)

To account for these cases, the TAIL program may approve a misreporting of a CAT coin's Delta by a specific amount, called the **Extra Delta**. This is one of the parameters passed to the TAIL program.

There are a few rules to ensure that extra coins are not minted or retired:
  * If the Extra Delta is anything other than `0`, the TAIL program is forced to run. It must evaluate whether to permit the Extra Delta, or fail with an `(x)` call.
  * If the Extra Delta value in the solution does not cause the TAIL program to fail, then it is automatically added to the reported Delta, which is used in the announcement ring.
  * If the TAIL program is not revealed and the Extra Delta is not `0`, then the puzzle will fail.


## The Token and Asset Issuance Limiter (TAIL) Program

The TAIL program is powerful and flexible. It has control over, and access to, many things. This gives a programmer a lot of control, but also a great deal of responsibility.

>**Warning**: If the TAIL is not programmed correctly,
>then tokens may be minted by attackers,
>rendering the asset worthless.

A TAIL should follow all of the conventional rules of security that any Chialisp program responsible for locking up money should follow.

Several parameters must be passed to a TAIL's solution:
  * Truths - These are bundled together, as explained above
  * parent_is_cat - A flag indicating whether the parent has been validated as a CAT of the same type as this CAT
  * lineage_proof - (optional) Proof that the parent is a CAT of the same type as this CAT
  * delta - The Extra Delta value, as explained above
  * inner_conditions - The conditions returned by the inner puzzle
  * tail_solution - (optional) A list of opaque parameters

Although the TAIL is powerful, it is **not necessarily** run every time the coin is spent. The TAIL is run if a "magic" condition is created in the inner puzzle. This "magic" condition is required to prevent people who can spend the TAIL from intercepting the spend and changing it against the spender's will.

The TAIL should check diligently for the following things:
  * Is the Extra Delta minting or retiring any coins, and if so, do I approve?
  * If this coin's parent is not a CAT of the same type as me, do I approve?

## The limits of a TAIL's power

In Ethereum, a token's issuer might have the ability to freeze or confiscate funds without the owner's permission. This is not possible in Chia. Let's explore why.

In Chia, an issuer creates a TAIL, which lives inside all CATs of the same type, including those that have already been distributed. However, the issuer does not have the power to spend coins they do not own. A TAIL can only run as the last step in a CAT's spend, and the owner of the CAT (and not the issuer) is responsible for providing its solution. This means that only the owner can run the TAIL. Therefore, the CAT's owner is the only one with the ability to complete the spend.

This decision adds some decentralization for users. It also adds some complexity. The importance of creating a well-constructed TAIL cannot be emphasized enough. Once you have distributed a CAT, it is no longer possible to change the TAIL across the entire token supply. The TAIL is locked into the same set of rules forever. To change the TAIL would be tantamount to replacing physical cash in circulation. You would have to offer an exchange for new tokens and eventually deprecate the old token, even if some people still carry it.

It also means that if the set of rules is compromised, people may be able to mint or retire CATs maliciously. There’s no easy way to “patch” the TAIL, other than through the process above, which is obviously best avoided.

## TAIL Examples

The CAT1 standard currently includes three example TAILs, though many more are possible.

* [One-Time Minting](https://github.com/Chia-Network/chia-blockchain/blob/protocol_and_cats_rebased/chia/wallet/puzzles/genesis-by-coin-id-with-0.clvm "Chialisp code for the One-Time Minting TAIL")

  The default way in which we currently issue CATs is with a TAIL that only allows coin creation from a specific coin ID. In Chia, coins can only be spent once, so this results in a one-time minting of a CAT. After the issuance, there will never be any more or less of the CAT, and no one will be able to run the same TAIL ever again.

* [Everything With Signature](https://github.com/Chia-Network/chia-blockchain/blob/protocol_and_cats_rebased/chia/wallet/puzzles/everything_with_signature.clvm "Chialisp code for the Everything With Signature TAIL")
  
  The polar opposite of the TAIL above is the ability of the creator to do whatever they want, as long as they provide a signature from their public key. This key is curried into the TAIL, which returns a single AGG_SIG_ME condition asking for a matching signature. If the creator can provide that signature, then the spend passes and any supply rules that were violated are ignored.
  
  Keep in mind that AGG_SIG_ME only allows the signature to work on a single coin. Therefore, the creator cannot release a signature for everyone to use; instead the creator must personally sign every TAIL execution.

* [Delegated TAIL](https://github.com/Chia-Network/chia-blockchain/blob/protocol_and_cats_rebased/chia/wallet/puzzles/delegated_genesis_checker.clvm "Chialisp code for the Delegated TAIL")

  This is the best balance of security and flexibility that we currently have. The Delegated TAIL is similar to the "Everything With Signature" example, except instead of requiring a signature from a specific coin, it requires a signature from a specific puzzlehash. When the puzzlehash has been signed, the creator may run that puzzle in place of the TAIL.
  
  This TAIL allows the creator to create new TAILs that they can use with the CAT, even if those TAILs didn't exist during the initial issuance! For example, the creator could create:
  
  * A single minting
  * A DID to mint new coins
  * Anything else they want!
  
  Note that we use AGG_SIG_UNSAFE in order to make this signature work for all coins. The creator can publish a valid signature, allowing any owner of the CAT to run the TAIL on their own. One scenario where this is useful is in redemption schemes -- you want to allow people to melt their CATs into XCH as long as they follow certain rules when they do so.
  
  There is another consideration to make when you are signing new Delegated TAILs. Once you sign it and publish the signature, it is out there forever. Be careful what permissions you grant because you can never take them back.
  
## CAT denominations, value, and retirement rules

Some design decisions regarding the granularity and denomination of CATs versus XCH:

* Most Chia wallets choose to display their value in XCH. However, this is a purely cosmetic choice because Chia's blockchain only knows about mojos. One XCH is equal to one trillion (1,000,000,000,000) mojos.
* In a similar vein, a default decision was made to map 1 CAT to 1000 XCH mojos. By default, this ratio will be the same for all CATs.
* It is possible to set the CAT:mojo ratio to something other than 1:1000 for a specific CAT, but doing so could negatively affect interoperability between tokens. We recommend that you use the default setting unless you have a good reason to do otherwise.
* Therefore, the default melt value of a single token is 1000 mojos. This remains true regardless of the token's face value or its circulating supply.
* A token's face value and its melt value are not necessarily correlated, let alone matched.

By analogy, on multiple occasions the US Treasury has floated the idea of minting a $1 trillion coin made from platinum. Leaving aside the practical implications of doing this, the magnitude of the difference between this hypothetical coin's face value and melt value would be similar to that of CATs and XCH. The coin would be worth $1 trillion dollars, but if someone melted it and sold the platinum, they'd only receive a minuscule fraction of that amount.

On the other end of the spectrum, consider the US penny. Its base metals (97.5% zinc and 2.5% copper) are worth around two cents. So in theory, if you could melt a penny into zinc and copper while minimizing your costs, you could sell these metals for a sizable profit.

**The value of XCH and CATs**

The face value of both XCH and CATs is market-driven -- the coins are worth whatever someone is willing to pay for them.

If a CAT achieves a certain level of financial success, its face value will be greater than its melt value, just like the $1 trillion coin would be worth more than the metal it was minted from. For example:

* A meme token could trade for one-millionth of an XCH, or 1,000,000 mojos. The token is worth very little money, but it's still 1000 times more valuable than its melt value of 1000 mojos.
* A dollar-backed stablecoin will have a face value of $1. Its melt value will be 1000 mojos.
* A highly successful token could even sell for more than one XCH -- there are no rules preventing this from happening. Its melt value would still be 1000 mojos.

One real-world analogy for these three cases is that you could start with a piece of metal and mint a coin worth a fraction of a cent, or $1, or $10,000, or really any other value. But no matter the face value, the melt value would always remain the same.

**CAT retirement use cases and rules**

It's important to keep in mind that a CAT's TAIL (and nothing else) decides the rules for retirement, _if_ it allows retirement at all. For example, our single-mint TAIL only works with a specific coin, so it does not allow retirement. CATs that use this TAIL can never be melted, no matter how small their face value.

Our delegated TAIL leaves it entirely up to the CAT's creator whether -- and how -- retirement can happen.

Beyond our pre-packaged examples, TAILs with a wide range of functionality are also possible. To illustrate just some of this functionality, let's consider four potential reasons for retirement, along with who gets to retire the tokens:

**1. Removal from circulation (must be the creator AND owner)**

  For certain categories of CATs (for example, stablecoins and redemption tokens), retirement will be allowed, but only by the creator, who also must own the tokens. In the case of a stablecoin, the creator may need to remove some tokens from circulation if backing funds are reduced. For redemption tokens, the owner may exchange a token with the creator for something of value. The token no longer has any face value, so its creator will remove it from circulation.

**2. Value exchange (must be the owner)**

  Some CATs might allow their owners to melt tokens in order to gain something else of value, for example NFTs or other CATs. In fact, an entire marketplace could emerge from this concept. Some possible examples:

  * The creator of a set of NFTs also creates a small issuance of "golden tickets" that can be used to pick out any individual NFT before the set is made publicly available.
  * A celebrity mints some tokens that can be exchanged for something of non-monetary value, such as a meeting with said celebrity.
  * The holder of a CAT must submit a "proof of melt" in order to enter a contest.

**3. Ephemeral tokens (must be the creator OR a preset algorithm)**

  A CAT could be created as a limited-time offer or as a game of Musical Chairs. In these cases, tokens would be melted _against the owner's will_. This could be done either at random or as a deliberate type of slashing. 

**4. Melt-value retrieval (must be the owner)**

  If a CAT is not financially successful, its melt value could exceed its face value, in the same way that the metals that compose a US penny are worth more than one cent. In this case, it might make financial sense for the CAT's owner to retire a token by melting it into 1000 XCH mojos. Because of the low default melt value of tokens, this motivation for melting will likely be rare.

In each of these examples, the rules of retirement for a specific CAT are clearly spelled out in the TAIL. If a TAIL allows for retirement against the owner's will, the owner will be able to ascertain this information before acquiring the token.


## Conclusion

The CAT1 standard is an exciting addition to Chia's ecosystem. It allows near-limitless functionality for issuing fungible tokens. We're excited to see what kind of creative ideas the Chia community comes up with!
