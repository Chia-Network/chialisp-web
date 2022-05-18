---
id: lang_reference
title: CLVM Language Reference
---

The clvm is a small, tightly defined VM that defines the semantics of CLVM programs run during Chia blockchain validation. It serves as a target language for higher level languages, especially Chialisp.


## Terminology

* **CLVM Assembly** - The textual representation of a CLVM program.
* **Chialisp** - A higher-level language, built on top of CLVM.
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

## Readable assembly format

The in-memory objects the CLVM operates on are atoms and cons pairs, but for programming convenience there is a human readable string format for input and output. This format is what is passed to the `brun` tool. This text representation of CLVM programs and data is not used anywhere in blockchain validation and has no impact on consensus. There are multiple ways of encoding the same CLVM object in the human readable serialization format, so going backwards to pretty print a CLVM object in this format requires guessing as to the best representation.

Atoms in the human readable representation can be represented as directly quoted strings. They can also be expressed as decimal integers (`100`), or hex literals (`0x64`).

Cons pairs can be represented using dot as an infix operator like so: `(3 . 4)`, which corresponds to a cons pair containing 3 and 4. A more common representation of data is lists, which are written as parentheses surrounding a space-delimited list of values.

Proper lists are built from linked cons pairs, and assume a nil terminator. For example `(3 4 5)` represents the same thing as `(3 . (4 . (5 . nil)))`.

Note that `0`, `''`, and `()` all are parsed to the same value, but 0x0 is not.

## Program Evaluation

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

The atom is an array of bytes, with a length. No specific semantics are assumed, except as specified in the instruction.

### Signed Integer

Arithmetic operations will interpret its operands as two's complement, big endian, signed integers. The most significant bit denotes a negative number. In order to represent a positive integer where the most significant bit aligns with the most significant bit in the first byte need a 0-byte prefix in order to be interpreted as positive.

Said another way, if a positive integer's first byte is >= `0x80` then it will be prepended with a `0x00`. Without that prepended byte, a positive value would appear negative in the case that the high bit is set.

e.g. `0xFF` means -1 and `0x00FF` means 255.

You are likely to encounter this when using the output of an int operation as the input of a string operation.

The integer representation matters because there are operands that treats atoms as byte arrays, e.g. sha256hash.

Since atoms are of arbitrary length, the same value can be represented by many different atoms. For example, `0xFF` and `0xFFFF` both represent `-1`. Likewise, `0x01` and `0x0001` both represent `1`.

Arithmetic operations, returning integers, always return the shortest representation for numbers. eg. `0xFF` for `-1`

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

## Operator Summary

### The built-in opcodes

Opcodes are functions built in to the CLVM. They are available to any running program.

### List Operators

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

The idea is, after a soft fork, the meaning of the arguments may change. In fact, we can hide completely new dialects of Chialisp inside here, that has new operators that calculate new things.

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

## Costs

When a CLVM program is run, a cost is attributed to it. The minimum program cost is 40. The maximum cost per block is 11 000 000 000 (11 billion). If the cost of an individual program exceeds this threshold, the program will fail. The maximum realistic size of a block is around 400 KB.

To determine the total cost of a clvm program, you can run `brun -c <clvm>`, but this doesn't include the cost of the program's size or its conditions. All of these costs will be explained in detail below.

This section begins with a breakdown of the specific cost for each operator and how to calculate costs by hand.

* [Cost tables](#cost-tables)
* [Evaluating cost for a sample brun program](#evaluating-cost-for-a-sample-brun-program)
* [Evaluating cost for a typical transaction](#evaluating-cost-for-a-typical-transaction)

Later, we'll discuss our rationale for having costs in the first place. We'll also detail the theoretical and realistic maximum cost and size per block. 

* [Minimum spec machine for farming](#minimum-spec-machine-for-farming)
* [Maximum cost per block](#maximum-cost-per-block)

### Cost tables

The costs used in Chia's consensus come from the Rust implementation of CLVM, specifically from these locations:
  * [more_ops.rs#L24](https://github.com/Chia-Network/clvm_rs/blob/main/src/more_ops.rs#L24)
  * [core_ops.rs#L7](https://github.com/Chia-Network/clvm_rs/blob/main/src/core_ops.rs#L7)
  * [run_program.rs#L11](https://github.com/Chia-Network/clvm_rs/blob/main/src/run_program.rs#L11)

We'll start with a table showing the two base costs, namely a mandatory cost and a cost per byte of memory.

| type                   | base cost   | cost per byte |
| ---------------------- | ----------- | ------------- |
| mandatory cost         | 1           | -             |
| `MALLOC_COST_PER_BYTE` | -           | 10            |

* The "mandatory cost" is charged for all operators to process data
* `MALLOC_COST_PER_BYTE` is charged for allocating new atoms, as the return value(s) from operators. Atoms 0 and 1 don't count, they are free. E.g. `(> A B)`, which returns `true` or `false`, is not charged the `MALLOC_COST_PER_BYTE`.

Next we'll show the cost of each CLVM operator, as well as the cost of the outputted conditions.

| operator            | base cost | cost per arg | cost per byte |
| ------------------- | --------- | ------------ | ------------- |
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

Next, three of CLVM's conditions also have an associated cost:

| operator            | cost    |
| ------------------- | ------- |
| `CREATE_COIN`       | 1800000 |
| `AGG_SIG_UNSAFE`    | 1200000 |
| `AGG_SIG_ME`        | 1200000 |

Finally, each byte of data that gets added to the blockchain has a cost of 12 000. Spendbundles are created using a serialized format of CLVM programs, calculated by running [opc](https://chialisp.com/docs/debugging#opd-and-opc) on the original CLVM code. Each two-digit pair of this format is equivalent to one byte on the blockchain, with a cost of 12 000.

Aside from cost, the maximum number of atoms or pairs (counted separately) in a CLVM program is 2^31 apiece. If this threshold is exceeded, the program will fail. However, this is likely a moot point because it's probably not possible to write a program with this many atoms or pairs without exceeding the maximum cost per block.

### Evaluating cost for a sample brun program

In this section, we'll show you how to calculate the cost of a simple CLVM program by hand. The program we'll use is

brun "(concat (q . `gu`) (q . `ide`))"

Where "gu" and "ide" are quoted, so that they are interpreted as values rather than programs.

The `brun` command takes two arguments, a program and its "environment". If no environment is specified on the command line (as is the case in this example), we use an empty environment, "()".

At the lowest level of the interpreter, we interpret an atom as one of three things:

1. A quote (cost 20)
2. A path lookup into the environment (base cost of 44 + 4 for each bit)
  > Note that there might be a penalty cost. See the [Penalty cost](#penalty-cost) section for more info
3. An operator (mandatory cost of 1 + the cost of executing the operator)

Next we can calculate the cost of the program, "(concat (q . `gu`) (q . `ide`))":
* `concat` eval (mandatory cost):   1
* `q . gu` (cost of a quote):      20 
* `q . ide` (cost of a quote):     20 
* `concat` (execution cost):      142
* `concat` arg cost ("gu"):       135 
* `concat` arg cost ("ide"):      135
* `concat` two bytes ("gu"):        6 (2 bytes * 3 cost per byte)
* `concat` three bytes ("ide"):     9 (3 bytes * 3 cost per byte)
* `malloc` five bytes ("guide"):   50 (5 bytes * 10 malloc cost per byte)

Program cost = 518

This is confirmed by running `brun` from the command line:

```powershell
PS C:\Users\User> brun -c --quiet '(concat (q . gu) (q . ide))'
cost = 518
```

### Penalty cost

At first glance, it might appear that the following two programs should have the same cost. However, the cost of the second program is 10 higher than that of the first:

```
$ brun -c '(+ (q . 126) (q . 1))' 
cost = 796
127
```

```
$ brun -c '(+ (q . 127) (q . 1))'
cost = 806
128
```

The reason these programs cost different is that the latter needs a leading zero in its result. When dumping the hexadecimal representation of the output, this becomes clearer:

```
$ brun -d -c '(+ (q . 126) (q . 1))'
cost = 796
7f
```
```
$ brun -d -c '(+ (q . 127) (q . 1))'
cost = 806
820080
```

### Evaluating cost for a typical transaction

Now let's look at a real-world example of calculating cost. The _standard_ transaction is one that adds and removes one or more vanilla XCH coins from the coin set. While it is possible to both add and remove exactly one coin in a standard transaction, a more _typical_ transaction would involve adding and removing two coins, giving the transaction two inputs and two outputs.

This would happen if Alice spent two coins to send money to Bob, and received one coin back as change. We'll detail two techniques to calculate the cost of this transaction.

### Obtaining transaction info from a wallet

This technique is straightforward, but it will only give a rough estimate of cost. We'll look at a more accurate technique in the next section.

The example we'll use is a transaction where Alice sent money to Bob and received change. The commands will be performed on Alice's computer. First, we'll run `get_transactions` to obtain the transaction ID:

```bash
(venv) chia-blockchain $ chia wallet get_transactions
Transaction cd4e915dc8fd6eb932b5e1be67088eb9af48a560a6ddbc55c53ee44eaf191ee0
Status: Confirmed
Amount sent: 1.01 XCH
To address: xch1989s7f4dn43963gsdqus7z6ydm7upuqzfae4ftts7rm80k4848csewg085
Created at: 2022-03-20 06:03:09
```

Next, we'll get more info by running `get_transaction`, entering the ID we just obtained:

```bash
(venv) chia-blockchain $ chia wallet get_transaction -tx
cd4e915dc8fd6eb932b5e1be67088eb9af48a560a6ddbc55c53ee44eaf191ee0 -v
{'additions': [{ 'amount': 1010000000000,
                 'parent_coin_info': '0x484ed352cd7e7e396bdbee72302e40653c2d880bd134d29f75f07ffffe4c7a0f',
                 'puzzle_hash': '0x29cb0f26ad9d625d451068390f0b446efdc0f0024f7354ad70f0f677daa7a9f1'
               },
               { 'amount': 936839958396,
                 'parent_coin_info': '0x484ed352cd7e7e396bdbee72302e40653c2d880bd134d29f75f07ffffe4c7a0f',
                 'puzzle_hash': '0xf56f5af041272572fe528e794c364fbe2be444ab77de62a1796772804a4c9fef'
               }],
               'amount': 1010000000000,
               'confirmed': True,
               'confirmed_at_height': 1720943,
               'created_at_time': 1647781389,
               'fee_amount': 0,
               'memos': [],
               'name': '0xcd4e915dc8fd6eb932b5e1be67088eb9af48a560a6ddbc55c53ee44eaf191ee0',
'removals':   [{ 'amount': 946839958396,
                 'parent_coin_info': '0x98706c3a489574a9f32f339662f339b7ba3c9dce1da4feb301432aa60216635e',
                 'puzzle_hash': '0xe415c314693b27c0cb949c27cb244a8ed9def528346f37491393fdd49e24bcd5'
               },
               { 'amount': 1000000000000,
                 'parent_coin_info': '0x98706c3a489574a9f32f339662f339b7ba3c9dce1da4feb301432aa60216635e',
                'puzzle_hash': '0xd8af3cb1130f6d7e4011c6fa85779c0cfddb1a594cdd170d1dfc8aeb5f3c93fe'
               }],
'spend_bundle': { 'aggregated_signature': '0xa35c58c6687e79a91e2c409451e620dc26f286637be916910d02253fa0fb401a77d0f3c2b0ff72565fae5c9e66affbe70833f7bbae6b2c3508404f6058ec82d94f9738d23a4b23748d97d71e532a7d7c6390f21fe82dc5f1c0c75d90150d952f',
                  'coin_spends': [{
                     'coin': {
                        'amount': 946839958396,
                        'parent_coin_info': '0x98706c3a489574a9f32f339662f339b7ba3c9dce1da4feb301432aa60216635e',
                        'puzzle_hash': '0xe415c314693b27c0cb949c27cb244a8ed9def528346f37491393fdd49e24bcd5'
                     },
                        'puzzle_reveal': '0xff02ffff01ff02ffff01ff02ffff03ff0bffff01ff02ffff03ffff09ff05ffff1dff0bffff1effff0bff0bffff02ff06ffff04ff02ffff04ff17ff8080808080808080ffff01ff02ff17ff2f80ffff01ff088080ff0180ffff01ff04ffff04ff04ffff04ff05ffff04ffff02ff06ffff04ff02ffff04ff17ff80808080ff80808080ffff02ff17ff2f808080ff0180ffff04ffff01ff32ff02ffff03ffff07ff0580ffff01ff0bffff0102ffff02ff06ffff04ff02ffff04ff09ff80808080ffff02ff06ffff04ff02ffff04ff0dff8080808080ffff01ff0bffff0101ff058080ff0180ff018080ffff04ffff01b09496e8abd4a5b09f10b71e43b779f7ed8d5c1c92e3c5a6b70cd78bc2fb32347cc5fdca3f6acafb143f185029cd422010ff018080',
                        'solution': '0xff80ffff01ffff33ffa029cb0f26ad9d625d451068390f0b446efdc0f0024f7354ad70f0f677daa7a9f1ff8600eb28b0f40080ffff33ffa0f56f5af041272572fe528e794c364fbe2be444ab77de62a1796772804a4c9fefff8600da20034f7c80ffff3cffa048c2db108c24bf3192913b6cd5bca66688a9b2fc0e1821e306f7b01848a7b24d8080ff8080'
                  },
                  {
                     'coin': {
                        'amount': 1000000000000,
                        'parent_coin_info': '0x98706c3a489574a9f32f339662f339b7ba3c9dce1da4feb301432aa60216635e',
                        'puzzle_hash': '0xd8af3cb1130f6d7e4011c6fa85779c0cfddb1a594cdd170d1dfc8aeb5f3c93fe'
                     },
                        'puzzle_reveal': '0xff02ffff01ff02ffff01ff02ffff03ff0bffff01ff02ffff03ffff09ff05ffff1dff0bffff1effff0bff0bffff02ff06ffff04ff02ffff04ff17ff8080808080808080ffff01ff02ff17ff2f80ffff01ff088080ff0180ffff01ff04ffff04ff04ffff04ff05ffff04ffff02ff06ffff04ff02ffff04ff17ff80808080ff80808080ffff02ff17ff2f808080ff0180ffff04ffff01ff32ff02ffff03ffff07ff0580ffff01ff0bffff0102ffff02ff06ffff04ff02ffff04ff09ff80808080ffff02ff06ffff04ff02ffff04ff0dff8080808080ffff01ff0bffff0101ff058080ff0180ff018080ffff04ffff01b0848f09f98800442737684dd76071f25a0bd100b51e727aabafeddb062dbc3d2b3ac64bc87f084a6d16e4e89e1417de14ff018080',
                        'solution': '0xff80ffff01ffff3dffa023f61666150d2a467ee7b81a77954c93255d65c0c43108f1bb14ac420fd59c428080ff8080'
                  }]},
}
```

The `additions` and `removals` sections contain two coins apiece. Before the transaction, Alice had two coins in her wallet, one worth 1 XCH, and one worth 0.946839958396 XCH. The amount sent was 1.01 XCH, which was greater than the value of either of Alice's coins. The wallet therefore automatically selected both coins to be sent, for a total of 1.946839958396 XCH. A new coin worth 0.936839958396 XCH was created in Alice's wallet as "change". 

To recap, before the transaction:
* Alice had two coins, worth 1 XCH and 0.946839958396 XCH
* Bob had zero coins
* The total value was 1.946839958396 XCH

After the transaction:
* Alice had one coin worth 0.936839958396 XCH
* Bob had one coin worth 1.01 XCH
* The total value was 1.946839958396 XCH (same as before the transaction)

Back to the original question: what was the CLVM cost of this transaction? One way to find out is by creating a spend bundle based on the output of the `get_transaction` command, and inspecting it using `cdv`.

  > NOTE: You'll need to run `pip install chia-dev-tools` in order to use the `cdv` command.

```bash 
(venv) chia-blockchain $ cdv inspect spendbundles spend.json -ec
...
Cost: 17187295
```

The cost was 17 187 295. Note that this command is simulating a small block that contains only the single spendbundle. In reality, this spendbundle would be aggregated into a larger block, possibly with 999 similar transactions. Therefore, this cost is only an estimation. However, for many applications, this simple technique will be sufficient.

As for fee calculations, if your transaction makes it into the mempool, then it will be prioritized (using mojos per cost as a metric) against all other transactions in the mempool. If the mempool is full, however, your transaction's fee will need to be at least 5 mojos per cost in order to kick another transaction out of the mempool. Therefore, in order to increase the likelihood of your transaction making it into the mempool right away, we recommend that you include a fee of at least five mojos per cost with every transaction.

In this case, the fee to reach the 5 mojos per cost threshold is `5 * 17 187 295 = 85 936 475 mojos`. However, because the cost is just an estimate, and generally speaking, you might not want to calculate the cost of every transaction before it is run, it's a good idea to round the fee up to 100 million mojos.

### Obtaining transaction info using RPC and brun

`brun -c` will give the actual cost of a program, but it is still necessary to calculate some costs manually, as we'll explain in this section.

First, obtain the same info as before, this time using RPC commands to get the record of the coin you want to examine:

```bash
(venv) chia-blockchain $ cdv rpc coinrecords --by id 0x484ed352cd7e7e396bdbee72302e40653c2d880bd134d29f75f07ffffe4c7a0f
[
    {
        "coin": {
            "amount": 946839958396,
            "parent_coin_info": "0x98706c3a489574a9f32f339662f339b7ba3c9dce1da4feb301432aa60216635e",
            "puzzle_hash": "0xe415c314693b27c0cb949c27cb244a8ed9def528346f37491393fdd49e24bcd5"
        },
        "coinbase": false,
        "confirmed_block_index": 1720835,
        "spent": true,
        "spent_block_index": 1720943,
        "timestamp": 1647780998
    }
]
```

This coin was spent in block 1720943. Using this info, we can get the original puzzle and solution used in the coin spend, in serialized form:

```bash
(venv) chia-blockchain $ cdv rpc blockspends -id 484ed352cd7e7e396bdbee72302e40653c2d880bd134d29f75f07ffffe4c7a0f -h 1720943
{
    "coin": {
        "amount": 946839958396,
        "parent_coin_info": "0x98706c3a489574a9f32f339662f339b7ba3c9dce1da4feb301432aa60216635e",
        "puzzle_hash": "0xe415c314693b27c0cb949c27cb244a8ed9def528346f37491393fdd49e24bcd5"
    },
    "puzzle_reveal": "0xff02ffff01ff02ffff01ff02ffff03ff0bffff01ff02ffff03ffff09ff05ffff1dff0bffff1effff0bff0bffff02ff06ffff04ff02ffff04ff17ff8080808080808080ffff01ff02ff17ff2f80ffff01ff088080ff0180ffff01ff04ffff04ff04ffff04ff05ffff04ffff02ff06ffff04ff02ffff04ff17ff80808080ff80808080ffff02ff17ff2f808080ff0180ffff04ffff01ff32ff02ffff03ffff07ff0580ffff01ff0bffff0102ffff02ff06ffff04ff02ffff04ff09ff80808080ffff02ff06ffff04ff02ffff04ff0dff8080808080ffff01ff0bffff0101ff058080ff0180ff018080ffff04ffff01b09496e8abd4a5b09f10b71e43b779f7ed8d5c1c92e3c5a6b70cd78bc2fb32347cc5fdca3f6acafb143f185029cd422010ff018080",
    "solution": "0xff80ffff01ffff33ffa029cb0f26ad9d625d451068390f0b446efdc0f0024f7354ad70f0f677daa7a9f1ff8600eb28b0f40080ffff33ffa0f56f5af041272572fe528e794c364fbe2be444ab77de62a1796772804a4c9fefff8600da20034f7c80ffff3cffa048c2db108c24bf3192913b6cd5bca66688a9b2fc0e1821e306f7b01848a7b24d8080ff8080"
}
```

Next, use the `opd` command to deserialize the puzzle and solution to human-readable clvm:

```bash
(venv) chia-blockchain $ opd ff02ffff01ff02ffff01ff02ffff03ff0bffff01ff02ffff03ffff09ff05ffff1dff0bffff1effff0bff0bffff02ff06ffff04ff02ffff04ff17ff8080808080808080ffff01ff02ff17ff2f80ffff01ff088080ff0180ffff01ff04ffff04ff04ffff04ff05ffff04ffff02ff06ffff04ff02ffff04ff17ff80808080ff80808080ffff02ff17ff2f808080ff0180ffff04ffff01ff32ff02ffff03ffff07ff0580ffff01ff0bffff0102ffff02ff06ffff04ff02ffff04ff09ff80808080ffff02ff06ffff04ff02ffff04ff0dff8080808080ffff01ff0bffff0101ff058080ff0180ff018080ffff04ffff01b09496e8abd4a5b09f10b71e43b779f7ed8d5c1c92e3c5a6b70cd78bc2fb32347cc5fdca3f6acafb143f185029cd422010ff018080
(a (q 2 (q 2 (i 11 (q 2 (i (= 5 (point_add 11 (pubkey_for_exp (sha256 11 (a 6 (c 2 (c 23 ()))))))) (q 2 23 47) (q 8)) 1) (q 4 (c 4 (c 5 (c (a 6 (c 2 (c 23 ()))) ()))) (a 23 47))) 1) (c (q 50 2 (i (l 5) (q 11 (q . 2) (a 6 (c 2 (c 9 ()))) (a 6 (c 2 (c 13 ())))) (q 11 (q . 1) 5)) 1) 1)) (c (q . 0x9496e8abd4a5b09f10b71e43b779f7ed8d5c1c92e3c5a6b70cd78bc2fb32347cc5fdca3f6acafb143f185029cd422010) 1))
```

```bash
(venv) chia-blockchain $ opd ff80ffff01ffff33ffa029cb0f26ad9d625d451068390f0b446efdc0f0024f7354ad70f0f677daa7a9f1ff8600eb28b0f40080ffff33ffa0f56f5af041272572fe528e794c364fbe2be444ab77de62a1796772804a4c9fefff8600da20034f7c80ffff3cffa048c2db108c24bf3192913b6cd5bca66688a9b2fc0e1821e306f7b01848a7b24d8080ff8080
(() (q (51 0x29cb0f26ad9d625d451068390f0b446efdc0f0024f7354ad70f0f677daa7a9f1 0x00eb28b0f400) (51 0xf56f5af041272572fe528e794c364fbe2be444ab77de62a1796772804a4c9fef 0x00da20034f7c) (60 0x48c2db108c24bf3192913b6cd5bca66688a9b2fc0e1821e306f7b01848a7b24d)) ())
```

To obtain the cost of this program, use `brun -c`:

```bash
(venv) chia-blockchain $ brun -c '(a (q 2 (q 2 (i 11 (q 2 (i (= 5 (point_add 11 (pubkey_for_exp (sha256 11 (a 6 (c 2 (c 23 ()))))))) (q 2 23 47) (q 8)) 1) (q 4 (c 4 (c 5 (c (a 6 (c 2 (c 23 ()))) ()))) (a 23 47))) 1) (c (q 50 2 (i (l 5) (q 11 (q . 2) (a 6 (c 2 (c 9 ()))) (a 6 (c 2 (c 13 ())))) (q 11 (q . 1) 5)) 1) 1)) (c (q . 0x9496e8abd4a5b09f10b71e43b779f7ed8d5c1c92e3c5a6b70cd78bc2fb32347cc5fdca3f6acafb143f185029cd422010) 1))' '(() (q (51 0x29cb0f26ad9d625d451068390f0b446efdc0f0024f7354ad70f0f677daa7a9f1 0x00eb28b0f400) (51 0xf56f5af041272572fe528e794c364fbe2be444ab77de62a1796772804a4c9fef 0x00da20034f7c) (60 0x48c2db108c24bf3192913b6cd5bca66688a9b2fc0e1821e306f7b01848a7b24d)) ())'
cost = 39652
((50 0x9496e8abd4a5b09f10b71e43b779f7ed8d5c1c92e3c5a6b70cd78bc2fb32347cc5fdca3f6acafb143f185029cd422010 0x87f20f182aa0b488027d678fd1cdb63f9fb583347cbf2744d2e7f5ae5ab49102) (51 0x29cb0f26ad9d625d451068390f0b446efdc0f0024f7354ad70f0f677daa7a9f1 0x00eb28b0f400) (51 0xf56f5af041272572fe528e794c364fbe2be444ab77de62a1796772804a4c9fef 0x00da20034f7c) (60 0x48c2db108c24bf3192913b6cd5bca66688a9b2fc0e1821e306f7b01848a7b24d))
```

The cost of this program was 39 652. However, there are three important things to note here:
1. This only gives the program cost of executing the CLVM code. It does not include the per-byte cost of 12 000. Let's calculate that cost now.
  * The serialized puzzle (before running `opd`) is 582 hexadecimal digits, or 291 bytes (2 digits per byte)
  * The serialized solution is 278 digits, or 139 bytes
  * The sum of these two is 430 bytes. With a cost of 12 000 per byte, the program's size cost is 5 160 000
2. This cost does not include the CLVM conditions, specifically condition 50 (AGG_SIG_ME) and 51 (CREATE_COIN)
  * AGG_SIG_ME cost is 1 200 000
  * CREATE_COIN cost is 1 800 000 per coin, and there were two coins
  * The total condition cost is 4 800 000
3. Another coin was spent in the same transaction, which is not included here

Let's run the same commands to figure out the cost of the other coin spend:

```bash
(venv) chia-blockchain $ cdv rpc coinrecords --by id 0x45174eedbd162f2baeb37d7360c14727782d8f58519f878665efcdaef62a407a
[
    {
        "coin": {
            "amount": 1000000000000,
            "parent_coin_info": "0x98706c3a489574a9f32f339662f339b7ba3c9dce1da4feb301432aa60216635e",
            "puzzle_hash": "0xd8af3cb1130f6d7e4011c6fa85779c0cfddb1a594cdd170d1dfc8aeb5f3c93fe"
        },
        "coinbase": false,
        "confirmed_block_index": 1720835,
        "spent": true,
        "spent_block_index": 1720943,
        "timestamp": 1647780998
    }
]
```

```bash
(venv) chia-blockchain $ cdv rpc blockspends -id 45174eedbd162f2baeb37d7360c14727782d8f58519f878665efcdaef62a407a -h 1720943
{
    "coin": {
        "amount": 1000000000000,
        "parent_coin_info": "0x98706c3a489574a9f32f339662f339b7ba3c9dce1da4feb301432aa60216635e",
        "puzzle_hash": "0xd8af3cb1130f6d7e4011c6fa85779c0cfddb1a594cdd170d1dfc8aeb5f3c93fe"
    },
    "puzzle_reveal": "0xff02ffff01ff02ffff01ff02ffff03ff0bffff01ff02ffff03ffff09ff05ffff1dff0bffff1effff0bff0bffff02ff06ffff04ff02ffff04ff17ff8080808080808080ffff01ff02ff17ff2f80ffff01ff088080ff0180ffff01ff04ffff04ff04ffff04ff05ffff04ffff02ff06ffff04ff02ffff04ff17ff80808080ff80808080ffff02ff17ff2f808080ff0180ffff04ffff01ff32ff02ffff03ffff07ff0580ffff01ff0bffff0102ffff02ff06ffff04ff02ffff04ff09ff80808080ffff02ff06ffff04ff02ffff04ff0dff8080808080ffff01ff0bffff0101ff058080ff0180ff018080ffff04ffff01b0848f09f98800442737684dd76071f25a0bd100b51e727aabafeddb062dbc3d2b3ac64bc87f084a6d16e4e89e1417de14ff018080",
    "solution": "0xff80ffff01ffff3dffa023f61666150d2a467ee7b81a77954c93255d65c0c43108f1bb14ac420fd59c428080ff8080"
}
```

```bash
(venv) chia-blockchain $ opd ff02ffff01ff02ffff01ff02ffff03ff0bffff01ff02ffff03ffff09ff05ffff1dff0bffff1effff0bff0bffff02ff06ffff04ff02ffff04ff17ff8080808080808080ffff01ff02ff17ff2f80ffff01ff088080ff0180ffff01ff04ffff04ff04ffff04ff05ffff04ffff02ff06ffff04ff02ffff04ff17ff80808080ff80808080ffff02ff17ff2f808080ff0180ffff04ffff01ff32ff02ffff03ffff07ff0580ffff01ff0bffff0102ffff02ff06ffff04ff02ffff04ff09ff80808080ffff02ff06ffff04ff02ffff04ff0dff8080808080ffff01ff0bffff0101ff058080ff0180ff018080ffff04ffff01b0848f09f98800442737684dd76071f25a0bd100b51e727aabafeddb062dbc3d2b3ac64bc87f084a6d16e4e89e1417de14ff018080
(a (q 2 (q 2 (i 11 (q 2 (i (= 5 (point_add 11 (pubkey_for_exp (sha256 11 (a 6 (c 2 (c 23 ()))))))) (q 2 23 47) (q 8)) 1) (q 4 (c 4 (c 5 (c (a 6 (c 2 (c 23 ()))) ()))) (a 23 47))) 1) (c (q 50 2 (i (l 5) (q 11 (q . 2) (a 6 (c 2 (c 9 ()))) (a 6 (c 2 (c 13 ())))) (q 11 (q . 1) 5)) 1) 1)) (c (q . 0x848f09f98800442737684dd76071f25a0bd100b51e727aabafeddb062dbc3d2b3ac64bc87f084a6d16e4e89e1417de14) 1))
```

```bash
(venv) chia-blockchain $ opd ff80ffff01ffff3dffa023f61666150d2a467ee7b81a77954c93255d65c0c43108f1bb14ac420fd59c428080ff8080
(() (q (61 0x23f61666150d2a467ee7b81a77954c93255d65c0c43108f1bb14ac420fd59c42)) ())
```

```bash
(venv) chia-blockchain $ brun -c '(a (q 2 (q 2 (i 11 (q 2 (i (= 5 (point_add 11 (pubkey_for_exp (sha256 11 (a 6 (c 2 (c 23 ()))))))) (q 2 23 47) (q 8)) 1) (q 4 (c 4 (c 5 (c (a 6 (c 2 (c 23 ()))) ()))) (a 23 47))) 1) (c (q 50 2 (i (l 5) (q 11 (q . 2) (a 6 (c 2 (c 9 ()))) (a 6 (c 2 (c 13 ())))) (q 11 (q . 1) 5)) 1) 1)) (c (q . 0x848f09f98800442737684dd76071f25a0bd100b51e727aabafeddb062dbc3d2b3ac64bc87f084a6d16e4e89e1417de14) 1))' '(() (q (61 0x23f61666150d2a467ee7b81a77954c93255d65c0c43108f1bb14ac420fd59c42)) ())'
cost = 15032
((50 0x848f09f98800442737684dd76071f25a0bd100b51e727aabafeddb062dbc3d2b3ac64bc87f084a6d16e4e89e1417de14 0x03db13c4e422e5eea98463c02b2c15994b620e0a45aa2db6f7785d3ba28f46cf) (61 0x23f61666150d2a467ee7b81a77954c93255d65c0c43108f1bb14ac420fd59c42))
```

The CLVM cost for this coin spend was 15 032.

We still need to calculate this program's size cost.
  * The serialized puzzle is 582 hexadecimal digits, or 291 bytes
  * The serialized solution is 94 digits, or 47 bytes
  * The sum of these two is 338 bytes. With a cost of 12 000 per byte, the program's size cost is 4 056 000

Let's add up the costs to get the total cost for this transaction:
* First coin
    * CLVM:             39 652
    * AGG_SIG_ME:    1 200 000
    * CREATE_COIN 1: 1 800 000
    * CREATE_COIN 2: 1 800 000 
    * Program size:  5 160 000
* Second coin
    * CLVM:             15 032
    * AGG_SIG_ME:    1 200 000
    * Program size:  4 056 000
* Total:            15 270 684

This is an accurate assessment of the cost for this particular transaction.

Just like before, we have to multiply the cost by five to obtain the minimum fee. In this case, the result is `5 * 15 270 684 = 76 353 420 mojos`. If this specific transaction had included a fee of at least that many mojos, it would've kicked a transaction with a lower fee out of the mempool in order to be included.

Now that you know _what_ the cost of each CLVM operator is, as well as _how_ to calculate costs, we'll discuss _why_ we decided to structure costs in this manner. It all begins with the minimum spec machine for farming, the humble Raspberry Pi 4.

## Minimum spec machine for farming

The minimum spec machine to run a full node is the Raspberry Pi 4. How do we know if this machine can stay synced? The worst case scenario occurs when multiple full transaction blocks are created with the minimum amount of time between them. This will temporarily put maximum load on the system. If the Pi can stay synced in this scenario, then it easily should be able to stay synced under normal load.

The first question we must answer is how much time elapses between transaction blocks. Chia's consensus mandates that at least three signage points must be reached before infusion_iterations may occur, so the minimum time between blocks is

`3 signage points * signage point time`, which equals

`3 signage points * (600 seconds per sub-slot / 64 signage points per sub-slot)`, which equals

`3 signage points * 9.375 seconds per signage point`, which equals

`28.125 seconds`

  > Note: The **average** time between transaction blocks is [51.95 seconds](https://docs.chia.net/docs/03consensus/foliage#transaction-block-time). The lower a given time interval between transaction blocks (down to 28.125 seconds), the lower the probability of a transaction block being created in that time interval.

A transaction block is considered "full" when it contains 2000 outputs. For this document, we'll assume this translates to 1000 vanilla transactions, each with two inputs and two outputs. This would give the network an average of 19.25 (1000/51.95) transactions per second.

  > Note: A transaction with only one input and one output is also possible. In theory, a block could therefore hold up to 2000 transactions, in which case the network would process an average of 38.5 (2000/51.95) transactions per second.

With this goal in mind, Chia has created a **generator program** that processes 2000 compressed inputs and outputs. This program simulates a "full block".

To calculate the total amount of time for a Raspberry Pi 4 to process a full block, we must take into account three factors:
* The time required to run the generator program (2000 inputs and outputs)
  * The Raspberry Pi 4 accomplishes this in 5.2 seconds
* The time required to validate 2000 public keys
  * 2.2 seconds
* The time required to validate 2000 aggregate signatures
  * 10.63 seconds

Therefore, the total amount of time required for a Raspberry Pi 4 to process a full block is 5.2 + 2.2 + 10.63 = 18.03 seconds. This is 10.095 seconds faster than the minimum time between blocks, and 33.92 seconds faster than the average. When considering other factors such as network latency and time required to fetch a full proof ([640 ms on a slow HDD](https://docs.chia.net/docs/03consensus/proof-of-space#farming)), this still allows plenty of leeway for a Raspberry Pi 4 to stay synced and collect farming rewards.

## Minimum spec machine for syncing

As a benchmark, we use the Raspberry Pi 4, Chia's minimum spec machine for farming. A Raspberry Pi 4 has four cores, so it can validate a pre-existing block in 18.03 / 4 = 4.5075 seconds, which is around 11.5 times the average real-time rate of 51.95 seconds. Even in the worst-case scenario where every transaction block is full, the Pi can sync faster than the chain is being created.

## Maximum cost per block

Now that we've established that a Raspberry Pi 4 can, indeed, sync and farm, even when every transaction block is full, we'll calculate the maximum cost per block. 

There are three categories that go into determining a block's maximum cost:
1. Generator program cost, which is split into two parts
    * Execution cost
    * Signature validation cost
2. Generator program size (each byte has a cost)
3. Generator program coins (each new coin has a cost)

In the case of calculating the maximum cost, these three categories are to be given equal weight. We'll go through each of the categories individually.

#### Generator program execution cost

(This is the first half of 1, above.)

An Intel Macbook Pro was used as a reference platform to determine baseline costs based on CPU usage. The costs were then hand-tweaked for various reasons:

* To ascribe additional cost to operations that allocate memory, i.e. the operand per-byte cost was inflated. This additional cost is called `MALLOC_PER_BYTE_COST` and amounts to 10 cost per byte.
* The especially CPU intensive BLS operations (`point_add` and `pubkey_for_exp`) had their cost inflated to not differ too much from the Raspberry Pi 4.
* Some operations that do not allocate memory and end up being common in relatively simple programs had their cost deflated. Specifically, `if`, `cons`, `listp`, `first`, and `rest`.

The result is that the generator program has an execution cost of 1 317 054 957.

#### Generator program signature validation cost

(This is the second half of 1, above.)

The signature validation cost is based on computation time. BLS operations involve public key and aggregate signature validation, which are multiplied by the number of outputs.

* Time per public key validation: 0.179370 ms
* Time per aggregate signature validation: 0.972140 ms
* Total time for 2000 key and signature validations: (0.179370 + 0.972140) * 2000 = 2303.02 ms

Each 1 cost is designed to require 1 nanosecond, so we need to multiply the result by 1 million (ns/ms).
* Cost for the generator program's BLS operations: `2303.02 * 1 000 000 = 2 303 020 000`.

Using this info, we can also calculate the cost of each `AGG_SIG_UNSAFE` and `AGG_SIG_ME` condition in all CLVM programs:
* Cost per BLS condition: `(0.179370 + 0.972140) * 1 000 000 = 1 151 510`. We round this number up to 1 200 000.

### Generator program cost

(This is the total cost of 1, above.)

Taking the previous two calculations into account, the total cost to execute and run the BLS operations of the generator program is: `1 317 054 957 + 2 303 020 000 = 3 620 074 957`.

### Generator program size

(This is the cost of 2, above.)

We know that 1, 2, and 3 all will be assigned equal maximum costs, which we've already established is 3 620 074 957. This is the size-based cost of the generator program.

The generator program itself is 298 249 bytes. Each byte, therefore has a cost of `3 620 074 957 / 298 249 = 12 137.76`. We round this number to 12 000 per byte. This is the cost per bye of all CLVM programs.

### Generator program coins

(This is the cost of 3, above.)

Just like the previous calculation, the total cost of the generator program's coins is 3 620 074 957. The generator program creates 2000 coins, so the cost per `CREATE_COIN` in all CLVM programs is `3 620 074 957 / 2000 = 1 810 037.4785`. We round this number to 1 800 000.

### Maximum cost per block

To calculate the maximum cost per block, we simply add the generator program's execution, size, and coin costs:

Theoretical maximum cost per block: `3 620 074 957 + 3 620 074 957 + 3 620 074 957 = 10 860 224 871` We round this number to 11 000 000 000.

### Maximum block size

The theoretical maximum size of a single block is `maximum cost per block / cost per byte`, or `11 000 000 000 / 12 000 = 916 667 bytes`. However, this number ignores the costs of all operators. If you want a CLVM program to do anything useful, the maximum size would be closer to 400 KB.

Even this number is not realistic because it assumes that a single program will take up an entire block. The maximum number of vanilla transactions (with two outputs) per block is 1000. Therefore, if there is fee pressure on Chia's blockchain, a 400 KB program would need to include a larger fee than the top 1000 vanilla transactions in the mempool -- combined -- in order for a farmer to include it.

