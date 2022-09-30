---
id: costs
title: Costs
slug: /costs
---

Every operator has a cost associated with it. Additionally, there can be a separate cost dependent on the number of arguments or bytes used when calling it.

At some point, the program will terminate if it surpasses the cost limit. Additionally, if you deploy your program as a puzzle on the Chia blockchain, it can have higher fees associated with it based on the cost.

:::info

The maximum cost per block is 11,000,000,000. Keep this in mind as you write your Chialisp programs.

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

## Conditions

More information on the costs associated with conditions can be found on the [Conditions page](https://docs.chia.net/conditions#costs) of the Chia docs.
