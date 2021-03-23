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

**Q:** Is it possible to store data or maintain state in smart contracts?

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
