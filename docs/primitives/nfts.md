---
title: NFTs
slug: /nfts
---

NFTs are non-fungible tokens that are minted on the Chia blockchain. The NFT puzzle ensures that there is only ever one copy of a given NFT, and it cannot be divided into multiple coins.

They can be used to prove digital ownership of files such as images or videos, as well as the metadata and license pertaining to the file.

## Code Examples

### chia-blockchain

The official Chia wallet has a reference implementation for the following in Python:

- [Mint NFT](https://github.com/Chia-Network/chia-blockchain/blob/010cedf83718aa8e4d97da76f892fe69387a5d82/chia/wallet/nft_wallet/nft_wallet.py#L321)
- [Bulk mint NFTs](https://github.com/Chia-Network/chia-blockchain/blob/010cedf83718aa8e4d97da76f892fe69387a5d82/chia/wallet/nft_wallet/nft_wallet.py#L1242)
- [Spend NFT](https://github.com/Chia-Network/chia-blockchain/blob/010cedf83718aa8e4d97da76f892fe69387a5d82/chia/wallet/nft_wallet/nft_wallet.py#L606)

### chia-rs

The wallet code used by the [MonsterSprouts example game](https://github.com/Chia-Network/MonsterSprouts) has the following reference methods:

- [Puzzle and solution types](https://github.com/Chia-Network/chia_rs/blob/wallet-dev/chia-primitives/src/primitives/nft.rs)
- [Bulk mint NFTs](https://github.com/Chia-Network/chia_rs/blob/wallet-dev/chia-wallet/src/wallet.rs#L665)
- [Spend NFT](https://github.com/Chia-Network/chia_rs/blob/2334c842f694444da317fa7432f308f159f62d70/chia-wallet/src/wallet.rs#L1053).

## NFT Code {#code}

This is the source code of the NFT state layer, which can also be found in the chia-blockchain repository in the puzzle [`nft_state_layer.clvm`](https://github.com/Chia-Network/chia-blockchain/blob/164fd158c8626893bc45ba00b87ae69d2ab5f8b7/chia/wallet/puzzles/nft_state_layer.clvm).

<details>
  <summary>Expand NFT State Puzzle</summary>

```chialisp title="nft_state_layer.clvm"
(mod (
    NFT_STATE_LAYER_MOD_HASH
    METADATA
    METADATA_UPDATER_PUZZLE_HASH
    INNER_PUZZLE
    inner_solution
  )

  (include condition_codes.clvm)
  (include curry-and-treehash.clinc)
  (include utility_macros.clib)

  (defun-inline nft_state_layer_puzzle_hash (NFT_STATE_LAYER_MOD_HASH METADATA METADATA_UPDATER_PUZZLE_HASH inner_puzzle_hash)
    (puzzle-hash-of-curried-function NFT_STATE_LAYER_MOD_HASH
                                     inner_puzzle_hash
                                     (sha256 ONE METADATA_UPDATER_PUZZLE_HASH)
                                     (sha256tree METADATA)
                                     (sha256 ONE NFT_STATE_LAYER_MOD_HASH)
    )
  )


  ; this function does two things - it wraps the odd value create coins, and it also filters out all negative conditions
  ; odd_coin_params is (puzhash amount ...)
  ; new_metadata_info is ((METADATA METADATA_UPDATER_PUZZLE_HASH) conditions)
  (defun wrap_odd_create_coins (NFT_STATE_LAYER_MOD_HASH conditions odd_coin_params new_metadata_info metadata_seen)
    (if conditions
      (if (= (f (f conditions)) CREATE_COIN)
          (if (logand (f (r (r (f conditions)))) ONE)
              (assert (not odd_coin_params)
                (wrap_odd_create_coins NFT_STATE_LAYER_MOD_HASH (r conditions) (r (f conditions)) new_metadata_info metadata_seen)
              )
              (c (f conditions) (wrap_odd_create_coins NFT_STATE_LAYER_MOD_HASH (r conditions) odd_coin_params new_metadata_info metadata_seen))
          )
          (if (= (f (f conditions)) -24)
              (wrap_odd_create_coins NFT_STATE_LAYER_MOD_HASH (r conditions) odd_coin_params
                (assert (all
                          (= (sha256tree (f (r (f conditions)))) (f (r (f new_metadata_info))))
                          (not metadata_seen)
                        )
                    ; then
                    (a (f (r (f conditions))) (list (f (f new_metadata_info)) (f (r (f new_metadata_info))) (f (r (r (f conditions))))))
                )
                ONE  ; the metadata update has been seen now
              )
              (c (f conditions) (wrap_odd_create_coins NFT_STATE_LAYER_MOD_HASH (r conditions) odd_coin_params new_metadata_info metadata_seen))
          )
      )
      (c
        (c CREATE_COIN
            (c
              (nft_state_layer_puzzle_hash
                NFT_STATE_LAYER_MOD_HASH
                (f (f new_metadata_info))
                (f (r (f new_metadata_info)))
                (f odd_coin_params)  ; metadata updater solution
              )
              (r odd_coin_params)
            )
        )
        (f (r new_metadata_info))  ; metadata_updater conditions
      )
    )
  )

  ; main
  (wrap_odd_create_coins
    NFT_STATE_LAYER_MOD_HASH
    (a INNER_PUZZLE inner_solution)
    ()
    (list (list METADATA METADATA_UPDATER_PUZZLE_HASH) 0)  ; if the magic condition is never seen, this is the information we us to recurry
    ()
  )
)
```

</details>

This is the source code of the NFT ownership layer, which can also be found in the chia-blockchain repository in the puzzle [`nft_ownership_layer.clvm`](https://github.com/Chia-Network/chia-blockchain/blob/164fd158c8626893bc45ba00b87ae69d2ab5f8b7/chia/wallet/puzzles/nft_ownership_layer.clvm).

<details>
  <summary>Expand NFT Ownership Puzzle</summary>

```chialisp title="nft_ownership_layer.clvm"
(mod (
    NFT_OWNERSHIP_LAYER_MOD_HASH
    CURRENT_OWNER
    TRANSFER_PROGRAM
    INNER_PUZZLE
    inner_solution
   )

   (include condition_codes.clvm)
   (include curry-and-treehash.clinc)
   (include utility_macros.clib)

   (defconstant NEW_OWNER_CONDITION -10)
   (defconstant ANNOUNCEMENT_PREFIX 0xad4c)  ; first 2 bytes of (sha256 "Ownership Layer")

   (defun-inline nft_ownership_layer_puzzle_hash (NFT_OWNERSHIP_LAYER_MOD_HASH new_owner TRANSFER_PROGRAM inner_puzzle_hash)
      (puzzle-hash-of-curried-function NFT_OWNERSHIP_LAYER_MOD_HASH
                                       inner_puzzle_hash
                                       (sha256tree TRANSFER_PROGRAM)
                                       (sha256 ONE new_owner)
                                       (sha256 ONE NFT_OWNERSHIP_LAYER_MOD_HASH)
      )
   )

   (defun construct_end_conditions (NFT_OWNERSHIP_LAYER_MOD_HASH TRANSFER_PROGRAM odd_args (new_owner new_tp conditions))
     (c
       (c
         CREATE_COIN
         (c
           (nft_ownership_layer_puzzle_hash NFT_OWNERSHIP_LAYER_MOD_HASH new_owner (if new_tp new_tp TRANSFER_PROGRAM) (f odd_args))
           (r odd_args)
          )
        )
        conditions
     )
   )

   (defun wrap_odd_create_coins (NFT_OWNERSHIP_LAYER_MOD_HASH TRANSFER_PROGRAM CURRENT_OWNER all_conditions conditions odd_args tp_output)
     (if conditions
       (if (= (f (f conditions)) CREATE_COIN)
         (if (= (logand (f (r (r (f conditions))))) ONE)
            (assert (not odd_args)
              ; then
              (wrap_odd_create_coins NFT_OWNERSHIP_LAYER_MOD_HASH TRANSFER_PROGRAM CURRENT_OWNER all_conditions (r conditions) (r (f conditions)) tp_output)
            )
            (c (f conditions) (wrap_odd_create_coins NFT_OWNERSHIP_LAYER_MOD_HASH TRANSFER_PROGRAM CURRENT_OWNER all_conditions (r conditions) odd_args tp_output))
         )
         (if (= (f (f conditions)) NEW_OWNER_CONDITION)
            (assert (not tp_output)
              (c
                (list CREATE_PUZZLE_ANNOUNCEMENT (concat ANNOUNCEMENT_PREFIX (sha256tree (r (f conditions)))))
                (wrap_odd_create_coins NFT_OWNERSHIP_LAYER_MOD_HASH TRANSFER_PROGRAM CURRENT_OWNER all_conditions (r conditions) odd_args (a TRANSFER_PROGRAM (list CURRENT_OWNER all_conditions (r (f conditions)))))
              )
            )
            (if (= (f (f conditions)) CREATE_PUZZLE_ANNOUNCEMENT)
                (assert (not (and
                          (= 34 (strlen (f (r (f conditions)))))
                          (= (substr (f (r (f conditions))) 0 2) ANNOUNCEMENT_PREFIX)  ; lazy eval
                        ))
                  ; then
                  (c (f conditions) (wrap_odd_create_coins NFT_OWNERSHIP_LAYER_MOD_HASH TRANSFER_PROGRAM CURRENT_OWNER all_conditions (r conditions) odd_args tp_output))
                )
                (c (f conditions) (wrap_odd_create_coins NFT_OWNERSHIP_LAYER_MOD_HASH TRANSFER_PROGRAM CURRENT_OWNER all_conditions (r conditions) odd_args tp_output))
            )
         )
       )
       ; odd_args is guaranteed to not be nil or else we'll have a path into atom error
       (construct_end_conditions NFT_OWNERSHIP_LAYER_MOD_HASH TRANSFER_PROGRAM odd_args
          (if tp_output
              tp_output
              (a TRANSFER_PROGRAM (list CURRENT_OWNER all_conditions ()))
          )
       )
     )
   )

  (defun main (
      NFT_OWNERSHIP_LAYER_MOD_HASH
      TRANSFER_PROGRAM
      CURRENT_OWNER
      conditions
    )
    (wrap_odd_create_coins
      NFT_OWNERSHIP_LAYER_MOD_HASH
      TRANSFER_PROGRAM
      CURRENT_OWNER
      conditions
      conditions
      () ()
    )
  )

  ; main
  (main
    NFT_OWNERSHIP_LAYER_MOD_HASH
    TRANSFER_PROGRAM
    CURRENT_OWNER
    (a INNER_PUZZLE inner_solution)
  )
)
```

</details>

This is the source code of the default NFT metadata updater, which can also be found in the chia-blockchain repository in the puzzle [`nft_metadata_updater_default.clvm`](https://github.com/Chia-Network/chia-blockchain/blob/164fd158c8626893bc45ba00b87ae69d2ab5f8b7/chia/wallet/puzzles/nft_metadata_updater_default.clvm).

<details>
  <summary>Expand NFT Metadata Updater Puzzle</summary>

```chialisp title="nft_metadata_updater_default.clvm"
(mod (CURRENT_METADATA METADATA_UPDATER_PUZZLE_HASH (key . new_url))

  ; METADATA and METADATA_UPDATER_PUZZLE_HASH are passed in as truths from the layer above
  ; This program returns ((new_metadata new_metadata_updater_puzhash) conditions)

  ; Add uri to a field
  (defun add_url (METADATA key new_url)
    (if METADATA
      (if (= (f (f METADATA)) key)
        (c (c key (c new_url (r (f METADATA)))) (r METADATA))
        (c (f METADATA) (add_url (r METADATA) key new_url))
      )
      ()
    )
  )
  ; main
  ; returns ((new_metadata new_metadata_updater_puzhash) conditions)
  (list
    (list
        (if (all key new_url)
            (if (any (= key "mu") (= key "lu") (= key "u"))
                (add_url CURRENT_METADATA key new_url)
                CURRENT_METADATA
            )
            CURRENT_METADATA
         )
        METADATA_UPDATER_PUZZLE_HASH)
    0
  )
)
```

</details>

## Decision Decisions

#### Multiple separate forms of data {#data}

There are three kinds of files that can be added to the NFT, one per type:

- Data, for things such as images and videos
- Metadata, for information about the data or NFT
- License, detailing legal rights related to the NFT

#### Data must match an immutable hash {#hash}

Any data that the NFT points to must match a specific [sha256](https://en.wikipedia.org/wiki/SHA-2) hash. The hash cannot be changed later, even by the creator of the NFT. This prevents it from being modified or tampered with later, and enforces permanence.

#### Extendable list of multiple URLs {#urls}

Each type of data has a list of URLs that each resolve to the hash of the data. However, if a URL is no longer valid or has been compromised, it will no longer match, which means it won't be displayed in the wallet. To help uphold permanence, the owner can add a new URL that matches the original hash. It will be prepended to the beginning of the list so that it's checked first in the future.

It's recommended to start with multiple links, some on a decentralized platform such as [IPFS](https://www.ipfs.com) or [Arweave](https://www.arweave.org), and others on a server you have control over. This way, even if one fails, the others can be used as a fallback.

## Association with DID

You can add a DID to the NFT when you mint it to show that it is a part of that identity. For example, you can always verify that a [Chia Friend NFT](https://chiafriends.xyz) is authentic by checking that the DID matches the DNS record on [did.chia.net](https://did.chia.net) and the collection id in the metadata matches the rest.

## Conclusion

NFTs are a great way to represent indivisible assets on the Chia blockchain. You can attach royalties to them that get paid upon sale, and store files such as images in them, with attached metadata and license files.
