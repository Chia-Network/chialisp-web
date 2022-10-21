---
title: Offers
slug: /offers
---

Offers are a way to enable peer-to-peer asset exchange on the Chia blockchain. In other words, you can swap tokens without needing to go through an exchange. Only two parties are required, the maker and the taker. They don't need to trust each other, since any attempts to modify the offer will invalidate it.

## Offer Files

When you create an offer, you get a string of text that is usually stored in a file. This describes the details of the trade, including the assets you are requesting and the assets you are giving in return. This file can be published on various platforms and downloaded by anyone to fulfill in the wallet of their choice. This allows for the flexibility of exchanges, while keeping it fully decentralized and preventing tampering or relying on a third party or middleman.

You can use a wallet to generate an offer file for a given trade, then distribute that offer to platforms such as the following:

- [Dexie](https://dexie.space)
- [OfferPool](https://offerpool.io)
- [OfferBin](https://offerbin.io)
- [HashGreen](https://hash.green)

## Settlement Payments Puzzle

This is the source code of the settlement payments puzzle, which can also be found in the chia-blockchain repository in the puzzle [`settlement_payments.clvm`](https://github.com/Chia-Network/chia-blockchain/blob/164fd158c8626893bc45ba00b87ae69d2ab5f8b7/chia/wallet/puzzles/settlement_payments.clvm).

<details>
  <summary>Expand Settlement Payments Puzzle</summary>

```chialisp title="settlement_payments.clvm"
(mod notarized_payments
  ;; `notarized_payments` is a list of notarized coin payments
  ;; a notarized coin payment is `(nonce . ((puzzle_hash amount ...) (puzzle_hash amount ...) ...))`
  ;; Each notarized coin payment creates some `(CREATE_COIN puzzle_hash amount ...)` payments
  ;; and a `(CREATE_PUZZLE_ANNOUNCEMENT (sha256tree notarized_coin_payment))` announcement
  ;; The idea is the other side of this trade requires observing the announcement from a
  ;; `settlement_payments` puzzle hash as a condition of one or more coin spends.

  (include condition_codes.clvm)

  (defun sha256tree (TREE)
     (if (l TREE)
         (sha256 2 (sha256tree (f TREE)) (sha256tree (r TREE)))
         (sha256 1 TREE)
     )
  )

  (defun create_coins_for_payment (payment_params so_far)
    (if payment_params
        (c (c CREATE_COIN (f payment_params)) (create_coins_for_payment (r payment_params) so_far))
        so_far
    )
  )

  (defun-inline create_announcement_for_payment (notarized_payment)
      (list CREATE_PUZZLE_ANNOUNCEMENT
            (sha256tree notarized_payment))
  )

  (defun-inline augment_condition_list (notarized_payment so_far)
    (c
      (create_announcement_for_payment notarized_payment)
      (create_coins_for_payment (r notarized_payment) so_far)
    )
  )

  (defun construct_condition_list (notarized_payments)
    (if notarized_payments
        (augment_condition_list (f notarized_payments) (construct_condition_list (r notarized_payments)))
        ()
    )
  )

  (construct_condition_list notarized_payments)
)
```

</details>

Offers use the settlement payments puzzle. Its solution is a list of `notarized_payments`.

The `notarized_payments` are structured like this:

```chialisp
((N . ((PH1 AMT1 ...) (PH2 AMT2 ...) (PH3 AMT3 ...))) ...)
```

- `N` is the nonce
- `PH1` is the puzzle hash of the first coin
- `AMT1` is the amount (or value) of the coin being offered
- `...` is an optional memo

For each set of notarized coin payments, this puzzle creates one `CREATE_PUZZLE_ANNOUNCEMENT` condition. For each coin payment within this set, the puzzle creates one `CREATE_COIN` condition.

The reason for creating these conditions is to match the announcements created in the offer file. The `settlement_payments` puzzle is quite versatile, as it can be used as an inner puzzle inside a CAT or NFT, as a puzzle to spend regular XCH, or in order to spend any other assets in Chia's ecosystem.

## Design Decisions

#### Settlement announces required payments {#announcements}

The settlement payments puzzle announces the payments that are required for the transaction to complete, so that it will fail if either party cannot complete their end of the bargain.

#### Offers trade by puzzle not specific coins {#nonspecific}

Payments must be of a certain puzzle with a certain value in mojos, rather than a specific coin. This allows a part of a coin to be sent back as change, and the remainder left up to the offer to claim as its value.

Another benefit of doing it this way is that anyone can accept the offer, rather than it being between two specific parties.

#### It is possible to aggregate offers {#aggregation}

An Automated Market Maker (AMM) can aggregate offers together and complete them simultaneously. This allows someone to request a large amount of a coin and multiple parties who have a smaller amount can complete the transaction. The small amounts add up to the amount requested, and the large amount of the offered value is divided amongst the smaller offers. As long as the terms of each offer are met, how you get there doesn't matter.

## Advantages

Offers have many properties that we think will make them a valuable tool for Chia's community.

### Secure

When using Chia offers, makers and takers retain control of their private keys, as well as their assets. By contrast, centralized exchanges require users to transfer their funds to an account that the exchange controls. If the exchange is hacked or simply goes out of business, users can lose their funds. With Chia offers, self-custody of keys and funds is assured.

:::note
Offer files do not contain private keys or any way to deduce them.

If an offer file falls into a hacker's hands, they only have two options like anyone else:

- Ignore the offer
- Accept it

:::

### Immutable

Once an offer file is created, any alterations to the file will invalidate it.

The offer file only has two possible outcomes:

1. The taker accepts the offer as-is and the transaction is processed
2. The maker cancels the offer

The offer will be in a pending state until either outcome is fulfilled. It is possible that the offer never is completed or canceled.

:::note
Takers are free to propose a counter offer by creating their own offer file. In this case, the original maker could cancel the original offer, and both parties' roles would be reversed.
:::

### Compliant

As offers are inherently peer-to-peer, they don't constitute an exchange or other regulated market activity.

### Trustless

Offers are _not_ analogous to a handshake or a promise, where one party could renege on the trade. By using Chia offers, the maker and taker don't need to trust each other. They don't even need to _know_ each other. As long as a taker matches the offer identically, the offer will be valid.

### Simultaneous

The maker's and taker's transactions must happen in the same block. In Chia, all transactions conducted within a single block happen simultaneously. This eliminates one type of maximum extractable value (MEV), where validators can increase their fees by re-ordering transactions.

### Non-Custodial

Neither the maker nor taker are required to send their funds to a trusted intermediary, such as an escrow service or an exchange. This removes the need for Over The Counter (OTC) desks and other middlemen, who require their customers to submit funds before they allow transactions to complete.

### Commission-Free

Because offers don't use escrow services or other middlemen, there are also none of the typical fees associated with those intermediaries. However, offers _are_ subject to Chia blockchain transaction fees, just like all transactions.

### Multi-Asset

A maker can create an offer for multiple assets on both ends of the offer. For example, they could offer 1 XCH and 1.75 CKC for 100,000 SBX and 3 MRMT.

## Offer States

An offer has six potential states:

**PENDING_ACCEPT** - The maker has created the offer, but a taker has not yet accepted it. The maker's wallet has reserved the coin(s) to be spent. The spend bundle for the offer has not been sent to the mempool.

**PENDING_CONFIRM** - The taker has accepted the offer. The taker's wallet has reserved the coin(s) to be spent. The completed spend bundle has been sent to the mempool.

**PENDING_CANCEL** - The maker has attempted to cancel the offer by spending the coins being offered. The completed spend bundle has been sent to the mempool.

**CANCELLED** - Depending on which [type of cancellation](#cancellation) has been used, either:

- The maker's wallet has released the coins it had been reserving for this offer
- The maker's coins have been spent and new ones have been created in the maker's wallet

**CONFIRMED** - The maker's and taker's reserved coins have been spent in the same spend bundle. The offer has been completed successfully.

**FAILED** - The taker attempted, and failed to accept the offer. This could have happened either because the maker cancelled the offer, or because another taker took the offer first.

## Cancellation

There are two ways to cancel an offer, depending on the circumstances.

If the offer is already publicly available, it will have to be cancelled on-chain. This is done by spending the coins involved in the offer to (which make the notarized payments invalid).

Otherwise, it is trivial to simply delete the offer or not share the file, as it is not stored anywhere publicly and therefore can't be accepted.

## Arbitrage

It is possible to accept an offer, then create or accept another offer in a way that you make a profit. This is known as arbitrage, and drives supply and demand. However, old offers are at risk unless they are cancelled because the price can change in the time it's sitting around.

A possible solution for this is a price oracle, which would stabilize the prices and keep them up to date.

## Market Makers

Offers in the `PENDING_CONFIRM` state have been added to the mempool. Farmers and third-party software can observe the current list of offers, and aggregate overlapping ones. This operation is known as a "market maker."

Automated Market Makers (AMMs) are likely to appear in Chia's ecosystem. AMMs can create a single settlement puzzle for each type of asset (for example XCH or a specific type of CAT), and aggregate all of the notarized coin payments of that type in the puzzle.

A taker is part offer-creator, part market-maker. A taker finds an offer of interest and constructs the other side of that offer, using both of the `settlement_payments` puzzles to resolve the cross-asset payments.

### Offer Aggregation

A sophisticated AMM might aggregate multiple `settlement_payments` into a single spend, which means it could combine an arbitrary number of offers, paying through one `settlement_payments` ephemeral coin for each asset type.

For example, a whale wants to buy 10,000 XCH, and is currently sitting on a large stack of stablecoins. There aren't any individuals willing to sell such a large amount of XCH, but the whale doesn't need to create a bunch of small offers. Instead, they create a single offer: X stablecoins (at the current market price) for 10,000 XCH. Several small XCH holders can aggregate their holdings to complete the offer.

## Creating Offer Files

Here's the basic workflow to create an offer file:

1. The maker uses either the wallet GUI or CLI to create the terms for an offer. For example, the maker might offer 1 XCH for 251 CKC. If the maker doesn't have sufficient funds, an error is thrown.

2. The maker's wallet selects the appropriate coin(s) to spend, starting with the largest coin available.

3. For each coin the maker wants to receive from the offer, the maker's wallet creates a notarized coin payment. This is a list in the form of `(PH1 AMT1 ...)`, where:

   - `PH1` is the puzzle hash of the coin the maker wants to acquire.
   - `AMT1` is the value of the coin the maker wants to acquire.
   - `...` is an optional memo of arbitrary length. The trade manager adds a hint to itself in this memo.

4. The maker's wallet creates a nonce `N`, using the treehash of a sorted list of the coinIDs of each coin being offered.

:::info
If you're unfamiliar with them, Wikipedia has a good explanation of [Cryptographic nonces](https://en.wikipedia.org/wiki/Cryptographic_nonce).
:::

Every coin id needs to be included in the nonce to prevent the maker from creating two offers that can both be completed with just one payment.

:::note
Even if two conflicting offers were created, the blockchain would correctly reject one of them as a double-spend.
:::

Because each coin id must be unique, any attempts to change any of the coins being offered will cause the offer to become invalid.

5. The maker's wallet combines the nonce with the notarized coin payment(s) to create a list called `notarized_payments`. For example, if three coins are included in the maker's offer, `notarized_payments` will be structured like this:

```chialisp
((N . ((PH1 AMT1 ...) (PH2 AMT2 ...) (PH3 AMT3 ...))) ...)
```

6. The offer driver calculates the announcements that need to be asserted in order to get paid.

7. The maker's wallet creates a spend bundle paying the puzzle hash of the settlement payments puzzle. Finally, the offer file is created, using `notarized_payments` and the spendbundle.

8. The offer file is now complete. The maker can send this file anywhere others might see it, including social media, message boards, or a website dedicated to maintaining a list of current offers.

9. The offer's status is now `PENDING_ACCEPT`. In order for the offer to be completed, it still requires a `CREATE_PUZZLE_ANNOUNCEMENT` condition for the whole puzzle, and a `CREATE_COIN` condition for each type of asset to be received. The maker's coin(s) can't be spent until a taker creates these conditions.

## Accepting Offer Files

The offer file can be named anything, and it contains a bech32 address for an incomplete spend bundle.

The taker still must perform several steps before the offer can be confirmed:

**View the Offer** - The taker needs to validate the terms of the offer before choosing whether to accept it. This can be done using either Chia's wallet GUI or the CLI. In either case, the taker can choose whether to load the offer file or paste its contents.

**Validate the Offer** - When the offer is loaded into the taker's wallet, the wallet verifies that the offer is valid by checking that the Maker's coins have not been spent. If any coins have been spent, the wallet will show an error that the offer is no longer valid. If the offer is still valid, the taker's wallet displays the offer's terms and asks whether the taker will accept it.

**Create a Spend Bundle** - If the taker accepts, then the taker's wallet creates a new spend bundle with a combination of both the maker's and taker's ends of the offer. The offer's status is now `PENDING_CONFIRM`.

**Push the Spend Bundle** - The taker's wallet pushes the spendbundle to the blockchain. After the spend bundle succeeds, all of the relevant coins have been spent or created, and all assertions have been completed. At this point, the offer's status is `CONFIRMED`.

## Conclusion

Offers are a refreshing new way to swap tokens in a decentralized way without a third party exchange or placing trust in others. They can be shared in any method you choose and accepted by anyone without worrying about the offer being tampered with.
