---
id: setting_up_testnet
title: Setting up the Testnet
---

If you haven't already, you will need to [clone the Chia Blockchain repository](https://github.com/Chia-Network/chia-blockchain), then follow the below steps to set it up and configure it for the testnet.

## Setup

:::tip

If you are using Windows, we recommend PowerShell, and you may need to replace forward slashes `/` with backslashes `\`.

:::

1.  Open the `chia-blockchain` folder in a command prompt of your choice.
2.  Set the environment variable `CHIA_ROOT` to `~/.chia/testnet10`.
3.  Run `./Install.ps1` on Windows or `./install.sh` on MacOS or Linux.
4.  Run `. ./activate` to use the Python virtual environment.
5.  Run `chia init` to setup and configure Chia.
6.  Run `chia keys generate` to prepare the wallet keys.
7.  Run `chia configure -t true` to use the Testnet.
8.  Download the [Testnet database](https://download.chia.net/testnet10/blockchain_v2_testnet10.sqlite.gz) and place it in the `~/.chia/testnet10/db` folder.
9.  Finally, run `chia start node` to start the full node.

## Faucet

Now you can set up the wallet and use a faucet to receive Testnet coins to use in the upcoming guides.

1. Run `chia start wallet` to start the wallet.
2. Run `chia wallet get_address` to get the next wallet address.
3. Go to the [Testnet faucet](https://testnet10-faucet.chia.net) and give it your address.
4. Wait a minute or two and run `chia wallet show` to check your balance.

## Conclusion

You should now be ready to use the Testnet to create and spend smart coins.
