# Chialisp

Chialisp is a powerful and secure LISP-like language for encumbering and releasing funds with smart-contract capabilities.
This website is a consolidated place to learn about Chialisp, CLVM and the conditions language.

Here's a sample:

```chialisp
(mod (password new_puzhash amount)
  (defconstant CREATE_COIN 51)

  (if (= (sha256 password) (q . 0x2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824))
    (list (list CREATE_COIN new_puzhash amount))
    (x)
  )
)
```

## Why Lisp?

Many people come into our keybase channel and ask us why we chose a 60 year old language as our on chain programming language.
We chose it due to a few unique features that make it remarkably well suited to the Chia blockchain:

- **Completely sandboxed.** Chialisp resource utilization is completely controlled.
  The language needs to be run on half a million computers, so it is important that the program cannot reach out and affect everyone's machines in an unintended way.
  A lisp program is _evaluated_ and therefore cannot spawn any new processes or interact with the system it is running on.

- **Composability.** A lisp program is itself just a list.
  This feature allows for powerful techniques that allow you to modify source code during program evaluation.
  Doing so can allow a "smart coin" to enforce rules on a participating coin while still allowing it to utilize the full programmability that Chialisp has to offer.
  Using lisp programs like this allows you to have _layers of smart coins_ in which the output of an "inner" puzzle can be used in the evaluation of the "outer" puzzle.

- **Interoperability.** Every smart coin in the Chia ecosystem, no matter how complex, is fundamentally a coin that is locked up with a Chialisp puzzle. The input to any puzzle will always be a lisp data structure, and the output will always be a list of **conditions** that all puzzles share. This means that everything in Chia interoperates with everything else.
  Any smart coin should be able to interact or communicate with any other smart coin, regardless of whether either coin was specifically designed to do so.

## Getting Started

If you'd like to get started learning and using Chialisp, you can start with the [Intro to Chialisp](/docs) guide. Throughout this series you will write programs in the language, create smart coins on the Chia Blockchain, and spend them on the command-line.

## Chia Asset Tokens (CATs)

[CATs](https://chialisp.com/docs/puzzles/cats) are tokens that you can create and/or trade on Chia's blockchain. The issuers of these tokens create the rules for their minting and retirement, using a "Token and Asset Issuance Limiter" (TAIL). The owners of these tokens have control over how they may be spent. CATs can be implemented as stable coins, stock issuance tokens, voting shares, or anything else you can think of. For more info, you can read about the nomenclature of [CATs](https://www.chia.net/2021/09/23/chia-token-standard-naming.en.html).

## Singletons

Another fascinating application of Chialisp is the creation of **singletons**.
Singletons are a type of coin that there is verifiably only one of.
When you can verify that there is only one of a coin, you can enable some interesting functionality.
The Chia Network pooling protocol uses this to verify that you have committed your plots to a pool and have not promised them to any other pool.
You can also make NFTs, decentralized identities, and anything else that could make use of a unique coin.

## DeFi

Chialisp is also capable of any of the popularly available decentralized finance tools you find on other blockchains today.
One feature that enables this is the fact that coins can communicate with each other when they are spent.
You can have market makers announce prices and have other coins utilize those prices in their own logic when they are spent.
The natural interoperability that Chialisp provides is also relevant because it will allow participants to layer and leverage many different DeFi tools all at once!

## Introductory Material

- The introductory post on [Chialisp](https://www.chia.net/2019/11/27/chialisp.en.html)
- Introduction to our [MVP of Coloured coins](https://www.chia.net/2020/04/29/coloured-coins-launch.en.html)
- A Vision for [DeFi in Chia](https://www.chia.net/2021/07/13/a-vision-for-defi-in-chia.en.html)

## Developer Documentation

- [Chialisp Compiler Repository](https://github.com/Chia-Network/clvm)
- [A video introduction to developing in Chialisp](https://chialisp.com/docs/tutorials/developing_applications)
- [clvm_tools for developing in Chialisp](https://github.com/Chia-Network/clvm_tools)
- [CLVM Basics](/docs/)
- [Glossary of Chialisp terms](/docs/glossary/)
- [Lower Level Language Reference Document](/docs/ref/clvm/)
