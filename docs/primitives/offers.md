---
title: Offers
slug: /offers
---

Offers are a way to enable peer-to-peer asset exchange on the Chia blockchain. In other words, you can swap tokens without needing to go through an exchange. Only two parties are required, the maker and the taker. They don't need to trust each other, since any attempts to modify the offer will invalidate it.

## Chialisp Code

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

## Design Decisions

#### Settlement announces required payments {#announcements}

The settlement payments puzzle announces the payments that are required for the transaction to complete, so that it will fail if either party cannot complete their end of the bargain.

#### Offers trade by puzzle not specific coins {#nonspecific}

Payments must be of a certain puzzle with a certain value in mojos, rather than a specific coin. This allows a part of a coin to be sent back as change, and the remainder left up to the offer to claim as its value.

Another benefit of doing it this way is that anyone can accept the offer, rather than it being between two specific parties.

#### It is possible to aggregate offers {#aggregation}

An Automated Market Maker (AMM) can aggregate offers together and complete them simultaneously. This allows someone to request a large amount of a coin and multiple parties who have a smaller amount can complete the transaction. The small amounts add up to the amount requested, and the large amount of the offered value is divided amongst the smaller offers. As long as the terms of each offer are met, how you get there doesn't matter.

## Offer Files

Offers are implemented through what's known as an offer file, which contains the details of the offer in hexadecimal bytecode. They can be shared publicly since they don't contain any private keys.

You can use a wallet to generate an offer file for a given trade, then distribute that offer to platforms such as the following:

- [Dexie](https://dexie.space)
- [OfferPool](https://offerpool.io)
- [OfferBin](https://offerbin.io)
- [HashGreen](https://hash.green)

## Cancellation

There are two ways to cancel an offer, depending on the circumstances.

If the offer is already publicly available, it will have to be cancelled on-chain. This is done by spending the coins involved in the offer to (which make the notarized payments invalid).

Otherwise, it is trivial to simply delete the offer or not share the file, as it is not stored anywhere publicly and therefore can't be accepted.

## Arbitrage

It is possible to accept an offer, then create or accept another offer in a way that you make a profit. This is known as arbitrage, and drives supply and demand. However, old offers are at risk unless they are cancelled because the price can change in the time it's sitting around.

A possible solution for this is a price oracle, which would stabilize the prices and keep them up to date.

## Conclusion

Offers are a refreshing new way to swap tokens in a decentralized way without a third party exchange or placing trust in others. They can be shared in any method you choose and accepted by anyone without worrying about the offer being tampered with.
