---
id: deeper_into_clvm
title: 3 - Deeper into CLVM
---

This guide assumes knowledge of [the basics of CLVM](/docs/) so if you haven't read that, please do so before reading this.

This section of the guide will cover how ChiaLisp relates to transactions and coins on the Chia network.
If there are any terms that you aren't sure of, be sure to check the [glossary](/docs/glossary).

## Lazy Evaluation in ChiaLisp

As we've seen in earlier sections, programs are often structured around `(i A B C)` to control flow.
ChiaLisp evaluates programs as trees, where the leaves are evaluated first.
This can cause unexpected problems if you are not aware of it.
Consider the following program which uses `x` which immediately halts and throws an error if it is evaluated.

```chialisp
$ brun '(i (q . 1) (q . 100) (x (q . "still being evaluated")))'
FAIL: clvm raise (0x7374696c6c206265696e67206576616c7561746564)
```

This is because ChiaLisp evaluates both of the leaves even though it will only follow the path of one.

To get around this we can use the following design pattern to replace (i A B C).

```chialisp
(a (i (A) (q . B) (q . C)) 1)
```

Applying this to our above example looks like this:

```chialisp
$ brun '(a (i (q . 1) (q . (q . 100)) (q . (x (q . "still being evaluated")))) 1)'
100
```

It is worth keeping this in mind whenever you write an `(i A B C)`.

If you're wondering how this works (and how the [signature locked coin](/docs/coins_spends_and_wallets#example-signature-locked-coin) from before worked), then allow me to introduce Evaluate.

## Introduction to Evaluate

In [the introduction to CLVM](/docs/) we mentioned that a program is usually a list where the first element is an operator, and every subsequent element is a valid program.
We can also run programs with new arguments inside a program.

This looks like this:

```chialisp
(a *puzzle* *solution*)
```

Let's put this into practice.

Here is a program that evaluates the program `(+ 2 (q . 5)))` and uses the list `(70 80 90)` or `(80 90 100)` as the solution.

```chialisp
$ brun '(a (q . (+ 2 (q . 5))) (q . (70 80 90)))' '(20 30 40)'
75

$ brun '(a (q . (+ 2 (q . 5))) (q . (80 90 100)))' '(20 30 40)'
85
```

Notice how the original solution `(20 30 40)` does not matter for the new evaluation environment.
In this example we use `q . ` to quote both the new puzzle and the new solution to prevent them from being prematurely evaluated.

A neat trick that we can pull is that we can define the new solution in terms of the outer solution.
In this next example we will add the first element of the old solution to our new solution.

```chialisp
$ brun '(a (q . (+ 2 (q . 5))) (c 2 (q . (70 80 90))))' '(20 30 40)'
25
```

However it's not just the new solution that we can affect using this, we can also pass programs as parameters.

## Programs as Parameters

The core CLVM does not have an operator for creating user defined functions.
It does, however, allow programs to be passed as parameters, which can be used for similar results.

Here is a puzzle that executes the program contained in `2` (the first solution argument) with the solution `(12)`.

```chialisp
$ brun '(a 2 (q . (12)))' '((* 2 (q . 2)))'
24
```

Taking this further we can make the puzzle run a new evaluation that only uses parameters from its old solution:

```chialisp
$ brun '(a 2 1)' '((* 5 (q . 2)) 10)'
20
```

We can use this technique to implement recursive programs.
