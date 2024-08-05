---
id: operators
title: Operators
slug: /operators
---

import Runnable from '@site/src/components/Runnable.tsx';

This is a basic description of each operator. If you want tangible examples for how to use them, check out the [Examples page](/examples).

:::note
The operators in the [Modules section](#chialisp-modules), as well as `if`, `qq`, and `unquote` are only part of Chialisp, not the compiled CLVM representation.

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

| Operator | Format         | Description                                           |
| -------- | -------------- | ----------------------------------------------------- |
| +        | `(+ A B ...)`  | Adds multiple atoms.                                  |
| -        | `(- A B ...)`  | Subtracts multiple atoms.                             |
| \*       | `(* A B ...)`  | Multiplies multiple atoms.                            |
| /        | `(/ A B)`      | Divides two atoms. Rounds towards negative infinity.  |
| divmod   | `(divmod A B)` | Calculates quotient and remainder in cons pair.       |

### Negative Division

:::info

In earlier versions of Chia, the `/` operator produced incorrect rounding when used with negative numbers. It was disabled in a [soft-fork at block height 2,300,000](https://www.chia.net/2022/03/04/divided-we-fork.en.html). It was enabled again in the hard fork, with correct behavior. It always rounds towards negative infinity

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

If you would like to replicate the lazy evaluation of the `if` operator in CLVM, you can wrap the `i` operator like this:

<Runnable flavor='clvm'>

```chialisp
(a (i (q . 1) (q q . 'abc') (q q . 'xyz')) 1)
```

</Runnable>

Essentially, this runs the branch the condition matches as a program (with the current environment). Depending on how much code is executed in each branch, this may be more cost effective than executing both branches.
:::

## Evaluation

| Operator           | Format        | Description                                                                   |
| ------------------ | ------------- | ----------------------------------------------------------------------------- |
| qq - _quasi-quote_ | `(qq A)`      | **Chialisp only** - Quote an expression except for anything inside `unquote`. |
| unquote            | `(unquote A)` | **Chialisp only** - Unquote an expression nested within `qq`.                 |
| q - _quote_        | `(q . A)`     | Treats A as a value rather than a program.                                    |
| a - _apply_        | `(a A B)`     | Evaluate value A as a program with value B as its environment.                |
| @ - _environment_  | `(@ A)`       | **Chialisp only** - Access value A from the environment.                      |

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

| Operator       | Format                  | Description                                                                                                |
| -------------- | ----------------------- | ---------------------------------------------------------------------------------------------------------- |
| point_add      | `(point_add p1 p2 ...)` | Adds two or more G1 points (public keys) together. Renamed to g1_add in [CHIP-0011](#chip-0011-operators). |
| pubkey_for_exp | `(pubkey_for_exp A)`    | Maps an exponent (secret key) to a G1 point (public key).                                                  |

## Softfork

The purpose of the `softfork` operator is to enable the ability to define new CLVM operators without creating a hard fork. For example, suppose we want to add secp256k1 operators like `+s` for adding two points on this ECDSA curve for bitcoin compatibility. We can't just do this in vanilla CLVM, because that would make the program `(+s A B)` return different values before and after the soft fork. So instead, we can hide it under `softfork`.

The syntax is defined as follows:

```chialisp
(softfork cost extension program arguments)
```

- The `cost` must equal the cost of executing the program with the specified arguments, otherwise an exception is raised. The minimum cost of the operator is 140.
- The `extension` is an unsigned (up to 32-bit in size) integer indicating the set of extensions available in the softfork guard.
- The `program` is executed with the specified `arguments`. The output is always either null or termination of the program if it failed.

Here is a CLVM example using the `coinid` operator described in the [CHIP-0011 Operators](#chip-0011-operators) section:

```chialisp
(softfork
  (q . 1265)  ; expected cost (including cost of softfork itself)
  (q . 0)     ; extension 0
  (q a        ; defer execution of if-branches
    (i
      (=
        (coinid
          (q . 0x1234500000000000000000000000000000000000000000000000000000000000)
          (q . 0x6789abcdef000000000000000000000000000000000000000000000000000000)
          (q . 123456789)
        )
        (q . 0x69bfe81b052bfc6bd7f3fb9167fec61793175b897c16a35827f947d5cc98e4bc)
      )
      (q . 0) ; if coin ID matches, return 0
      (q x)   ; if coin ID mismatches, raise
    )
    (q . ())) ; environment to apply
  (q . ())    ; environment to softfork
)
```

Pre-softfork, this always passes and returns `()` at a cost of `cost` (or 140, whichever is higher).

Post-softfork, this also returns `()` at a cost of `cost`, but may also fail if the coin id doesn't match. We can't export the result outside the `softfork` boundary, but we can compare it to something inside and raise if it doesn't match.

We take the cost of running the program inside the `softfork` boundary and ensure it exactly matches `cost`, and raise an exception if it's wrong. That way, the program really does have the same cost pre-softfork and post-softfork (or it fails post-softfork).

## [CHIP-0011](https://github.com/Chia-Network/chips/blob/main/CHIPs/chip-0011.md) Operators

:::info
These operators will be usable within the `softfork` operator starting at block height 4,510,000.

At block height 5,496,000, the operators can be used directly as well.
:::

| Operator             | Format                                         | Description                                                                                                |
| -------------------- | ---------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| g1_add               | `(g1_add p1 p2 ...)`                           | Adds two or more G1 points (public keys) together.                                                         |
| g1_subtract          | `(g1_subtract p1 p2 ...)`                      | Subtracts one or more G1 points (public keys) from a base G1 point.                                        |
| g1_multiply          | `(g1_multiply p1 p2)`                          | Multiplies a G1 point (public key) by a scalar value.                                                      |
| g1_negate            | `(g1_negate point)`                            | Negates a G1 point (public key).                                                                           |
| g2_add               | `(g2_add p1 p2 ...)`                           | Adds two or more G2 points (signatures) together.                                                          |
| g2_subtract          | `(g2_subtract p1 p2 ...)`                      | Subtracts one or more G2 points (signatures) from a base G2 point.                                         |
| g2_multiply          | `(g2_multiply p1 p2)`                          | Multiplies a G2 point (signature) by a scalar value.                                                       |
| g2_negate            | `(g2_negate point)`                            | Negates a G2 point (signature).                                                                            |
| g1_map               | `(g1_map data dst)`                            | Hashes the data to a G1 point with sha256 and ExpandMsgXmd. DST is optional.                               |
| g2_map               | `(g2_map data dst)`                            | Hashes the data to a G2 point with sha256 and ExpandMsgXmd. DST is optional.                               |
| bls_pairing_identity | `(bls_pairing_identity g1 g2 ...)`             | Returns nil if the pairing of all pairs is the identity, otherwise raises an exception.                    |
| bls_verify           | `(bls_verify g2 g1 msg ...)`                   | Nil if signature g2 is valid with public key g1 and message, otherwise raises an exception.                |
| coinid               | `(coinid parent_id puzzle_hash amount)`        | Validates inputs and calculates the coin id with a parent coin id, puzzle hash, and amount.                |
| modpow               | `(modpow base exponent modulus)`               | Computes `(base ^ exponent) % modulus`. Base may be negative, exponent must not be, modulus must not be 0. |
| %                    | `(% numerator denominator)`                    | Computes the remainder of the numerator divided by the denominator.                                        |
| secp256k1_verify     | `(secp256k1_verify pubkey msg_hash signature)` | Verifies a signature that uses the secp256k1 curve.                                                        |
| secp256r1_verify     | `(secp256r1_verify pubkey msg_hash signature)` | Verifies a signature that uses the secp256r1 curve.                                                        |
