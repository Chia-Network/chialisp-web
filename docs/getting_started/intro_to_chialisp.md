---
id: intro_to_chialisp
title: Intro to Chialisp
---

[Chialisp](https://chialisp.com) is a language based on [Lisp](<https://en.wikipedia.org/wiki/Lisp_(programming_language)>) that is used on the Chia blockchain to dictate how and when [coins](https://docs.chia.net/docs/01introduction/chia-system-overview#coins-and-transactions) can be spent. It's designed to be as simple and efficient as possible, but still provide broad functionality and [Turing Completeness](https://en.wikipedia.org/wiki/Turing_completeness).

Throughout this guide you will learn the basics of Chialisp, and by the end you should have the skills required to write working programs using it. No prior knowledge of Lisp is required.

## Installation

You can follow [this guide](https://github.com/Chia-Network/chia-dev-tools/#install) to install and use Chia Dev Tools. You will be using these tools and a simple text editor of your choice to write and run snippets of code.

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

If you are interested in learning more about how atoms are represented, see the [Types](https://chialisp.com/docs/ref/clvm#types) section.

## Lists

A **list** is a nested chain of [cons pairs](https://en.wikipedia.org/wiki/Cons) used to represent a set of values, which are also either atoms or lists. While you can manually create these pairs, and it is a good thing to know how to do, we will focus on the higher-level concept of lists for now, since they are easier to use and more practical.

The first item in an unquoted list is the operator, and the rest are its operands. The same goes for functions or macros and their arguments. If you want to express a list of values, you either have to use the `list` operator or quote the list.

Here is a list of values:

```chialisp
(list 1 2 3)
```

And here is an operator:

```chialisp
(+ 2 3)
```

As you can see, just about everything in this language is based on lists, hence the name Lisp (an abbreviation for List Processor). You can see a full list of built-in operators [here](https://chialisp.com/docs/clvm/lang_reference/#operator-summary).

## Modules

The `mod` operator creates a context for converting the usage of constants into a single expression. It's used for more complicated features such as creating functions and including library files.

Note that definitions inside the module will not have direct access to the [solution](/docs/glossary#solution) values provided during execution, so values will have to be passed in manually as function parameters. In other words, there is no concept of a module [scope](<https://en.wikipedia.org/wiki/Scope_(computer_science)>), although constants can be used anywhere.

This module will add two arbitrary values together:

```chialisp
(mod (first second)
    (+ first second)
)
```

And this is an example of defining a constant and a function, followed by their usage:

```chialisp
;;; Raises the number by one order of magnitude.

(mod (value)
    ; Defines a constant value with a name.
    (defconstant ORDER_OF_MAGNITUDE 10)

    ; Defines a function that can be called with a value.
    (defun raise_magnitude (value)
        (* value ORDER_OF_MAGNITUDE)
    )

    ; Calls the previously defined function.
    (raise_magnitude value)
)
```

1. The module takes in a `value` parameter.
2. `ORDER_OF_MAGNITUDE` is defined as 10.
3. The `raise_magnitude` function takes in a `value` parameter (even though they have the same name, this is a different variable from the `value` defined as a module parameter).
4. Returns the `value` function parameter multiplied by the `ORDER_OF_MAGNITUDE`.
5. Calls the function with the module parameter `value`.

## Putting it Together

By now you have seen how some aspects of the language work, and we can use these concepts to write and run a simple Chialisp program. We will write a module that calculates the factorial of a number using [recursion](https://en.wikipedia.org/wiki/Recursion).

Put this in a file named `factorial.clsp`:

```chialisp
;;; Calculates a factorial recursively.
;;; f(n) = n * f(n - 1)
;;; f(n) = n if n <= 2

(mod (number)
    ; Defines the factorial function.
    (defun factorial (number)
        (if (> number 1)
            (* number (factorial (- number 1)))
            1
        )
    )

    ; Calls the function with the number provided.
    (factorial number)
)
```

Run this example with the following command:

```bash
brun "$(run factorial.clsp)" "(5)"
```

It will compile it and run the result with a solution where `number` is 5. The result of this should be the factorial of that number, which is 120. There were a few new operators used in these examples. For more information, you should refer to the [operator reference](https://chialisp.com/docs/ref/clvm#the-built-in-opcodes). Below is a detailed explanation of how this works.

1. The module takes in a `number` parameter.
2. The `factorial` function also takes in a `number` parameter.
3. If the number is greater than 2, returns the number times the previous factorial.
4. Otherwise, returns the number itself.
5. Call the recursive function with the `number` module parameter.

We can visualize this function with the input 5 as follows:

```chialisp
(factorial 5)
(* 5 (factorial 4))
(* 5 (* 4 (factorial 3)))
(* 5 (* 4 (* 3 (factorial 2))))
(* 5 (* 4 (* 3 (* 2 (factorial 1)))))
(* 5 (* 4 (* 3 (* 2 1))))
```

Which then simplifies like this:

```chialisp
(* 5 (* 4 (* 3 2)))
(* 5 (* 4 6))
(* 5 24)
120
```

Everything that would normally be written using iteration in an imperative language, for example array modification, is instead written using recursion in Chialisp. It can be hard to understand at first, but eventually it will make more and more sense.

## Conclusion

Hopefully this guide has been a good introduction into the world of Chialisp. We know it's a lot to take in, so feel free to take a break before continuing on with more guides or the documentation.

If you really want to get started with using it, the best way is to simply write code in the language and ask questions on our [Keybase](https://keybase.io/team/chia_network.public) that come up along the way. We are always happy to help you learn.
