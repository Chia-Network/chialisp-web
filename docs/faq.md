---
id: faq
title: ChiaLisp and CLVM FAQ
sidebar_label: ChiaLisp and CLVM FAQ
---

Q: Why is my number being evaluated to `()`, a.k.a. `nil`?

A: In clvm (the `brun` command), integers are evaluated as references to arguments in the argument tree.
If no argument tree is given on the command line, the default is an empty argument tree. When an argument is not found, `nil` is returned. 
In ChiaLisp (the `run` command), integers are compiled to quoted atoms, which will give you the value you expected.

