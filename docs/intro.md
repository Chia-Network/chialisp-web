---
id: intro
sidebar_label: Introduction
title: About Chialisp
slug: /
---

Chialisp is a pure and functional language with a focus on security and auditability. Chialisp is commonly used on the Chia blockchain to lock funds in smart coins until spent and released by their owner. This enables behavior similar to that of smart contracts.

Here is an example:

```chialisp
(mod ()
    (defun square (number)
        (* number number)
    )

    (square 5) ; 25
)
```

## Design Decisions

There are many reasons to choose [Lisp](<https://en.wikipedia.org/wiki/Lisp_(programming_language)>) as the basis for this language, even though it is over 60 years old.

#### CLVM

Chialisp compiles to a lower level form, which is CLVM (Chialisp Virtual Machine) bytecode. This allows the language to change over time while still being executed in the same way.

#### Sandboxed

CLVM is completely sandboxed, in order to prevent it from gaining access to its host machine. This is important, since on the Chia blockchain, it needs to be run on hundreds of thousands of computers.

Programs are evaluated, and therefore cannot spawn any new processes or interact with the system.

#### Auditable

Code written in Chialisp has no effects or hidden information. This makes it easier to find security flaws and bugs. This is essential for smart coins made for the Chia blockchain.

#### Composable

A program in LISP is just a list. This enables powerful techniques that allow you to modify source code during program evaluation. You can even have multiple layers of a program that get executed at different stages.

## Getting Started

If you'd like to get started learning and using Chialisp, you can start with the [Intro to Chialisp](https://devs.chia.net/guides) guide. Throughout this series, you will write programs in the language, create smart coins on the Chia blockchain, and spend them on the command-line.
