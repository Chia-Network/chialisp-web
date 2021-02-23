---
id: opcodes
title: CLVM Reference Manual
sidebar_label: 2 - Opcodes
---

The clvm is a small, tightly defined VM that defines the semantics of CLVM programs run during Chia blockchain validation. It serves as a target language for higher level languages targeting CLVM, especially ChiaLisp.


## Definitions

* **Atom** - The underlying data type in the CLVM. Atoms are immutable byte arrays. Atoms are untyped and are used to encode all strings, integers, and keys. The only things in the CLVM which are not atoms are cons pairs.
* **cons pair** - An immutable ordered pair of references to other CLVM objects.
* **nil** - nil is the special value consisting of a string of length zero. The same value represents zero, null string, false, quote, empty list, and nil. Nil can be represented as `()`, `0`, ``''``, or `nil`. The `nil` name refers to its use in the right cell of the last cons pair of a list to signal the end of the list.
* **Value** - We use value to mean an abstract value like `1` (an integer), `0xCAFE` (a byte string), `"hello"` (a string) or `(sha256 (q "hello"))` (a program). Values are represented by CLVM Objects.
* **CLVM Object** - An atom or cons pair and everything recursively pointed to by it. CLVM objects can't have contain circular references although they can contain redundant references into the same underlying object. Although redundant data structures can be created there's no way for the CLVM language to tell whether two objects are the same reference or merely contain the same data (there is no 'is' function) and there's no way to represent them in the current human readable serialization format.
* **List** - CLVM lists follow the lisp convention of being either a cons pair which contains the first element on the left and the rest of the list on the right or a nil indicating end of the list/empty list. While this is in many cases a higher layer semantic convention it does factor in to how programs are executed.
* **Function** - A function in the CLVM is either a built-in opcode or a user-defined program.  User defined functions are covered in [User Defined Functions](/docs/ref/language#user-defined-functions).
* **Operator** - An opcode/string specifying a built-in function to use.
* **Program** - A CLVM object which can be executed. When a program is executed it's passed a CLVM object as parameters and returns a CLVM object. On-chain programming involves a lot of usage of self-reference and what's called eval() in other languages, which is safe in this context due to the total lack of side effects.
* **Opcodes** - The strings used for function lookup by the CLVM. Unknown opcodes either error out or return nil depending on the context, likely error out for mempool checking or local testing and return nil when validating the blockchain for consensus.
* **Tree** - A binary tree can be formed from cons pairs and atoms by allowing the right and left cells of a cons pair to hold either an atom, or a cons pair. Atoms are the leaves of the tree.
* Function Parameter - All of the values in a list except the first. In the program `(+ (q 1) (q 2))`, the quoted atoms `1` and `2` are parameters to the operator `+`
* **Treearg** - These are program arguments passed in from outside the program. They are referenced by integers. See [pathargs](/docs/ref/vm#pathargs).
* **Argument** - Outside the context of the CLVM, the term "argument" can mean "program argument" (the "argv" of the C language, for example), or "function argument", among other things. Because of this potential confusion, we avoid using the term "argument" in this document. The context is especially important considering the way in which CLVM programs look up their program arguments. See [pathargs](/docs/ref/vm#pathargs).

A CLVM program must have an unambigious definition and meaning, so that Chia block validation and consensus is deterministic.
Programs are treated as Merkle trees, which are uniquely identified by the hash at their root. The program hash can be used to verify that two programs are identical.

# Human readable serialization

Underlying CLVM objects contain atoms and cons pairs, but for convenience there's a human readable string format. In particular this format is what's passed in to brun. It isn't used anywhere in blockchain validation and has no impact on consensus. There are multiple ways of encoding the same CLVM object in the human readable serialization format, so going backwards to pretty print a CLVM object in this format requires guessing as to the best representation.

Atoms in the human readable representation can be represented as directly quoted strings. They can also be expressed as integers which get converted to two's complement minimal encoding length. Built-in opcodes map directly to specific strings.

Cons pairs can be represented using dot as an infix operator like so: `(3 . 4)` which corresponds to a cons box containing 3 and 4. A more common representation is for lists, which are done not using a dot and assume a nil terminator, for example `(3 4 5)` represents the same thing as `(3 . (4 . (5 . nil)))`. This can of course be used recursively as well. Note that `0`, `nil`, `false`, `''`, `q`, and `()` all get parsed to the same value.

# Program Evaluation
The semantics of the language implemented by the CLVM is similar to Lisp. A program is represented as a tree, and the root of the tree is the outermost thing getting called, with later/inner function calls embedded recursively inside of it.

Whenever a program is called it always has a context of a CLVM object which is the arguments passed in, referred to in the plural even though it's technically a single object.

If the root of the program is an atom then an argument lookup is performed and returned. Please see [treeargs](#treeargs), below.

If the the root of the program is a cons pair then a function call is made and the result of that function call is returned. The object on the left determines the function to call and the object on the right determines what arguments it gets passed.

The left object is either an atom, in which case it's treated as an opcode, or a cons pair, in which case it's an implicit eval. The quote opcode is very special in that it's recognized by the interpreter and causes whatever's on the right to not be evaluated but instead returned verbatim. All other functions get passed the results of evaluating what's on the right first. When the interpreter evaluates the right value it does so using the lisp list convention: It either encounters a nil, in which case it returns nil, in which case it returns nil, or it encounters a cons pair, in which case it returns a cons pair containing the result of a recursive call to evalute using the current argument context to the thing on the left and the result of recursing evaluation to the thing on the right.

If implicit evaluation is used then the value on the left is evaluated then it's called getting passed the value from evaluating what's on the right as context. This differs from recursive evaluation because it changes the argument context instead of that getting inherited. Note that if you want to run an argument passed in as a function you can't specify which arg at the outermost position using an atom because that will be treated as an opcode lookup but you can work around the limitation by using first on a list of length one which will treat an atom as an arg lookup during evaluation.

A compiled CLVM program can be thought of as a binary tree.

Here is an example of a function invocation ("function call"). `(+ (q 1) (q 2))`. The function is the opcode `+`, a function built in to the clvm runtime.


`(+ (q 1) (q 2))`

```
      [ ]
     /   \
    +     [ ]
         /   \
      [q, 1]  [ ]
             /   \
         [q, 2]  nil
```

After First Reduction

`(+ 1 2)`

```
      [ ]
     /   \
    +     [ ]
         /   \
        1     [ ]
             /   \
            2    nil
```

After Second Reduction, and function application

```
3
```

Program trees are evaluated by first evaluating the leaf nodes, then their parents, recursively.
Arguments to functions are always evaluated before the function is called.
CLVM objects need not be evaluated in a specific order, but all child nodes must be evaluated before their parent.

If the item is a quoted value, the value is returned.

If the item is an atom, the atom is looked up as a Treearg.

If the item to be evaluated is a list, all of the parameters are evaluated and then the evaluatted parameters are passed to the function

All arguments of a function are evaluated before being passed to that function.

When a list is evaluated, if the first item in the list is an atom, it is interpreted as a function. Function definitions are covered in [functions](/docs/ref/language#functions)

## Types

The two types of CLVM Object are *cons pair* and *atom*. They can be distinguished by the **listp** opcode. Atoms in the CLVM language do not carry other type information. However, similarly to the machine code instructions for a CPU, functions interpret atoms in specific predictible ways. Thus, each function imposes a type for each of its arguments.

The value of an atom - its length, and the values of its bytes - are always well defined. Because atoms have no type information, the meaning of an atom is determined when a function is applied to it. For example, an atom may be parsed as an integer, concatenated to another atom, and then treated as a BLS point.

### Byte Array

The atom is treated as an array of bytes, with a length. No specific semantics are assumed, except as specified in the instruction.

### Unsigned Integer

An unsigned integer of arbitrary length. If more bits are required to perform an operation with atoms of different length, the atom is virtually extended with zero bytes to the left.

### Signed Integer

The byte array behaves as a two's complement signed integer. The most significant bit denotes a negative number. The underlying representation matters, because the individual bytes are viewable through other operations.

This type has the potential for multiple representations to be treated as the same value. For example, 0xFF and 0xFFFF both encode `-1`. Integer arithmetic operations that treat returned atoms as signed integers will return the minimal representation for negative numbers, eg. `0xFF` for `-1`

These integers are byte-aligned. For example, `0xFFF` is interpreted as `4095`.

### BLS Point

This type represents a point on an elliptic curve over finite field described [here](https://electriccoin.co/blog/new-snark-curve/).


## Treeargs : Program Arguments, and Argument Lookup

For a program running on a deterministic machine to have different behaviours, it must be able to take take have different starting states. The starting state for a CLVM program is the program argument list - the treearg.

When an unquoted integer is evaluated, it is replaced with the corresponding value/CLVM Object from the program Treearg.

As an improvement over walking the argument tree via calls to **first** and **rest**, arguments are indexed from the argument list by their argument number. This number is derived by translating the path of left and right nodes through the argument tree into a series of ones and zeros corresponding to the path to the CLVM Object in the argument tree, starting at the least significant bit. The number of the root of the argument tree is `1` (`0` will also evaluate to the root of the argtree).

We treat an s-expression as a binary tree, where leaf nodes are atoms, and cons pairs
are nodes with two children. We then number the paths as follows:

```
              1
             / \
            /   \
           /     \
          /       \
         /         \
        /           \
       2             3
      / \           / \
     /   \         /   \
    4      6      5     7
   / \    / \    / \   / \
  8   12 10  14 9  13 11  15

etc.
```

This quirky numbering makes the implementation simple.
It starts at the argument passed in, and if the index is 1 it returns args directly otherwise
it uses the lest significant bit to decide whether to recurse left or right and and right
shifts the index one bit.

See the implementation [here](https://github.com/Chia-Network/clvm_tools/blob/master/clvm_tools/NodePath.py)

## Quoting

In most programming languages, evaluating a literal returns the evaluated value itself.
In CLVM, the meaning of an atom at evaluation time is a reference to a value in the argument tree.

Therefore, when you intend to write:

`(+ 1 2)` => `3`

You must instead write:
`(+ (q 1) (q 2))` => `3`

nil is self-quoting.

### Compilation: Atom Syntax

Although there is only one underlying representation of an atom, different syntaxes are recognized during compile time, and those atom syntaxes are interpreted differently during the translation from program text to CLVM Objects.

Nil, decimal zero and the empty string all evaluate to the same atom.

`(q ())` => `()`

`(q 0)` => `()`

`(q "")` => `()`

which is not the same as a sigle zero byte.

`(q 0x0)` => `0x00`

#### Equivalence of Strings, symbols, hex strings, and numbers

`"A"` is the same atom as `A`

```
(q "A") => 65
(q A) => 65
(q 65) => 65
(q 0x41) => 65

```

However, the same is not true for Built-ins.
`"q"` is not the same as `q`
```
(q q) => 1
(q "q") => 113
```


## Errors

While running a clvm program, checks are made to ensure the CLVM does not enter an undefined state. When a program violates one of these runtime checks, it is said to have caused an error.

TODO We need the full list of errors.

* First element in an evaluated list is not a valid function. Example: `("hello" (q 1))` => `FAIL: unimplemented operator "hello"`
* Wrong number of arguments. Example: `(lognot (q 1) (q 2))` => `FAIL: lognot requires 1 arg`
* Program evaluation exceeds max cost see [Costs](/docs/ref/opcodes#costs)
* Too many allocations have been performed

An error will cause the program to abort.

# Operator Summary

## The built-in opcodes

Opcodes are functions built in to the CLVM. They are available to any running program.

## List Operators

**c** *cons* `(c A B)` takes exactly two operands and returns a cons pair with the two objects in it (A in the left, B in the right)

Example: `'(c (q "A") (q ()))'` => `(65)`

**f** *first* `(f X)` takes exactly one operand which must be a cons pair, and returns the left half

**r** *rest* `(r X)` takes exactly one operand which must be a cons pair, and returns the right half

**l** *listp* `(l X)` takes exactly one operand and returns `()` if it is an atom or `1` if it is a cons pair. In contrast to most other lisps, nil is not a list in CLVM.

## Control Flow
**i** *if* `(i A B C)` takes exactly three operands `A`, `B`, `C`. If `A` is `()`, return `C`. Otherwise, return `B`. Both B and C are evaluated before *if* is evaluated.

**x** *raise* `(x X Y ...)` takes an arbitrary number of arguments (even zero). Immediately fail, with the argument list passed up into the (python) exception. No other CLVM instructions are run after this instruction is evaluated.

**=** *equal* `(= A B)` returns 1 if `A` and `B` are both atoms and both equal. Otherwise `()`. Do not use this to test if two programs are identical. Use **sha256tree**. Nil tests equal to zero, but nil is not equal to a single zero byte.

**not** *not* `(not A)` returns 1 if `A` is `()`, otherwise returns 0.

**>** *greater than* `(> A B)` returns 1 if `A` and `B` are both atoms and A is greater than B, interpreting both as two's complement signed integers. Otherwise `()`. `(> A B)` means `A > B` in infix syntax.

**>s** *greater than bytes* `(>s A B)` returns 1 if `A` and `B` are both atoms and A is greater than B, interpreting both as an array of unsigned bytes. Otherwise `()`. Compare to strcmp.
`(>s "a" "b")` => `()`


## Constants
**q** *quote* `(q X)` takes exactly one operand which is *not* evaluated and returns it
Example: `(q "A")` => `(65)`

## Integer Operators

The arithmetic operators `+`, `-`, `*` and `divmod` treat their arguments as signed integers.

**`+`** `(+ a0 a1 ...)` takes any number of integer operands and sums them. If given no arguments, zero is returned.

**`-`** `(- a0 a1 ...)` takes one or more integer operands and adds a0 to the negative of the rest. Giving zero arguments returns 0.

**`*`** `(* a0 a1 ...)` takes any number of integer operands and returns the product.

**divmod** `(divmod A B)` takes two integers and returns a list containing the floored quotient and the remainder

## Bit Operations

logand, logior and logxor operate on any number of arguments (See [limits](/docs/ref/limits))
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

**substr** `(substr S I1 I2)` return an atom containing bytes indexed from I1 to I2. The MSB of S is byte zero. If I1 == I2, returns nil.

```
(substr (q "clvm") (q 0) (q 4)) => clvm
(substr (q "clvm") (q 2) (q 4)) => vm
(substr (q "clvm") (q 4) (q 4)) => ()

(substr (q "clvm") (q 4) (q 5)) => FAIL
(substr (q "clvm") (q 1) (q 0)) => FAIL
(substr (q "clvm") (q -1) (q 4)) => FAIL
```

**strlen** `(strlen S)` return the number of bytes in S.

```
(strlen (q "clvm")) => 4
(strlen (q "0x0")) => 1
(strlen (q "")) => ()
(strlen (q 0)) => ()
(strlen (q ())) => ()
(strlen ()) => ()
```

**concat** `(concat A ...)` return the concatenation of any number of atoms.

Example: `(concat (q "Hello") (q " ") (q "world"))` => `"Hello world"`

## Streaming Operators
**sha256**
  `(sha256 A ...)` returns the sha256 hash (as a 32-byte blob) of the bytes of its parameters.

```
(sha256 (q "clvm")) => 0xcf3eafb281c0e0e49e19c18b06939a6f7f128595289b08f60c68cef7c0e00b81
(sha256 (q "cl") (q "vm")) => 0xcf3eafb281c0e0e49e19c18b06939a6f7f128595289b08f60c68cef7c0e00b81
```

## ECDSA operators
**point_add**
  `(point_add a0 a1 ...)` takes an arbitrary number of bls12_381 points and adds them

Example: `(point_add (pubkey_for_exp (q 1)) (pubkey_for_exp (q 2)))` => `0x89ece308f9d1f0131765212deca99697b112d61f9be9a5f1f3780a51335b3ff981747a0b2ca2179b96d2c0c9024e5224`

**pubkey_for_exp**
  `(pubkey_for_exp A)` turns the integer A into a bls12_381 point

`(pubkey_for_exp (q 1))` => `0x97f1d3a73197d7942695638c4fa9ac0fc3688c4f9774b905a14e3a3f171bac586c55e83ff97a1aeffb3af00adb22c6bb`

## Arithmetic and Bitwise Identities

Some operators have a special value that is returned when they are called with zero arguments. This value is the identity of that function.

Operator | Identity
---|---
`+`| 0
`*`| 1
AND| all 1's
OR| all zeros
XOR| all zeros


## Arithmetic

### Behaviour of nil when used as an integer

When used in an integer context, nil behaves as zero.

### Behaviour of zero when used as a value that may be checked for nil

When used as a parameter that may be checked for nil, zero is interpreted as nil.

# Operator specification

All documentation in the Opcode section omits the necessary quote operator around each literal.

If a precondition is not met, it is an error. Checking argument count is covered later in the document.

Conventions used in the Operator Table
* N: the number of arguments. For `(+ (q 1) (q 2))`, N = `2`
* strlen(atom): number of bytes in an atom.
* max_arg_strlen: the length of the longest arg atom, in bytes
* result: the return value of the function

All opcodes below accept arguments as a [flat list](opcodes#definitions).

keyword|opcode|impl|funcall|args|return|preconditions|cost|Allocations
-------|------|-------------|---|---|---|---|---|---
i|0x04|op_if|(i C A B)|3|if C==nil then B else A||10|None
c|0x05|op_cons|(c A B)|2|cons pair containing [A,B]||10|1 cons
f|0x06|op_first|(f L)|1|left cell of cons pair L|L is not atom|10|None
r|0x07|op_rest|(r L)|1|right cell of cons pair L|L is not atom|10|None
l|0x08|op_listp|(l A)|1|return 1 if A is a cons pair, else nil||20|None
x|0x09|op_raise|(x ...)|>=0|stop program execution||N/A|None
=|0x0a|op_eq|(= A B)|2|if A == B then 1 else nil|A and B are atoms|len(A) + len(B)|None
sha256|0x0b|op_sha256|(sha256 ...)|>=0|return sha256 of *concat* of args|All args are atoms|2 * len(args)|Atom(32)
+|0x0c|op_add|(+ A B ...)|>=0|A + B + ...|All args are atoms|strlen(concat A B ...)) * 10|Atom(max(map(strlen, args)) + 1)
-|0x0d|op_subtract|(- A B ...)|>=0|A + B + ...|All args are atoms|strlen(concat A B ...)) * 10|Atom(max(map(strlen, args)))
`*`|0x0e|op_multiply|(* A B ...)|>=0|A * B * ...|All args are atoms|strlen(A) * strlen(B) * ... * 10
divmod|0x0f|op_divmod|(divmod A B)|2|((div A B) . (mod A B))|A and B are atoms|strlen(concat A B ...)) * 10|Atom(len(A) * len(B) * ...)
substr|0x10|op_substr|(substr S start end)|3|new atom with bytes from|<ul><li>S is atom</li><li>start <= end</li><li>start>=0</li><li>end>=0</li><li>end<=len(S)</li></ul>|1|Atom(len(S))
strlen|0x11|op_strlen|(strlen S)|1|length of atom S|S is atom|len(S)|None
point_add|0x12|op_point_add|(point_add P1 P2 ...)|>=0|Sum any number, N, of G1 Elements|P[n] are 48 bytes in length|N * 32|Atom(96)
pubkey_for_exp|0x13|op_pubkey_for_exp|(pubkey_for_exp E)|1|Get pubkey for E|E is an atom|900|Atom(96)
concat|0x14|op_concat|(concat A B ...)|>=0|Concatenate args|2 * (len(A) + len(B) + ...)| Atom(map(sum, arg_lens))
sha256tree|0x15|op_sha256tree|(sha256tree L)|1|Recursive sha256 of all leaf nodes of L|| (len_of_all_atoms*10) + (Number of CLVM Objects * 10) TODO: Check|Atom(32)
`>`|0x16|op_gr|(> A B)|2|if A > B then 1 else nil. Int conversion via Python's [int.from_bytes](https://docs.python.org/3/library/stdtypes.html#int.from_bytes)|A and B are atoms|<p style={{ color: 'red' }}>10 * max(A,B)</p>|None
`>s`|0x17|op_gr_bytes|(>s A B)|2|Unsigned greater than|A and B are atoms|<p style={{ color: 'red' }}>max(A,B)</p>|None
logand|0x18|op_logand|(logand A B ...)|>=0|Bitwise AND of args|All args are atoms|max_arg_strlen * 2|Atom(max(arg_lens))
logior|0x19|op_logior|(logior A B ...)|>=0|Bitwise OR of args|All args are atoms|max_arg_strlen * 2|Atom(max(arg_lens))
logxor|0x1a|op_logxor|(logxor A B)|2|Bitwise XOR of args. The bit is 1 if that bit is 1 in an odd number of the arguments|All args are atoms|max_arg_strlen * 2|Atom(max(arg_lens))
lognot|0x1b|op_lognot|(lognot A)|1|Flip every bit in A|A is an atom|strlen(A)*2|Atom(len(A))
ash|0x1c|op_ash|(ash A B)|2|Arithmetic shift. if B >= 0, A << B. Else A >> abs(B). Shift in 1's if right shifting a negative number|A and B are atoms|2 * (strlen(A) + strlen(result)) |Atom(len(result))
lsh|0x1d|op_lsh|(lsh A B)|2|Unsigned shift. if B >= 0, A << B. Else A >> abs(B). Shift in 0's in all cases|A and B are atoms|2 * (strlen(A) + strlen(result)) | Atom(len(result))
softfork|0x1e|op_softfork|(softfork COST)|1|See [Blockchain & Consensus](/docs/ref/consensus)|COST>=1||None

## Detailed behaviour Notes

**ash**
```
(ash (q 1) (q 1)) => 2
(ash (q 1) (q -1)) => 0
```

Consecutive right shifts of negative numbers will result in a terminal value of -1.

```
(ash -7 -1) ; -7 = . . . 111111111111111111111111111001
(ash -4 -1) ; -4 = . . . 111111111111111111111111111100
(ash -2 -1) ; -2 = . . . 111111111111111111111111111110
(ash -1 -1) ; -1 = . . . 111111111111111111111111111111
```

That is, a right shift (negative shift count) of `-1` by any amount is `-1`:
```
(ash (q -1) (q -99)) => -1
```

**lsh**

lsh behaviour from the [elisp manual](https://www.gnu.org/software/emacs/manual/pdf/elisp.pdf):

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

A left shift of an atom with the high bit set will extend the atom left, and result in an allocation

```
(lsh (q -1) (q 1)) => 0x01FE
(strlen (lsh (q -1) (q 1))) => 2


```


A left arithmetic shift will only extend the atom length when more bits are needed

```
(strlen (ash (q -1) (q 7))) => 1
(strlen (ash (q -1) (q 8))) = >2
```


```
(strlen (ash (q 255) (q 1)))
(strlen (ash (q 128) (q 1)))
(strlen (ash (q 127) (q 1)))

(strlen (lsh (q 255) (q 1)))
(strlen (lsh (q 128) (q 1)))
(strlen (lsh (q 127) (q 1)))

```


# Costs

The minimum program cost is 40. After each opcode is run, its cost is added to the total program cost. When the cost exceeds a threshold, the program is terminated, and no value is returned.


## Argument Checking: Behaviour with fewer or more args than required

Some opcodes have strict argument requirements, and others will work with more arguments than required, ignoring additional arguments (eg. listp). Opcodes taking an unlimited number of arguments have not been checked in the table below.

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
`=`|0x0a|op_eq
sha256|0x0b|op_sha256
`+`|0x0c|op_add
`-`|0x0d|op_subtract
`*`|0x0e|op_multiply
divmod|0x0f|op_divmod
substr|0x10|op_substr
strlen|0x11|op_strlen
point_add|0x12|op_point_add
pubkey_for_exp|0x13|op_pubkey_for_exp
concat|0x14|op_concat
sha256tree|0x15|op_sha256tree
`>`|0x16|op_gr
`>s`|0x17|op_gr_bytes
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
`+` | () | 0
`-` | cannot unpack non-iterable SExp object | 1
`*` | 1 | 0
divmod | FAIL: divmod requires 2 args () | 255
substr | FAIL: first of non-cons () | 255
strlen | FAIL: first of non-cons () | 255
point_add | 0xc00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000 | 0
pubkey_for_exp | FAIL: pubkey_for_exp requires 1 arg () | 255
concat | () | 0
sha256tree | FAIL: op_sha256tree expects exactly one argument () | 255
`>` | FAIL: > requires 2 args () | 255
`>s` | FAIL: >s requires 2 args () | 255
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
ASSERT_ANNOUNCEMENT | 52
ASSERT_MY_COIN_ID | 53
ASSERT_RELATIVE_TIME_EXCEEDS | 54
ASSERT_BLOCK_INDEX_EXCEEDS | 55
ASSERT_BLOCK_AGE_EXCEEDS | 56
AGG_SIG_ME | 57
ASSERT_FEE | 58
ASSERT_TIME_EXCEEDS | 59
CREATE_ANNOUNCEMENT | 60
