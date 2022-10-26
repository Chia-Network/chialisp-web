---
id: costs
title: Costs
slug: /costs
---

Every operator has a cost associated with it. Additionally, there can be a separate cost dependent on the number of arguments or bytes used when calling it.

If you deploy your program as a puzzle on the Chia blockchain, it will terminate if it surpasses a cost of 11,000,000,000 (11 billion), and it can have higher fees associated with it based on the cost.

If you are interested in how cost affects the Chia blockchain, you can read the [Cost page](https://docs.chia.net/coin-set-costs) on the Chia documentation site.

:::info
You can use the following commands to check the cost while compiling and running programs:

```bash
run --cost "<Chialisp>"
brun --cost "<Compiled CLVM>" "<Environment>"
```

:::

## Cost Table {#table}

| Operator                 | Base    | Argument | Byte                                                                                        |
| ------------------------ | ------- | -------- | ------------------------------------------------------------------------------------------- |
| f - _first_              | 30      | 0        | 0                                                                                           |
| i - _if_                 | 33      | 0        | 0                                                                                           |
| c - _cons_               | 50      | 0        | 0                                                                                           |
| r - _rest_               | 30      | 0        | 0                                                                                           |
| l - _list predicate_     | 19      | 0        | 0                                                                                           |
| q - _quote_              | 20      | 0        | 0                                                                                           |
| a - _apply_              | 90      | 0        | 0                                                                                           |
| =                        | 117     | 0        | 1                                                                                           |
| +                        | 99      | 320      | 3                                                                                           |
| -                        | 99      | 320      | 3                                                                                           |
| \*                       | 92      | 885      | [Info](https://github.com/Chia-Network/clvm_tools/blob/main/costs/README.md#multiplication) |
| /                        | 988     | 0        | 4                                                                                           |
| logand                   | 100     | 264      | 3                                                                                           |
| logior                   | 100     | 264      | 3                                                                                           |
| logxor                   | 100     | 264      | 3                                                                                           |
| lognot                   | 331     | 0        | 3                                                                                           |
| >                        | 498     | 0        | 2                                                                                           |
| >s                       | 117     | 0        | 1                                                                                           |
| strlen                   | 173     | 0        | 1                                                                                           |
| concat                   | 142     | 135      | 3                                                                                           |
| divmod                   | 1116    | 0        | 6                                                                                           |
| sha256                   | 87      | 134      | 2                                                                                           |
| ash - _arithmetic shift_ | 596     | 0        | 3                                                                                           |
| lsh - _logical shift_    | 277     | 0        | 3                                                                                           |
| not                      | 200     | 300      | 0                                                                                           |
| any                      | 200     | 300      | 0                                                                                           |
| all                      | 200     | 300      | 0                                                                                           |
| point_add                | 101094  | 1343980  | 0                                                                                           |
| pubkey_for_exp           | 1325730 | 0        | 38                                                                                          |

## Additional Costs

There is a base cost of 1 for every call to an operator. This is due to the processing time of steps taken internally to call the operator.

Additionally, there is a cost of 10 per byte of memory allocated in the return value of an operator. This excludes the boolean values 0 and 1, which are free.

## Conditions

More information on the costs associated with conditions can be found on the [Conditions page](https://docs.chia.net/conditions#costs) of the Chia docs.

## Evaluating Cost

This is an example of how to calculate the cost of a simple CLVM program by hand. Understanding this section requires knowledge of what CLVM is first. Refer to the [CLVM page](/clvm) for more information.

Refer to the following CLVM program:

```chialisp
(concat (q . gu) (q . ide))
```

The atoms `gu` and `ide` are quoted, so that they are interpreted as values rather than programs.

The `brun` command takes two arguments, a program and its environment. If no environment is specified on the command line (as is the case in this example), we use an empty environment, `()`.

At the lowest level of the interpreter, we interpret an atom as one of three things:

1. A quote (cost 20)
2. A path lookup into the environment (base cost of 44 + 4 for each bit)
3. An operator (mandatory cost of 1 + the cost of executing the operator)

:::note
There might be a penalty cost for path lookups. See the [Penalty Cost](#penalty-cost) section for more info.
:::

This is a breakdown of how we can calculate the cost of that program:

- `concat` eval (mandatory cost): 1
- `q . gu` (cost of a quote): 20
- `q . ide` (cost of a quote): 20
- `concat` (execution cost): 142
- `concat` arg cost ("gu"): 135
- `concat` arg cost ("ide"): 135
- `concat` two bytes ("gu"): 6 (2 bytes \* 3 cost per byte)
- `concat` three bytes ("ide"): 9 (3 bytes \* 3 cost per byte)
- `malloc` five bytes ("guide"): 50 (5 bytes \* 10 malloc cost per byte)

Program cost = 518

This is confirmed by running `brun` from the command line:

```bash
brun --cost --quiet '(concat (q . gu) (q . ide))'
cost = 518
```

### Penalty cost

At first glance, it might appear that the following two programs should have the same cost. However, the cost of the second program is 10 higher than that of the first:

```bash
brun --cost '(+ (q . 126) (q . 1))'
cost = 796
127
```

```bash
brun --cost '(+ (q . 127) (q . 1))'
cost = 806
128
```

The reason these programs cost different is that the latter needs a leading zero in its result. When dumping the hexadecimal representation of the output, this becomes clearer:

```bash
brun --dump --cost '(+ (q . 126) (q . 1))'
cost = 796
7f
```

```bash
brun --dump --cost '(+ (q . 127) (q . 1))'
cost = 806
820080
```

## Real World Example

Now let's look at a real-world example of calculating cost. The [standard transaction](/standard-transactions) is one that adds and removes one or more vanilla XCH coins from the coin set. While it is possible to both add and remove exactly one coin in a standard transaction, a more _typical_ transaction would involve adding and removing two coins, giving the transaction two inputs and two outputs.

This would happen if Alice spent two coins to send money to Bob, and received one coin back as change. We'll detail two techniques to calculate the cost of this transaction.

### Using CLI

This technique is straightforward, but it will only give a rough estimate of cost. We'll look at a more accurate technique in the next section.

The example we'll use is a transaction where Alice sent money to Bob and received change. The commands will be performed on Alice's computer. First, we'll run `get_transactions` to obtain the transaction ID:

```bash
chia wallet get_transactions
Transaction cd4e915dc8fd6eb932b5e1be67088eb9af48a560a6ddbc55c53ee44eaf191ee0
Status: Confirmed
Amount sent: 1.01 XCH
To address: xch1989s7f4dn43963gsdqus7z6ydm7upuqzfae4ftts7rm80k4848csewg085
Created at: 2022-03-20 06:03:09
```

Next, we'll get more info by running `get_transaction`, entering the ID we just obtained:

```bash
chia wallet get_transaction -tx
cd4e915dc8fd6eb932b5e1be67088eb9af48a560a6ddbc55c53ee44eaf191ee0 -v
{'additions': [{ 'amount': 1010000000000,
                 'parent_coin_info': '0x484ed352cd7e7e396bdbee72302e40653c2d880bd134d29f75f07ffffe4c7a0f',
                 'puzzle_hash': '0x29cb0f26ad9d625d451068390f0b446efdc0f0024f7354ad70f0f677daa7a9f1'
               },
               { 'amount': 936839958396,
                 'parent_coin_info': '0x484ed352cd7e7e396bdbee72302e40653c2d880bd134d29f75f07ffffe4c7a0f',
                 'puzzle_hash': '0xf56f5af041272572fe528e794c364fbe2be444ab77de62a1796772804a4c9fef'
               }],
               'amount': 1010000000000,
               'confirmed': True,
               'confirmed_at_height': 1720943,
               'created_at_time': 1647781389,
               'fee_amount': 0,
               'memos': [],
               'name': '0xcd4e915dc8fd6eb932b5e1be67088eb9af48a560a6ddbc55c53ee44eaf191ee0',
'removals':   [{ 'amount': 946839958396,
                 'parent_coin_info': '0x98706c3a489574a9f32f339662f339b7ba3c9dce1da4feb301432aa60216635e',
                 'puzzle_hash': '0xe415c314693b27c0cb949c27cb244a8ed9def528346f37491393fdd49e24bcd5'
               },
               { 'amount': 1000000000000,
                 'parent_coin_info': '0x98706c3a489574a9f32f339662f339b7ba3c9dce1da4feb301432aa60216635e',
                'puzzle_hash': '0xd8af3cb1130f6d7e4011c6fa85779c0cfddb1a594cdd170d1dfc8aeb5f3c93fe'
               }],
'spend_bundle': { 'aggregated_signature': '0xa35c58c6687e79a91e2c409451e620dc26f286637be916910d02253fa0fb401a77d0f3c2b0ff72565fae5c9e66affbe70833f7bbae6b2c3508404f6058ec82d94f9738d23a4b23748d97d71e532a7d7c6390f21fe82dc5f1c0c75d90150d952f',
                  'coin_spends': [{
                     'coin': {
                        'amount': 946839958396,
                        'parent_coin_info': '0x98706c3a489574a9f32f339662f339b7ba3c9dce1da4feb301432aa60216635e',
                        'puzzle_hash': '0xe415c314693b27c0cb949c27cb244a8ed9def528346f37491393fdd49e24bcd5'
                     },
                        'puzzle_reveal': '0xff02ffff01ff02ffff01ff02ffff03ff0bffff01ff02ffff03ffff09ff05ffff1dff0bffff1effff0bff0bffff02ff06ffff04ff02ffff04ff17ff8080808080808080ffff01ff02ff17ff2f80ffff01ff088080ff0180ffff01ff04ffff04ff04ffff04ff05ffff04ffff02ff06ffff04ff02ffff04ff17ff80808080ff80808080ffff02ff17ff2f808080ff0180ffff04ffff01ff32ff02ffff03ffff07ff0580ffff01ff0bffff0102ffff02ff06ffff04ff02ffff04ff09ff80808080ffff02ff06ffff04ff02ffff04ff0dff8080808080ffff01ff0bffff0101ff058080ff0180ff018080ffff04ffff01b09496e8abd4a5b09f10b71e43b779f7ed8d5c1c92e3c5a6b70cd78bc2fb32347cc5fdca3f6acafb143f185029cd422010ff018080',
                        'solution': '0xff80ffff01ffff33ffa029cb0f26ad9d625d451068390f0b446efdc0f0024f7354ad70f0f677daa7a9f1ff8600eb28b0f40080ffff33ffa0f56f5af041272572fe528e794c364fbe2be444ab77de62a1796772804a4c9fefff8600da20034f7c80ffff3cffa048c2db108c24bf3192913b6cd5bca66688a9b2fc0e1821e306f7b01848a7b24d8080ff8080'
                  },
                  {
                     'coin': {
                        'amount': 1000000000000,
                        'parent_coin_info': '0x98706c3a489574a9f32f339662f339b7ba3c9dce1da4feb301432aa60216635e',
                        'puzzle_hash': '0xd8af3cb1130f6d7e4011c6fa85779c0cfddb1a594cdd170d1dfc8aeb5f3c93fe'
                     },
                        'puzzle_reveal': '0xff02ffff01ff02ffff01ff02ffff03ff0bffff01ff02ffff03ffff09ff05ffff1dff0bffff1effff0bff0bffff02ff06ffff04ff02ffff04ff17ff8080808080808080ffff01ff02ff17ff2f80ffff01ff088080ff0180ffff01ff04ffff04ff04ffff04ff05ffff04ffff02ff06ffff04ff02ffff04ff17ff80808080ff80808080ffff02ff17ff2f808080ff0180ffff04ffff01ff32ff02ffff03ffff07ff0580ffff01ff0bffff0102ffff02ff06ffff04ff02ffff04ff09ff80808080ffff02ff06ffff04ff02ffff04ff0dff8080808080ffff01ff0bffff0101ff058080ff0180ff018080ffff04ffff01b0848f09f98800442737684dd76071f25a0bd100b51e727aabafeddb062dbc3d2b3ac64bc87f084a6d16e4e89e1417de14ff018080',
                        'solution': '0xff80ffff01ffff3dffa023f61666150d2a467ee7b81a77954c93255d65c0c43108f1bb14ac420fd59c428080ff8080'
                  }]},
}
```

The `additions` and `removals` sections contain two coins apiece. Before the transaction, Alice had two coins in her wallet, one worth 1 XCH, and one worth 0.946839958396 XCH. The amount sent was 1.01 XCH, which was greater than the value of either of Alice's coins. The wallet therefore automatically selected both coins to be sent, for a total of 1.946839958396 XCH. A new coin worth 0.936839958396 XCH was created in Alice's wallet as "change".

To recap, before the transaction:

- Alice had two coins, worth 1 XCH and 0.946839958396 XCH
- Bob had zero coins
- The total value was 1.946839958396 XCH

After the transaction:

- Alice had one coin worth 0.936839958396 XCH
- Bob had one coin worth 1.01 XCH
- The total value was 1.946839958396 XCH (same as before the transaction)

Back to the original question: what was the CLVM cost of this transaction? One way to find out is by creating a spend bundle based on the output of the `get_transaction` command, and inspecting it using `cdv`.

:::note
You'll need to run `pip install chia-dev-tools` in order to use the `cdv` command.
:::

```bash
cdv inspect spendbundles spend.json -ec
...
Cost: 17187295
```

The cost was 17 187 295. Note that this command is simulating a small block that contains only the single spendbundle. In reality, this spendbundle would be aggregated into a larger block, possibly with 999 similar transactions. Therefore, this cost is only an estimation. However, for many applications, this simple technique will be sufficient.

As for fee calculations, if your transaction makes it into the mempool, then it will be prioritized (using mojos per cost as a metric) against all other transactions in the mempool. If the mempool is full, however, your transaction's fee will need to be at least 5 mojos per cost in order to kick another transaction out of the mempool. Therefore, in order to increase the likelihood of your transaction making it into the mempool right away, we recommend that you include a fee of at least five mojos per cost with every transaction.

In this case, the fee to reach the 5 mojos per cost threshold is `5 * 17 187 295 = 85 936 475 mojos`. However, because the cost is just an estimate, and generally speaking, you might not want to calculate the cost of every transaction before it is run, it's a good idea to round the fee up to 100 million mojos.

### Using RPC and Brun

`brun -c` will give the actual cost of a program, but it is still necessary to calculate some costs manually, as we'll explain in this section.

First, obtain the same info as before, this time using RPC commands to get the record of the coin you want to examine:

```bash
cdv rpc coinrecords --by id 0x484ed352cd7e7e396bdbee72302e40653c2d880bd134d29f75f07ffffe4c7a0f
[
    {
        "coin": {
            "amount": 946839958396,
            "parent_coin_info": "0x98706c3a489574a9f32f339662f339b7ba3c9dce1da4feb301432aa60216635e",
            "puzzle_hash": "0xe415c314693b27c0cb949c27cb244a8ed9def528346f37491393fdd49e24bcd5"
        },
        "coinbase": false,
        "confirmed_block_index": 1720835,
        "spent": true,
        "spent_block_index": 1720943,
        "timestamp": 1647780998
    }
]
```

This coin was spent in block 1720943. Using this info, we can get the original puzzle and solution used in the coin spend, in serialized form:

```bash
cdv rpc blockspends -id 484ed352cd7e7e396bdbee72302e40653c2d880bd134d29f75f07ffffe4c7a0f -h 1720943
{
    "coin": {
        "amount": 946839958396,
        "parent_coin_info": "0x98706c3a489574a9f32f339662f339b7ba3c9dce1da4feb301432aa60216635e",
        "puzzle_hash": "0xe415c314693b27c0cb949c27cb244a8ed9def528346f37491393fdd49e24bcd5"
    },
    "puzzle_reveal": "0xff02ffff01ff02ffff01ff02ffff03ff0bffff01ff02ffff03ffff09ff05ffff1dff0bffff1effff0bff0bffff02ff06ffff04ff02ffff04ff17ff8080808080808080ffff01ff02ff17ff2f80ffff01ff088080ff0180ffff01ff04ffff04ff04ffff04ff05ffff04ffff02ff06ffff04ff02ffff04ff17ff80808080ff80808080ffff02ff17ff2f808080ff0180ffff04ffff01ff32ff02ffff03ffff07ff0580ffff01ff0bffff0102ffff02ff06ffff04ff02ffff04ff09ff80808080ffff02ff06ffff04ff02ffff04ff0dff8080808080ffff01ff0bffff0101ff058080ff0180ff018080ffff04ffff01b09496e8abd4a5b09f10b71e43b779f7ed8d5c1c92e3c5a6b70cd78bc2fb32347cc5fdca3f6acafb143f185029cd422010ff018080",
    "solution": "0xff80ffff01ffff33ffa029cb0f26ad9d625d451068390f0b446efdc0f0024f7354ad70f0f677daa7a9f1ff8600eb28b0f40080ffff33ffa0f56f5af041272572fe528e794c364fbe2be444ab77de62a1796772804a4c9fefff8600da20034f7c80ffff3cffa048c2db108c24bf3192913b6cd5bca66688a9b2fc0e1821e306f7b01848a7b24d8080ff8080"
}
```

Next, use the `opd` command to deserialize the puzzle and solution to human-readable clvm:

```bash
opd ff02ffff01ff02ffff01ff02ffff03ff0bffff01ff02ffff03ffff09ff05ffff1dff0bffff1effff0bff0bffff02ff06ffff04ff02ffff04ff17ff8080808080808080ffff01ff02ff17ff2f80ffff01ff088080ff0180ffff01ff04ffff04ff04ffff04ff05ffff04ffff02ff06ffff04ff02ffff04ff17ff80808080ff80808080ffff02ff17ff2f808080ff0180ffff04ffff01ff32ff02ffff03ffff07ff0580ffff01ff0bffff0102ffff02ff06ffff04ff02ffff04ff09ff80808080ffff02ff06ffff04ff02ffff04ff0dff8080808080ffff01ff0bffff0101ff058080ff0180ff018080ffff04ffff01b09496e8abd4a5b09f10b71e43b779f7ed8d5c1c92e3c5a6b70cd78bc2fb32347cc5fdca3f6acafb143f185029cd422010ff018080
(a (q 2 (q 2 (i 11 (q 2 (i (= 5 (point_add 11 (pubkey_for_exp (sha256 11 (a 6 (c 2 (c 23 ()))))))) (q 2 23 47) (q 8)) 1) (q 4 (c 4 (c 5 (c (a 6 (c 2 (c 23 ()))) ()))) (a 23 47))) 1) (c (q 50 2 (i (l 5) (q 11 (q . 2) (a 6 (c 2 (c 9 ()))) (a 6 (c 2 (c 13 ())))) (q 11 (q . 1) 5)) 1) 1)) (c (q . 0x9496e8abd4a5b09f10b71e43b779f7ed8d5c1c92e3c5a6b70cd78bc2fb32347cc5fdca3f6acafb143f185029cd422010) 1))
```

```bash
opd ff80ffff01ffff33ffa029cb0f26ad9d625d451068390f0b446efdc0f0024f7354ad70f0f677daa7a9f1ff8600eb28b0f40080ffff33ffa0f56f5af041272572fe528e794c364fbe2be444ab77de62a1796772804a4c9fefff8600da20034f7c80ffff3cffa048c2db108c24bf3192913b6cd5bca66688a9b2fc0e1821e306f7b01848a7b24d8080ff8080
(() (q (51 0x29cb0f26ad9d625d451068390f0b446efdc0f0024f7354ad70f0f677daa7a9f1 0x00eb28b0f400) (51 0xf56f5af041272572fe528e794c364fbe2be444ab77de62a1796772804a4c9fef 0x00da20034f7c) (60 0x48c2db108c24bf3192913b6cd5bca66688a9b2fc0e1821e306f7b01848a7b24d)) ())
```

To obtain the cost of this program, use `brun -c`:

```bash
brun -c '(a (q 2 (q 2 (i 11 (q 2 (i (= 5 (point_add 11 (pubkey_for_exp (sha256 11 (a 6 (c 2 (c 23 ()))))))) (q 2 23 47) (q 8)) 1) (q 4 (c 4 (c 5 (c (a 6 (c 2 (c 23 ()))) ()))) (a 23 47))) 1) (c (q 50 2 (i (l 5) (q 11 (q . 2) (a 6 (c 2 (c 9 ()))) (a 6 (c 2 (c 13 ())))) (q 11 (q . 1) 5)) 1) 1)) (c (q . 0x9496e8abd4a5b09f10b71e43b779f7ed8d5c1c92e3c5a6b70cd78bc2fb32347cc5fdca3f6acafb143f185029cd422010) 1))' '(() (q (51 0x29cb0f26ad9d625d451068390f0b446efdc0f0024f7354ad70f0f677daa7a9f1 0x00eb28b0f400) (51 0xf56f5af041272572fe528e794c364fbe2be444ab77de62a1796772804a4c9fef 0x00da20034f7c) (60 0x48c2db108c24bf3192913b6cd5bca66688a9b2fc0e1821e306f7b01848a7b24d)) ())'
cost = 39652
((50 0x9496e8abd4a5b09f10b71e43b779f7ed8d5c1c92e3c5a6b70cd78bc2fb32347cc5fdca3f6acafb143f185029cd422010 0x87f20f182aa0b488027d678fd1cdb63f9fb583347cbf2744d2e7f5ae5ab49102) (51 0x29cb0f26ad9d625d451068390f0b446efdc0f0024f7354ad70f0f677daa7a9f1 0x00eb28b0f400) (51 0xf56f5af041272572fe528e794c364fbe2be444ab77de62a1796772804a4c9fef 0x00da20034f7c) (60 0x48c2db108c24bf3192913b6cd5bca66688a9b2fc0e1821e306f7b01848a7b24d))
```

The cost of this program was 39 652. However, there are three important things to note here:

1. This only gives the program cost of executing the CLVM code. It does not include the per-byte cost of 12 000. Let's calculate that cost now.

- The serialized puzzle (before running `opd`) is 582 hexadecimal digits, or 291 bytes (2 digits per byte)
- The serialized solution is 278 digits, or 139 bytes
- The sum of these two is 430 bytes. With a cost of 12 000 per byte, the program's size cost is 5 160 000

2. This cost does not include the CLVM conditions, specifically condition 50 (AGG_SIG_ME) and 51 (CREATE_COIN)

- AGG_SIG_ME cost is 1 200 000
- CREATE_COIN cost is 1 800 000 per coin, and there were two coins
- The total condition cost is 4 800 000

3. Another coin was spent in the same transaction, which is not included here

Let's run the same commands to figure out the cost of the other coin spend:

```bash
cdv rpc coinrecords --by id 0x45174eedbd162f2baeb37d7360c14727782d8f58519f878665efcdaef62a407a
[
    {
        "coin": {
            "amount": 1000000000000,
            "parent_coin_info": "0x98706c3a489574a9f32f339662f339b7ba3c9dce1da4feb301432aa60216635e",
            "puzzle_hash": "0xd8af3cb1130f6d7e4011c6fa85779c0cfddb1a594cdd170d1dfc8aeb5f3c93fe"
        },
        "coinbase": false,
        "confirmed_block_index": 1720835,
        "spent": true,
        "spent_block_index": 1720943,
        "timestamp": 1647780998
    }
]
```

```bash
cdv rpc blockspends -id 45174eedbd162f2baeb37d7360c14727782d8f58519f878665efcdaef62a407a -h 1720943
{
    "coin": {
        "amount": 1000000000000,
        "parent_coin_info": "0x98706c3a489574a9f32f339662f339b7ba3c9dce1da4feb301432aa60216635e",
        "puzzle_hash": "0xd8af3cb1130f6d7e4011c6fa85779c0cfddb1a594cdd170d1dfc8aeb5f3c93fe"
    },
    "puzzle_reveal": "0xff02ffff01ff02ffff01ff02ffff03ff0bffff01ff02ffff03ffff09ff05ffff1dff0bffff1effff0bff0bffff02ff06ffff04ff02ffff04ff17ff8080808080808080ffff01ff02ff17ff2f80ffff01ff088080ff0180ffff01ff04ffff04ff04ffff04ff05ffff04ffff02ff06ffff04ff02ffff04ff17ff80808080ff80808080ffff02ff17ff2f808080ff0180ffff04ffff01ff32ff02ffff03ffff07ff0580ffff01ff0bffff0102ffff02ff06ffff04ff02ffff04ff09ff80808080ffff02ff06ffff04ff02ffff04ff0dff8080808080ffff01ff0bffff0101ff058080ff0180ff018080ffff04ffff01b0848f09f98800442737684dd76071f25a0bd100b51e727aabafeddb062dbc3d2b3ac64bc87f084a6d16e4e89e1417de14ff018080",
    "solution": "0xff80ffff01ffff3dffa023f61666150d2a467ee7b81a77954c93255d65c0c43108f1bb14ac420fd59c428080ff8080"
}
```

```bash
opd ff02ffff01ff02ffff01ff02ffff03ff0bffff01ff02ffff03ffff09ff05ffff1dff0bffff1effff0bff0bffff02ff06ffff04ff02ffff04ff17ff8080808080808080ffff01ff02ff17ff2f80ffff01ff088080ff0180ffff01ff04ffff04ff04ffff04ff05ffff04ffff02ff06ffff04ff02ffff04ff17ff80808080ff80808080ffff02ff17ff2f808080ff0180ffff04ffff01ff32ff02ffff03ffff07ff0580ffff01ff0bffff0102ffff02ff06ffff04ff02ffff04ff09ff80808080ffff02ff06ffff04ff02ffff04ff0dff8080808080ffff01ff0bffff0101ff058080ff0180ff018080ffff04ffff01b0848f09f98800442737684dd76071f25a0bd100b51e727aabafeddb062dbc3d2b3ac64bc87f084a6d16e4e89e1417de14ff018080
(a (q 2 (q 2 (i 11 (q 2 (i (= 5 (point_add 11 (pubkey_for_exp (sha256 11 (a 6 (c 2 (c 23 ()))))))) (q 2 23 47) (q 8)) 1) (q 4 (c 4 (c 5 (c (a 6 (c 2 (c 23 ()))) ()))) (a 23 47))) 1) (c (q 50 2 (i (l 5) (q 11 (q . 2) (a 6 (c 2 (c 9 ()))) (a 6 (c 2 (c 13 ())))) (q 11 (q . 1) 5)) 1) 1)) (c (q . 0x848f09f98800442737684dd76071f25a0bd100b51e727aabafeddb062dbc3d2b3ac64bc87f084a6d16e4e89e1417de14) 1))
```

```bash
opd ff80ffff01ffff3dffa023f61666150d2a467ee7b81a77954c93255d65c0c43108f1bb14ac420fd59c428080ff8080
(() (q (61 0x23f61666150d2a467ee7b81a77954c93255d65c0c43108f1bb14ac420fd59c42)) ())
```

```bash
brun -c '(a (q 2 (q 2 (i 11 (q 2 (i (= 5 (point_add 11 (pubkey_for_exp (sha256 11 (a 6 (c 2 (c 23 ()))))))) (q 2 23 47) (q 8)) 1) (q 4 (c 4 (c 5 (c (a 6 (c 2 (c 23 ()))) ()))) (a 23 47))) 1) (c (q 50 2 (i (l 5) (q 11 (q . 2) (a 6 (c 2 (c 9 ()))) (a 6 (c 2 (c 13 ())))) (q 11 (q . 1) 5)) 1) 1)) (c (q . 0x848f09f98800442737684dd76071f25a0bd100b51e727aabafeddb062dbc3d2b3ac64bc87f084a6d16e4e89e1417de14) 1))' '(() (q (61 0x23f61666150d2a467ee7b81a77954c93255d65c0c43108f1bb14ac420fd59c42)) ())'
cost = 15032
((50 0x848f09f98800442737684dd76071f25a0bd100b51e727aabafeddb062dbc3d2b3ac64bc87f084a6d16e4e89e1417de14 0x03db13c4e422e5eea98463c02b2c15994b620e0a45aa2db6f7785d3ba28f46cf) (61 0x23f61666150d2a467ee7b81a77954c93255d65c0c43108f1bb14ac420fd59c42))
```

The CLVM cost for this coin spend was 15 032.

We still need to calculate this program's size cost.

- The serialized puzzle is 582 hexadecimal digits, or 291 bytes
- The serialized solution is 94 digits, or 47 bytes
- The sum of these two is 338 bytes. With a cost of 12 000 per byte, the program's size cost is 4 056 000

Let's add up the costs to get the total cost for this transaction:

- First coin
  - CLVM: 39 652
  - AGG_SIG_ME: 1 200 000
  - CREATE_COIN 1: 1 800 000
  - CREATE_COIN 2: 1 800 000
  - Program size: 5 160 000
- Second coin
  - CLVM: 15 032
  - AGG_SIG_ME: 1 200 000
  - Program size: 4 056 000
- Total: 15 270 684

This is an accurate assessment of the cost for this particular transaction.

Just like before, we have to multiply the cost by five to obtain the minimum fee. In this case, the result is `5 * 15 270 684 = 76 353 420 mojos`. If this specific transaction had included a fee of at least that many mojos, it would've kicked a transaction with a lower fee out of the mempool in order to be included.

Now that you know _what_ the cost of each CLVM operator is, as well as _how_ to calculate costs, we'll discuss _why_ we decided to structure costs in this manner. It all begins with the minimum spec machine for farming, the humble Raspberry Pi 4.
