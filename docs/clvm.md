---
id: clvm
title: CLVM
slug: /clvm
---

import Runnable from '../src/components/Runnable.tsx';
import Program from 'clvm-lib';

Chialisp is compiled to bytecode, which is executed on the Chialisp Virtual Machine. CLVM is as minimal as possible, and doesn't have direct support for language constructs such as functions, constants, and modules.

This is all implemented by the Chialisp compiler. Although many of the operators are derived from CLVM, many things about Chialisp deviate from the bytecode it compiles to.

## Syntax

The core language syntax of CLVM is the same as Chialisp. However, it's a much more barebones language with less of the [syntactic sugar](https://en.wikipedia.org/wiki/Syntactic_sugar) you may be used to regarding the operators available. Additionally, there are differences in the interpretation of certain things such as numbers. This is explained in more detail below.

### Quoting Atoms

In Chialisp, you can write an atom directly like this:

<Runnable flavor='chialisp'>

```chialisp
"hello"
```

</Runnable>

However, CLVM will treat that as a call to access the program's environment (explained below).

As a result, all atoms that are intended to be treated as a value must be quoted like this:

<Runnable flavor='clvm'>

```chialisp
(q . "hello")
```

</Runnable>

If you forget to do this, you will end up with either an unexpected value, or a path into atom error.

## Program Evaluation

The syntax of CLVM is similar to Lisp. It is a parenthesized [Polish notation](https://en.wikipedia.org/wiki/Polish_notation) that puts the operator before the arguments when reading left to right.

A program is represented as a binary tree. The root of the tree is the least nested object in the program tree, with inner operator calls and values embedded recursively inside of it.

In the following example, the outer parentheses represent the cons pair that is the root of the tree:

<Runnable flavor='clvm'>

```chialisp
(+ (q . 1) (q . 2))
```

</Runnable>

Whenever a program is called, it always has an environment (which will be described in more detail later), which is a CLVM value. This value, which is usually a list, holds all of the arguments passed into the program. This is the second command-line argument to `brun`, with the default environment being nil.

If the program being evaluated is a cons pair, then all of the parameters (contained in the right slot of the cons pair) are evaluated. Next, an operator call is made and the result of that function call is returned. The value on the left is the operator that is being called, and the values on the right are its operands.

If CLVM is running in strict mode, an unknown opcode will cause the program to terminate. During developer testing, CLVM may be run in non-strict mode, which allows for unknown opcodes to be used and treated as no-ops.

The quote operator, `q`, is special. When it is recognized by the interpreter, it causes whatever is on the right to be returned as a value rather than being evaluated as a program. In every other case, the right hand side is evaluated, then passed as operands to the operator on the left.

A CLVM program can be thought of as a binary tree.

Here is an example of an operator call:

<Runnable flavor='clvm'>

```chialisp
(+ (q . 1) (q . 2))
```

</Runnable>

The operator is the opcode `+`, which is built-in to the CLVM runtime.

Here is a graph of the program, as stored in memory:

```
      [ ]
     /   \
    +     [ ]
         /   \
      [q, 1]  [ ]
             /   \
         [q, 2]  nil
```

After the first reduction, the program looks like this:

<Runnable flavor='chialisp'>

```chialisp
(+ 1 2)
```

</Runnable>

Here is a graph of the new program, as stored in memory:

```
      [ ]
     /   \
    +     [ ]
         /   \
        1     [ ]
             /   \
            2    nil
```

After the second reduction, and the `+` operator call, it results in the following value:

<Runnable flavor='chialisp'>

```chialisp
3
```

</Runnable>

## Environment

CLVM programs have an environment, which is the value that is used as input. This is also how constants are implemented within programs.

Because the environment is just a tree of cons pairs like any other value, it's easy to access individual nodes on that tree using numbers. In fact, this is done so often in CLVM that the default meaning of a number is to access the node at that index. If you want the actual value of the number, you need to quote it.

This is what the first few layers of the environment's binary tree numbering looks like:

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
```

The entire environment can be accessed using `1`.

You can use the following formula to find any node on the tree:

```
first(n) = n * 2
rest(n) = n * 2 + 1
```

Here is an example of how the environment works in practice:

```bash
brun '1' '(200 500)' # (200 500)
brun '2' '(200 500)' # 200 - first
brun '3' '(200 500)' # (500) - rest
brun '5' '(200 500)' # 500 - first of rest
```

## Integer Representation

Arithmetic operations will interpret its operands as two's complement, big endian, signed integers. The most significant bit denotes whether a number is negative.

In order to represent a positive integer where the first byte begins with the bit 1, it is necessary to prepend a `0x00` byte. Otherwise, it would be interpreted as a negative integer. Said another way, if a positive integer's first byte is at least `0x80`, then it will be prepended with `0x00`.

Because of this, `0xFF` means -1, whereas `0x00FF` means 255.

You are likely to encounter this when using the output of an integer operation as the input of a byte operation such as `sha256`.

Since atoms are of arbitrary length, the same integer can be represented by many different atoms. For example, `0x01` and `0x0001` both represent `1`.

Arithmetic operations which return integers always return the shortest representation for numbers (e.g. `0xFF` for `-1`).

## Serialization

CLVM is typically stored in binary format, so that it can be quickly read and executed without parsing. It is fairly simple to serialize it into binary format, since programs are stored in a tree structure.

Each value is stored as a series of one or more bytes. Data is laid out in a way such that only one value can be encoded in each set of bytes.

Because a value may either be an atom or a cons pair, it is necessary to differentiate between the two.

### Nil

The value for nil is unique (represented as `0x80` in hex) and different than zero.

### Small Atoms

Values that are 7 bits or fewer can be represented as a single byte, equivalent to the atom's value itself.

### Large Atoms

Values longer than 7 bits are represented as a sequence of bytes that encode the size, followed by the value.

The first serialized byte determines the number of size bytes. The size takes up anywhere from 1 to 6 bytes in total, including the first. The size then determines the number of bytes denoting the value - anywhere from 0 to 17,179,869,183 bytes long.

The following table shows the bits used to indicate the number of size bytes.

| Size Bytes | Max Length  | Byte 1    | Byte 2 | Byte 3 | Byte 4 | Byte 5 |
| ---------- | ----------- | --------- | ------ | ------ | ------ | ------ |
| 1          | 0x3F        | 1 ...     |        |        |        |        |
| 2          | 0x1FFF      | 11 ...    | ...    |        |        |        |
| 3          | 0xFFFFF     | 111 ...   | ...    | ...    |        |        |
| 4          | 0x7FFFFFF   | 1111 ...  | ...    | ...    | ...    |        |
| 5          | 0x3FFFFFFFF | 11111 ... | ...    | ...    | ...    | ...    |

In other words, the number of bits set to 1 at the start of the first size byte indicate the total number of size bytes.

### Cons Pairs

A cons pair is represented with the byte `0xFF`. The two values that follow are the first and rest of the pair, respectively.

## Deserialization

To deserialize a program, simply do the same steps in reverse.

### Nil

If the first byte is `0x80`, the value is nil.

### Small Atoms

If the first byte is 7 or fewer bits in length, the value is an atom equivalent to that byte.

### Large Atoms

If the first byte is more than 7 bits in length, you will need to do a bit of math to figure out the size and value of the atom.

Here is a table you can reference:

| First Byte Max | Skipped Bits |
| -------------- | ------------ |
| 0xBF           | 2            |
| 0xDF           | 3            |
| 0xEF           | 4            |
| 0xF7           | 5            |
| 0xFB           | 6            |

The number of skipped bits is also the number of total bytes the size is encoded in. For example, the value `0xE3` would have 4 skipped bits and 4 size bytes, because it is below `0xEF`.

:::note

The number of size bytes includes the first.

:::

### Cons Pairs

A cons pair begins with the special value `0xFF`. The first and rest values can be read individually after.

For example, `(1 . 2)` would be represented as `0xFF0102`. Once you read `0xFF`, you know that the next value is the first of the cons pair, which is `0x01`. Then, the rest of the cons pair is the final value, which in this case is `0x02`.

Lists are typically chains of cons pairs that end in a nil terminator.

## Programs as Parameters

CLVM does not have operators for defining and calling functions. However, it does allow programs to be passed into the environment, as well as executing a value as a program with a new environment.

This behavior is how functions are implemented in the Chialisp compiler.

Here is a CLVM program that executes the program contained in the first environment value with its own environment, `(12)`:

<Runnable flavor='clvm' input='((* 2 (q . 2)))'>

```chialisp
(a 2 (q . (12)))
```

</Runnable>

Taking this further, we can make the program run a new program that only uses values from the original environment:

<Runnable flavor='clvm' input='((* 5 (q . 2)) 10)'>

```chialisp
(a 2 1)
```

</Runnable>

We can use this technique to implement recursive functions.
