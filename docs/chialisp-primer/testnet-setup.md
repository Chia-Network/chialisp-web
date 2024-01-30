---
slug: /chialisp-testnet-setup
title: 3. Testnet Setup
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

## Peers

If you were previously running on mainnet, you will have a list of mainnet peers stored in the following file:

```
~/.chia/mainnet/db/peers.dat
```

Be sure to **rename or delete** this file when you convert your system to running on testnet. If you do not do this, your system will eventually drop its mainnet peers and add new testnet peers, but this could take a long time.

One way to speed up the peer discovery process even more is to run the [add-nodes bash script](https://github.com/wallentx/farm-and-ranch-supply-depot/blob/main/bin/extra/add-nodes). Note that this script won't work on Windows. Your mileage also may vary on Linux and MacOS.

## Conclusion

You should now be ready to use the Testnet to create and spend smart coins. As always, if you ran into any issues while setting up the Testnet, feel free to ask for support on our [Discord](https://discord.gg/chia).
