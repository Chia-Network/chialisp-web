---
id: serialization
title: CLVM Reference Manual
sidebar_label: Serialization
---

## Serialization

The CLVM serialization format closely follows the in-memory representation of the program tree.

This in turn, closely resembles the text format of a fully compiled CLVM program.

At the lowest level, there are only two types of Object in the CLVM.

* Pair (also called Cons Pair/Cons Box/Cons Cell) - A pair of two values. Usually, the first value is an atom and contains information, whereas the second value is usually either a pointer to another pair, or a `nil` atom. Lists are built from these pairs.
* Atom - A value that holds data, which is represented as a byte array with the static length. Empty, zero-length atoms are used to represent `nil` value.

Each CLVM Object is represented by a series of one or more bytes. Each byte belongs to the representation of exactly one CLVM Object. That is, no bits in a byte are shared by multiple CLVM objects.


### Values

Each value in the CLVM is an untyped sequence of bytes. In the running virtual machine, values have a property length, containing the number of bytes. The same concept is preserved in the serialization format. However, values must be distinguished from cons boxes in the byte stream, so an escaping scheme is used. This escaping means that serialized values using more than 7 bits have a different representation than the in memory representation.

Nil has a single predefined value which is not shared with any user-defined value.

### Encoding

Values which can be represented in 7 bits are encoded as a single byte with that value. Larger serialized values are represented as a sequence of bytes that encode the size, and then the value bytes.

The encoding scheme for the size prefix is as follows:

The value of the first serialized byte determines the number of size bytes (1 to 6, including the first byte). The size then determines the number of bytes denoting the value (0 to 0x400000000-1 bytes long)

**size** is the length of the byte array containing the value, as an integer.
In the table below, we use **s** to describe the bytes that make up the encoded size value, s[0] being the least significant byte of **size**. The size bytes are encoded MSB first.

```
object is cons box:   0xFF
value == nil:         0x80
value <= 0x7F:        value

size < 0x40:          0x80 | s[0], value
size < 0x2000:        0xC0 | s[1], s[0], value
size < 0x100000:      0xE0 | s[2], s[1], s[0], value
size < 0x8000000:     0xF0 | s[3], s[2], s[1], s[0], value
size < 0x400000000:   0xF8 | s[4], s[3], s[2], s[1], s[0], value
```

In the table below, the bits marked x contain the length of the value array, in bytes.

### Encoded Size bytes layout

Size bytes | Min Value Len | Max Value Length | Byte 1 | Byte 2 | Byte 3 | Byte 4 | Byte 5
---|---|---|---|---|---|---|---
1|0x00|0x3F|1xxxxxxx
2|0x40|0x1FFF|11xxxxxx|xxxxxxxx
3|0x2000|0xFFFFF|111xxxxx|xxxxxxxx|xxxxxxxx
4|0x100000|0x7FFFFFF|1111xxxx|xxxxxxxx|xxxxxxxx|xxxxxxxx
5|0x8000000|0x3FFFFFFFF|11111xxx|xxxxxxxx|xxxxxxxx|xxxxxxxx|xxxxxxxx

### Decoding

The decoding scheme is as follows:

c[0] is the first byte of the serialized CLVM object.

**size** is the number of bytes contained in the value byte array
**s** is the byte array containing the bytes of the two's complement integer size, the number of bytes in the value array.
**value** is the span of bytes describing the CLVM Object itself

c[0] can contain the entire value, or it can be part of the size header.
Values below 0x80 do not have size header bytes.

0x00-0x7f: A literal one byte value. c[0] contains the value.
           `size = 1; value = c[0]`

0x80-0xbf: The value starts at the byte c[1], and size is in the lower 6 bits of c[0]
           `size = (c[0] & 0x3F); value = c[1] .. c[size]`

0xc0-0xdf: The value starts at c[2]; the lower 5 bits of c[0] are the high bits of size
           `size = (c[0] & 0x1F) .. c[1]; value = c[2] .. c[size+1]`

0xe0-0xef: The value starts at c[3]; the lower 4 bits of c[0] are the high bits of size
           `size = (c[0] & 0x0F) .. c[2]; value = c[3] .. c[size+2]`

0xf0-0xf7: The value starts at c[4]; the lower 3 bits of c[0] are the high bits of size
           `size = (c[0] & 0x07) .. c[3]; value = c[4] .. c[size+3]`

0xf7-0xfb: The value starts at c[5]; the lower 2 bits of c[0] are the high bits of size
           `size = (c[0] & 0x03) .. c[4]; value = c[5] .. c[size+4]`

Atoms of size 0x400000000 or greater are disallowed in the serialization format.

As an example:
```
c = [ 0x84 0x33 0x22 0x11 0x00 ]
c[0] = 0x84
size = (0x84 & 0x3F) = 4
value = [ 33 22 11 00 ]
```

In the above example, the length of the value is **4**, and we only needed the bottom 3 bits of the c[0] byte to encode the length, so the size is completely described by the first serialized byte. The total length of the encoded atom is 5 bytes.

Note that for values greater than 0x7F, the bytes of the serialized value representing the length are disjoint with the actual value bytes.

Let us consider some special cases.

```
value(0x80) = 81 80
```
c[0] is `0x81`.Since c[0] is between `0x7F` and `0xC0`, we know that there is only one size byte, c[0], and the value is contained in the following bytes, starting at c[1]. The total size of the value array is
`size` = `c[0] & 0x3F` = `0x1`. So, the full value is contained in the single following byte.

```
value(0x81) = 81 81
value(0x82) = 81 82
value(0xFF) = 81 ff
```

Note that the special byte 0xFF is allowed within the bytes representing a value.
0xFF denotes a cons box when it is the first byte of a decoded CLVM object, but it may also occur within the serialized bytes of a value.

A 2 byte value
```
value(0x01FF) = 82 01 ff
```

### Lists

Lists are the primary high-level data structure in most LISP implementations. Traditionally, a LISP builds lists from cons boxes, a two-celled data structure that can be thought of as a struct with two fields, left and right, each of which contains either a value, or a (pointer to) another cons cell.

Because the cons cell is the low level data structure that lists are built from, LISP lists are only lists by way of the fact that lists can be implemented from trees. A lisp list built from cons cells in a binary tree.

Serialized cons cells are represented by the byte 0xFF, followed by the objects in its cells, left then right.
Values are represented by a variable length byte-aligned encoding scheme, described above.
Nil is chosen to be the zero-length object, which is represented by the byte 0x80.

Because lists are represented as a sequence of cons boxes, the byte 0xff occurs frequently in the serialization format.

After the FF introducer byte, the next two values describe what is in the left and right cons boxes, respectively.

The first examples use single byte values for clarity.

The list (1 2 3) will be encoded as:
```
ff 01 ff 02 ff 03 80
```
This can be read as:

`(a cons box containing 01` and `a cons box (containing 02` and `a cons box (containing 03 and nil)))`

Alternatively, it could be viewed as a binary tree that looks like this:

```
      [ ]
     /   \
    1    [ ]
         / \
        2  [ ]
           / \
          3  nil
```

Or, as a chain of memory cells that look like this:
```
(a)[ 1, ->b ]   (b)[ 2, ->c ]   (c)[ 3, nil ]
```

Where
  * (a) means "The contents of the memory cells at position a and a+1 (cons box a)"
  * ->b means "a pointer to cons box (b)"
  * `(a)`, `(b)`, `(c)` are arbitrary labels for the cons cells, and do not exist in the CLVM

Because the above list contains only one level of nesting, a single `0x80` byte is sufficient to terminate the list. Note the two `0x80` bytes in the example below.

```
opc '(1 (2 3))'
ff 01 ff ff 02 ff 03 80 80
```

There can be many cons cells in a CLVM program, so 0xFF will be common in the serialized program. There will be one serialized nil (0x80) per properly terminated list. Nil may also occur at other places in the program. There are usually more cons boxes than lists, so 0xFF occurs more frequently than 0x80.
