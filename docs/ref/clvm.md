---
id: clvm
title: CLVM Reference Manual
sidebar_label: CLVM Reference
---

The clvm is a small, tightly defined VM that defines the semantics of CLVM programs run during Chia blockchain validation. It serves as a target language for higher level languages, especially ChiaLisp.


## Definitions

* **CLVM Assembly** - The textual representation of a CLVM program.
* **CLVM Bytecode** - The serialized form of a CLVM program.
* **ChiaLisp** - A higher-level language, built on top of CLVM.
* **CLVM Object** - The underlying data type in the CLVM. An atom or a cons pair.
* **Atom** - The datatype for values in the CLVM. Atoms are immutable byte arrays. Atoms are untyped and are used to encode all strings, integers, and keys. The only things in the CLVM which are not atoms are cons pairs. Atom properties are length, and the bytes in the atom.
* **cons pair** - An immutable ordered pair of references to other CLVM objects. One of two data types in the CLVM. The syntax for a cons pair is a dotted pair. Also called `cons cell` or `cons box`.
* **slot** - One of the cells in a cons box. right or left. Accessed with `f` (first) or `r` (rest).
* **nil** - nil is the special value represented by the zero length byte array. This value represents zero, the empty string, false, and the empty list. Nil is represented in CLVM assembly as `()`, `0`, or `''`.
* **Value** - We use value to mean an abstract value like `1` (an integer), `0xCAFE` (a byte string), `"hello"` (a string) or `(sha256 (q . "hello"))` (a program). Values are represented by CLVM Objects.
* **List** - CLVM lists follow the lisp convention of being a cons pair containing the first list element in the left slot and the rest of the list in the right slot.
* **Proper List** - A "proper" list is a chain of cons boxes, each containing a value in the left slot. Each right slot contains either another cons box, or nil, if it is the last pair.
* **Function** - A function in the CLVM is either a built-in opcode or a user-defined program.
* **Operator** - An opcode/string specifying a built-in function to use.
* **Program** - A CLVM object which can be executed.
* **Opcodes** - An atom corresponding to a reserved keyword. When a list is evaluated with a pre-defined opcode in the first position, the code for that opcode is run.
* **Keyword** - A reserved word in the CLVM assembly language syntax. The strings used for function lookup by the CLVM.
* **Tree** - A binary tree can be formed from cons pairs and atoms by allowing the right and left cells of a cons pair to hold either an atom, or a cons pair. Atoms are the leaves of the tree.
* **Function Parameter** - When a list is evaluated, the first argument is the function, and the other items are parameters. In the program `(+ (q . 1) (q . 2))`, the quoted atoms `1` and `2` are parameters to the operator `+`
* **Treearg** - These are program arguments passed in from outside the program. They are referenced by integers that describe a path in the argument tree.
* **Argument** - Outside the context of the CLVM, the term "argument" can mean "program argument" (the "argv" of the C language, for example), or "function argument", among other things. Because of this potential confusion, we avoid using the term "argument" in this document. The context is especially important considering the way in which CLVM programs look up their program arguments.

A CLVM program must have an unambiguous definition and meaning, so that Chia block validation and consensus is deterministic. Programs are treated as Merkle trees, uniquely identified by the hash at their root. The program hash can be used to verify that two programs are identical.

# Readable assembly format

The in-memory objects the CLVM operates on are atoms and cons pairs, but for programming convenience there is a human readable string format for input and output. This format is what is passed to the `brun` tool. This text representation of CLVM programs and data is not used anywhere in blockchain validation and has no impact on consensus. There are multiple ways of encoding the same CLVM object in the human readable serialization format, so going backwards to pretty print a CLVM object in this format requires guessing as to the best representation.

Atoms in the human readable representation can be represented as directly quoted strings. They can also be expressed as decimal integers (`100`), or hex literals (`0x64`).

Cons pairs can be represented using dot as an infix operator like so: `(3 . 4)`, which corresponds to a cons pair containing 3 and 4. A more common representation of data is lists, which are written as parentheses surrounding a space-delimited list of values.

Proper lists are built from linked cons pairs, and assume a nil terminator. For example `(3 4 5)` represents the same thing as `(3 . (4 . (5 . nil)))`.

Note that `0`, `''`, and `()` all are parsed to the same value, but 0x0 is not.

# Program Evaluation

The syntax of CLVM assembly is similar to Lisp. It is a parenthesized [prefix notation](https://en.wikipedia.org/wiki/Polish_notation) that puts the operator before the arguments when reading left to right.

The semantics of the language implemented by the CLVM is similar to Lisp. A program is represented as a binary tree. The root of the tree is the least nested object in the program tree, with inner function calls embedded recursively inside of it. In the following example, the outer parentheses represent the cons box that is the root of the tree `(+ (q . 1) (q . 2))`.

Whenever a program is called it always has a context, or environment, which is a CLVM object. This object holds all the arguments passed into the program. This is the second command line argument to `run` and `brun`. The default environment is nil.

If the program is an atom then an argument lookup is performed, and the argument is returned. Please see [treeargs](#treeargs), below.

If the the root of the program is a cons pair then all of the parameters (contained in the right slot of the cons box) are evaluated, then a function call is made and the result of that function call is returned. The object on the left determines the function to call and the object on the right determines what arguments it is passed.

If the object in the leftmost position of a list being executed is an operator in a list, the operator is called without first evaluating the parameters.

If the CLVM is running in "strict mode", an unknown opcode will abort the program. This is the mode CLVM is run in during mempool checking and block validation. During developer testing, the CLVM may be run in "non-strict" mode, which allows for unknown opcodes to be used and treated as no-ops.

The quote opcode is special. When it is recognized by the interpreter, it causes whatever is on the right to be returned unevaluated. All other functions are passed the results of evaluating what's on the right first.

A compiled CLVM program can be thought of as a binary tree.

Here is an example of a function invocation (or "function call"). `(+ (q . 1) (q . 2))`. The function is the opcode `+`, a function built-in to the clvm runtime.


`(+ (q . 1) (q . 2))`

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

After Second Reduction, and `+` function application

```
3
```

Program trees are evaluated by first evaluating the leaf nodes, then their parents, recursively.
Arguments to functions are always evaluated before the function is called.
CLVM objects need not be evaluated in a specific order, but all child nodes must be evaluated before their parent.

If the item is a quoted value, the value is returned.

If the item is an atom, the atom is looked up as a Treearg.

If the item to be evaluated is a list, all of the parameters are evaluated and then the evaluated parameters are passed to the function

All arguments of a function are evaluated before being passed to that function.

## Types

The two types of CLVM Object are *cons pair* and *atom*. They can be distinguished by the **listp** opcode. Atoms in the CLVM language do not carry other type information. However, similarly to the machine code instructions for a CPU, functions interpret atoms in specific predictable ways. Thus, each function imposes a type for each of its arguments.

The value of an atom - its length, and the values of its bytes - are always well defined and unambiguous. Because atoms have no type information, the meaning of an atom is determined when a function is applied to it. In the following example, an atom that was read in as a string is treated as an integer.

`brun '(+ (q . "helo") (q . 1))'` => `"help"`

And in this example, an atom that was read in as an integer is appended to a string.

`brun '(concat (q . "hello") (q . 49))'` => `"hello1"`


### Atoms as Byte Arrays

The atom is treated as an array of bytes, with a length. No specific semantics are assumed, except as specified in the instruction.

### Unsigned Integer

An unsigned integer of arbitrary length. If more bits are required to perform an operation with atoms of different length, the atom is virtually extended with zero bytes to the left.

### Signed Integer

The byte array behaves as a two's complement signed integer. The most significant bit denotes a negative number. The underlying representation matters, because the individual bytes are viewable through other operations.

This type has the potential for multiple representations to be treated as the same value. For example, 0xFF and 0xFFFF both encode `-1`. Integer arithmetic operations that treat returned atoms as signed integers will return the minimal representation for negative numbers, eg. `0xFF` for `-1`

These integers are byte-aligned. For example, `0xFFF` is interpreted as the two bytes `0x0F`,`0xFF`, with value `4095`.

This can also cause unexpected representations of numbers when they are expected to be interpreted as strings..

If a positive integer's first byte is >= `0x80` (the most significant bit is 1) then it will be prepended with a `0x00` when the operator output type is a signed integer. Without that prepended byte, a positive value would appear negative in the case that the high bit is set.
You are likely to encounter this when using the output of an int operation as the input of a string operation.

### BLS Point

This type represents a point on an elliptic curve over finite field described [here](https://electriccoin.co/blog/new-snark-curve/).

These values are opaque values, 48 bytes in length. The outputs of `pubkey_for_exp` are BLS points. The inputs and outputs of `point_add` are BLS points.


## Treeargs : Program Arguments, and Argument Lookup

For a program running on a deterministic machine to have different behaviours, it must be able to have different starting states. The starting state for a CLVM program is the program argument list - the treearg.

When an unquoted integer is evaluated, it is replaced with the corresponding value/CLVM Object from the program Treearg. If the argument is not found, `nil` is returned.

As an improvement over walking the argument tree via calls to **first** and **rest**, arguments are referenced from the argument list by their argument number. This number is derived by translating a path of left and right cons slots followed from the root of the argument tree to that CLVM Object, into a series of ones and zeros. The number representing the path is read starting at the least significant bit. The number of the root of the argument tree is `1`. When the path is complete, a final `1` is appended to the msb of the number.

### Illustration of argument numbering

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

Numbering starts at the root of the tree. The path index is set to 1, which represents the entire argument tree.
Bits are appended to the right of the path index as we descend, 0 for left, and 1 for right.

See the implementation [here](https://github.com/Chia-Network/clvm_tools/blob/main/clvm_tools/NodePath.py)

## Quoting

In most programming languages, evaluating a literal returns the value itself.
In CLVM, the meaning of an atom at evaluation time (at any position of the list except the first), is a reference to a value in the argument tree. xxx

Therefore, when you intend to write:

`(+ 1 2)` => `3`

You must instead write:
`(+ (q . 1) (q . 2))` => `3`

nil is self-quoting.

### Compilation: Atom Syntax

Although there is only one underlying representation of an atom, different syntaxes are recognized during compile time, and those atom syntaxes are interpreted differently during the translation from program text to CLVM Objects.

Nil, decimal zero and the empty string all evaluate to the same atom.

`(q . ())` => `()`

`(q . 0)` => `()`

`(q . "")` => `()`

which is not the same as a single zero byte.

`(q . 0x0)` => `0x00`

#### Equivalence of Strings, symbols, hex strings, and numbers

`"A"` is the same atom as `A`

```chialisp
(q . "A") => 65
(q . A) => 65
(q . 65) => 65
(q . 0x41) => 65
```

However, the same is not true for Built-ins.
`"q"` is not the same as `q`
```chialisp
(q . q) => 1
(q . "q") => 113
```

## Operators are atoms too..



When you write a program, the first argument in the list is interpreted as an operator.
However, this operator is also stored as an unsigned int.
This can lead to ambiguity and confusing outputs:

`(r (q . (1 2 3)))` => `(a 3)`

Since `2` is at the beginning of the list, `brun` assumes it is the operator and looks up its corresponding representation, which in this case is `a`.
It is the correct output of the program, it is just displayed in an unexpected way.

## Errors

While running a clvm program, checks are made to ensure the CLVM does not enter an undefined state. When a program violates one of these runtime checks, it is said to have caused an error.

* First element in an evaluated list is not a valid function. Example: `("hello" (q . 1))` => `FAIL: unimplemented operator "hello"`
* Wrong number of arguments. Example: `(lognot (q . 1) (q . 2))` => `FAIL: lognot requires 1 arg`
* Program evaluation exceeds max cost see [Costs](/docs/ref/clvm#costs)
* Too many allocations have been performed
* Argument checking e.g. negative index `run '(substr "abc" -1 -)'` FAIL: invalid indices for substr ("abc" -1 17)

An error will cause the program to abort.

# Operator Summary

## The built-in opcodes

Opcodes are functions built in to the CLVM. They are available to any running program.

## List Operators

**c** *cons* `(c A B)` takes exactly two operands and returns a cons pair with the two objects in it (A in the left, B in the right)

Example: `'(c (q . "A") (q . ()))'` => `(65)`

**f** *first* `(f X)` takes exactly one operand which must be a cons pair, and returns the left half

**r** *rest* `(r X)` takes exactly one operand which must be a cons pair, and returns the right half

**l** *listp* `(l X)` takes exactly one operand and returns `()` if it is an atom or `1` if it is a cons pair. In contrast to most other lisps, nil is not a list in CLVM.

## Control Flow
**a** *apply* `(a P A)` run the program P with the arguments A. Note that this executes P in a new environment. Using integers to reference values in the solution will reference values in A.

**i** *if* `(i A B C)` takes exactly three operands `A`, `B`, `C`. If `A` is `()`, return `C`. Otherwise, return `B`. Both B and C are evaluated before *if* is evaluated.

**x** *raise exception* `(x X Y ...)` takes an arbitrary number of arguments (even zero). Immediately fail, with the argument list passed up into the (python) exception. No other CLVM instructions are run after this instruction is evaluated.

**=** *equal* `(= A B)` returns 1 if `A` and `B` are both atoms and both equal. Otherwise `()`. Do not use this to test if two programs are identical. That is determined by their tree hash. Nil tests equal to zero, but nil is not equal to a single zero byte.

**>** *greater than* `(> A B)` returns 1 if `A` and `B` are both atoms and A is greater than B, interpreting both as two's complement signed integers. Otherwise `()`. `(> A B)` means `A > B` in infix syntax.

**>s** *greater than bytes* `(>s A B)` returns 1 if `A` and `B` are both atoms and A is greater than B, interpreting both as an array of unsigned bytes. Otherwise `()`. Compare to strcmp.
`(>s "a" "b")` => `()`

**not** `(not A)` returns 1 if `A` evaluates to `()`. Otherwise, returns `()`.

**all** `(all A B ...)` takes an arbitrary number of arguments (even zero). Returns `()` if any of the arguments evaluate to `()`. Otherwise, returns 1.

**any** `(any A B ...)` takes an arbitrary number of arguments (even zero). Returns 1 if any of the arguments evaluate to something other than `()`. Otherwise, returns `()`.


## Constants

**q** *quote* The form `(q . X)` when evaluated returns X, which is *not* evaluated.
Example: `(q . "A")` => `65`

## Integer Operators

The arithmetic operators `+`, `-`, `*`, `/` and `divmod` treat their arguments as signed integers.

**`+`** `(+ a0 a1 ...)` takes any number of integer operands and sums them. If given no arguments, zero is returned.

**`-`** `(- a0 a1 ...)` takes one or more integer operands and adds a0 to the negative of the rest. Giving zero arguments returns 0.

**`*`** `(* a0 a1 ...)` takes any number of integer operands and returns the product.

**`/`** `(/ A B)` divides two integers and returns the floored quotient


### Rounding

```chialisp
(/ 1  2) => ()
(/ 2  2) => 1
(/ 4  2) => 2
```

### Division of negative numbers

The treatment of negative dividend and divisors is as follows:
```chialisp
(/ -1 1) => -1
(/ 1 -1) => -1
(/ -1 -1) =>  1
```

### Flooring of negative numbers
Note that a division with a remainder always rounds towards negative infinity, not toward zero.
```chialisp
(/ -3 2) => -2
(/ 3 2) => 1
```
This means that `-a / b` is not always equal to `-(a / b)`

**divmod** `(divmod A B)` takes two integers and returns a cons-box containing the floored quotient and the remainder.
```chialisp
(divmod 10 3)
   => (3 . 1)
```

## Bit Operations

`logand`, `logior` and `logxor` operate on any number of arguments
nil as an argument to these functions is treated as a zero.
Fail if either A or B is not an atom.
The shorter atom is sign-extended to equal length as the longer atom.

The `logand`, `logior` and `logxor` accept 0 or more parameters.
There is an implicit *identity* argument, which is the value all parameters will apply to.
The identity will just be returned in case 0 arguments are given.

**logand** `(logand A B ...)` bitwise **AND** of one or more atoms. Identity is `-1`.

```chialisp
(logand -128 0x7fffff)
   => 0x7fff80
```

The first argument is `0x80` (since it's Two's complement). It is negative, it will be sign-extended with ones.
Once sign-extended, the computation becomes `0xffff80` AND `0x7fffff` = `0x7fff80`.

**logior** `(logior A B ...)` bitwise logical **OR** of one or more atoms. Identity is `0`.

```chialisp
(logior -128 0x7fffff)
   => -1
```

Sign extending the first argument becomes `0xffff80`, ORing that with `0x7fffff` becomes `0xffffff` which is -1 in Two's complement.
Note that the resulting atom will use the minimal encoding of `-1`, i.e. `0xff`.

**logxor** `(logxor A B ...)` bitwise **XOR** of any number of atoms. Identity is `0`.

```chialisp
(logxor -128 0x7fffff)
   => 0x80007f
```

Sign extending the first argument becomes `0xffff80`, XORing that with `0x7fffff` becomes `0x80007f`.
This is a negative number (in Two's complement) and it's also the minimal representation of it.

**lognot** `(lognot A)` bitwise **NOT** of A. All bits are inverted.

```chialisp
(lognot ()) => -1
(lognot 1) => -2
(lognot (lognot 17)) => 17
```

## Shifts

There are two variants of bit shift operators.
Arithmetic shift (`ash`) and Logical shift (`lsh`). Both can be used to shift both left and right, the direction is determined by the sign of the *count* argument.
A positive *count* shifts left, a negative *count* shifts right.
For both **ash** and **lsh**, if |*count*| exceeds 65535, the operation fails.
The resulting value is treated as a signed integer, and any redundant leading zero-bytes or `0xff` bytes are stripped.

**ash** `(ash A count)` if *count* is positive, return *A* shifted left *count* bits, else returns *A* shifted right by |*count*| bits, sign extended.

Arithmetic shift treats the value to be shifted (*A*) as a signed integer, and sign extends the left-most bits when when shifting right.

When shifting left, any new bytes added to the left side of the value are also filled with the sign-extended bit. For example:

```chialisp
(ash -1 8) ; -1 = . . . 11111111
   => -256 ; -256 = . . 1111111100000000
```

A arithmetic left shift will only extend the atom length when more bits are needed

```chialisp
(strlen (ash -1 7))
   => 1
(strlen (ash -1 8))
   => 2
(strlen (ash 255 1))
  => 2
(strlen (ash 128 1))
  => 2
(strlen (ash 127 1))
  => 2
```

Consecutive right shifts of negative numbers will result in a terminal value of -1.

```chialisp
(ash -7 -1) ; -7 = . . . 11111001
   => -4
(ash -4 -1) ; -4 = . . . 11111100
   => -2
(ash -2 -1) ; -2 = . . . 11111110
   => -1
(ash -1 -1) ; -1 = . . . 11111111
   => -1
```

A right shift of `-1` by any amount is still `-1`:
```chialisp
(ash -1 -99)
   => -1
```

**lsh** `(lsh A count)` if *count* is positive, return *A* shifted left *count* bits, else returns *A* shifted right |*count*| bits, adding zero bits on the left.

Logical shift treats the value to be shifted as an unsigned integer, and does not sign extend on right shift.

```chialisp
(lsh -7 -1) ; -7 = . . . 11111001
   => 124   ;    = . . . 01111100

(lsh -5 -2) ; -5 = . . . 11111011
   => 62    ;    = . . . 00111110
```

A left shift of an atom with the high bit set will extend the atom left, and result in an allocation.

```chialisp
(lsh -1 1) ; -1 = . . . 11111111
   => 510  ;    = . . . 0000000111111110
(strlen (lsh -1 1))
   => 2
(strlen (lsh 255 1))
  => 2
(strlen (lsh 128 1))
  => 2
(strlen (lsh 127 1))
  => 2
```

## Strings

**substr** `(substr S I1 I2)` return an atom containing the bytes in range \[`I1`, `I2`). Index 0 refers to the first byte of the string `S`. `I2` must be greater than or equal to `I1`. Both `I1` and `I2` must be greater than or equal to 0, and less than or equal to one past the end of the string `S`.

The third parameter to `substr` is optional. If omitted, the range \[`I1`, `(strlen S)`) is returned.

```chialisp
(substr "clvm" 0 4) => "clvm"
(substr "clvm" 2 4) => 30317 ; = "vm"
(substr "clvm" 4 4) => ()

(substr "clvm" 1) => "lvm"

(substr "clvm" 4 5) => FAIL
(substr "clvm" 1 0) => FAIL
(substr "clvm" -1 4) => FAIL
```

**strlen** `(strlen S)` return the number of bytes in `S`.

```chialisp
(strlen "clvm") => 4
(strlen "0x0") => 3
(strlen 0x0) => 1
(strlen "") => ()
(strlen 0) => ()
(strlen ()) => ()
(strlen ()) => ()
```

**concat** `(concat A ...)` return the concatenation of any number of atoms.

Example:

```chialisp
(concat "Hello" " " "world")
   => "Hello world"
```

## Streaming Operators
**sha256**
  `(sha256 A ...)` returns the sha256 hash (as a 32-byte blob) of the bytes of its parameters.

```chialisp
(sha256 "clvm")
   => 0xcf3eafb281c0e0e49e19c18b06939a6f7f128595289b08f60c68cef7c0e00b81
(sha256 "cl" "vm")
   => 0xcf3eafb281c0e0e49e19c18b06939a6f7f128595289b08f60c68cef7c0e00b81
```

## BLS12-381 operators

`point_add` and `pubkey_for_exp` operate on G1 points of the BLS12-381 curve. These are represented as 48 bytes == 384 bits.

```chialisp
(strlen (pubkey_for_exp 1))
   => 48
```

**point_add**
  `(point_add a0 a1 ...)` takes an arbitrary number of [BLS12-381](https://electriccoin.co/blog/new-snark-curve/) G1 points and adds them.

Example:
```chialisp
(point_add (pubkey_for_exp 1) (pubkey_for_exp 2))
   => 0x89ece308f9d1f0131765212deca99697b112d61f9be9a5f1f3780a51335b3ff981747a0b2ca2179b96d2c0c9024e5224
```

**pubkey_for_exp**
  `(pubkey_for_exp A)` turns the integer A into a BLS12-381 point on G1.

```chialisp
(pubkey_for_exp 1)
   => 0x97f1d3a73197d7942695638c4fa9ac0fc3688c4f9774b905a14e3a3f171bac586c55e83ff97a1aeffb3af00adb22c6bb
```

## softfork

The `softfork` operator takes at least one parameter cost. So `(softfork cost arg_1 ... arg_n)`.

At the moment, `softfork` always returns `0` (aka `()` or nil), and takes `cost` amount of cost.

At first glance, it seems pretty useless since it doesn't do anything, and just wastes cost doing it.

The idea is, after a soft fork, the meaning of the arguments may change. In fact, we can hide completely new dialects of ChiaLisp inside here, that has new operators that calculate new things.

For example, suppose we want to add secp256k1 operators like `+s` for adding two points on this ECDSA curve for bitcoin compatibility. We can't just do this in vanilla clvm because that would make a program `(+s p1 p2)` return different values before and after the soft fork. So instead we hide it under `softfork`.

`(mod (cost p1 p2 p3 p4) (softfork cost 1 (assert (= (+s p1 p2) (+s p3 p4)))))`

Pre-softfork, this always passes and returns `()` at a cost of `COST` (plus a bit of overhead).

Post-softfork, this also returns `()` at a cost of `COST`... but may also fail if `p1 + p2 ≠ p3 + p4`! We can't export the sum outside the `softfork` boundary, but we can calculate the sum and compare it to another thing inside.

One more thing -- we take the cost of running the program inside the `softfork` boundary and ensure it exactly matches `COST`, and raise an exception if it's wrong. That way, the program really does have the same cost pre and post-softfork (or it fails post-softfork).

## Arithmetic and Bitwise Identities

Some operators have a special value that is returned when they are called with zero arguments. This value is the identity of that function. For example, calling the operator `+` with zero arguments will return `0`:

`(+)` => `0`

Operator | Identity
---|---
`+`| 0
`-`| 0
`*`| 1
logand| all 1's
logior| all zeros
logxor| all zeros

Note that `/`, `divmod`, and `lognot` do not have an identity value. Calling them with zero arguments is an error.

## Arithmetic

### Behaviour of nil when used as an integer

When used in an integer context, nil behaves as zero.

### Behaviour of zero when used as a value that may be checked for nil

When used as a parameter that may be checked for nil, zero is interpreted as nil.

# Costs

When a CLVM program is run, a cost is attributed to it. The minimum program cost is 40. The maximum cost per block is 11,000,000,000. If the cost of an individual program exceeds this threshold, the program will be terminated and no value will be returned.

To determine the total cost of a clvm program, you can run `brun -c <clvm>`.

This section will explain how the minimum and maximum costs were derived, the maximum size in KB of a CLVM program, the cost of each individual CLVM operator, and how to calculate the total cost of a small sample program.

Before we can get into those details, it's important to outline the rationale for having costs in the first place. We'll begin with the lowest common denominator in Chia farming: the humble Raspberry Pi 4.

## Lowest common denominator to stay synced

The minimum spec machine to run a full node is the Raspberry Pi 4. How do we know if this machine can stay synced? The worst case scenario occurs when multiple full transaction blocks are created with the minimum amount of time between them. This will temporarily put maximum load on the system. If the Pi can stay synced in this scenario, then it easily should be able to stay synced under normal load.

The first question we must answer is how much time elapses between transaction blocks. Chia's consensus mandates that at least three signage points must be reached before infusion_iterations may occur, so the minimum time between blocks is

`3 signage points * signage point time`, which equals

`3 signage points * (600 seconds per sub-slot / 64 signage points per sub-slot)`, which equals

`3 signage points * 9.375 seconds per signage point`, which equals

`28.125 seconds`

  > Note: The **average** time between transaction blocks is [51.95 seconds](https://docs.chia.net/docs/03consensus/foliage#transaction-block-time). The lower a given time interval between transaction blocks (down to 28.125 seconds), the lower the probability of a transaction block being created in that time interval.

A transaction block is considered "full" when it contains 2000 outputs. For this document, we'll assume this translates to 1000 vanilla transactions, each with two inputs and two outputs. This would give the network an average of 19.25 (1000/51.95) transactions per second.

  > Note: A transaction with only one input and one output is also possible. In theory, a block could therefore hold up to 2000 transactions, in which case the network would process an average of 38.5 (2000/51.95) transactions per second.

With this goal in mind, Chia has created a generator program that processes 2000 compressed inputs and outputs. This program simulates a "full block".

To calculate the total amount of time for a Raspberry Pi 4 to process a full block, we must take into account three factors:
* The time required to run the generator program (2000 inputs and outputs): 5.2 seconds
* The time required to validate 2000 public keys: 2.2 seconds
* The time required to validate 2000 aggregate signatures: 10.63 seconds

Therefore, the total amount of time required for a Raspbery Pi 4 to process a full block is 5.2 + 2.2 + 10.63 = 18.03 seconds. This is 10.095 seconds faster than the minimum time between blocks, and 33.92 seconds faster than the average. When considering other factors such as network latency and time required to fetch a full proof ([640 ms on a slow HDD](https://docs.chia.net/docs/03consensus/proof-of-space#farming)), this leaves plenty of leeway for a Raspberry Pi 4 to stay synced and collect farming rewards.

## Can a Raspberry Pi 4 sync from genesis?

A Raspberry Pi 4 has four cores, so it can validate a pre-existing block in 18.03 / 4 = 4.5075 seconds, which is around 11.5 times the real-time rate of 51.95 seconds. Even in the worst-case scenario where every transaction block is full, the Pi can sync faster than the chain is being created.

## Calculating the maximum cost per block

Now that we've established that a Raspberry Pi 4 can, indeed, sync and farm, even when every transaction block is full, we'll calculate the maximum cost per block. 

There are three categories that go into determining a block's maximum cost:
1. Generator program cost (each executed operator, as well as each AGGSIG condition, has a cost)
2. Generator program size (each byte has a cost)
3. Generator program coins (each new coin has a cost)

In the case of calculating the maximum cost, these three categories are to be given equal weight. We'll go through each of the categories individually.

**Generator program execution cost**

(This is the first half of 1, above.)

An Intel Macbook Pro was used as a reference platform to determine baseline costs based on CPU usage. The costs were then hand-tweaked for various reasons:

* To ascribe additional cost to operations that allocate memory, i.e. the operand per-byte cost was inflated. This additional cost is called `MALLOC_PER_BYTE_COST` and amounts to 10 cost per byte.
* The especially CPU intensive BLS operations (`point_add` and `pubkey_for_exp`) had their cost inflated to not differ too much from the Raspberry Pi 4.
* Some operations that do not allocate memory and end up being common in relatively simple programs had their cost deflated. Specifically, `if`, `cons`, `listp`, `first`, and `rest`.

The result is that the generator program has an execution cost of 1,317,054,957.

**Generator program signature validation cost**

(This is the second half of 1, above.)

The signature validation cost is based on computation time. BLS operations involve public key and aggregate signature validation, which are multiplied by the number of outputs.

* Time per public key validation: 0.179370 ms
* Time per aggregate signature validation: 0.972140 ms
* Total time for 2000 key and signature validations: (0.179370 + 0.972140) * 2000 = 2303.02 ms

Each 1 cost is designed to require 1 nanosecond, so we need to multiply the result by 1 million (ms/ns).
* Cost for the generator program's BLS operations: `2303.02 * 1,000,000 = 2,303,020,000`.

Using this info, we can also calculate the cost of each `AGG_SIG_UNSAFE` and `AGG_SIG_ME` condition in all CLVM programs:
* Cost per BLS condition: `(0.179370 + 0.972140) * 1,000,000 = 1,151,510`. We roud this number up to 1,200,000.

### Generator program cost

(This is the total cost of 1, above.)

Taking the previous two calculations into account, the total cost to execute and run the BLS operations of the generator program is: `1,317,054,957 + 2,303,020,000 = 3,620,074,957`.

### Generator program size

(This is the cost of 2, above.)

We know that 1, 2, and 3 all will be assigned equal maximum costs, which we've already established is 3,620,074,957. This is the size-based cost of the generator program.

The generator program itself is 298,249 bytes. Each byte, therefore has a cost of `3,620,074,957 / 298,249 = 12,137.76`. We round this number to 12,000 per byte. This is the cost per bye of all CLVM programs.

### Generator program coins

(This is the cost of 3, above.)

Just like the previous calculation, the total cost of the generator program's coins is 3,620,074,957. The generator program creates 2000 coins, so the cost per `CREATE_COIN` in all CLVM programs is `3,620,074,957 / 2000 = 1,810,037.4785`. We round this number to 1,800,000.

### Maximum cost per block

To calculate the maximum cost per block, we simply add the generator program's execution, size, and coin costs:

Theoretical maximum cost per block: `3,620,074,957 + 3,620,074,957 + 3,620,074,957 = 10,860,224,871` We round this number to 11,000,000,000.

### Maximum block size

The theoretical maximum size of a single block is `maximum cost per block / cost per byte`, or `11,000,000,000 / 12,000 = 916,667 bytes`. However, this number ignores the costs of all operators. If you want a CLVM program to do anything useful, the maximum size would be closer to 400 KB.

Even this number is not realistic because it assumes that a single program will take up an entire block. The maximum number of vanilla transactions (with two outputs) per block is 1000. Therefore, if there is fee pressure on Chia's blockchain, a 400 KB program would need to include a larger fee than the top 1000 vanilla transactions in the mempool -- combined -- in order for a farmer to include it.

### Cost tables

The following table shows the two costs that must be applied to all operators, namely a mandatory cost and a cost per byte of memory.

| type                   | base cost   | cost per byte |
| ---------------------- | ----------- | ------------- |
| mandatory cost         | 1           | -             |
| `MALLOC_COST_PER_BYTE` | -           | 10            |

The following table shows the cost of each CLVM operator, as well as the cost of the outputted conditions.

| operator            | base cost | cost per arg | cost per byte |
| ------------------- | --------- | ------------ | ------------- |
|                     |           |              |               |
| `f` *first*         | 30        | -            | -             |
| `i` *if*            | 33        | -            | -             |
| `c` *cons*          | 50        | -            | -             |
| `r` *rest*          | 30        | -            | -             |
| `l` *listp*         | 19        | -            | -             |
| `q` *quote*         | 20        | -            | -             |
| `a` *apply*         | 90        | -            | -             |
| `=`                 | 117       | -            | 1             |
| `+`                 | 99        | 320          | 3             |
| `/`                 | 988       | -            | 4             |
| `*`                 | 92        | 885          | [see here](https://github.com/Chia-Network/clvm_tools/blob/main/costs/README.md#multiplication) |
| `logand`, `logior`, `logxor` | 100 | 264       | 3             |
| `lognot`            | 331       | -            | 3             |
| `>`                 | 498       | -            | 2             |
| `>s`                | 117       | -            | 1             |
| `strlen`            | 173       | -            | 1             |
| `concat`            | 142       | 135          | 3             |
| `divmod`            | 1116      | -            | 6             |
| `sha256`            | 87        | 134          | 2             |
| `ash`               | 596       | -            | 3             |
| `lsh`               | 277       | -            | 3             |
| `not`, `any`, `all` | 200       | 300          | -             |
| `point_add`         | 101094    | 1343980      | -             |
| `pubkey_for_exp`    | 1325730   | -            | 38            |
|                     |           |              |               |
| `CREATE_COIN`       | 1800000   | -            | -             |
| `AGG_SIG_UNSAFE`,`AGG_SIG_ME` | 1200000 | -    | -             |

Aside from cost, the maximum number of atoms or pairs in a CLVM program is 2^31. If this threshold is exceeded, the program will be terminated and no value will be returned.

## Evaluating cost for a sample brun program

In this section, we'll show you how to calculate the cost of a simple CLVM program by hand. The program we'll use is `brun (concat (q . fu) (q . bar))`.

The `brun` command takes two arguments, a program and its "environment". If no environment is specified on the command line, we use an empty environment, "()".

`brun` executes the program, passing in its arguments by producing a new program that looks like this:

`(a 2 3)`, where:
* `a` is the "apply" operator
* `2` and `3` refer to the left and right halves of the binary tree that represents the whole CLVM program.

At the lowest level of the interpreter, we interpret an atom as one of three things:

1. A quote (cost 20)
2. A path lookup into the environment (base cost of 44 + 4 for each bit, and some extra penalty if there are redundant leading zeros)
3. An operator (mandatory cost of 1 + the cost of executing the operator)

For the program `(a 2 3)`, the costs are as follows:
* `a` eval (mandatory cost):   1
* `a` (execution cost):       90
* `2` (env lookup base cost): 44 
* `2` (env lookup, one bit):   4
* `3` (env lookup base cost): 44 
* `3` (env lookup, one bit):   4

Cost for `(a 2 3)` = 187

Next we can calculate the cost of the original program, `(concat (q . fu) (q . bar))`:
* `concat` eval (mandatory cost):   1
* `q . fu` (cost of a quote):      20 
* `q . bar` (cost of a quote):     20 
* `concat` (execution cost):      142
* `concat` arg cost ("fu"):       135 
* `concat` arg cost ("bar"):      135
* `concat` two bytes ("fu"):        6 (2 bytes * 3 cost per byte)
* `concat` three bytes ("bar"):     9 (3 bytes * 3 cost per byte)
* `malloc` five bytes ("fubar"):   50 (5 bytes * 10 malloc cost per byte)

Cost for the original program = 518

Gross cost = Cost for `(a 2 3)` + Cost for the original program = 187 + 518 = 705

Finally, we must apply an offset to the cost. This involves subtracting the cost of the boiler-plate, as well as a constant offset of 53.

Boiler-plate:
* `a` execution cost:       90
* `concat` execution cost: 142

Boiler-plate cost = 232

Offset = constant - Boiler-plate cost = 53 - 232 = -179

(**NOTE: the actual number is -178 for some reason**)

To obtain the final cost, we add the Gross cost to the Offset: 705 + -178 = 527

This is confirmed by running `brun` from the command line:

```powershell
PS C:\Users\User> brun -c --quiet '(concat (q . fu) (q . bar))'
cost = 527
```