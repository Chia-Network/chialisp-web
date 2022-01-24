# CAT creation tutorial (Linux/MacOS)

This tutorial is for creating Chia Asset Tokens (CATS) on Linux and MacOS. We also have made available a version of [this tutorial for Windows users](https://www.chialisp.com/docs/tutorials/CAT_Launch_Process_Windows "Chia Asset Token tutorial for Windows users").

Contents:

* [Introduction](#introduction)
* [CAT issuance granularity](#cat-issuance-granularity)
* [Setting up your Chia environment](#setting-up-your-chia-environment)
* [Creating a single-mint CAT](#creating-a-single-mint-cat)
* [Creating a multiple mint CAT](#creating-a-multiple-mint-cat)
* [Preparing for mainnet](#preparing-for-mainnet)
* [Generating a secure key pair](#generating-a-secure-key-pair)
* [Potential future additions](#potential-future-additions)

-----

## Introduction

Welcome to the world of CATs! We're excited to have you here, and we can't wait to see the creative ideas you come up with.

This tutorial will help you jump right in and get started with issuing your own CATs. However, there are a few things you should know before we begin.

The [CAT1 standard](https://chialisp.com/docs/puzzles/cats "CAT1 standard documentation") is finalized as of January 2022.

To minimize your risk of running into unexpected results, we recommend that you do following (each of these will be discussed in more detail later in the tutorial):

* Generate a new public/private key pair for each CAT you issue. This key pair should be used for issuing one specific CAT **and nothing else**. It should also be the only key pair on your computer while issuing the CAT.
* Test thoroughly on testnet before issuing your CAT to mainnet.

For any questions regarding this tutorial, head over to the #chialisp channel on our [Keybase](https://keybase.io/team/chia_network.public "Chia's Keybase forum") forum, where there are lots of friendly folks who can help you.

-----

## CAT issuance granularity

CAT denominations, as well as the rules behind minting and melting, can take some getting used to. Here are a few things to keep in mind before you issue your CATs:

* Most Chia wallets choose to display their value in XCH. However, this is a purely cosmetic choice because Chia's blockchain only knows about mojos. One XCH is equal to one trillion (1,000,000,000,000) mojos.
* In a similar vein, a default decision was made to map 1 CAT to 1000 XCH mojos. By default, this ratio will be the same for all CATs.
* It is possible to set the CAT:mojo ratio to something other than 1:1000 for a specific CAT, but doing so could negatively affect interoperability between tokens. We recommend that you use the default setting unless you have a good reason to do otherwise.
* Therefore, the default melt value of a single token is 1000 mojos. This remains true regardless of the token's face value or its circulating supply.
* A token's face value and its melt value are not necessarily correlated, let alone matched.

With one XCH, you can mint 1 billion CATs. The face value of these tokens could be zero, or multiple XCH, or anywhere in between. This value is decided by the market -- it's worth whatever someone is willing to pay for it. The value of the tokens has nothing to do with the underlying XCH, other than their 1000-mojo melt value.

These concepts are discussed in greater detail in our [CAT1 standard](https://chialisp.com/docs/puzzles/cats#cat-denominations-value-and-retirement-rules "CAT1 standard documentation").

-----

## Setting up your Chia environment

There are two phases of issuing a CAT: testing your issuance on testnet and actually issuing on mainnet. In both of these phases, you'll need a synced full node.

We'll start with installing Chia's testnet.

0. Ensure that you have a Python version between 3.7 and 3.9 installed by running `python3 version`.

  >If you already have Chia version 1.3 or later installed, you can skip step 1.

1. Clone the `main` branch from GitHub and install Chia:

    a. Create a new folder called `chia_main` (or something similar) and cd to it.
  
    b. Run `git clone https://github.com/Chia-Network/chia-blockchain.git -b main --recurse-submodules` to clone Chia's main branch.
 
    c. Run `cd chia-blockchain`.
    
    d. Run `sh install.sh` to install Chia.
    
    e. Run `. ./activate` to activate a virtual environment.
    
    f. Run `chia init` to initialize your environment.

    g. If you receive this message: "WARNING: UNPROTECTED SSL FILE!" then run `chia init --fix-ssl-permissions`.
    
    h. Run `sh install-gui.sh` to install the Chia GUI.

2. Download the testnet10 database and tell Chia to use the testnet:

    Because your are running on the testnet, you can download a database to speed up the syncing of your full node.
    
    > **WARNING: Do not attempt this on mainnet.** 

    a. Open a new browser window and go to [our download site](https://download.chia.net/?prefix=testnet10/ "Testnet10 database download").
    
    b. Click the file "blockchain_v1_testnet10.sqlite" to download it. Depending on your connection speed, this could take several minutes.
    
    c. Move the .sqlite file to the db folder, which is located in `~/.chia/mainnet/db/`.

    d. Run `chia configure -t true` to switch to testnet10.
    
3. Run and sync the Chia GUI:

    a. Before doing anything else, it’s a good idea to set your log_level to INFO. To do this, edit `~/.chia/mainnet/config/config.yaml` and change the value for "log_level:" to INFO. (It’s set to WARNING by default.)
    
    b. Run `cd chia_main/chia-blockchain/chia-blockchain-gui`.

    c. If "(venv)" doesn’t appear on the left side of your command line, run `. ../activate` to activate your virtual environment.
    
    d. Run `npm run electron &` to run the Chia GUI as a daemon.

    e. You will be given the option to run in "Farming Mode" or "Wallet Mode". Choose "Farming Mode", which will start run Chia as a full node.

    f. If you already have a "Private key with public fingerprint", select it when the GUI loads. Otherwise, select "CREATE A NEW PRIVATE KEY".

    g. "Status: Syncing" should appear in the upper right corner of the GUI. Within a few minutes, this should change to "Status: Synced".

    h. If your Total Balance is 0, you can get some testnet10 TXCH from [our faucet](https://testnet10-faucet.chia.net "testnet10 TXCH faucet").

4. Set up the CAT admin tool, which will help you to issue your CATs:

    a. Run `git clone https://github.com/Chia-Network/CAT-admin-tool.git -b main --recurse-submodules` to clone the CAT admin tool.

    b. Run `cd CAT-admin-tool`.
    
    c. Run `python3 -m venv venv` to create a virtual environment.

    d. Run `. ./venv/bin/activate` to activate the virtual environment.

    e. Run `pip install .`. This will take a few minutes. You will likely receive a few errors, which are safe to ignore.
    
    f. Run `pip install chia-dev-tools --no-deps`.
    
    g. Run `pip install pytest`. You can safely ignore the errors about missing requirements.

5. Your environment should be all set, but let's make sure:

    a. Run `cats --help`. You should get a usage statement.
    
    b. Run `cdv --help`. You should get another usage statement.
    
    c. Run `chia show -s`. You should get this message: "Current Blockchain Status: Full Node Synced", along with a listing of the latest block heights.

    d. Verify that "Status: Synced" is showing in the upper right side of the Chia GUI.

    e. Make sure you have some TXCH in your wallet.

Your environment is now set up and you are ready to start issuing CATs.

-----

## Creating a single-mint CAT

If you're a visual learner, please see our [video tutorial for creating a single-mint CAT](https://chialisp.com/docs/tutorials/single_issuance_CAT "Single-mint CAT video tutorial").

> NOTE: This section will discuss Token Asset Issuance Limiters (TAILs), as well some technical details of CATs. For a refresher on CATs and TAILs, check out our [CAT1 standard](https://chialisp.com/docs/puzzles/cats "CAT1 standard documentation").

To get started, you will create a single-mint CAT. This is the default way to issue a CAT. It's also the simplest. It contains a TAIL that only can be used on a specific XCH coin. In Chia the coins can only be spent once, so in this case, the CAT can only mint tokens once.

A CAT with a single-mint TAIL will be useful for anyone who wants to create a token with a guaranteed fixed supply.

You can find the TAIL we'll use for this example [here](https://github.com/Chia-Network/chia-blockchain/blob/main/chia/wallet/puzzles/genesis-by-coin-id-with-0.clvm "Single-mint TAIL").

1. Find a coin to mint, and create and push a new spendbundle:

    a. Change to the "CAT-admin-tool" folder if you're not already there.

    b. Figure out how many XCH mojos you want to use to issue your CAT. By default each CAT token will contain 1000 mojos, so you should multiply the number of tokens you want to mint by 1000. For example, if you want to mint 1 million tokens, you'll need 1 billion XCH mojos (1/1000 of an XCH).

    c. Take note of your Receive Address in the Chia GUI. You'll need it for the next step.

    d. Run `cats --tail ./reference_tails/genesis_by_coin_id.clsp.hex --send-to <your receive address> --amount <XCH mojos> --as-bytes --select-coin`

    The --select-coin flag will choose a coin from your wallet for minting your tokens. The final line of the output will be "Name: &lt;Coin ID&gt;". You’ll use "&lt;Coin ID&gt;" in the next step.

    e. Run the same command again, this time removing the --select-coin flag and adding a new flag, "--curry 0x&lt;Coin ID&gt;". It’s very important to preface the &lt;Coin ID&gt; with 0x here, to make CLVM interpret the value as bytes and not a string. Here’s the full command to run:

    `cats --tail ./reference_tails/genesis_by_coin_id.clsp.hex --send-to <your receive address> --amount <XCH mojos> --as-bytes --curry 0x<Coin ID>`

    The command will output two values, &lt;Asset ID&gt; and &lt;Spend Bundle&gt;. &lt;Asset ID&gt; will be the ID of this CAT, so it’s important to save this value for later. &lt;Spend Bundle&gt; is a large wall of text. This is the actual transaction that you will push to the blockchain, in byte format.

    f. Copy the value of &lt;Spend Bundle&gt; and run `cdv rpc pushtx <Spend Bundle>`. You should receive the message "status": "SUCCESS", "success": true.

    Congratulations! You have issued your first CAT. You still need to tell your wallet about it, though.

2. Add a wallet ID for your new CAT:

    a. Switch to the Chia GUI. Within a few minutes, your balance should decrease by the number of mojos you just minted. It may or may not show up in your transactions.

    b. Now you can add a wallet ID for your new CAT. In the upper left corner, click "+ ADD TOKEN", then click "+ Custom". Enter the name of your CAT (it can be anything) in the first text field. For the second field, paste the &lt;Asset ID&gt; you saved from a few steps ago. Click ADD.

    c. You will now be taken to your new CAT wallet. The balance should show the number of XCH mojos you chose to use, divided by 1000. This is because CAT mojos by default are one-thousandth of a CAT.
    
    d. If you see a Total Balance of 0, you need to refresh your wallet. Run `chia start wallet-only -r`. You should now see the correct balance.

You now have access to your CAT in the GUI. You can send and receive your new tokens just like you would with regular XCH.

-----

## Creating a multiple mint CAT

If you're a visual learner, please see our [video tutorial for creating a multiple mint CAT](https://chialisp.com/docs/tutorials/multiple_issuance_CAT "Multiple mint CAT video tutorial").

Next we’ll create a CAT capable of minting tokens multiple times. This CAT uses a delegated TAIL, which is much more flexible than the previous one. As long as you sign a puzzlehash that you specify, you can mint new tokens using whatever TAIL you want. This allows for features such as rebate offers and distributed minting and retiring of tokens.

You can find the TAIL we'll use for this example [here](https://github.com/Chia-Network/chia-blockchain/blob/main/chia/wallet/puzzles/delegated_genesis_checker.clvm "Delegated TAIL").

We’ll set up this CAT to delegate the same TAIL we set up previously. What this means is that nobody else can mint new tokens until you allow it. Keep in mind that this is only one of many possible implementations of a delegated TAIL.

1. Find a coin to mint, and create and push a new spendbundle:

    a. Change to the "CAT-admin-tool" folder if you're not already there.

    b. Figure out how many XCH mojos you want to use to issue your CAT. By default each CAT token will contain 1000 mojos, so you should multiply the number of tokens you want to mint by 1000. For example, if you want to mint 1 million tokens, you'll need 1 billion XCH mojos (1/1000 of an XCH).

    c. Take note of your Receive Address in the Chia GUI.

    d. Run `chia keys show`. Take note of your &lt;Fingerprint&gt; and &lt;Master public key&gt;.

    e. Run `cats --tail ./reference_tails/delegated_tail.clsp.hex --curry 0x<Master public key> --send-to <wallet address> -a <XCH mojos> --as-bytes --select-coin`

    The --select-coin flag will choose a coin from your wallet to issue the CAT from. The final line of the output will be "Name: &lt;Coin ID&gt;". You’ll use "&lt;Coin ID&gt;" in the next step.

    Now that you have a coin, you can create a full delegated TAIL. In our case, the TAIL it delegates will be of the single-mint variety.
    
    f. Run `cdv clsp curry ./reference_tails/genesis_by_coin_id.clsp.hex -a 0x<Coin ID>`. (Keep in mind the 0x before &lt;Coin ID&gt; is necessary.) The result of this command will be a &lt;delegated puzzle&gt;, which you’ll pass in as part of the solution to your main TAIL.

    g. Run the same command again, with the additional --treehash flag. This will give you the &lt;treehash&gt; of the puzzle you just created:
    
    `cdv clsp curry ./reference_tails/genesis_by_coin_id.clsp.hex -a 0x<Coin ID> --treehash`

    h. Sign the treehash (you do not need 0x here) with the &lt;Fingerprint&gt; you noted above by running this command:
    
    `chia keys sign -d <treehash> -f <Fingerprint> -t m -b`
    
    The last two flags are for the path and bytes. Make sure the resulting Public Key corresponds to the &lt;Fingerprint&gt; you just used. Copy the &lt;Signature&gt; to use in the next step.

    i. Run the same "cats" command as above, but remove the --select-coin flag and add the --solution flag, passing in the &lt;delegated puzzle&gt; you just calculated. This must be surrounded by quotes and parenthesis, and it must contain a solution, which we'll leave empty. Add the --signature flag as well, so the command looks like this:

    `cats --tail ./reference_tails/delegated_tail.clsp.hex --curry 0x<Master public key> --send-to <wallet address> -a <amount in mojos to issue> --as-bytes --solution "(<delegated puzzle> ())" --signature <Signature>`

    This command will output two values, &lt;Asset ID&gt; and &lt;Spend Bundle&gt;. &lt;Asset ID&gt; will be the ID of this CAT, so it’s important to save this value for later. &lt;Spend Bundle&gt; is a large wall of text. This is the actual transaction that you will push to the blockchain, in byte format.

    j. Run `cdv rpc pushtx <Spend Bundle>`. You should receive the message "status": "SUCCESS", "success": true.

2. Add a wallet ID for your new CAT:

    a. Switch to the Chia GUI. Within a few minutes, your balance should decrease by the number of mojos you just minted. It might not show up in your transactions.

    b. Now you can add a wallet ID for your new CAT. In the upper left corner, click "+ ADD TOKEN", then click "+ Custom". Enter the name of your CAT (it can be anything) in the first text field. For the second text field, paste the &lt;Asset ID&gt; you saved from a few steps ago. Click ADD.

    c. You will now be taken to your new CAT wallet. The balance should show the number of XCH mojos you chose to use, divided by 1000. This is because CAT mojos by default are one-thousandth of a CAT.
    
    d. If you see a Total Balance of 0, you need to refresh your wallet. Run `chia start wallet-only -r`. You should now see the correct balance. This will be fixed in a future release.

    Just like the previous example, you now have access to your CAT in the GUI.

3. Because this CAT uses a delegated TAIL, you can issue new mintings by re-doing step 1 from this section. After you run the “cdv rpc pushtx” command, the balance in your CAT wallet will increase according to the new minting.


## Preparing for mainnet

After you are comfortable with issuing your CAT on testnet, you may wish to move to mainnet. Please keep in mind that there are extra risks inherent to publishing code on a public blockchain. If your CAT and/or TAIL have not been created securely, your funds could potentially be bricked or stolen. **Proceed with caution.**

That said, issuing a CAT to mainnet isn't very different from issuing one to testnet. You'll still need a synced full node. You can also run off of the `main` code branch.

When you are ready to issue your CAT to mainnet, the first step is to run `chia configure -t false`, which will instruct Chia to switch your configuration to mainnet.

Next, you'll need to generate and protect your keys in a secure manner, which we'll discuss in the following section.

## Generating a secure key pair

Before we walk you through the process of securely generating and saving a new public/private key pair, please read this important message.

>**WARNING:** The key pair you are about to use will control the minting and retirement of these tokens **forever.** If the private key were ever compromised, an attacker could mint new tokens, as well as melt any that they owned into regular XCH.
>
>The only way to nullify an attack would be to keep track of illegitimate mints (luckily all of this is fully visible on the public ledger), issue a new CAT, and then offer an exchange of legitimate old CATs for the new CAT type.
>
>This would be a complex and time-consuming process that would likely result in people being sold counterfeit CATs at some point. It’s very important to keep your private key secret.

Here's how to generate a secure public/private key pair for issuing your new CAT:

1. Open your choice of command prompt and change to the `chia-blockchain` directory.

2. Run `. ./activate` to activate your virtual environment.

3. Run `chia keys show`.

    a. If you receive this message: `There are no saved private keys`, then proceed to step 4.

    b. If you have any keys stored on your machine, they'll be shown now. Note the Fingerprint for each key, as you will _not_ be using these keys to create your CAT and you don't want to confuse them for the key you are about to create. Even better, if this is an option for you, would be to delete your existing keys to avoid confusing them for the new ones. Just be sure to save your mnemonic seed somewhere secure before you delete your keys.

4. Run `chia init`. This will initialize your environment if it has not yet been set up.
    
5. Run `chia keys generate`. This will generate a new public/private key pair.

6. Run `chia keys show --show-mnemonic-seed`. This will show your public and private keys, as well as your Mnemonic seed.

7. Copy your new key pair's `Mnemonic seed (24 secret words)` to a secure offline location. These 24 words are all you'll need to restore your wallet in the future.

## Potential future additions

Now that the CAT1 standard has been finalized, we do not expect to see any major updates for quite some time. However, there is a chance that a CAT2 standard will be needed in the future. For now, good luck and happy minting!