---
id: offers
title: Offers
---

# Chia Offers

Contents:

* [Introduction](#introduction)
* [Advantages](#advantages)
* [Technical details](#technical-details)
* [Market makers](#market-makers)
* [Offer file quirks](#offer-file-quirks)
* [CLI Usage](#cli-usage)
* [RPCs](#rpcs)
* [Glossary of terms](#glossary-of-terms)

## Introduction

_Offers_ enable peer-to-peer asset exchange in Chia's ecosystem. In other words, you can swap tokens that run on Chia's blockchain without needing to go through an exchange. Only two parties are required -- the _Maker_, who creates the offer, and the _Taker_, who accepts it.

The Maker and Taker don't need to trust each other. Any attempts to modify the offer will invalidate it.

### Hypothetical example

A clique of classical jazz enthusiasts creates a new token in Chia's ecosystem called "CAT King Cole" (CKC). Alice has 1 XCH in her wallet, and she wants to join the CKC club. The current exchange rate is 251 CKC per XCH.

<figure>
<img src="/img/offers_img/offers/1_alice_1_xch.png" alt="Alice wallet before offer"/>
<figcaption>
<em>Alice's wallet before creating the offer.</em>
</figcaption>
</figure>

Alice likes those numbers, so she uses her Chia wallet to generate an _offer file_ with the following conditions, to be enacted upon the offer's acceptance:

<figure>
<img src="/img/offers_img/offers/2_offer_1_xch_251_ckc.png" alt="offer details"/>
<figcaption>
<em>Alice's offer: 1 XCH for 251 CKC.</em>
</figcaption>
</figure>

So far, this is not a valid transaction. She hasn't actually spent her XCH, and she can't create CKC out of thin air -- this isn't a jazz improv show. She needs someone to take the other side of this offer.

Alice scours the internet and finds a message board where fans of CKC like to share their latest riffs. She posts her offer file and waits, not knowing who will agree to face the music. However, she _does_ know that potential Takers cannot modify the offer -- they must take it or leave it. Additionally, acceptance of the offer is on a first come, first served basis. They better act quickly!

The offer is not left dangling for long. After just a few seconds, Bob (who's more of a Cat Stevens fan) opens the offer file in his Chia wallet, which asks if he would like to exchange 251 CKC for 1 XCH. Bob accepts the offer, and his wallet automatically creates the other half of the transactions that Alice had started.

<figure>
<img src="/img/offers_img/offers/3_bob_view_xch_ckc_offer.png" alt="offer Bob view"/>
<figcaption>
<em>Bob's view of the offer.</em>
</figcaption>
</figure>

Alice posted her offer on a message board, _not_ on a decentralized exchange. She could've posted the offer on Reddit, Twitter, Facebook, or anywhere else online.

Alice didn't trust Bob, and Bob didn't trust Alice. They never had to meet or interact in any way. If either of them had attempted to change the conditions of the offer, it automatically would've been rendered invalid. And as soon as Bob accepted the offer, the transactions became valid and were automatically processed, no middlemen required.

That's music to Alice and Bob's ears.

<figure>
<img src="/img/offers_img/offers/4_alice_251_ckc.png" alt="Alice post offer wallet"/>
<figcaption>
<em>Alice's wallet after the offer has been accepted.</em>
</figcaption>
</figure>

<figure>
<img src="/img/offers_img/offers/5_bob_1_xch.png" alt="Bob post offer wallet"/>
<figcaption>
<em>Bob's wallet after the offer has been accepted.</em>
</figcaption>
</figure>

The rest of this document will go into the details of offers -- why they're valuable, how the offer files are created, design decisions, and some of the exciting possibilities that lie ahead.

If you want to start using offers right away, you can check out our tutorials:
* [GUI tutorial](../tutorials/offers_gui_tutorial.md "Offers GUI tutorial")
* [CLI tutorial](../tutorials/offers_cli_tutorial.md "Offers CLI tutorial")

-----
## Advantages

Offers have many properties that we think will make them a valuable tool for Chia's community:

* **Secure**: When using Chia offers, Makers and Takers retain control of their private keys, as well as their assets. By contrast, centralized exchanges require users to transfer their funds to an account that the exchange controls. If the exchange is hacked or simply goes out of business, users can lose their funds. With Chia offers, self-custody of keys and funds is assured.

  >Offer files do not contain private keys or any way to deduce them. If an offer file falls into a "hacker's" hands, they only have two options: ignore the offer or accept it.

* **Immutable**: Once an offer file is created, any alterations to the file will invalidate it. The offer file only has three possible outcomes:
  1. A Taker accepts the offer as-is. All transactions contained within it are automatically processed. (There also could be multiple Takers, [explained below](#market-makers "Market makers and multiple Takers").)
  2. The Maker [cancels the offer](#cancellation "Offer cancellation").
  3. The offer will be in a pending state until either 1. or 2. are fulfilled. It is possible that the offer never is completed or canceled.

  >Takers are free to propose a counter offer by creating their own offer file. In this case, the original Maker could cancel the original offer, and both parties' roles would be reversed.

* **Compliant**: As offers are inherently peer-to-peer, they don't constitute an “exchange” or other regulated market activity.

* **Trustless**: Offers are _not_ analogous to a handshake or a promise, where one party could renege on the trade. By using Chia offers, the Maker and Taker don't need to trust each other. They don't even need to _know_ each other. As long as a Taker matches the offer identically, the offer will be valid.

* **Simultaneous**: The Maker's and Taker's transactions must happen in the same block. In Chia, all transactions conducted within a single block happen simultaneously. This eliminates one type of Maximum Extractable Value (MEV), where validators can increase their fees by re-ordering transactions.

* **Non-custodial**: Neither Maker nor Taker are required to send their funds to a trusted intermediary, such as an escrow service or an exchange. This removes the need for Over The Counter (OTC) desks and other middlemen, who require their customers to submit funds before they allow transactions to complete.

* **Commission-free**: Because offers don't use escrow services or other middlemen, there are also none of the typical fees associated with those intermediaries. (Offers _are_ subject to Chia blockchain transaction fees, just like all transactions on Chia's network.)

* **Multi-asset**: A Maker can create an offer for multiple assets on both ends of the offer. For example, they could offer 1 XCH and 1.75 CKC for 100,000 SBX and 3 MRMT.

-----
## Technical details

In this section, we'll discuss the technical details of offers, including how they're created, accepted, canceled, etc.


### Offer States

An offer has six potential states, as defined in [trade_status.py](https://github.com/Chia-Network/chia-blockchain/blob/main/chia/wallet/trading/trade_status.py "trade_status.py"):

0. PENDING_ACCEPT -- The Maker has created the offer, but a Taker has not yet accepted it. The Maker's wallet has reserved the coin(s) to be spent. The spendbundle for the offer has not been sent to the mempool.
1. PENDING_CONFIRM -- The Taker has accepted the offer. The Taker's wallet has reserved the coin(s) to be spent. The completed spendbundle has been sent to the mempool.
2. PENDING_CANCEL -- The Maker has attempted to cancel the offer by spending the coins being offered. The completed spendbundle has been sent to the mempool.
3. CANCELLED -- Depending on which [type of cancellation](#cancellation "Offer cancellation") has been used, either:
    * The Maker's wallet has released the coins it had been reserving for this offer, or
    * The Maker's coins have been spent and new ones have been created in the Maker's wallet.
4. CONFIRMED -- The Maker's and Taker's reserved coins have been spent in the same spendbundle. The offer has been completed successfully.
5. FAILED -- The Taker attempted, and failed to accept the offer. This could have happened either because the Maker canceled the offer, or because another Taker took the offer first.


### Creating an offer file

Here's the basic workflow to create an offer file:

1. The Maker uses either the wallet GUI or [CLI](#cli-usage "CLI usage for offers") to create the terms for an offer. For example, the Maker might offer 1 XCH for 251 CKC. If the Maker doesn't have sufficient funds, an error is thrown.

2. The Maker's wallet [selects the appropriate coin(s)](https://github.com/Chia-Network/chia-blockchain/blob/main/chia/wallet/wallet.py#L232 "Wallet code's select_coins method") to spend, starting with the largest coin available.

3. For each coin the Maker wants to receive from the offer, the Maker's wallet [creates a notarized coin payment](https://github.com/Chia-Network/chia-blockchain/blob/b76b75f3175fc5b8fc904a4b07a7543fdde7dbf1/chia/wallet/trade_manager.py#L241 "trade_manager.py, _create_offer_for_ids method"). This is a list in the form of `(PH1 AMT1 ...)`, where:
    * `PH1` is the puzzle hash of the coin the Maker wants to acquire.
    * `AMT1` is the value of the coin the Maker wants to acquire.
    * `...` is an optional memo of arbitrary length. The trade manager adds a hint to itself in this memo.

4. The Maker's wallet creates a nonce `N`, using the treehash of a sorted list of the coinIDs of each coin being offered.

  Every coinID needs to be included in the nonce to prevent the Maker from creating two offers that can both be completed with just one payment. (Note that even if two conflicting offers were created, the blockchain would correctly reject one of them as a double-spend.) Because each coinID must be unique, any attempts to change any of the coins being offered will cause the offer to become invalid.

  >If you're unfamiliar with nonces, [Wikipedia](https://en.wikipedia.org/wiki/Cryptographic_nonce "Cryptographic Nonce on Wikipedia") has a good explanation.

5. The Maker's wallet combines the nonce (Step 4) with the notarized coin payment(s) (Step 3) to [create a list](https://github.com/Chia-Network/chia-blockchain/blob/4873ea53be168276a56a5a1797075bdd63c46ad9/chia/wallet/trading/offer.py#L49 "offer.py, notarize_payments method") called `notarized_payments`. For example, if three coins are included in the Maker's offer, `notarized_payments` will be structured like this: `((N . ((PH1 AMT1 ...) (PH2 AMT2 ...) (PH3 AMT3 ...))) ...)`.

6. The Offer driver [calculates the announcements](https://github.com/Chia-Network/chia-blockchain/blob/127342f2ed516537f7398dd1672c89b2fa3c2b59/chia/wallet/trading/offer.py#L69 "Offer.py, calculate_announcements method") that need to be asserted in order to get paid.

7. The Maker's wallet creates a spendbundle paying the puzzlehash of settlement_payments.clvm (explained in the [next section](#settlement_paymentsclvm "Discussion of settlement_payments.clvm")). Finally, the offer file is created, using `notarized_payments` and the spendbundle.

The offer file is now complete. The Maker can send this file anywhere others might see it, including social media, message boards, or a website dedicated to maintaining a list of current offers.

The _offer_'s status is now PENDING_ACCEPT. In order for the offer to be completed, it still requires a `CREATE_PUZZLE_ANNOUNCEMENT` condition for the whole puzzle, and a `CREATE_COIN` condition for each type of asset to be received. The Maker's coin(s) can't be spent until a Taker creates these conditions.


### settlement_payments.clvm

Offers use a Chialisp puzzle called [settlement_payments.clvm](https://github.com/Chia-Network/chia-blockchain/tree/main/chia/wallet/puzzles/settlement_payments.clvm "settlement_payments.clvm, the puzzle to create offer files."). This puzzle's solution is a list of `notarized_payments`, which were calculated in the previous section.

Recall that `notarized_payments` is structured like this: `((N . ((PH1 AMT1 ...) (PH2 AMT2 ...) (PH3 AMT3 ...))) ...)`, where:
* `N` is the nonce.
* `PH1` is the puzzle hash of the first coin.
* `AMT1` is the amount (or value) of the coin being offered.
* `...` is an optional memo.

For each set of notarized coin payments, this puzzle creates one `CREATE_PUZZLE_ANNOUNCEMENT` condition. For each coin payment within this set, the puzzle creates one `CREATE_COIN` condition.

The reason for creating these conditions is to match the announcements created in the offer file. The settlement_payments puzzle is quite versatile -- it can be used as an inner puzzle inside a CAT or NFT, as a puzzle to spend regular XCH, or in order to spend any other assets in Chia's ecosystem.


### Accepting an offer

The offer file can be named anything, and it contains a bech32 address for an incomplete spendbundle. The Taker still must perform several steps before the offer can be confirmed:

1. **View the offer** -- The Taker needs to validate the terms of the offer before choosing whether to accept it. This can be done using either Chia's wallet GUI or the CLI. In either case, the Taker can choose whether to load the offer file or paste its contents.

2. **Validate the offer** -- When the offer is loaded into the Taker's wallet, the wallet [verifies that the offer is valid](https://github.com/Chia-Network/chia-blockchain/blob/127342f2ed516537f7398dd1672c89b2fa3c2b59/chia/wallet/trade_manager.py#L334 "trade_manager.py, check_offer_validity method") by checking that the Maker's coins have not been spent. If any coins have been spent, the wallet will show an error that the offer is no longer valid. If the offer is still valid, the Taker's wallet displays the offer's terms and asks whether the Taker will accept it.

3. **Create a spendbundle** -- If the Taker accepts, then the Taker's wallet creates a new spendbundle with a combination of both the Maker's and Taker's ends of the offer. The offer's status is now `PENDING_CONFIRM`.

4. **Create a CAT wallet (optional)** -- The Taker's wallet creates a [new CAT wallet](https://github.com/Chia-Network/chia-blockchain/blob/127342f2ed516537f7398dd1672c89b2fa3c2b59/chia/wallet/trade_manager.py#L322 "trade_manager.py maybe_create_wallets_for_offer method") if there isn't one already.

5. **Push the spendbundle** -- The Taker's wallet [pushes the spendbundle](https://github.com/Chia-Network/chia-blockchain/blob/127342f2ed516537f7398dd1672c89b2fa3c2b59/chia/wallet/trade_manager.py#L344 "trade_manager.py respond_to_offer method") to the blockchain. After the spendbundle succeeds, all of the relevant coins have been spent or created, and all assertions have been completed. At this point, the offer's status is `CONFIRMED`.

-----------
## Market makers

Offers in the `PENDING_CONFIRM` state have been added to the mempool. Farmers and third-party software can observe the current list of offers, and aggregate overlapping ones. This operation is known as a "market maker."

Automated Market Makers (AMMs) are likely to appear in Chia's ecosystem. AMMs can create a single settlement puzzle for each type of asset (XCH or a specific type of CAT), and aggregate all of the notarized coin payments of that type in the puzzle.

A "Taker" is part offer-creator, part market-maker. A Taker finds an offer of interest and constructs the other side of that offer, using both of the `settlement_payments` puzzles to resolve the cross-asset payments.

### Offer aggregation

A sophisticated AMM might aggregate multiple `settlement_payments` into a single spend, which means it could combine an arbitrary number of offers, paying through one `settlement_payments` ephemeral coin for each asset type.

For example, a whale wants to buy 10,000 XCH, and is currently sitting on a large stack of stablecoins. There aren't any individuals willing to sell such a large amount of XCH, but the whale doesn't need to create a bunch of small offers. Instead, they create a single offer: _X_ stablecoins (at the current market price) for 10,000 XCH. Several small XCH holders can aggregate their holdings to complete the offer.

### Oracles and arbitrage

As discussed previously, an offer in the `PENDING_ACCEPT` state cannot be modified. If the price of any asset changes after the offer has been created, AMMs could take advantage of arbitrage by accepting stale offers and creating new ones. However, this also means that farmers could do the same, taking the arbitrage for themselves.

For example:
  1. Alice offers 1 XCH for 251 CKC.
  2. The spot price of XCH doubles to 502 CKC per XCH.
  3. An AMM notices the price increase and decides to accept the offer. They could then sell the 1 XCH and profit 251 CKC, which would be worth 0.5 XCH.
  4. However, Farmer Bob notices the AMM's attempt at arbitrage and also accepts the offer, adding his own acceptance (and not the AMM's) to the block. Bob has effectively taken the AMM's intended arbitrage.
  5. The AMM's only option to taking the offer is to add a fee of at least 0.5 XCH, which would cost them more money than they stood to make in the first place. Bob has secured all of the financial incentive for himself.

Additionally, price oracles could be used to reduce MEV, ensure fairness, and stabilize the offers markets. There are many potential business opportunities in this realm, which would have to be developed external to Chia Network Inc.

-----
## Offer file quirks

A few aspects of offer files might seem counter-intuitive at first.

### On-chain vs off-chain

When a Maker creates an offer, it's moved to the `PENDING_ACCEPT` state. So far, nothing has been written to the blockchain. In fact, nobody else will even know of the offer's existence until the Maker shares the file. If the Maker changes their mind before sending the offer file to anyone else, the Maker can delete the file, and the offer will have been effectively "canceled."

However, the Maker's wallet needs to keep track of any pending offers, in case the Maker decides to initiate any additional transactions before the offer has been accepted.

For example, let's say Alice has 1 XCH and wants to buy 251 CKC (thereby spending all of her XCH). When she creates her offer, her wallet will store the details locally in its database. All of her XCH coins (totaling 1 XCH) have been reserved for the offer, so she can't spend them while the offer is still pending.

If Alice's 1 XCH is only reserved locally, what's stopping her from using a third-party wallet to spend that money? Nothing! The third-party wallet will ascertain its balance by examining the blockchain, which does not know about the pending offer. Therefore, the third-party wallet hasn't reserved any coins for the offer. Alice absolutely could still send someone else her XCH, but then the offer would no longer be valid.

If Alice wants to be sure all of her wallets are in agreement, she must cancel her offer.

### Cancellation

A Maker has two options to cancel an offer.
1. Cancel on the blockchain. This is the default cancellation option. It should be used if the Maker has sent the offer file to anyone else.

  Continuing our previous example, if Alice uses this option, then her wallet will spend the coins being offered, and create new coins of the same type and value. Alice doesn't need to know about the underlying coins that have been spent -- she just sees her old balance return to her wallet. The offer is now complete and can't be used again.

  This option does come with two small downsides.
    * Alice must wait for the blockchain to confirm that the cancellation transaction has completed.
    * Alice might have to pay a transaction fee.

  These downsides will likely be acceptable in most cases, so "cancel on the blockchain" is the default option.

2. Cancel locally only. This option should only be used if the Maker has not sent the offer file to anyone else.

  This option will simply notify Alice's wallet that the transaction has been canceled, so the coins will no longer be reserved. There is no blockchain transaction, so the two disadvantages of "Cancel on the blockchain" don't apply here -- the cancellation happens instantly and there is no need for a transaction fee. The downside of this option is that if the offer file ever leaves Alice's computer, a Taker can still take the offer (as long as Alice's coins have not been spent).

  >NOTE: Double spends on the blockchain aren't possible for either of these options. In the coin set model, coins can only ever be spent once. If someone attempts to take Alice's offer at the same time she spends the coins, only one of those transactions will make it onto the blockchain. [Chialisp.com](https://chialisp.com/docs/coin_lifecycle#the-coin-set-model "Coin set model on chialisp.com") has a detailed explanation of the coin set model.

### Coin set (UTXO)

Chia uses the coin set model to keep track of state. This is similar to the UTXO model in Bitcoin. The coin set model [has many advantages](https://docs.chia.net/docs/04coin-set-model/what-is-a-coin "Coin set model") over the account model, but it can create some situations that take time to understand.

In the coin set model, everything is a coin. There are no accounts, at least not at the blockchain level. Coins can only ever be spent once, and they can't be divided.

This is similar to how cash works. If Alice has a $20 bill and she wants to buy something for $1, she can't just rip out a piece of the bill and hand it to the cashier. She has to pay with the whole bill and wait for her change.

Chia works the same way. If someone sends Alice 20 XCH, her wallet is now tracking a single coin worth 20 XCH. If she makes an offer for 1 XCH, her wallet needs to reserve the entire coin for the offer. While the offer is pending, Alice can't spend any of her coin.

However, Alice can get around this issue by sending money to herself. Let's say she sends 10 XCH to her own wallet. Her 20-XCH coin has been spent and two new coins have been created, both worth 10 XCH. She can now make an offer for 1 XCH, thus reserving one of her coins, and she can spend the other coin in the usual manner while the offer is pending.

The [GUI tutorial](../tutorials/offers_gui_tutorial.md#whole-coins-must-be-reserved "Offers GUI tutorial") goes over an example of this process.

-----
## CLI Usage

Chia's command line interface provides a set of commands to make, take, cancel, and list offers. To use offers on the command line, make sure you are using a virtual environment.

The relevant commands can all be found under the `chia wallet` command:

```bash
(venv) $ chia wallet -h
```

### Commands

* [`make_offer`](#make_offer)
* [`take_offer`](#take_offer)
* [`cancel_offer`](#cancel_offer)
* [`get_offers`](#get_offers)

### Reference

### `make_offer`

Functionality: Create an offer of XCH/CATs for XCH/CATs.

Usage: `chia wallet make_offer [OPTIONS]`

Options:

| Short Command | Long Command                 | Type  | Required | Description |
|:-------------:|:----------------------------:|:-----:|:--------:|:------------|
| -wp | --wallet-rpc-port | INTEGER | False | Set the port where the Wallet is hosting the RPC interface. See the rpc_port under wallet in config.yaml|
| -f  | --fingerprint     | INTEGER | False | Set the fingerprint to specify which wallet to use
| -o  | --offer           | TEXT    | True  | A wallet id to offer and the amount to offer (formatted like wallet_id:amount)
| -r  | --request         | TEXT    | True  | A wallet id of an asset to receive and the amount you wish to receive (formatted like wallet_id:amount)
| -p  | --filepath        | TEXT    | True  | The path to write the generated offer file to
| -m  | --fee             | TEXT    | False | A fee to add to the offer when it gets taken
| -h  | --help            | None    | False | Show a help message and exit

---
### **`take_offer`**

Functionality: Examine or take an offer.

Usage: `chia wallet take_offer [OPTIONS] PATH_OR_HEX`

Options:

| Short Command | Long Command                 | Type  | Required | Description |
|:-------------:|:----------------------------:|:-----:|:--------:|:------------|
| -wp | --wallet-rpc-port | INTEGER | False | Set the port where the Wallet is hosting the RPC interface. See the rpc_port under wallet in config.yaml
| -f  | --fingerprint     | INTEGER | False | Set the fingerprint to specify which wallet to use
| -e  | --examine-only    | None    | False | Print the summary of the offer file but do not take it
| -m  | --fee             | TEXT    | False | The fee to use when pushing the completed offer
| -h  | --help            | None    | False | Show a help message and exit

---
### **`cancel_offer`**

Functionality: Cancel an existing offer. Must be the offer's Maker.

Usage: `chia wallet cancel_offer [OPTIONS]`

Options:

| Short Command | Long Command                 | Type  | Required | Description |
|:-------------:|:----------------------------:|:-----:|:--------:|:------------|
| -wp | --wallet-rpc-port | INTEGER | False | Set the port where the Wallet is hosting the RPC interface. See the rpc_port under wallet in config.yaml
| -f  | --fingerprint     | INTEGER | False  | Set the fingerprint to specify which wallet to use
| -id | --id              | TEXT    | True  | The offer ID that you wish to cancel
| N/A | --insecure        | None    | False | Don't make an on-chain transaction, simply mark the offer as canceled
| -m  | --fee             | TEXT    | False | The fee to use when canceling the offer securely
| -h  | --help            | None    | False | Show a help message and exit

---
### **`get_offers`**

Functionality: Get the status of existing offers.

Usage: `chia wallet get_offers [OPTIONS]`

Options:

| Short Command | Long Command                 | Type  | Required | Description |
|:-------------:|:----------------------------:|:-----:|:--------:|:------------|
| -wp | --wallet-rpc-port      | INTEGER | False | Set the port where the Wallet is hosting the RPC interface. See the rpc_port under wallet in config.yaml
| -f  | --fingerprint          | INTEGER | False | Set the fingerprint to specify which wallet to use
| -id | --id                   | TEXT    | False | The ID of the offer that you wish to examine
| -p  | --filepath             | TEXT    | False | The path to rewrite the offer file to (must be used in conjunction with --id)
| -em | --exclude-my-offers    | None    | False | Exclude your own offers from the output
| -et | --exclude-taken-offers | None    | False | Exclude offers that you've accepted from the output
| -ic | --include-completed    | None    | False | Include offers that have already been confirmed/canceled or failed
| -s  | --summaries            | None    | False | Show the assets being offered and requested for each offer
| -r  | --reverse              | None    | False | Reverse the order of the output
| -h  | --help                 | None    | False | Show a help message and exit

-----
### CLI examples

For detailed examples of offers using the command line interface, see our [CLI tutorial](../tutorials/offers_cli_tutorial.md "Offers CLI tutorial").

-----
## RPCs

From [wallet_rpc_client.py](https://github.com/Chia-Network/chia-blockchain/blob/main/chia/rpc/wallet_rpc_client.py):

* [`create_offer_for_ids`](#create_offer_for_ids)
* [`get_offer_summary`](#get_offer_summary)
* [`check_offer_validity`](#check_offer_validity)
* [`take_offer`](#take_offer-1)
* [`get_offer`](#get_offer)
* [`get_all_offers`](#get_all_offers)
* [`cancel_offer`](#cancel_offer-1)

### create_offer_for_ids

Creates a new offer.

* **offer_dict**: A dictionary of the offer to create.
* **fee:** An optional fee to include with the offer. Defaults to 0.
* **validate_only:** Defaults to False. Set to True to verify the validity of a potential offer, rather than actually creating an offer.

```python
async def create_offer_for_ids(
  self, offer_dict: Dict[uint32, int], fee=uint64(0), validate_only: bool = False
) -> Tuple[Optional[Offer], TradeRecord]:
  send_dict: Dict[str, int] = {}
  for key in offer_dict:
    send_dict[str(key)] = offer_dict[key]

  res = await self.fetch("create_offer_for_ids", {"offer": send_dict, "validate_only": validate_only, "fee": fee})
  offer: Optional[Offer] = None if validate_only else Offer.from_bytes(hexstr_to_bytes(res["offer"]))
  return offer, TradeRecord.from_json_dict_convenience(res["trade_record"], res["offer"])
```

### get_offer_summary

Returns the summary of a specific offer. Works for offers in any state.

* **offer:** The offer to summarize.

```python
async def get_offer_summary(self, offer: Offer) -> Dict[str, Dict[str, int]]:
  res = await self.fetch("get_offer_summary", {"offer": bytes(offer).hex()})
  return res["summary"]
```

### check_offer_validity

Checks whether a specific offer is valid.

* **offer:** The offer to check. The offer is considered valid if it is in any of the following states:
  * PENDING_ACCEPT
  * PENDING_CONFIRM
  * PENDING_CANCEL

  The offer is no longer valid if it is in any of the following states:
  * CANCELLED
  * CONFIRMED
  * FAILED

```python
async def check_offer_validity(self, offer: Offer) -> bool:
  res = await self.fetch("check_offer_validity", {"offer": bytes(offer).hex()})
  return res["valid"]
```

### take_offer

Takes (accepts) a specific offer, with a given fee.

* **offer:** The offer to accept. Must be in the PENDING_ACCEPT state.
* **fee:** An optional fee to include with the offer. Defaults to 0.

```python
async def take_offer(self, offer: Offer, fee=uint64(0)) -> TradeRecord:
  res = await self.fetch("take_offer", {"offer": bytes(offer).hex(), "fee": fee})
  return TradeRecord.from_json_dict_convenience(res["trade_record"])
```

### get_offer

Given an offer's unique identifier, return that offer's details.

* **trade_id:** The ID of the offer to examine. Can be retrieved from an offer file by calling `cdv inspect spendbundles <offer_file>`.
* **file_contents:** Set to True to return a summary for the offer. Defaults to False, which only returns the offer's basic metadata.

```python
async def get_offer(self, trade_id: bytes32, file_contents: bool = False) -> TradeRecord:
  res = await self.fetch("get_offer", {"trade_id": trade_id.hex(), "file_contents": file_contents})
  offer_str = res["offer"] if file_contents else ""
  return TradeRecord.from_json_dict_convenience(res["trade_record"], offer_str)
```

### get_all_offers

Gets all offers for the current wallet. Includes offers in every state.

* **file_contents** Set to True to return a summary for the offer. Defaults to False, which only returns the offer's basic metadata.

```python
async def get_all_offers(self, file_contents: bool = False) -> List[TradeRecord]:
  res = await self.fetch("get_all_offers", {"file_contents": file_contents})

  records = []
  optional_offers = res["offers"] if file_contents else ([""] * len(res["trade_records"]))
  for record, offer in zip(res["trade_records"], optional_offers):
    records.append(TradeRecord.from_json_dict_convenience(record, offer))

  return records
```

### cancel_offer

Cancel an offer with a specific identifier.

* **trade_id:** The ID of the offer to examine. Can be retrieved from an offer file by calling `cdv inspect spendbundles <offer_file>`.
* **fee:** An optional fee to include with the cancellation. Defaults to 0.
* **secure:** Defaults to True, which means "cancel on blockchain," ie spend the coins being offered and create new coin's in the Maker's wallet. Set to False to cancel locally. See [cancellation](#cancellation "Offer cancellation") for more info.

```python
async def cancel_offer(self, trade_id: bytes32, fee=uint64(0), secure: bool = True):
  await self.fetch("cancel_offer", {"trade_id": trade_id.hex(), "secure": secure, "fee": fee})
```

-------
## Glossary of terms

* **AMM** -- Automated Market Maker, a software protocol that uses liquidity pools to enable the permissionless trading of digital assets.
* **Asset** -- In the context of offers, an _asset_ may refer to XCH, CATs, or even NFTs that live on Chia's blockchain.
* **Liquidity Pool** -- A shared pot of a digital asset's coins or tokens. AMMs use these in lieu of middlemen to connect buyers and sellers.
* **Maker** -- The party (human or computer) who creates the offer.
* **Nonce** -- A **N**umber **ON**ly used on**CE**, typically applied to prevent replay attacks. See [Wikipedia](https://en.wikipedia.org/wiki/Cryptographic_nonce "Cryptographic Nonce on Wikipedia") for more info.
* **Notarized coin** -- A coin the Maker wishes to receive upon an offer's acceptance.
* **notarized_payments** -- A list of notarized coins.
* **Offer** -- A bid to exchange assets on Chia's ecosystem in a peer-to-peer manner.
* **Offer File** -- A text file containing the details of an offer, stored in hexadecimal bytecode. Offer files don't contain any private keys, so they may be shared publicly.
* **Price oracle** -- An automated software program that provides off-chain data to a blockchain's ecosystem.
* **Taker** -- The party (human or computer) who accepts the offer. Multiple Takers can be aggregated to complete an offer.
* **settlement_payments** -- A Chialisp puzzle used in offers. It takes notarized_payments as its solution, and creates a coin and a puzzle announcement for each notarized coin.
