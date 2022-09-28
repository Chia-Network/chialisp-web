---
id: syntax
title: Syntax
slug: /syntax
---

Chialisp's syntax is based on [LISP](<https://en.wikipedia.org/wiki/Lisp_(programming_language)>), but there are some differences. This is a primer on the structure of expressions. Everything in the language shares the same [S-expression](https://en.wikipedia.org/wiki/S-expression) syntax, including operators and functions.

## Comments

You can use one or more semicolons to denote that the rest of the line is a comment, and should be ignored when running the program.

```chialisp
;;; This is a comment.

(+ 3 2) ; This is also a comment.
```

Here are a few conventions for the number of semicolons to use:

- 1 semicolon when right-aligned with code.
- 2 semicolons when block-aligned with code.
- 3 semicolons when top-level.

## Atoms

An atom is a [big endian](https://en.wikipedia.org/wiki/Endianness) array of bytes. Atoms can be interpreted as either an integer or a raw byte string, depending on the operator.

They are immutable, so any time an operator performs a calculation, it is creating a new atom for the result rather than reusing the original. This ensures that Chialisp is stateless and doesn't allow for [side effects](<https://en.wikipedia.org/wiki/Side_effect_(computer_science)>).

Although an atom is represented in the same way regardless of the data stored in it, it can be written and displayed in the following ways to make it more meaningful to the reader:

- Decimal (e.g. `100`)
- Hexadecimal (e.g. `0xFF`)
- String (e.g. `"xyz"` or `'xyz'`)
- Symbol (e.g. `hello`)

### Nil

The value `0` or `()` is referred to as nil.

It can mean a few different things depending on the context:

- Zero
- False
- Empty list
- Empty bytes
- List terminator

## Cons Pairs

A cons pair is a set of two values. A cons pair value looks like this:

```
(first . rest)
```

Because a value can be a cons pair itself, you can nest them in a chain:

```chialisp
(1 . (2 . (3 . ())))
```

When a chain of cons pairs ends in nil, it forms a proper list.

This is the preferred way of writing the same thing, in list form:

```chialisp
(1 2 3)
```

### List Termination

A proper list is terminated with nil, but if you are using cons pairs as a struct of values rather than a list, you can choose not to terminate it with nil.

Here is an example of a struct with three values:

```chialisp
(1 2 . 3)
```

Which is equivalent to the following:

```chialisp
(1 . (2 . 3))
```

## Destructuring

Usually for things such as modules and functions, you will only need a list of parameters. However, more advanced behavior is possible for destructuring those arguments. In fact, you can write a named list, cons pair, or single atom in whatever structure you need, and it will automatically destructure the environment into the constants provided.

This will capture the entire environment:

```chialisp
(mod environment
    ...
)
```

This will destructure an improper list:

```chialisp
(mod (first second . third)
    ...
)
```

And finally, this will unwrap a list within the list:

```chialisp
(mod (first (second third))
    ...
)
```

## Include Files

You can write a set of utility functions, constants, and macros inside of a file to be included when needed in your Chialisp programs. This is known as an include file.

They are structured as a list of definitions, like this:

```chialisp
(
    (defconstant ONE_HUNDRED 100)

    (defun do-something-special ()
        ONE_HUNDRED
    )
)
```
