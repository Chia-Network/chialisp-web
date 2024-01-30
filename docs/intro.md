---
id: intro
sidebar_label: Introduction
title: About Chialisp
slug: /
---

import Runnable from '@site/src/components/Runnable.tsx';

Chialisp is a pure and functional language with a focus on security and auditability. Chialisp is commonly used on the Chia blockchain to lock funds in smart coins until spent and released by their owner. This enables behavior similar to that of smart contracts.

Here is an example:

<Runnable flavor='chialisp'>

```chialisp
(mod ()
    (defun square (number)
        (* number number)
    )

    (square 5)
)
```

</Runnable>

:::tip
Many Chialisp code block examples on this site can be edited, and evaluated by clicking the play button in the top right. You can edit the program arguments at the top (if not present, click the keyboard button to add arguments).
:::

## Design Decisions

There are many reasons to choose [Lisp](<https://en.wikipedia.org/wiki/Lisp_(programming_language)>) as the basis for this language, even though it is over 60 years old.

#### CLVM

Chialisp compiles to a lower level form, which is CLVM (Chialisp Virtual Machine) bytecode. This allows the language to change over time while still being executed in the same way.

#### Sandboxed

CLVM is completely sandboxed, in order to prevent it from gaining access to its host machine. This is important, since on the Chia blockchain, it needs to be run on hundreds of thousands of computers.

Programs are evaluated, and therefore cannot spawn any new processes or interact with the system.

#### Auditable

Code written in Chialisp has no side effects or hidden information. This makes it easier to find security flaws and bugs. This is essential for smart coins made for the Chia blockchain.

#### Composable

A program in Lisp is just a list. This enables powerful techniques that allow you to modify source code during program evaluation. You can even have multiple layers of a program that get executed at different stages.

#### New language features

Chialisp has been receiving new features which mirror other languages in the scheme and lisp family. Install the chialisp nightly tools to enable these features.
New features are listed in detail [here](/modern-chialisp).

## Getting Started

If you'd like to get started learning and using Chialisp, you can start with the [Intro to Chialisp](/chialisp-primer/intro) guide. Throughout this series, you will write programs in the language, create smart coins on the Chia blockchain, and spend them on the command-line.
