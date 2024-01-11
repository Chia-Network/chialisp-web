---
id: syntax
title: Syntax
slug: /syntax
---

import Runnable from '@site/src/components/Runnable.tsx';

Chialisp's syntax is based on [Lisp](<https://en.wikipedia.org/wiki/Lisp_(programming_language)>), but there are some differences. This is a primer on the structure of expressions. Everything in the language shares the same [S-expression](https://en.wikipedia.org/wiki/S-expression) syntax, including operators and functions.

## Comments

You can use one or more semicolons to denote that the rest of the line is a comment, and should be ignored when running the program.

<Runnable flavor='chialisp'>

```chialisp
;;; This is a comment.

(+ 3 2) ; This is also a comment.
```

</Runnable>

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

:::note
When interpreting atoms as integers, it's important to remember that they are signed. In order to represent a positive integer, the most significant bit may not be set. Because of this, positive integers have a 0 byte prepended to them, in case the most significant bit in the next byte is set.
:::

### Nil

The value `0` or `()` is referred to as nil.

It can mean a few different things depending on the context:

- Zero
- False
- Empty list
- Empty bytes
- List terminator

### Boolean Values

Some operators treat atoms as booleans.

While every atom is considered to be `true` other than nil, the value is internally represented as `1`.

## Cons Pairs

:::note
Keep in mind that this is the syntax of the language itself. If you try to write a value as shown below, the language will interpret the first argument as an operator and throw an error.

Chances are, you want to use the `list` operator or quote the value with `q` instead, to prevent it from being interpreted as an operator.
:::

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

### Quoting

As previously mentioned, if you want to write a value using the syntax shown above, rather than a call to an operator, you need to use the quote operator. This treats an expression as a value rather than a program, preventing execution.

Here is an example quotation of a list:

<Runnable flavor='clvm'>

```chialisp
(q . (1 2 3))
```

</Runnable>

Which is equivalent to the following Chialisp code:

<Runnable flavor='chialisp'>

```chialisp
(list 1 2 3)
```

</Runnable>

:::note
Because quotation prevents execution, any operators or constants used within will be left in the form they are written in rather than being replaced.
:::

#### Quoting Evaluation

It's necessary to think about how clvm functions in order to fully understand `q`.  The evaluation process is basically the following:
"If the current thing is an atom, evaluate it.  If the current thing is a pair, evaluate the thing on the right, and pass it as an argument to the operator on the left."

`q` is one of two special operators in clvm.  Its job is basically to say, "don't evaluate the thing on the right, and just return it".  It puts an end to the recursive evaluation.

`qq` by itself does the same thing as `q`.  When used with unquote it's like f-strings in python.  You don't want to evaluate the thing on the right, but you need to do some evaluation to generate it.
`(qq ("don't evaluate me" . ("nor me" . (unquote "but this needs to be evaluated"))))`

:::note
The other special operator is `a` which resets the environment before continuing with the evaluation.
:::

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
