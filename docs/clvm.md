---
id: clvm
title: CLVM
slug: /clvm
---

Chialisp is compiled to bytecode, which is executed on the Chialisp Virtual Machine. CLVM is as minimal as possible, and doesn't have direct support for language constructs such as functions, constants, and modules.

This is all implemented by the Chialisp compiler. Although many of the operators are derived from CLVM, many things about Chialisp deviate from the bytecode it compiles to.

## Syntax

The core language syntax of CLVM is the same as Chialisp. However, it's a much more barebones language with less of the [syntactical sugar](https://en.wikipedia.org/wiki/Syntactic_sugar) you may be used to regarding the operators available. Additionally, there are differences in the interpretation of certain things such as numbers. This is explained in more detail below.

## Environment

CLVM programs have an environment, which is the value that is used as input. This is also how constants are implemented within programs.

Because the environment is just a tree of cons pairs like any other value, it's easy to access individual nodes on that tree using numbers. In fact, this is done so often in CLVM that the default meaning of a number is to access the node at that index. If you want the actual value of the number, you need to quote it.

This is what the first few layers of the environment's binary tree numbering looks like:

<details>
  <summary>Environment Tree Graphic</summary>

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

</details>

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
