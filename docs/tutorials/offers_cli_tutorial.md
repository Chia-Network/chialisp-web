id: offers_gui_tutorial
title: Offers, GUI Tutorial
---

# Offers tutorial (CLI)

## Contents:

* [Note about Windows](#note-about-windows)
* [Add a new CAT wallet](#add-a-new-cat-wallet)
* [Create a single-token offer](#create-a-single-token-offer)
* [Accept a single-token offer](#accept-a-single-token-offer)
* [Cancel an offer](#cancel-an-offer)
* [Create a multiple-token offer](#create-a-multiple-token-offer)
* [Accept a multiple-token offer](#accept-a-multiple-token-offer)
* [Common issues](#common-issues)
-----

## Note about Windows

If you are running on Windows, many of the commands from this tutorial will result in an exception that is outside of Chia's control. You can safely ignore it.

```bash
Exception ignored in: <function _ProactorBasePipeTransport.__del__ at 0x000001EACD142CA0>
Traceback (most recent call last):
  File "C:\Users\User\AppData\Local\Programs\Python\Python38\lib\asyncio\proactor_events.py", line 116, in __del__
    self.close()
  File "C:\Users\User\AppData\Local\Programs\Python\Python38\lib\asyncio\proactor_events.py", line 108, in close
    self._loop.call_soon(self._call_connection_lost, None)
  File "C:\Users\User\AppData\Local\Programs\Python\Python38\lib\asyncio\base_events.py", line 719, in call_soon
    self._check_closed()
  File "C:\Users\User\AppData\Local\Programs\Python\Python38\lib\asyncio\base_events.py", line 508, in _check_closed
    raise RuntimeError('Event loop is closed')
RuntimeError: Event loop is closed
```

For more info, see [https://github.com/aio-libs/aiohttp/issues/4324](https://github.com/aio-libs/aiohttp/issues/4324 "Info about event loop exception").

-----

## Add a new CAT wallet

For this example, we'll start with an empty wallet.
```bash
(venv) $ chia wallet show
Wallet height: 1332820
Sync status: Synced
Balances, fingerprint: 123456789
Wallet ID 1 type STANDARD_WALLET Chia Wallet 
   -Total Balance: 0.2 xch (200000000000 mojo)
   -Pending Total Balance: 0.2 xch (200000000000 mojo)
   -Spendable: 0.2 xch (200000000000 mojo)
```
<br/>

In order to create an offer, you must have a wallet for any Chia Asset Tokens (CATs) you want to acquire.

The asset IDs for Chia's main CATs are stored in:
`chia-blockchain/chia/wallet/cc_wallet/cat_constants.py`

The ID for USDS, which we'll use for this example, is:
`6d95dae356e32a71db5ddcb42224754a02524c615c5fc35f568c2af04774e589`

Here's the command to add a Stably USD wallet:
```bash
(venv) $ chia wallet add_token -n "Stably USD" -id 6d95dae356e32a71db5ddcb42224754a02524c615c5fc35f568c2af04774e589
Successfully added Stably USD with wallet id 2 on key 123456788
```
<br/>

To see your new Stably USD wallet, run `chia wallet show`:

```bash
(venv) $ chia wallet show
Wallet height: 1335386
Sync status: Synced
Balances, fingerprint: 123456789
Wallet ID 1 type STANDARD_WALLET Chia Wallet 
   -Total Balance: 0.2 xch (200000000000 mojo)
   -Pending Total Balance: 0.2 xch (200000000000 mojo)
   -Spendable: 0.2 xch (200000000000 mojo)
Wallet ID 2 type COLOURED_COIN Stably USD (Asset ID: 6d95dae356e32a71db5ddcb42224754a02524c615c5fc35f568c2af04774e589)
   -Total Balance: 0.0  (0 mojo)
   -Pending Total Balance: 0.0  (0 mojo)
   -Spendable: 0.0  (0 mojo)
```
<br/>
You now have a Stably USD wallet, in addition to your standard Chia wallet.

-----

## Create a single-token offer

In this example, we'll offer 0.1 XCH in exchange for 10 USDS.
<br/><br/>

A few assumptions:

* There is only one wallet fingerprint installed locally. (If you have more than one fingerprint, use the `-f` flag to specify which one to use.)
* Wallet ID 1 is a standard Chia wallet.
* Wallet ID 2 is a Stably USD wallet.
<br/><br/>

Three flags are required to create the offer file:
* `-o`: The Wallet ID and amount being offered.
* `-r`: The Wallet ID and amount being requested.
* `-p`: The name of the offer file to be created.
<br/><br/>

Here's the full command and result:

```bash
(venv) $ chia wallet make_offer -o 1:0.1 -r 2:10 -p ~/offers/0.1_xch_for_10_usds.offer
Creating Offer
--------------

OFFERING:
  - 0.1 XCH (100000000000 mojos)
REQUESTING:
  - 10 Stably USD (10000 mojos)
Confirm (y/n): y
Created offer with ID 62260d78a563620818a43c2cf837a8fca13a808f20ce62f4e42064f46f4c5a91
Use chia wallet get_offers --id 62260d78a563620818a43c2cf837a8fca13a808f20ce62f4e42064f46f4c5a91 -f 0123456789 to view status
```
<br/>

After running and confirming this command, the offer file `~/offers/0.1_xch_for_10_usds.offer` will be created.

To view the status, run `chia wallet get_offers`, specifying your offer's ID and your wallet's fingerprint:

```bash
(venv) $ chia wallet get_offers --id 62260d78a563620818a43c2cf837a8fca13a808f20ce62f4e42064f46f4c5a91 -f 123456789

Record with id: 62260d78a563620818a43c2cf837a8fca13a808f20ce62f4e42064f46f4c5a91
---------------
Created at: 2021-12-27 08:05:07
Confirmed at: 0
Accepted at: N/A
Status: PENDING_ACCEPT
---------------
```
<br/>

Congratulations! You have created an offer. A few things to note:
* Your wallet has reserved the coin(s) necessary to complete the offer.
* The blockchain has not recorded this offer.
* You can distribute the offer file wherever you want.
* Anyone who sees the offer file can attempt to accept it.

-----

## Accept a single-token offer

This example will use a different computer to accept the offer from the previous example. Keep in mind, offers are accepted on a first-come, first-served basis.
<br/><br/>

Display your wallet's balance before accepting the offer.
```bash
(venv) $ chia wallet show
Wallet height: 1335630
Sync status: Synced
Balances, fingerprint: 9876543210
Wallet ID 1 type STANDARD_WALLET Chia Wallet
   -Total Balance: 0.0 xch (0 mojo)
   -Pending Total Balance: 0.0 xch (0 mojo)
   -Spendable: 0.0 xch (0 mojo)
Wallet ID 2 type COLOURED_COIN Stably USD (Asset ID: 6d95dae356e32a71db5ddcb42224754a02524c615c5fc35f568c2af04774e589)
   -Total Balance: 10.0  (10000 mojo)
   -Pending Total Balance: 10.0  (10000 mojo)
   -Spendable: 10.0  (10000 mojo)
```
<br/>

Use the `-e` flag to examine the offer:
```bash
(venv) $ chia wallet take_offer -e ~/0.1_xch_for_10_usds.offer
Summary:
  OFFERED:
    - XCH (Wallet ID: 1): 0.1 (100000000000 mojos)
  REQUESTED:
    - Stably USD (Wallet ID: 2): 10 (10000 mojos)
Fees: 0
```
<br/>

To accept the offer, remove the `-e` flag:
```bash
(venv) $ chia wallet take_offer ~/0.1_xch_for_10_usds.offer
Summary:
  OFFERED:
    - XCH (Wallet ID: 1): 0.1 (100000000000 mojos)
  REQUESTED:
    - Stably USD (Wallet ID: 2): 10 (10000 mojos)
Fees: 0
Would you like to take this offer? (y/n): y
Accepted offer with ID d7b91ac37c41edfcf0009075b14d4665bfd1d1d2f1ee4087455147ca5134004c
Use chia wallet get_offers --id d7b91ac37c41edfcf0009075b14d4665bfd1d1d2f1ee4087455147ca5134004c -f 9876543210 to view its status
```
<br/>

The offer has been successfully accepted. To see the offer's status, run the `chia wallet get_offers` command:
```bash
(venv) $ chia wallet get_offers --id d7b91ac37c41edfcf0009075b14d4665bfd1d1d2f1ee4087455147ca5134004c -f 9876543210

Record with id: d7b91ac37c41edfcf0009075b14d4665bfd1d1d2f1ee4087455147ca5134004c
---------------
Created at: 2021-12-27 08:41:22
Confirmed at: 1335560
Accepted at: 2021-12-27 08:41:22
Status: CONFIRMED
---------------
```
<br/>

Your wallet will now show your updated balances:
```bash
(venv) $ chia wallet show
Wallet height: 1335630
Sync status: Synced
Balances, fingerprint: 9876543210
Wallet ID 1 type STANDARD_WALLET Chia Wallet
   -Total Balance: 0.100000000000 xch (100000000000 mojo)
   -Pending Total Balance: 0.100000000000 xch (100000000000 mojo)
   -Spendable: 0.100000000000 xch (100000000000 mojo)
Wallet ID 2 type COLOURED_COIN Stably USD (Asset ID: 6d95dae356e32a71db5ddcb42224754a02524c615c5fc35f568c2af04774e589)
   -Total Balance: 1.0  (1000 mojo)
   -Pending Total Balance: 1.0  (1000 mojo)
   -Spendable: 1.0  (1000 mojo)
```

## Cancel an offer

You can cancel any offer you created, as long as it has not been accepted already.
<br/>

Start by listing all of your current offers:
```bash
(venv) $ chia wallet get_offers

Record with id: 47fa10e11c743b03bb1d182a6f915de1e563f40c5e6adf24698cbeb7732baa5f
---------------
Created at: 2021-12-27 09:24:30
Confirmed at: 0
Accepted at: N/A
Status: PENDING_ACCEPT
---------------
```
<br/>

Cancel an offer with a Status of PENDING_ACCEPT:
```bash
(venv) $ chia wallet cancel_offer -id 47fa10e11c743b03bb1d182a6f915de1e563f40c5e6adf24698cbeb7732baa5f

Record with id: 47fa10e11c743b03bb1d182a6f915de1e563f40c5e6adf24698cbeb7732baa5f
---------------
Created at: 2021-12-27 09:24:30
Confirmed at: 0
Accepted at: N/A
Status: PENDING_ACCEPT
Summary:
  OFFERED:
    - XCH (Wallet ID: 1): 0.1 (100000000000 mojos)
  REQUESTED:
    - Stably USD (Wallet ID: 2): 10 (10000 mojos)
Pending Balances:
    - XCH (Wallet ID: 1): 0.1 (100000000000 mojos)
Fees: 0
---------------
Are you sure you wish to cancel offer with ID: 47fa10e11c743b03bb1d182a6f915de1e563f40c5e6adf24698cbeb7732baa5f? (y/n): y
Cancelled offer with ID 47fa10e11c743b03bb1d182a6f915de1e563f40c5e6adf24698cbeb7732baa5f
Use chia wallet get_offers --id 47fa10e11c743b03bb1d182a6f915de1e563f40c5e6adf24698cbeb7732baa5f -f 123456789 to view cancel status
```
<br/>

To view the status of the cancellation, run `chia wallet get_offers`, specifying your offer's ID and your wallet's fingerprint:

```bash
(venv) $ chia wallet get_offers --id 47fa10e11c743b03bb1d182a6f915de1e563f40c5e6adf24698cbeb7732baa5f -f 123456789

Record with id: 47fa10e11c743b03bb1d182a6f915de1e563f40c5e6adf24698cbeb7732baa5f
---------------
Created at: 2021-12-27 09:24:30
Confirmed at: 0
Accepted at: N/A
Status: CANCELLED
---------------
```
<br/>

Note that this command canceled the offer on the blockchain by buying the coins that had been offered. This method of cancellation ensures that nobody could accept your offer in the future. This is the default option, and the option that you should use if you have copied your offer file to another computer or website.

If you have not sent the offer file elsewhere, you can cancel the offer by running the same command with the `--insecure` flag, which will un-reserve the coins for your offer. However, nothing will be recorded on the blockchain. If you copied your offer file elsewhere, someone could still accept it. The advantages of this option are that it will cancel your offer instantly, and there's no need to include a fee.

-----

## Create a multiple-token offer

To create an offer with multiple tokens, simply add `-o` (offer) and `-r` (request) flags to the `make_offer` command as needed. For example:

```bash
(venv) $ chia wallet make_offer -o 2:10 -o 3:10000 -r 1:0.1 -r 4:9000 -p ~/offers/10usds_10kckc_for_100bmojos_9ksbx.offer
Creating Offer
--------------

OFFERING:
  - 10 Stably USD (10000 mojos)
  - 10000 CAT King Cole (10000000 mojos)
REQUESTING:
  - 0.1 XCH (100000000000 mojos)
  - 9000 Spacebucks (9000000 mojos)
Confirm (y/n): y
Created offer with ID 9f624c95b81ed3428f74cbe2e400d0d8cccbfe6169fe8e58422af8a86e0a6388
Use chia wallet get_offers --id 9f624c95b81ed3428f74cbe2e400d0d8cccbfe6169fe8e58422af8a86e0a6388 -f 123456789 to view status
```

<br/>

To view the offer with a summary of the tokens being offered, use the `-s` flag:

```bash
(venv) $ chia wallet get_offers --id 9f624c95b81ed3428f74cbe2e400d0d8cccbfe6169fe8e58422af8a86e0a6388 -f 123456789 -s

Record with id: 9f624c95b81ed3428f74cbe2e400d0d8cccbfe6169fe8e58422af8a86e0a6388
---------------
Created at: 2021-12-27 10:22:07
Confirmed at: 0
Accepted at: N/A
Status: PENDING_ACCEPT
Summary:
  OFFERED:
    - Stably USD (Wallet ID: 2): 10 (10000 mojos)
    - CAT King Cole (Wallet ID: 3): 10000 (10000000 mojos)
  REQUESTED:
    - XCH (Wallet ID: 1): 0.1 (100000000000 mojos)
    - Spacebucks (Wallet ID: 4): 9000 (9000000 mojos)
Pending Balances:
    - Stably USD (Wallet ID: 2): 10 (10000 mojos)
    - CAT King Cole (Wallet ID: 3): 10000 (10000000 mojos)
Fees: 0
---------------
```

-----

## Accept a multiple-token offer

Accept a multiple-token offer just like you did with a single-token offer:

```bash
(venv) $ chia wallet take_offer ~/offers/10usds_10kckc_for_100bmojos_9ksbx.offer
Summary:
  OFFERED:
    - Stably USD (Wallet ID: 3): 10 (10000 mojos)
    - CAT King Cole (Wallet ID: 4): 10000 (10000000 mojos)
  REQUESTED:
    - XCH (Wallet ID: 1): 0.1 (100000000000 mojos)
    - Spacebucks (Wallet ID: 2): 9000 (9000000 mojos)
Fees: 0
Would you like to take this offer? (y/n): y
Accepted offer with ID 5eb909c87df9ddf598906d95183141029c947c045aa369beee9ab699f08a9be1
Use chia wallet get_offers --id 5eb909c87df9ddf598906d95183141029c947c045aa369beee9ab699f08a9be1 -f 9876543210 to view its status
```
<br/>

The offer has been successfully accepted. To see the offer's status, run the `chia wallet get_offers` command:
```bash
(venv) $ chia wallet get_offers --id 5eb909c87df9ddf598906d95183141029c947c045aa369beee9ab699f08a9be1 -f 9876543210

Record with id: 5eb909c87df9ddf598906d95183141029c947c045aa369beee9ab699f08a9be1
---------------
Created at: 2021-12-27 10:35:32
Confirmed at: 1335930
Accepted at: 2021-12-27 10:35:32
Status: CONFIRMED
---------------
```
<br/>

Your wallet will now show your updated balances:
```bash
(venv) $ chia wallet show
Wallet height: 1335942
Sync status: Synced
Balances, fingerprint: 9876543210
Wallet ID 1 type STANDARD_WALLET Chia Wallet
   -Total Balance: 0.0 xch (0 mojo)
   -Pending Total Balance: 0.0 xch (0 mojo)
   -Spendable: 0.0 xch (0 mojo)
Wallet ID 2 type COLOURED_COIN Spacebucks (Asset ID: 78ad32a8c9ea70f27d73e9306fc467bab2a6b15b30289791e37ab6e8612212b1)
   -Total Balance: 0.0  (0 mojo)
   -Pending Total Balance: 0.0  (0 mojo)
   -Spendable: 0.0  (0 mojo)
Wallet ID 3 type COLOURED_COIN Stably USD (Asset ID: 6d95dae356e32a71db5ddcb42224754a02524c615c5fc35f568c2af04774e589)
   -Total Balance: 10.0  (10000 mojo)
   -Pending Total Balance: 10.0  (10000 mojo)
   -Spendable: 10.0  (10000 mojo)
Wallet ID 4 type COLOURED_COIN CAT King Cole (Asset ID: 1121996b75cce3c746369aced2c8887b02b84e95592c3dc006d82a145adf349a)
   -Total Balance: 10000.0  (10000 mojo)
   -Pending Total Balance: 10000.0  (10000 mojo)
   -Spendable: 10000.0  (10000 mojo)
```

-----

## Common issues

