---
id: operators
title: Operators
slug: /operators
---

This is a basic description of each operator. If you want tangible examples for how to use them, check out the [Examples page](/examples).

:::note
The operators in the [Modules section](#modules), as well as `if`, `qq`, and `unquote` are only part of Chialisp, not the compiled CLVM representation.

Additionally, they do not have an intrinsic cost, since they are compiled to CLVM and not actually executed on their own.
:::

## Chialisp Modules

| Statement    | Format                 | Description                                      |
| ------------ | ---------------------- | ------------------------------------------------ |
| mod          | `(mod A B)`            | Compiles module with args A and body B.          |
| include      | `(include A.clib)`     | Includes file A containing a list of statements. |
| defun        | `(defun A B C)`        | Function named A with args B and body C.         |
| defun-inline | `(defun-inline A B C)` | Inline function named A with args B and body C.  |
| lambda       | `(lambda A B)`         | Lambda function with args A and body B.          |
| defmacro     | `(defmacro A B C)`     | Macro named A with args B and body C.            |
| defconstant  | `(defconstant A B)`    | Constant A with value B.                         |

## Arithmetic

| Operator | Format         | Description                                     |
| -------- | -------------- | ----------------------------------------------- |
| +        | `(+ A B ...)`  | Adds multiple atoms.                            |
| -        | `(- A B ...)`  | Subtracts multiple atoms.                       |
| \*       | `(* A B ...)`  | Multiplies multiple atoms.                      |
| /        | `(/ A B)`      | Divides two atoms.                              |
| divmod   | `(divmod A B)` | Calculates quotient and remainder in cons pair. |

### Negative Division

:::info

The `/` operator cannot be used to divide negative numbers. Previously this worked, but used the wrong method of dividing negative integers. The operator was [soft-forked at block height 2,300,000](https://www.chia.net/2022/03/04/divided-we-fork.en.html) to prevent this.

You should use `divmod` instead in situations where you need to divide negative numbers.

For example:

```chialisp
(f (divmod -6 3)) ; -2
```

:::

## Comparison

| Operator | Format          | Description                                             |
| -------- | --------------- | ------------------------------------------------------- |
| =        | `(= A B)`       | True if both atoms are equal.                           |
| >        | `(> A B)`       | True if the first atom is greater as a number.          |
| >s       | `(>s A B)`      | True if the first atom is greater as a string of bytes. |
| not      | `(not A)`       | True if the atom is false.                              |
| all      | `(all A B ...)` | True if all of the atoms are non-zero.                  |
| any      | `(any A B ...)` | True if any of the atoms are non-zero.                  |

## Control Flow

| Operator   | Format       | Description                                                            |
| ---------- | ------------ | ---------------------------------------------------------------------- |
| if         | `(if A B C)` | **Chialisp only** - If A is true, then B, otherwise C. Lazy evaluated. |
| i - _if_   | `(i A B C)`  | If A is true, then B, otherwise C.                                     |
| x - _exit_ | `(x ...)`    | Terminate the program with zero or more values.                        |

### If Operator

:::note

The `if` operator is lazy evaluated. This means that code paths are not evaluated unless they need to be.

Usually this is the intended behavior, but if it isn't, you can use the `i` operator instead.

:::

## Evaluation

| Operator           | Format        | Description                                                          |
| ------------------ | ------------- | -------------------------------------------------------------------- |
| qq - _quasi-quote_ | `(qq A)`      | **Chialisp only** - Quote an expression except for certain sections. |
| unquote            | `(unquote A)` | **Chialisp only** - Unquote a section of an expression inside `qq`.  |
| q - _quote_        | `(q . A)`     | Treats A as a value rather than a program.                           |
| a - _apply_        | `(a A B)`     | Evaluate program A with input B.                                     |
| @ - _environment_  | `(@ A)`       | **Chialisp only** - Access value A from the environment.             |

### Environment Operator

:::note
The `@` operator acts in a similar fashion to unquoted atoms in CLVM. If `@` is used plainly as a value, its value is the whole environment.
:::

## Lists

| Operator             | Format    | Description                                                |
| -------------------- | --------- | ---------------------------------------------------------- |
| f - _first_          | `(f A)`   | First value in list A.                                     |
| r - _rest_           | `(r A)`   | Rest of the values in list A.                              |
| c - _cons_           | `(c A B)` | Cons pair of A and B, or prepend A to list B.              |
| l - _list predicate_ | `(l A)`   | True if A is a list, not nil. Can be used to check length. |

## Atoms

| Operator                 | Format             | Description                                  |
| ------------------------ | ------------------ | -------------------------------------------- |
| sha256                   | `(sha256 A B ...)` | Calculates the sha256 hash of the atoms.     |
| concat                   | `(concat A B ...)` | Concatenates the bytes of the atoms.         |
| strlen                   | `(strlen A)`       | Returns the length of the atom.              |
| substr                   | `(substr A B C)`   | Slice of bytes A between B and C, exclusive. |
| logand                   | `(logand A B ...)` | Bitwise and of the atoms.                    |
| logior                   | `(logior A B ...)` | Bitwise logical or of the atoms.             |
| logxor                   | `(logxor A B ...)` | Bitwise xor of the atoms.                    |
| lognot                   | `(lognot A)`       | Bitwise not of A.                            |
| ash - _arithmetic shift_ | `(ash A B)`        | Arithmetic shift A by B bits.                |
| lsh - _logical shift_    | `(lsh A B)`        | Logical shift A by B bits.                   |

## BLS12-381

| Operator       | Format                | Description                                         |
| -------------- | --------------------- | --------------------------------------------------- |
| point_add      | `(point_add A B ...)` | Adds G1 points (public keys) together.              |
| pubkey_for_exp | `(pubkey_for_exp A)`  | Turns A (private key) into a G1 point (public key). |
