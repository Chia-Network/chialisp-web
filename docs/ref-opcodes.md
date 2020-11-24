
---
id: ref-opcodes
title: CLVM Reference Manual
sidebar_label: 2 - Opcodes
---

The clvm is a small, tightly defined VM that defines the semantics of CLVM programs run during Chia blockchain validation. It serves as a target language for higher level languages targeting CLVM, especially ChiaLisp.

## Definitions

* **Value** - Any CLVM Object other than a cons box. These atoms can represent any value allowed by the syntax, including nil
* **Atom** - A synonym for Value
* **nil** - nil is a special built in value. The syntax for nil is `()`. It is used in the right cell of the last cons box of a list to signal the end of the list. nil is also used in all contexts where the boolean `false` might be used in other languages. For example, as the first argument of the `if` opcode.
* **cons box** - A special CLVM Object that contains an ordered pair of CLVM Objects
* **List** - A linked list of cons boxes, each containing a CLVM Object in the left cons cell, and the next cons box in the right cell. The final cell contains nil in its right cell. When All of the left cons cells hold a value, the list is a "flat list". When some of the cons cells hold cons boxes in their left cells, the "list" becomes a binary tree.
* **Function** - A program that can be evaluated, and a name. The name of a function is used to look up the function definition, which is its compiled program. The name is an atom that is assigned at the time of definition. This part of the documentation is concerned only with predefined, builtin functions: Opcodes.
* **Operator** - Function.
* **Program** - The textual representation of a clvm program can be referred to as a program, but what is usually meant in the context of the Chia blockchain is the compiled, in-memory representation of the program, which is a  binary tree whose Internal nodes are cons boxes, and whose leaf nodes are atoms.
* **Opcodes** - These are builtin functions

Nil does not name a function, and cannot be evaluated as a function.

A CLVM program must have an unambigious definition and meaning, so that Chia blockchain consensus is deterministic with respect to block validation.
Programs are treated as Merkle trees, and they are uniquely identified by the hash at their root. This program hash can be used to verify that two programs are the same.

## Evaluation
The semantics of the language implemented by the CLVM is similar to Lisp.
Evaluating a program means evaluaing the root of the program tree.

If the root of the program is an atom, only one evaluation is performed. Please see [Program Arguments](), below.

If the the root of the program is a list, the first element in that list is expected to evaluate to an atom. That atom is used to look up a function, which is passed the rest of the list as its arguments and evaluated. All arguments are evaluated before being passed to functions. This quality, eager evaluation, means that all leaves are evaluated before inner nodes of the program tree.

### Program Arguments

For a program running on a deterministic machine to have different behaviours, it must be able to take take on different starting states. The starting state for a CLVM program is the argument list.

As an improvement over walking the argument tree via calls to **first** and **rest**, arguments are indexed from the argument list by their argument number. This number is derived by translating the path of left and right nodes through the argument tree into a series of ones and zeros corresponding to the path to the CLVM Object in the argument list. The number of the root of the argument tree is `1`.

In most programming languages, evaluating a literal returns the evaluated value itself.
In CLVM, the meaning of an atom not in function context at evaluation time is a reference to a value in the argument tree.

Therefore, when you intend to write:

`(+ 1 2)` => `3`

You must instead write:
`(+ (q 1) (q 2))` => `3`

### Compilation: Atom Syntax

Although there is only one underlying representation of an atom, different syntaxes are recognized during compile time, and those atom syntaxes are interpreted differently during the translation from program text to CLVM Objects.

`()` => `()`
`0` => `()`
`0x0` => `()`


# Program Evaluation

If the Object being evaluated is a list, the value of the first list item is interpreted as referring to a function.
That function is looked up and evaluated, with the rest of the list as arguments.

All arguments of a function are evaluated before being passed to that function.

Here is an example of a function invocation ("function call"). This function happens to be the opcode `+`, a function built in to the clvm runtime. `(+ (q 1) (q 2))`

## Errors

While running a clvm program, checks are made to ensure the CLVM does not enter an undefined state. When a program violates one of these runtime checks, it is said to have caused an error.

Some errors are:

* First element in an evaluated list is not a valid function. Example: `("hello" (q 1))` => `FAIL: unimplemented operator "hello"`
* Wrong number of arguments. Example: `(lognot (q 1) (q 2))` => `FAIL: lognot requires 1 arg`
* Program evaluation exceeds max cost see [Costs](ref-opcodes.md#costs)
* Too many allocations have been performed

An error will cause the program to abort.

## The builtin opcodes

Opcodes are functions built in to the CLVM. They are available to any running program.

# Operator Summary

## List Operators

**c** *cons* `(c A B)` takes exactly two operands and returns a cons box with the two objects in it (A in the left, B in the right)

Example: `'(c (q "A") (q ()))'` => `(65)`

**f** *first* `(f X)` takes exactly one operand which must be a cons box, and returns the left half

**r** *rest* `(r X)` takes exactly one operand which must be a cons box, and returns the right half

**l** *listp* `(l X)` takes exactly one operand and returns `()` if it is an atom or `1` if it is a list. In contrast to most other lisps, nil is not a list in CLVM.

Errors:
Allocations: None
Cost:

## Control Flow
**i** *if* `(i A B C)` takes exactly three operands `A`, `B`, `C`. If `A` is `()` (which means "false"), return `C`. Otherwise, return `B`. Note that B and C are evaluated before *if* is evaluated.

**x** *raise* `(x X Y ...)` takes an arbitrary number of arguments (even zero). Immediately fail, with the argument list passed up into the (python) exception. No other CLVM instructions are run after this instruction is evaluated.

**=** *equal* `(= A B)` returns 1 if `A` and `B` are both atoms and both equal. Otherwise `()`. Do not use this to test if two programs are equal. Use **sha256tree**. Nil tests equal to zero.

**>** *greater than* `(> A B)` returns 1 if `A` and `B` are both atoms and A is greater than B, interpreting both as two's complement signed integers. Otherwise `()`. `(> A B)` means `A > B` in infix syntax.

**>s** *greater than bytes* `(>s A B)` returns 1 if `A` and `B` are both atoms and A is greater than B, interpreting both as an array on unsigned bytes. Otherwise `()`.
`(>s "a" "b")` => `()`

## Constants
**q** *quote* `(q X)` takes exactly one operand which is *not* evaluated and returns it

## Integer Operators
**`+`** `(+ a0 a1 ...)` takes any number of integer operands and sums them. If given no arguments, zero is returned.

**`-`** `(- a0 a1 ...)` takes one or more integer operands and adds a0 to the negative of the rest. Giving zero arguments is an error.

**`*`** `(* a0 a1 ...)` takes any number of integer operands and returns the product.

**divmod** `(divmod A B)` takes two integers and returns a list containing the floored quotient and the mod

## Bit Operations

logand, logior and logxor operate on any number of arguments (See [limits](ref-limits.md))
If any argument is nil, they return nil. Fail if either A or B is not an atom.
The shorter atom is considered to be extended with zero bytes until equal in length to the longer atom.

**logand** `(logand A B ...)` bitwise **AND** of one or more atoms. Given zero arguments, returns `-1`.

**logior** `(logior A B ...)` bitwise logical **OR** of one or more atoms. Given zero arguments, returns zero.

**logxor** `(logxor A B)` bitwise **XOR** of any number of atoms. Given zero arguments, returns zero.

**lognot** `(lognot A)` bitwise **NOT** of A. All bits are inverted.

## Shifts

**ash** `(ash A B)` if B is positive, return Arithmetic shift A << B. Else returns A >> |B|. *ash* sign extends.

**lsh** `(lsh A B)` if B is positive, Logical shift A by B bits left. Else Logical shift A >> |B|. Zeros are inserted into the vacated bits.

## Strings

**substr** `(substr S I1 I2)` return an atom containing bytes indexed from I1 to I2. The first byte on the left of S (the MSB) is byte zero.

`(substr (q "clvm") (q 0) (q 4))` => `clvm`

**strlen** `(strlen S)` return the number of bytes in S.

`(strlen (q "clvm"))` => `4`

**concat** `(concat A ...)` return the concatenation of any number of atoms.

Example: `(concat (q "Hello") (q " ") (q "world"))` => `"Hello world"`

## Streaming Operators
**sha256**
  `(sha256 A)` returns the sha256 hash (as a 32-byte blob) of the bytes of A.

Example: `(sha256 (q "clvm"))` => `0xcf3eafb281c0e0e49e19c18b06939a6f7f128595289b08f60c68cef7c0e00b81`

## ECDSA operators
**point_add**
  `(point_add a0 a1 ...)` takes an arbitrary number of bls12_381 points and adds them

Example: `(point_add (pubkey_for_exp (q 1)) (pubkey_for_exp (q 2)))` => `0x89ece308f9d1f0131765212deca99697b112d61f9be9a5f1f3780a51335b3ff981747a0b2ca2179b96d2c0c9024e5224`

**pubkey_for_exp**
  `(pubkey_for_exp A)` turns the integer A into a bls12_381 point

`(pubkey_for_exp (q 1))` => `0x97f1d3a73197d7942695638c4fa9ac0fc3688c4f9774b905a14e3a3f171bac586c55e83ff97a1aeffb3af00adb22c6bb`
# Operator specification

All documentation in the Opcode section omits the necessary quote operator around each literal.

If a precondition is not met, it is an error. Checking argument count is covered later in the document.

Conventions used in the Operator Table
* N: the number of arguments. For `(+ (q 1) (q 2))`, N = `2`
* strlen(atom): number of bytes in an atom.
* max_arg_strlen: the length of the longest arg atom, in bytes
* result: the return value of the function


keyword|opcode|impl|funcall|args|return|preconditions|cost|Allocations
-------|------|-------------|---|---|---|---|---|---
i|0x04|op_if|(i C A B)|3|if C==nil then B else A||10|None
c|0x05|op_cons|(c A B)|2|cons box containing [A,B]||10|1 cons
f|0x06|op_first|(f L)|1|left cell of cons box L|L is not atom|10|None
r|0x07|op_rest|(r L)|1|right cell of cons box L|L is not atom|10|None
l|0x08|op_listp|(l A)|1|return 1 if A is a list, else nil||20|None
x|0x09|op_raise|(x ...)|>=0|stop program execution||N/A|None
=|0x0a|op_eq|(= A B)|2|if A == B then 1 else nil|A and B are atoms|len(A) + len(B)|None
sha256|0x0b|op_sha256|(sha256 ...)|>=0|return sha256 of *concat* of args|All args are atoms|2 * len(args)|1 Atom(32)
+|0x0c|op_add|(+ A B ...)|>=0|A + B + ...|All args are atoms|strlen(concat A B ...)) * 10|1 Atom(max(map(strlen, args)) + 1)
-|0x0d|op_subtract|(- A B ...)|>=0|A + B + ...|All args are atoms|strlen(concat A B ...)) * 10|1 Atom(max(map(strlen, args)))
`*`|0x0e|op_multiply|(* A B ...)|>=0|A * B * ...|All args are atoms|strlen(A) * strlen(B) * ... * 10
divmod|0x0f|op_divmod|(divmod A B)|2|((div A B) . (mod A B))|A and B are atoms|strlen(concat A B ...)) * 10|1 Atom(len(A) * len(B) * ...)
substr|0x10|op_substr|(substr S start end)|3|new atom with bytes from|S is atom<br> start <= end<br>start>=0<br>end>=0<br>end<=len(S)|1|1 Atom(len(S))
strlen|0x11|op_strlen|(strlen S)|1|length of atom S|S is atom|len(S)|None
point_add|0x12|op_point_add|(point_add P1 P2 ...)|>=0|Sum any number, N, of G1 Elements|P[n] are 48 bytes in length|N * 32|1 Atom(96)
pubkey_for_exp|0x13|op_pubkey_for_exp|(pubkey_for_exp E)|1|Get pubkey for E|E is an atom|900|1 Atom(96)
concat|0x14|op_concat|(concat A B ...)|>=0|Concatenate args|2 * (len(A) + len(B) + ...)| Atom(map(sum, arg_lens))
sha256tree|0x15|op_sha256tree|(sha256tree L)|1|Recursive sha256 of all leaf nodes of L|| (len_of_all_atoms*10) + (Number of CLVM Objects * 10) TODO: Check|Atom(32)
`>`|0x16|op_gr|(> A B)|2|if A > B then 1 else nil. Int conversion via Python's [int.from_bytes](https://docs.python.org/3/library/stdtypes.html#int.from_bytes)|A and B are atoms|<p style="color:red">10 * max(A,B)</p>|None
>s|0x17|op_gr_bytes|(>s A B)|2|Unsigned greater than|A and B are atoms|<p style="color:red">max(A,B)</p>|None
logand|0x18|op_logand|(logand A B ...)|>=0|Bitwise AND of args|All args are atoms|max_arg_strlen * 2|Atom(max(arg_lens))
logior|0x19|op_logior|(logior A B ...)|>=0|Bitwise OR of args|All args are atoms|max_arg_strlen * 2|Atom(max(arg_lens))
logxor|0x1a|op_logxor|(logxor A B)|2|Bitwise XOR of args. The bit is 1 if that bit is 1 in an odd number of the arguments|All args are atoms|max_arg_strlen * 2|Atom(max(arg_lens))
lognot|0x1b|op_lognot|(lognot A)|1|Flip every bit in A|A is an atom|COST|Atom(len(A))
ash|0x1c|op_ash|(ash A B)|2|Arithmetic shift. if B >= 0, A << B. Else A >> abs(B). Shift in 1's if right shifting a negative number|A and B are atoms|2 * (strlen(A) + strlen(result)) |Atom(len(result))
lsh|0x1d|op_lsh|(lsh A B)|2|Unsigned shift. if B >= 0, A << B. Else A >> abs(B). Shift in 0's in all cases|A and B are atoms|2 * (strlen(A) + strlen(result)) | Atom(len(result))
softfork|0x1e|op_softfork|(softfork COST)|1|See [Blockchain & Consensus]()|COST>=1||None

## Detailed behaviour Notes

**ash**
`(ash (q 1) (q 1))` => `2`
`(ash (q 1) (q -1))` => `0`

Right shift of `-1` with **ash** currently does not sign extend: <p style="color:red">`(ash (q -1) (q -1))` => `-1`</p>

Right shift of `-1` by any quantity (negative shift count) returns `-1`: <p style="color:red">`(ash (q -1) (q -99))`\
 => `-1`</p>

**lsh**

lsh behaviour from [elisp manual](https://www.gnu.org/software/emacs/manual/pdf/elisp.pdf)

```
(ash -7 -1) ; -7 = . . . 111111111111111111111111111001
          ⇒ -4 ; = . . . 111111111111111111111111111100

(lsh -7 -1)
   ⇒ 536870908 ; = . . . 011111111111111111111111111100

(ash -5 -2) ; -5 = . . . 111111111111111111111111111011
          ⇒ -2 ; = . . . 111111111111111111111111111110

(lsh -5 -2)
   ⇒ 268435454 ; = . . . 001111111111111111111111111110
```

# Costs

The minimum program cost is 40. After each opcode is run, its cost is added to the total program cost. When the cost exceeds a threshold, the program is terminated, and no value is returned.


# Argument Checking: Behaviour with fewer or more args than required

Some opcodes have strict argument requirements, and others will work with more arguments than required, ignoring additional arguments (eg. listp). Opcodes taking an unlimited number of arguments have not been checked in the table below.

Some operators have a special value that is returned when they are called with zero arguments. This is the identity value of that function.

Operator | Identity
---|---
+| 0
*| 1
AND| all 1's
OR| all zeros
XOR| all zeros

### Opcode List

keyword|opcode|implementation
-------|------|-------------
q|0x01|NO IMPL
a|0x03|NO IMPL
i|0x04|op_if
c|0x05|op_cons
f|0x06|op_first
r|0x07|op_rest
l|0x08|op_listp
x|0x09|op_raise
=|0x0a|op_eq
sha256|0x0b|op_sha256
+|0x0c|op_add
-|0x0d|op_subtract
*|0x0e|op_multiply
divmod|0x0f|op_divmod
substr|0x10|op_substr
strlen|0x11|op_strlen
point_add|0x12|op_point_add
pubkey_for_exp|0x13|op_pubkey_for_exp
concat|0x14|op_concat
sha256tree|0x15|op_sha256tree
>|0x16|op_gr
>s|0x17|op_gr_bytes
logand|0x18|op_logand
logior|0x19|op_logior
logxor|0x1a|op_logxor
lognot|0x1b|op_lognot
ash|0x1c|op_ash
lsh|0x1d|op_lsh
softfork|0x1e|op_softfork

### Operator Results when called with zero arguments
operator|value|brun return code
---|---|---
i | FAIL: rest of non-cons () | 255
c | FAIL: first of non-cons () | 255
f | FAIL: first of non-cons () | 255
r | FAIL: first of non-cons () | 255
l | FAIL: first of non-cons () | 255
x | FAIL: clvm raise () | 255
= | FAIL: first of non-cons () | 255
sha256 | 0xe3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855 | 0
+ | () | 0
- | cannot unpack non-iterable SExp object | 1
* | 1 | 0
divmod | FAIL: divmod requires 2 args () | 255
substr | FAIL: first of non-cons () | 255
strlen | FAIL: first of non-cons () | 255
point_add | 0xc00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000 | 0
pubkey_for_exp | FAIL: pubkey_for_exp requires 1 arg () | 255
concat | () | 0
sha256tree | FAIL: op_sha256tree expects exactly one argument () | 255
> | FAIL: > requires 2 args () | 255
>s | FAIL: >s requires 2 args () | 255
logand | -1 | 0
logior | () | 0
logxor | () | 0
lognot | FAIL: lognot requires 1 arg () | 255
ash | FAIL: ash requires 2 args () | 255
lsh | FAIL: ash requires 2 args () | 255
softfork | FAIL: first of non-cons () | 255

### Operator Results when called with fewer than minimum arguments
program|value|brun return code
---|---|---
(i  (q "A")  (q "A") ) | 65 | 0
(c  (q "A") ) | FAIL: first of non-cons () | 255
(f ) | FAIL: first of non-cons () | 255
(r ) | FAIL: first of non-cons () | 255
(l ) | FAIL: first of non-cons () | 255
(x ) | FAIL: clvm raise () | 255
(=  (q "A") ) | FAIL: first of non-cons () | 255
(sha256 ) | 0xe3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855 | 0
(+ ) | () | 0
(- ) | cannot unpack non-iterable SExp object | 1
(* ) | 1 | 0
(divmod  (q "A") ) | FAIL: divmod requires 2 args (65) | 255
(substr  (q "A")  (q "A") ) | FAIL: substr requires 2 args (65) | 255
(strlen ) | FAIL: first of non-cons () | 255
(point_add ) | 0xc00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000 | 0
(pubkey_for_exp ) | FAIL: pubkey_for_exp requires 1 arg () | 255
(concat ) | () | 0
(sha256tree ) | FAIL: op_sha256tree expects exactly one argument () | 255
(>  (q "A") ) | FAIL: > requires 2 args (65) | 255
(>s  (q "A") ) | FAIL: >s requires 2 args (65) | 255
(logand ) | -1 | 0
(logior ) | () | 0
(logxor ) | () | 0
(lognot ) | FAIL: lognot requires 1 arg () | 255
(ash  (q "A") ) | FAIL: ash requires 2 args (65) | 255
(lsh  (q "A") ) | FAIL: ash requires 2 args (65) | 255
(softfork ) | FAIL: first of non-cons () | 255

### Operator Results when called with too many arguments
operator|value|brun return code
---|---|---
(i  (q "A")  (q "A")  (q "A")  (q "A") ) | 65 | 0
(c  (q "A")  (q "A")  (q "A") ) | (65 . 65) | 0
(f  (q "A")  (q "A") ) | FAIL: first of non-cons 65 | 255
(r  (q "A")  (q "A") ) | FAIL: rest of non-cons 65 | 255
(l  (q "A")  (q "A") ) | () | 0
none | Untested. | none
(=  (q "A")  (q "A")  (q "A") ) | 1 | 0
none | Untested. | none
none | Untested. | none
none | Untested. | none
none | Untested. | none
(divmod  (q "A")  (q "A")  (q "A") ) | FAIL: divmod requires 2 args (65 65 65) | 255
(substr  (q "A")  (q "A")  (q "A")  (q "A") ) | FAIL: substr requires 2 args (65 65 65) | 255
(strlen  (q "A")  (q "A") ) | 1 | 0
none | Untested. | none
(pubkey_for_exp  (q "A")  (q "A") ) | FAIL: pubkey_for_exp requires 1 arg (65 65) | 255
none | Untested. | none
(sha256tree  (q "A")  (q "A") ) | FAIL: op_sha256tree expects exactly one argument (65 65) | 255
(>  (q "A")  (q "A")  (q "A") ) | FAIL: > requires 2 args (65 65 65) | 255
(>s  (q "A")  (q "A")  (q "A") ) | FAIL: >s requires 2 args (65 65 65) | 255
none | Untested. | none
none | Untested. | none
none | Untested. | none
(lognot  (q "A")  (q "A") ) | FAIL: lognot requires 1 arg (65 65) | 255
(ash  (q "A")  (q "A")  (q "A") ) | FAIL: ash requires 2 args (65 65 65) | 255
(lsh  (q "A")  (q "A")  (q "A") ) | FAIL: ash requires 2 args (65 65 65) | 255
(softfork  (q "A")  (q "A") ) | () | 0

### Conditions

Condition | CLVM Opcode
---|---
AGG_SIG | 50
CREATE_COIN | 51
ASSERT_COIN_CONSUMED | 52
ASSERT_MY_COIN_ID | 53
ASSERT_TIME_EXCEEDS | 54
ASSERT_BLOCK_INDEX_EXCEEDS | 55
ASSERT_BLOCK_AGE_EXCEEDS | 56
AGG_SIG_ME | 57
ASSERT_FEE | 58
