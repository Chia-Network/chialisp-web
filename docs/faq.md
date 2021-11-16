---
id: faq
title: ChiaLisp and CLVM FAQ
sidebar_label: ChiaLisp and CLVM FAQ
---

**Q:** Why is my number being evaluated to `()`, a.k.a. `nil`?

**A:** In clvm (the `brun` command), integers are evaluated as references to arguments in the argument tree.
If no argument tree is given on the command line, the default is an empty argument tree. When an argument is not found, `nil` is returned.
In ChiaLisp (the `run` command), integers are compiled to quoted atoms, which will give you the value you expected.
____

**Q:** Is it possible to store data or maintain state in smart coins?

**A:** Yes, but probably not how you are thinking.
Quite deliberately the ChiaLisp environment is designed so that state is stored exclusively in coins.
Remember Chia uses smart coins, not smart contracts. This leads to a different kind of design to smart contracts.
A common design pattern in Chia smart coins is that they will recreate themselves with the same puzzle but with some "state" changed.
___

**Q:** What is the difference between ChiaLisp, CLVM bytecode, CLVM assembly and the Conditions Language?

**A:** ChiaLisp is the higher level language which can be compiled into the lower level language called CLVM.

CLVM Assembly is the lower level language that ChiaLisp is compiled to.

CLVM Bytecode is the serialized form of CLVM Assembly.

When CLVM is run on the network, it can use a language called the Conditions Language to declare certain requirements be met.
The conditions language is a series of statements which are evaluated all at the same time.
____

**Q:** What is a CAT?

**A:** CAT stands for Chia Asset Token.

CATs are fungible tokens that are minted from XCH and live on Chia's blockchain. CATs have the property of being "marked" in a way that makes them unusable as regular XCH. However, it is often possible to "retire" CATs, which then "melt" back into XCH.
____

**Q:** What is a TAIL?

**A:** TAIL stands for Token and Asset Issuance Limiter.

A TAIL is a Chialisp program that verifies that all of a CAT's supply rules are being followed. Two CATs that share the same TAIL are of the same type. The TAIL defines the CAT.

For more information on CATs and TAILS, check out our [CAT1 standard](https://chialisp.com/docs/puzzles/cats "CAT1 standard documentation") documentation.
____

**Q:** How can I receive some tokens?

**A:** If you give someone your XCH wallet address, they can send you tokens, just like they would send you XCH. If the tokens you receive are on our verified list, they'll automatically show up in your light wallet (full wallet functionality is coming in a future release).

If your new tokens are not on our verified list, you'll need to add a wallet manually. First obtain the CAT's ID from whoever sent you the tokens. In the upper left corner of your light wallet, click "+ ADD TOKEN", then click "+ Custom". Enter the name of your CAT in the Name field. For the Token and Asset Issuance Limitations field, add the CAT's ID. Click ADD.

You should be taken to a wallet for your CAT. If you have already received tokens, they'll show up in this wallet.
____

**Q:** Can I make my own CAT?

**A:** Sure! We have tutorial to guide you through the CAT creation process on both [Windows](https://www.chialisp.com/docs/tutorials/CAT_Launch_Process_Windows "Chia Asset Token tutorial for Windows users") and [Linux/MacOS](https://www.chialisp.com/docs/tutorials/CAT_Launch_Process_Linux_MacOS "Chia Asset Token tutorial for Linux and MacOs users").
____

**Q:** How can I get my CAT verified?

**A:** Eventually we will release a formal process for you to verify your CAT, after which it will be listed as one of the default CATs in our wallet GUI. Keep in mind that this will be a tightly-controlled process, where few CATs be verified. But don't let that stop you from creating your own CATs -- they will still work, even if they are not listed in our GUI.

Expect the verification process to be published around January 2022.


**Q:** What sort of CATs are in development?

**A:** It's too early to give any specific details, but many different CATs are coming _soon_!
