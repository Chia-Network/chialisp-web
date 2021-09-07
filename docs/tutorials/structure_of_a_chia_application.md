---
id: structure_of_a_chia_application
title: Structure of a Chia Application
sidebar_label: Structure of a Chia Application
---

# Basic structure of an app using chia

```

        CHIA                        Your Code
                 |   +--------------------+       +----------+
    Node RPC <---|-> | Specialized Wallet |<----->| Database |
       ^         |   +--------------------+       +----------+
       |         |       ^         ^
       |         |       |         |
       |         |       |         v
       v         |       |    +------------------+
    Wallet RPC --|-------+    | State management |
                 |            +------------------+
                 |                    ^
                                      |
                                      v
                                     User
```

### Concerns for developing chia apps

- The app likely needs a connection to the chia RPC at least for now.

- A "wallet" type system is needed to track blockchain traffic so that the app's
  concept of the current state can be recovered from the same information that's
  represented in the blockchain and in order to keep the state presented to the
  end user consistent via the node API and a well designed set of arguments to
  the chialisp code.  Coins touched in a block are available via the full node's
  get_additions_and_removals and the solutions via get_puzzle_and_solution.  By
  checking out each block, it'll be possible to find specially formatted
  coin solutions and track them.

- The app needs at a minimum to allow the user to take actions in a comprehensible
  way, which means using a combination of the wallet and node's RPC API to

    1. Establish which public and private keys to use when interacting with coins
       on the blockchain via get_transactions, get_coin_record_by_name and
       get_private_key and the master_sk_to_wallet_sk function.

    2. Send transactions to the blockchain via push_tx.

- It's likely that the app won't be able to guarantee that it remains running for
  the full duration of the purpose of the code it deploys, therefore any state
  picked up from the blockchain should be stored in and retrieved from a local
  cache database.

- If more than one party is cooperating over the coin in question, then either an
  identifier picking out the coin in question needs to be sent out of band or
  something identifiable by the recipient needs to be embedded in the coin
  solution.