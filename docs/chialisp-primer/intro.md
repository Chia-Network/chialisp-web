---
slug: /chialisp-primer/intro
title: 1. Intro to Chialisp
---

[Chialisp](https://chialisp.com) is a language based on [Lisp](<https://en.wikipedia.org/wiki/Lisp_(programming_language)>) that is used on the Chia blockchain to dictate how and when [coins](https://docs.chia.net/coin-set-intro) can be spent. It's designed to be as simple and efficient as possible, but still provide broad functionality and [Turing Completeness](https://en.wikipedia.org/wiki/Turing_completeness).

Throughout this guide you will learn the basics of Chialisp, and by the end you should have the skills required to write working programs using it. No prior knowledge of Lisp is required.

## Installation

You can follow the [Chia Dev Tools installation guide](https://github.com/Chia-Network/chia-dev-tools/#install) to install and use Chia Dev Tools. You will be using these tools and a simple text editor of your choice to write and run snippets of code.

Once you have it set up, run the following command:

```bash
run "test"
```

The `run` command compiles Chialisp code. In this case, we are compiling a simple string to make sure it is installed properly.

If it is working correctly, it should output `"test"`. You can now follow along with any of the code in the coming sections.

## Atoms

An **atom** can represent an integer, string, or hexadecimal number. However, the difference is only known before the code is compiled, and every atom is stored directly as bytes.

For example, these atoms all have the same value:

| Representation | Example | Description                         |
| -------------- | ------- | ----------------------------------- |
| Symbol         | `A`     | Names and operators                 |
| String         | `"A"`   | Used to represent text              |
| Integer        | `65`    | Whole numbers, positive or negative |
| Hexadecimal    | `0x41`  | Raw byte representation             |

If you are interested in learning more about how atoms are represented, see the [CLVM](/clvm) guide.

## Lists

A **list** is a nested chain of [cons pairs](https://en.wikipedia.org/wiki/Cons) used to represent a set of values, which are also either atoms or lists. While you can manually create these pairs, and it is a good thing to know how to do, we will focus on the higher-level concept of lists for now, since they are easier to use and more practical.

The first item in an unquoted list is the operator, and the rest are its operands. The same goes for functions or macros and their arguments. If you want to express a list of values, you either have to use the `list` operator or quote the list.

This creates a list of values:

```bash
run '(list 1 2 3)'
```

And here is an operator:

```bash
run '(+ 2 3)'
```

As you can see, just about everything in this language is based on lists, hence the name Lisp (an abbreviation for List Processor). You can see a full list of built-in [operators](/operators).

## Example

Lets try a more complex example:

```bash
run '(* (if (> 3 2) 10 5) 10)'
```

If 3 is greater than 2, it's 10, otherwise 5. Then multiply it by 10. The result here is as you would expect, 100.

## Conclusion

Hopefully this guide has been a good introduction into the world of Chialisp. There is a lot more to learn, but this is the foundation that everything else is built on top of.

If you really want to get started with using it, the best way is to try out these examples yourself, and play around a little yourself. Feel free to ask questions on our [Discord](https://discord.gg/chia) that come up along the way. We are always happy to help you learn.
