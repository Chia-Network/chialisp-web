---
id: NFT0_user_guide
title: NFT0 User Guide
sidebar_label: NFT0 User Guide
---

This document will guide you through the process of minting NFTs that comply with Chia's NFT0 standard, using the command line interface (CLI), on Windows, MacOS and Linux. Appologies if you are not comfortable with CLIs. Chia's Electron wallet will support the NFT1 standard, which is coming... Soon®!

## Contents:

* [Note about Python on Windows](#note-about-python-on-windows)
* [Install and configure Chia](#install-and-configure-chia)
* [Mint an NFT](#mint-an-nft)
* [DID wallet RPCs](#did-wallet-rpcs)
* [NFT wallet RPCs](#nft-wallet-rpcs)

---

## Note about Python on Windows

If you are running on Windows, you might occasionally see a Python Runtime Error. This is a [known issue in Python](https://github.com/aio-libs/aiohttp/issues/4324 "More info about this issue") and can be safely ignored. For example:

```powershell
(venv) PS C:\Users\User\Chia\main_dids\chia-blockchain> chia stop -d all
Exception ignored in: <function _ProactorBasePipeTransport.__del__ at 0x000001A719716160>
Traceback (most recent call last):
  File "C:\Users\User\AppData\Local\Programs\Python\Python39\lib\asyncio\proactor_events.py", line 116, in __del__
    self.close()
  File "C:\Users\User\AppData\Local\Programs\Python\Python39\lib\asyncio\proactor_events.py", line 108, in close
    self._loop.call_soon(self._call_connection_lost, None)
  File "C:\Users\User\AppData\Local\Programs\Python\Python39\lib\asyncio\base_events.py", line 746, in call_soon
    self._check_closed()
  File "C:\Users\User\AppData\Local\Programs\Python\Python39\lib\asyncio\base_events.py", line 510, in _check_closed
    raise RuntimeError('Event loop is closed')
RuntimeError: Event loop is closed
daemon: {'ack': True, 'command': 'exit', 'data': {'success': True}, 'destination': 'client', 'origin': 'daemon', 'request_id': '0de5449121b6873ce18661b2adc4213d7dc795c2943ff7f4be9502058e8eaba0'}
```

---

## Install and configure Chia

This section will show you how to download and install Chia from the `main_dids` branch, configure your installation to run on the testnet, sync your node, and obtain some TXCH. If you have already done all of these things, you can skip to the next section ([Create an NFT](#temp)).

  >Note: Your firewall might give warnings when installing Chia. This is normal. Allow the installations to continue.

1. We'll be running on Chia's testnet. If you don't have a synced testnet node, you can safely download a copy of the database. **Do not attempt this on mainnet.** [Click here to begin the download.](https://download.chia.net/testnet10/blockchain_v2_testnet10.sqlite.gz "Chia's testnet10 database download site") Save the file to your Downloads folder.

  > Note that the file you will download is around 15 GB, compressed. Uncompressed, it will be around 30 GB. Make sure you have at least this much free space, and ideally 50 GB. You can continue with the next steps while it is downloading.

You may continue with the next steps while the download is in progress.

2. If Chia is already installed on your system, make sure it is stopped by running `chia stop -d all`. Be sure there are no "chia" related processes running. If you are unsure, you may want to uninstall Chia before continuing.

3. Chia's NFT and DID development is currently happening in the [main_dids](https://github.com/Chia-Network/chia-blockchain/tree/main_dids "main_dids branch") branch of the `chia-blockchain` repository. You'll need to download this branch.
  
    a. If you don't already have the `git` CLI tool installed, [follow these intructions](https://git-scm.com/book/en/v2/Getting-Started-Installing-Git) to install it
  
    b. Create and `cd` to a new directory (eg `main_dids`)
  
    c. Run `git clone https://github.com/Chia-Network/chia-blockchain.git -b main_dids --recurse-submodules`. This will download the `main_dids` branch of the `chia-blockchain` repository
  
4. Install Chia:
 
    a. Run `cd chia-blockchain`
    
    b. Run `.\Install.ps1` (Windows) or `sh install.sh` (Linux/MacOS) to install Chia
    
    c. Run `.\venv\Scripts\Activate.ps1` (Windows) or `. ./activate` (Linux/MacOS) to activate a virtual environment
    
    d. Run `chia init` to initialize your environment

    e. If you receive this message: "WARNING: UNPROTECTED SSL FILE!" then run `chia init --fix-ssl-permissions`

    f. Run `chia configure -t true` to switch to testnet10

5. Run `chia version`. You should be shown the correct version. For example:
  ```powershell
  (venv) PS C:\Users\User\Chia\main_dids\chia-blockchain> chia version
  1.3.5.dev204
  ```

6. **IMPORTANT:** Run `chia configure --testnet true`. This will set up Chia to use the testnet.
  ```powershell
  (venv) PS C:\Users\User\Chia\main_dids\chia-blockchain> chia configure --testnet true
  Setting Testnet
  Default full node port, introducer and network setting updated
  Restart any running chia services for changes to take effect
  ```

7. We recommend that you use INFO-level logging instead of the default level of WARNING. To do this, run `chia configure --set-log-level INFO`.
  ```powershell
  (venv) PS C:\Users\User\Chia\main_dids\chia-blockchain> chia configure --set-log-level INFO
  Logging level updated. Check C:\Users\User\.chia\mainnet/log/debug.log
  Restart any running chia services for changes to take effect
  ```

8. You should use a public/private key pair for testnet that is separate than your mainnet keys. If you don't have a separate set of testnet keys, run `chia keys generate` to create one.

  ```powershell
  PS C:\Users\User\Chia\main_dids\chia-blockchain> chia keys generate
  Generating private key
  Added private key with public key fingerprint 3049838316
  Setting the xch destination for the farmer reward (1/8 plus fees, solo and pooling) to txch1tsepaz2qx978sajarelw33ekee0uzrydw5gpxq42lrtf7c6a2rksy3lxp7
  Setting the xch destination address for pool reward (7/8 for solo only) to txch1tsepaz2qx978sajarelw33ekee0uzrydw5gpxq42lrtf7c6a2rksy3lxp7
  To change the XCH destination addresses, edit the xch_target_address entries in /Users/user/.chia/mainnet/config/config.yaml.
  ```

  > It is good security practice to use this set of keys for testnet development only. In case of key compromise, your TXCH and NFTs will be sandboxed from your XCH.

9. If you generated new testnet keys in the last step, we recommend that you write down your seed phrase for later recovery. Run `chia keys show --show-mnemonic-seed`. You'll be shown your public and private keys. The last line of the output will be a list of 24 secret words. This is your _seed phrase_. **Carefully copy the words on paper and store them in a secure location.** Order is important.

  ```shell
  PS C:\Users\User\Chia\main_dids\chia-blockchain> chia keys show --show-mnemonic-seed
  Showing all public and private keys

  Fingerprint: 3049838316
  Master public key (m): b976ead8b3fe50d6813d6073cc161fc020f399fc7789e55c0da944ad8b5d04da418159e5dc40e492258baf2ca5123278
  Farmer public key (m/12381/8444/0/0): a5ec38213280c67c02733244c577f27f659b21ea70b347cbe8bb15c162e5d7d3c090b74d1e90a62734a1861531c5c86e
  Pool public key (m/12381/8444/1/0): ab82d14faa38f179d096b7471578461a4712109cb2ebd31953e9b333356850c133c109eb767e9dfd75443f63f8979438
  First wallet address: txch1tsepaz2qx978sajarelw33ekee0uzrydw5gpxq42lrtf7c6a2rksy3lxp7
  Master private key (m): 4036ad6e56a1de925411bfce35aca18fc692950d99241466267b475730a834cc
  First wallet secret key (m/12381/8444/2/0): <PrivateKey 2832e5f50dc5a092614e8627cf75f5fc378cc4c51db0932442f04b50fff338f1>
	Mnemonic seed (24 secret words):
  youth stomach social aware clay pottery benefit asthma mail cry rubber panda wife around provide atom cute sand staff exotic pink east gloom minute
  ```

  >**IMPORTANT**: Your seed phrase is all that is required to recover your wallet. If you lose your seed phrase, recovery will not be possible. If a bad actor gains access to your seed phrase, they'll be able to steal your Chia, including your NFTs.

  >**NOTE**: If you ever need to display your address, run `chia keys show`. This command will only output your public keys and address; your private keys and seed phrase will not be shown.

10. Start your wallet:

  ```powershell
  (venv) PS C:\Users\User\Chia\main_dids\chia-blockchain> chia start wallet
  Daemon not started yet
  Starting daemon
  chia_wallet: started
  ```

11. Wait for your wallet to sync. You can view the status of your wallet with the `chia wallet show` command. Be sure to select the correct key/fingerprint, which you obtained from the `chia keys show` command:

  ```powershell
  (venv) PS C:\Users\User\Chia\main_dids\chia-blockchain> chia wallet show
  Wallet keys:
  1)   285637561
  2) * 3049838316 (Not Synced)
  Choose a wallet key [1-2] ('q' to quit, or Enter to use 3049838316):
  Wallet height: 938814
  Sync status: Syncing...
  ```

Syncing should only require a few minutes, unless your wallet has a large number of previous transactions. Eventually, the `chia wallet show` command will show that your wallet has been synced:

  ```powershell
  (venv) PS C:\Users\User\Chia\main_dids\chia-blockchain> chia wallet show
  Wallet keys:
  1)   285637561
  2) * 3049838316 (Synced)
  Choose a wallet key [1-2] ('q' to quit, or Enter to use 3049838316):
  Wallet height: 938990
  Sync status: Synced
  Balances, fingerprint: 3049838316

  Chia Wallet:
     -Total Balance:         14.5 txch (14500000000000 mojo)
     -Pending Total Balance: 14.5 txch (14500000000000 mojo)
     -Spendable:             14.5 txch (14500000000000 mojo)
     -Type:                  STANDARD_WALLET
     -Wallet ID:             1
  ```

12. In order to continue, you'll need to have some txch in your wallet. If your total balance is 0, you can obtain some txch from our faucet. Copy the value of "First wallet address:" from the output of the `chia keys show` command. It will be a long string beginning with "txch". 

Open our [testnet faucet page](https://testnet10-faucet.chia.net "Chia's testnet10 faucet link"). Paste your address and click "Submit".

You'll receive this message: `Accepted. Your request is in the queue and will be processed in the order it was received.` At some point you'll receive 1 TXCH. Depending on how busy the faucet and the testnet are, this could take several minutes. However, you don't need to wait for your money to arrive before continuing.

13. Run `mkdir ~/.chia/mainnet/db` to create the folder where your database will sit.

	```powershell
	PS C:\Users\User> mkdir ~/.chia/mainnet/db

	Directory: C:\Users\User\.chia\mainnet

	Mode           LastWriteTime         Length Name
	----           -------------         ------ ----
	d-----         2/18/2022   3:28 PM          db
	```

14. You must wait for your database file to finish downloading before continuing. After the download has completed, use a zip manager such as [7-Zip](https://www.7-zip.org/ "7-Zip's website") to extract the file. You should now have a file in your Downloads folder called blockchain_v2_testnet10.sqlite.

 run `mv ~/Downloads/blockchain_v2_testnet10.sqlite ~/.chia/mainnet/db` to move it to the folder you just created.

15. Run `chia start node`. This command will start your full node, which will begin syncing to the database file:

  ```powershell
  (venv) PS C:\Users\User\Chia\main_dids\chia-blockchain> chia start node
  chia_full_node: started
  ```

16. Run `chia show -s`. This command will show your status. Eventually it will say `Current Blockchain Status: Full Node Synced`.

```powershell
(venv) PS C:\Users\User\Chia\main_dids\chia-blockchain> chia show -s
Network: testnet10    Port: 58444   RPC Port: 8555
Node ID: 82a73b06b3a5f9493a3ac4e3d903026b39c85b748158ba41c623d531947f2a2a
Genesis Challenge: ae83525ba8d1dd3f09b277de18ca3e43fc0af20d20c4b3e92ef2a48bd291ccb2
Current Blockchain Status: Full Node Synced
```

Once you have a synced full node and some txch, you may proceed to the next section. If your requested txch has not yet arrived, post your address on the #dev channel on Keybase. Someone might be able to send some to you.

---

## Mint an NFT

  > NOTE: This tutorial will use Windows. When running rpc commands on Windows, you'll need to escape all quotes with backslashes. This is not needed on Linux or MacOS. For example, the Windows command
  ```powershell  
  chia rpc wallet create_new_wallet '{\"wallet_type\": \"nft_wallet\", \"did_wallet_id\": 2}'
  ```
  Becomes the following on Linux and MacOS:
  ```powershell
  chia rpc wallet create_new_wallet '{"wallet_type": "nft_wallet", "did_wallet_id": 2}'
  ```
  

Before you can mint an NFT, you'll need to create new wallets for your DIDs and NFTs.

1. Run `chia wallet did create -n '<name>' -a 1` to create a DID wallet with a custom name and 1 mojo to start with. Be sure to select your wallet fingerprint that is synced and contains some TXCH:

```powershell
(venv) PS C:\Users\User\Chia\main_dids\chia-blockchain> chia wallet did create -n 'test_did_wallet' -a 1
Wallet keys:
1)   285637561
2) * 3049838316 (Synced)
Choose a wallet key [1-2] ('q' to quit, or Enter to use 3049838316):
Successfully created a DID wallet with name test_did_wallet and id 2 on key 3049838316
Successfully created a DID 15dbd596ea58ccf129b7f7cced9e2318b89ec07cf8ead71a71e1bb259ccb7f9b in the newly created DID wallet
```

2. It will take a few minutes for your new wallet to be confirmed on the blockchain. Run `chia wallet show` to view the status. Once your new wallet (`test_did_wallet` in this example) shows up, take note of its `Wallet ID` (`2` in this example).

```powershell
(venv) PS C:\Users\User\Chia\main_dids\chia-blockchain> chia wallet show
Wallet keys:
1)   285637561
2) * 3049838316 (Synced)
Choose a wallet key [1-2] ('q' to quit, or Enter to use 3049838316):
Wallet height: 939319
Sync status: Synced
Balances, fingerprint: 3049838316

Chia Wallet:
   -Total Balance:         14.499999999999 txch (14499999999999 mojo)
   -Pending Total Balance: 14.499999999999 txch (14499999999999 mojo)
   -Spendable:             14.499999999999 txch (14499999999999 mojo)
   -Type:                  STANDARD_WALLET
   -Wallet ID:             1

test_did_wallet:
   -Total Balance:         1.0
   -Pending Total Balance: 1.0
   -Spendable:             1.0
   -Type:                  DISTRIBUTED_ID
   -Asset ID:              {"origin_coin": {"parent_coin_info": "0xcc3d1270ab82345b51f88ff4
   -Wallet ID:             2
```

3. Create an NFT wallet that references your DID wallet's `Wallet ID`. Be sure to change the `did_wallet_id` to your local DID wallet's `Wallet ID`:

```powershell
(venv) PS C:\Users\User\Chia\main_dids\chia-blockchain> chia rpc wallet create_new_wallet '{\"wallet_type\": \"nft_wallet\", \"did_wallet_id\": 2}'
{
    "success": true,
    "type": 10,
    "wallet_id": 3
}
```
Note that a wall with a `type` of `10` is an NFT wallet.

4. Obtain the hash of the image your want to mint as an NFT. For this example, we'll use an image that is licensed in the public domain:
[https://images.pexels.com/photos/11053072/pexels-photo-11053072.jpeg](https://images.pexels.com/photos/11053072/pexels-photo-11053072.jpeg)

Here are three (of many) ways in which to obtain the hash:
  i. If you're on Windows, you'll need to run this command from git bash
  ```powershell
  $ curl https://images.pexels.com/photos/11053072/pexels-photo-11053072.jpeg | sha256sum
  % Total    % Received % Xferd  Average Speed   Time    Time     Time  Current
                                 Dload  Upload   Total   Spent    Left  Speed
  100 3252k  100 3252k    0     0  19.8M      0 --:--:-- --:--:-- --:--:-- 19.9M
  14836b86a48e1b2b5e857213af97534704475b4c155d34b2cb83ed4b7cba2bb0 *-
  ```

  ii. If you're on Windows, you'll need to run this command from git bash
  ```powershell
  $ curl https://images.pexels.com/photos/11053072/pexels-photo-11053072.jpeg | shasum -a 256
  % Total    % Received % Xferd  Average Speed   Time    Time     Time  Current
                                 Dload  Upload   Total   Spent    Left  Speed
  100 3252k  100 3252k    0     0  23.1M      0 --:--:-- --:--:-- --:--:-- 23.3M
  14836b86a48e1b2b5e857213af97534704475b4c155d34b2cb83ed4b7cba2bb0 *-
  ```

  iii. Save the image locally. Visit [https://emn178.github.io/online-tools/sha256_checksum.html](https://emn178.github.io/online-tools/sha256_checksum.html). Upload the image and click the Hash button. The result should be the same as with the other two commands.

5. Mint your NFT using the following values:
  * `wallet_id`: The ID of the NFT wallet you created in step 3
  * `uris`: A comma-separated list of URIs where this image may be found. We'll only use one URI for this example. For NFT1, the image at this url will be displayed in Chia's GUI wallet. Be sure to add two backslashes (`\\`) to escape any special characters in the URI, such as `?` and `=`
  * `hash`: The hash you just calculated. For now, the minting tool and wallet will not verify that this hash is correct. Be sure to double-check this, ideally using multiple methods to calculate the hash. Hash verification will be included in NFT1
  * `artist_percentage`: For NFT1, this will be the royalty that will go to the original artist each time the NFT is sold. The percentage is multiplied by 100 -- for example, to set a 15% royalty, set this value to 1500. However, this feature is disabled in NFT0
  * `artist_address`: Enter the wallet address of the original artist. For this example on testnet, we'll use a local address

The command will end up looking like this:

```powershell
chia rpc wallet nft_mint_nft '{
  \"wallet_id\": 3, 
  \"uris\": [
    \"https://images.pexels.com/photos/11053072/pexels-photo-11053072.jpeg\"
  ], 
  \"hash\": \"14836b86a48e1b2b5e857213af97534704475b4c155d34b2cb83ed4b7cba2bb0\", 
  \"artist_percentage\": 1500, 
  \"artist_address\": \"txch1yxpslrx30k7lnngpfczr3ltrge0ap25f4739jet5lz069lhn5szsu49uyh\"
}'
```

If successful, you will receive a JSON output, including the coin additions and removals involved in minting the NFT, as well as spendbundle that was used. At the end of the output, you should see `"success": true,`.

```powershell
(venv) PS C:\Users\User\Chia\main_dids\chia-blockchain> chia rpc wallet nft_mint_nft '{\"wallet_id\": 3, \"uris\": [\"https://images.pexels.com/photos/11053072/pexels-photo-11053072.jpeg\"], \"hash\": \"14836b86a48e1b2b5e857213af97534704475b4c155d34b2cb83ed4b7cba2bb0\", \"artist_percentage\": 1500, \"artist_address\": \"txch1yxpslrx30k7lnngpfczr3ltrge0ap25f4739jet5lz069lhn5szsu49uyh\"}'
{
    "nft": {
        "additions": [
          ...
        ],
        "amount": 1,
        "confirmed": false,
        "confirmed_at_height": 0,
        "created_at_time": 1651912565,
        "fee_amount": 0,
        "memos": [],
        "name": "0xdd14793f28b8d3d94782a5d99398094e6d0e612e3101a0fe806c474dab2feb48",
        "removals": [
          ...
        ],
        "sent": 0,
        "sent_to": [],
        "spend_bundle": {
          ...
        },
        "to_puzzle_hash": "0xae3c67057b390a1d6192d7f48e4585dd626eed9c1ac7b941668fb53cc432c034",
        "trade_id": null,
        "type": 1,
        "wallet_id": 3
    },
    "success": true,
    "wallet_id": 3
}
```

6. To view your NFT, run the `nft_get_nfts` RPC, passing in your NFT wallet's ID:

```powershell
(venv) PS C:\Users\User\Chia\main_dids\chia-blockchain> chia rpc wallet nft_get_nfts '{\"wallet_id\": 3}'
{
    "nft_list": [
        [
            {
                "coin": {
                   ...
                },
                "full_puzzle": ...,
                "lineage_proof": {
                    "amount": 1,
                    "inner_puzzle_hash": "0x0270e884ef2beb0a5c3b685f9edc3dc572fbfe73f7f07971ae7ee1aa681ccc00",
                    "parent_name": "0x831404fe4d27616a5527e8a0e86b9ef92ea5ec5f01240d19a421ac9e907eafa1"
                }
            },
            [
                "0xff75ffc04468747470733a2f2f696d616765732e706578656c732e636f6d2f70686f746f732f31313035333037322f706578656c732d70686f746f2d31313035333037322e6a70656780",
                "0xff68c04031343833366238366134386531623262356538353732313361663937353334373034343735623463313535643334623263623833656434623763626132626230"
            ]
        ]
    ],
    "success": true,
    "wallet_id": 3
}
```

---

## DID Wallet RPCs

### Commands

* [`did_set_wallet_name`](#did_set_wallet_name)
* [`did_get_wallet_name`](#did_get_wallet_name)
* [`did_update_recovery_ids`](#did_update_recovery_ids)
* [`did_update_metadata`](#did_update_metadata)
* [`did_get_did`](#did_get_did)
* [`did_get_recovery_list`](#did_get_recovery_list)
* [`did_get_metadata`](#did_get_metadata)
* [`did_recovery_spend`](#did_recovery_spend)
* [`did_get_pubkey`](#did_get_pubkey)
* [`did_create_attest`](#did_create_attest)
* [`did_get_information_needed_for_recovery`](#did_get_information_needed_for_recovery)
* [`did_get_current_coin_info`](#did_get_current_coin_info)
* [`did_create_backup_file`](#did_create_backup_file)
* [`did_transfer_did`](#did_transfer_did)

### Reference

---

### `did_set_wallet_name`

Functionality: Set the name of a DID wallet

Usage: `chia rpc wallet [OPTIONS] did_set_wallet_name [REQUEST]`

Options:

| Short Command | Long Command                 | Type  | Required | Description |
|:-------------:|:----------------------------:|:-----:|:--------:|:------------|
| -j            | --json-file                  | TEXT  | False    | Instead of REQUEST, provide a json file containing the request data
| -h            | --help                       | None  | False    | Show a help message and exit

Request Parameters:

| Parameter | Required | Description |
|:---------:|:--------:|:------------|
| wallet_id | True     | The `Wallet ID` of the DID wallet on which to set the name, obtainable by running `chia wallet show`
| name      | True     | The new name of the DID wallet

Example: 

```json
// Request
chia rpc wallet did_set_wallet_name '{\"wallet_id\": 2, \"name\": \"My DID Wallet\"}'

// Response
{
    "success": true,
    "wallet_id": 2
}
```

---

### `did_get_wallet_name`

Functionality: Get the name of a DID wallet

Usage: `chia rpc wallet [OPTIONS] did_get_wallet_name [REQUEST]`

Options:

| Short Command | Long Command                 | Type  | Required | Description |
|:-------------:|:----------------------------:|:-----:|:--------:|:------------|
| -j            | --json-file                  | TEXT  | False    | Instead of REQUEST, provide a json file containing the request data
| -h            | --help                       | None  | False    | Show a help message and exit

Request Parameters:

| Parameter | Required | Description |
|:---------:|:--------:|:------------|
| wallet_id | True     | The `Wallet ID` of the DID wallet on which to get the name, obtainable by running `chia wallet show`

Example: 

```json
// Request
chia rpc wallet did_get_wallet_name '{\"wallet_id\": 2}'

// Response
{
    "name": "My DID Wallet",
    "success": true,
    "wallet_id": 2
}
```

---

### `did_update_recovery_ids`

Functionality: Update the recovery IDs for a DID wallet. The current list can be obtained with the [`did_get_recovery_list`](#did_get_recovery_list) endpoint

Usage: `chia rpc wallet [OPTIONS] did_update_recovery_ids [REQUEST]`

Options: 

| Short Command | Long Command                 | Type  | Required | Description |
|:-------------:|:----------------------------:|:-----:|:--------:|:------------|
| -j            | --json-file                  | TEXT  | False    | Instead of REQUEST, provide a json file containing the request data
| -h            | --help                       | None  | False    | Show a help message and exit

Request Parameters:

| Parameter | Required | Description |
|:---------:|:--------:|:------------|
| wallet_id | True     | The `Wallet ID` of the DID wallet for which to update the recovery IDs, obtainable by running `chia wallet show`
| new_list  | True     | The new recovery ID list

Example: 

```json
// Request
[todo]
// Response
```

---

### `did_update_metadata`

Functionality: Update the metadata for a DID wallet. The current metadata can be obtained with the [`did_get_metadata`](#did_get_metadata) endpoint

Usage: `chia rpc wallet [OPTIONS] did_update_metadata [REQUEST]`

Options: 

| Short Command | Long Command                 | Type  | Required | Description |
|:-------------:|:----------------------------:|:-----:|:--------:|:------------|
| -j            | --json-file                  | TEXT  | False    | Instead of REQUEST, provide a json file containing the request data
| -h            | --help                       | None  | False    | Show a help message and exit

Request Parameters:

| Parameter | Required | Description |
|:---------:|:--------:|:------------|
| wallet_id | True     | The `Wallet ID` of the DID wallet for which to update the metadata, obtainable by running `chia wallet show`

Example: 

```json
// Request
[todo]
// Response
```

---

### `did_get_did`

Functionality: Get the `coin_id` and `my_did` settings for a given wallet

Usage: `chia rpc wallet [OPTIONS] did_get_did [REQUEST]`

Options: 

| Short Command | Long Command                 | Type  | Required | Description |
|:-------------:|:----------------------------:|:-----:|:--------:|:------------|
| -j            | --json-file                  | TEXT  | False    | Instead of REQUEST, provide a json file containing the request data
| -h            | --help                       | None  | False    | Show a help message and exit

Request Parameters:

| Parameter | Required | Description |
|:---------:|:--------:|:------------|
| wallet_id | True     | The `Wallet ID` of the DID wallet for which to get the DID info, obtainable by running `chia wallet show`

Example: 

```json
// Request
chia rpc wallet did_get_did '{\"wallet_id\": 2}'

// Response
{
    "coin_id": "0xcc946f6965c511a2ba1ad84aaa916c58b245d43e328037e5758395820311b32d",
    "my_did": "15dbd596ea58ccf129b7f7cced9e2318b89ec07cf8ead71a71e1bb259ccb7f9b",
    "success": true,
    "wallet_id": 2
}
```

---

### `did_get_recovery_list`

Functionality: Get the `recovery_list` setting for a given wallet

Usage: `chia rpc wallet [OPTIONS] did_get_recovery_list [REQUEST]`

Options: 

| Short Command | Long Command                 | Type  | Required | Description |
|:-------------:|:----------------------------:|:-----:|:--------:|:------------|
| -j            | --json-file                  | TEXT  | False    | Instead of REQUEST, provide a json file containing the request data
| -h            | --help                       | None  | False    | Show a help message and exit

Request Parameters:

| Parameter | Required | Description |
|:---------:|:--------:|:------------|
| wallet_id | True     | The `Wallet ID` of the DID wallet for which to get the recovery list, obtainable by running `chia wallet show`

Example: 

```json
// Request
chia rpc wallet did_get_recovery_list '{\"wallet_id\": 2}'

// Response
{
    "num_required": 0,
    "recovery_list": [],
    "success": true,
    "wallet_id": 2
}
```

---

### `did_get_metadata`

Functionality: Get the `metadata` list setting for a given wallet

Usage: `chia rpc wallet [OPTIONS] did_get_metadata [REQUEST]`

Options: 

| Short Command | Long Command                 | Type  | Required | Description |
|:-------------:|:----------------------------:|:-----:|:--------:|:------------|
| -j            | --json-file                  | TEXT  | False    | Instead of REQUEST, provide a json file containing the request data
| -h            | --help                       | None  | False    | Show a help message and exit

Request Parameters:

| Parameter | Required | Description |
|:---------:|:--------:|:------------|
| wallet_id | True     | The `Wallet ID` of the DID wallet for which to get the metadata list, obtainable by running `chia wallet show`

Example: 

```json
// Request
chia rpc wallet did_get_metadata '{\"wallet_id\": 2}'

[todo rerun command after adding metadata]
// Response
{
    "metadata": {},
    "success": true,
    "wallet_id": 2
}
```

---

### `did_recovery_spend`

Functionality: Recover a DID [todo]

Usage: `chia rpc wallet [OPTIONS] did_recovery_spend [REQUEST]`

Options: 

| Short Command | Long Command                 | Type  | Required | Description |
|:-------------:|:----------------------------:|:-----:|:--------:|:------------|
| -j            | --json-file                  | TEXT  | False    | Instead of REQUEST, provide a json file containing the request data
| -h            | --help                       | None  | False    | Show a help message and exit

Request Parameters:

| Parameter   | Required | Description |
|:-----------:|:--------:|:------------|
| wallet_id   | True     | The `Wallet ID` of the DID wallet to recover, obtainable by running `chia wallet show`
| attest_data | True     | [todo]

Example: 

```json
// Request
[todo]
// Response
[todo]
```

---

### `did_get_pubkey`

Functionality: Get the public key for a DID

Usage: `chia rpc wallet [OPTIONS] did_get_pubkey [REQUEST]`

Options: 

| Short Command | Long Command                 | Type  | Required | Description |
|:-------------:|:----------------------------:|:-----:|:--------:|:------------|
| -j            | --json-file                  | TEXT  | False    | Instead of REQUEST, provide a json file containing the request data
| -h            | --help                       | None  | False    | Show a help message and exit

Request Parameters:

| Parameter   | Required | Description |
|:-----------:|:--------:|:------------|
| wallet_id   | True     | The `Wallet ID` of the DID wallet from which to obtain the public key, obtainable by running `chia wallet show`

Example:

```json
// Request
chia rpc wallet did_get_pubkey '{\"wallet_id\": 2}'

// Response
{
    "pubkey": "886826068778f285c442cfd08a45c7b55ecc9ef870b9b18810e81457c56df9764793686c1756e48a91586839a4abd290",
    "success": true
}
```

---

### `did_create_attest`

Functionality: Create an attestation for a DID[todo verify]

Usage: `chia rpc wallet [OPTIONS] did_create_attest [REQUEST]`

Options: 

| Short Command | Long Command                 | Type  | Required | Description |
|:-------------:|:----------------------------:|:-----:|:--------:|:------------|
| -j            | --json-file                  | TEXT  | False    | Instead of REQUEST, provide a json file containing the request data
| -h            | --help                       | None  | False    | Show a help message and exit

Request Parameters:

| Parameter   | Required | Description |
|:-----------:|:--------:|:------------|
| wallet_id   | True     | The `Wallet ID` of the DID wallet for which to create the attestation, obtainable by running `chia wallet show`
| coin_name   | True     | [todo]

Example:

```json
// Request
[todo]
// Response
[todo]
```

---

### `did_get_information_needed_for_recovery`

Functionality: Get the information needed to recover a given DID

Usage: `chia rpc wallet [OPTIONS] did_get_information_needed_for_recovery [REQUEST]`

Options: 

| Short Command | Long Command                 | Type  | Required | Description |
|:-------------:|:----------------------------:|:-----:|:--------:|:------------|
| -j            | --json-file                  | TEXT  | False    | Instead of REQUEST, provide a json file containing the request data
| -h            | --help                       | None  | False    | Show a help message and exit

Request Parameters:

| Parameter   | Required | Description |
|:-----------:|:--------:|:------------|
| wallet_id   | True     | The `Wallet ID` of the DID wallet from which to obtain the recovery information, obtainable by running `chia wallet show`

Example:

```json
// Request
[todo: maybe doesn't work yet]
chia rpc wallet did_get_information_needed_for_recovery '{\"wallet_id\": 2}'

// Response
Request failed: {'error': "'NoneType' object has no attribute 'name'", 'success': False}
```

---

### `did_get_current_coin_info`

Functionality: Get the current coin info for a DID wallet

Usage: `chia rpc wallet [OPTIONS] did_get_current_coin_info [REQUEST]`

Options: 

| Short Command | Long Command                 | Type  | Required | Description |
|:-------------:|:----------------------------:|:-----:|:--------:|:------------|
| -j            | --json-file                  | TEXT  | False    | Instead of REQUEST, provide a json file containing the request data
| -h            | --help                       | None  | False    | Show a help message and exit

Request Parameters:

| Parameter   | Required | Description |
|:-----------:|:--------:|:------------|
| wallet_id   | True     | The `Wallet ID` of the DID wallet from which to obtain the coin info, obtainable by running `chia wallet show`

Example:

```json
// Request
chia rpc wallet did_get_current_coin_info '{\"wallet_id\": 2}'

// Response
{
    "did_amount": 1,
    "did_innerpuz": "0xbd33aa06a63014032cfa3a0ccc7a6d275d69214536e5816f72d34f9af7ed133a",
    "did_parent": "0x19b780c48d4923be92d2834c8ae4aaa7d1116d4e4c56d205ecebbd1e47f29d15",
    "my_did": "15dbd596ea58ccf129b7f7cced9e2318b89ec07cf8ead71a71e1bb259ccb7f9b",
    "success": true,
    "wallet_id": 2
}
```

---

### `did_create_backup_file`

Functionality: Create a backup file that contains a DID wallet's metadata

Usage: `chia rpc wallet [OPTIONS] did_create_backup_file [REQUEST]`

Options: 

| Short Command | Long Command                 | Type  | Required | Description |
|:-------------:|:----------------------------:|:-----:|:--------:|:------------|
| -j            | --json-file                  | TEXT  | False    | Instead of REQUEST, provide a json file containing the request data
| -h            | --help                       | None  | False    | Show a help message and exit

Request Parameters:

| Parameter   | Required | Description |
|:-----------:|:--------:|:------------|
| wallet_id   | True     | The `Wallet ID` of the DID wallet from which to obtain the coin info, obtainable by running `chia wallet show`
| >           | False    | By default, the info will be directed to the standard output. It is also possible to redirect the output to a text file

Example:

```json
// Request

chia rpc wallet did_create_backup_file '{\"wallet_id\": 2}' > wallet2.bak
more wallet2.bak

// Response
{
    "backup_data": "cc3d1270ab82345b51f88ff4b4cf7148d9171b274032d9dbc73e996ed42bf226:eff07522495060c066f66f32acc2a77e3a3e737aca8baea4d1a64ea4cdc13da9:1::ff02ffff01ff02ffff01ff02ffff03ff81bfffff01ff02ff05ff82017f80ffff01ff02ffff03ffff22ffff09ffff02ff7effff04ff02ffff04ff8217ffff80808080ff0b80ffff15ff17ff808080ffff01ff04ffff04ff28ffff04ff82017fff808080ffff04ffff04ff34ffff04ff8202ffffff04ff82017fffff04ffff04ff8202ffff8080ff8080808080ffff04ffff04ff38ffff04ff822fffff808080ffff02ff26ffff04ff02ffff04ff2fffff04ff17ffff04ff8217ffffff04ff822fffffff04ff8202ffffff04ff8205ffffff04ff820bffffff01ff8080808080808080808080808080ffff01ff088080ff018080ff0180ffff04ffff01ffffffff313dff4946ffff0233ff3c04ffffff0101ff02ff02ffff03ff05ffff01ff02ff3affff04ff02ffff04ff0dffff04ffff0bff2affff0bff22ff3c80ffff0bff2affff0bff2affff0bff22ff3280ff0980ffff0bff2aff0bffff0bff22ff8080808080ff8080808080ffff010b80ff0180ffffff02ffff03ff17ffff01ff02ffff03ff82013fffff01ff04ffff04ff30ffff04ffff0bffff0bffff02ff36ffff04ff02ffff04ff05ffff04ff27ffff04ff82023fffff04ff82053fffff04ff820b3fff8080808080808080ffff02ff7effff04ff02ffff04ffff02ff2effff04ff02ffff04ff2fffff04ff5fffff04ff82017fff808080808080ff8080808080ff2f80ff808080ffff02ff26ffff04ff02ffff04ff05ffff04ff0bffff04ff37ffff04ff2fffff04ff5fffff04ff8201bfffff04ff82017fffff04ffff10ff8202ffffff010180ff808080808080808080808080ffff01ff02ff26ffff04ff02ffff04ff05ffff04ff37ffff04ff2fffff04ff5fffff04ff8201bfffff04ff82017fffff04ff8202ffff8080808080808080808080ff0180ffff01ff02ffff03ffff15ff8202ffffff11ff0bffff01018080ffff01ff04ffff04ff20ffff04ff82017fffff04ff5fff80808080ff8080ffff01ff088080ff018080ff0180ff0bff17ffff02ff5effff04ff02ffff04ff09ffff04ff2fffff04ffff02ff7effff04ff02ffff04ffff04ff09ffff04ff0bff1d8080ff80808080ff808080808080ff5f80ffff04ffff0101ffff04ffff04ff2cffff04ff05ff808080ffff04ffff04ff20ffff04ff17ffff04ff0bff80808080ff80808080ffff0bff2affff0bff22ff2480ffff0bff2affff0bff2affff0bff22ff3280ff0580ffff0bff2affff02ff3affff04ff02ffff04ff07ffff04ffff0bff22ff2280ff8080808080ffff0bff22ff8080808080ff02ffff03ffff07ff0580ffff01ff0bffff0102ffff02ff7effff04ff02ffff04ff09ff80808080ffff02ff7effff04ff02ffff04ff0dff8080808080ffff01ff0bffff0101ff058080ff0180ff018080ffff04ffff01ff02ffff01ff02ffff01ff02ffff03ff0bffff01ff02ffff03ffff09ff05ffff1dff0bffff1effff0bff0bffff02ff06ffff04ff02ffff04ff17ff8080808080808080ffff01ff02ff17ff2f80ffff01ff088080ff0180ffff01ff04ffff04ff04ffff04ff05ffff04ffff02ff06ffff04ff02ffff04ff17ff80808080ff80808080ffff02ff17ff2f808080ff0180ffff04ffff01ff32ff02ffff03ffff07ff0580ffff01ff0bffff0102ffff02ff06ffff04ff02ffff04ff09ff80808080ffff02ff06ffff04ff02ffff04ff0dff8080808080ffff01ff0bffff0101ff058080ff0180ff018080ffff04ffff01b0b84b40fb8011ea25b35f8b67036f2397fce2d16dc67d1f83f929bfb34d1539c91478204524832f4f2e686602608a7dbaff018080ffff04ffff01a04bf5122f344554c53bde2ebb8cd2b7e3d1600ad631c385a5d7cce23c7785459affff04ffff0180ffff04ffff01ffa0f1e8350cec62f8204aaf867cc3c12cae369f619258206616108c6cfd7be760b3ffa015dbd596ea58ccf129b7f7cced9e2318b89ec07cf8ead71a71e1bb259ccb7f9ba0eff07522495060c066f66f32acc2a77e3a3e737aca8baea4d1a64ea4cdc13da9ffff04ffff0180ff01808080808080:0:{}",
    "success": true,
    "wallet_id": 2
}
```

---

### `did_transfer_did`

Functionality: Transfer a DID [todo verify]

Usage: `chia rpc wallet [OPTIONS] did_transfer_did [REQUEST]`

Options: 

| Short Command | Long Command                 | Type  | Required | Description |
|:-------------:|:----------------------------:|:-----:|:--------:|:------------|
| -j            | --json-file                  | TEXT  | False    | Instead of REQUEST, provide a json file containing the request data
| -h            | --help                       | None  | False    | Show a help message and exit

Request Parameters:

| Parameter   | Required | Description |
|:-----------:|:--------:|:------------|
| wallet_id     | True     | The `Wallet ID` of the DID wallet to transfer, obtainable by running `chia wallet show`
| inner_address | True     | The address of the inner puzzle to which to transfer the DID

Example:

```json
// Request
[todo]
// Response
[todo]
```

---

## NFT Wallet RPCs

### Commands

* [`nft_mint_nft`](#nft_mint_nft)
* [`nft_get_nfts`](#nft_get_nfts)
* [`nft_transfer_nft`](#nft_transfer_nft)
* [`nft_add_url`](#nft_add_url)

### Reference

### `nft_mint_nft`

Functionality: Create an offer of XCH/CATs for XCH/CATs.

Usage: `chia wallet make_offer [OPTIONS]`

Options:

Example: 

```json
// Request

// Response
```

---

### `nft_get_nfts`

Functionality: Create an offer of XCH/CATs for XCH/CATs.

Usage: `chia wallet make_offer [OPTIONS]`

Options:

Example: 

```json
// Request

// Response
```

---

### `nft_transfer_nft`

Functionality: Create an offer of XCH/CATs for XCH/CATs.

Usage: `chia wallet make_offer [OPTIONS]`

Options:

Example: 

```json
// Request

// Response
```

---

### `nft_add_url`

Functionality: Create an offer of XCH/CATs for XCH/CATs.

Usage: `chia wallet make_offer [OPTIONS]`

Options:

Example: 

```json
// Request

// Response
```

---
