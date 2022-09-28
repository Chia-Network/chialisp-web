---
id: examples
title: Examples
slug: /examples
---

This is a set of examples for various operators. If you want to see their documentation, checkout the [Operators page](/operators).

## Modules

### mod

Compiles an entire program into a single executable expression. You can define other constants within it.

```chialisp
(mod (value)

    ;; Doubles the value as the output.
    (* value 2)
)
```

### include

Includes all of the constants defined in a library file in the module.

```bash
cdv clsp retrieve sha256tree
```

```chialisp
(mod (thing-to-hash)

    ;; Includes the constants defined in the file.
    (include sha256tree.clib)

    ;; Calls the utility function as the output.
    (sha256tree thing-to-hash)
)
```

### defun

Defines a function that can be called from anywhere within the module.

```chialisp
(mod ()
    (defun square (number)
        ;; Returns the number squared.
        (* number number)
    )

    (square 16) ; 256
)
```

### defun-inline

Defines an inline function that can be called from anywhere within the module. It simply replaces the call with the code within (like an easier to write but limited macro).

```chialisp
(mod ()
    (defun-inline double (number)
        ;; Returns twice the number.
        (* number 2)
    )

    (double 9) ; 18
)
```

### lambda

Compiles a block of code into a single executable expression. Useful for writing functions as arguments to other functions.

```chialisp
(lambda (n1 n2)
    ;; Returns the two added together.
    (+ n1 n2)
)
```

### defmacro, qq, unquote {#defmacro}

Defines a macro that can manually structure the source code it is replaced with. Allows for advanced compile time behavior.

```chialisp
 (defmacro or ARGS
    (if ARGS
        (qq (if (unquote (f ARGS))
            1
            (unquote (c or (r ARGS)))
        ))
    0)
)
```

### defconstant

Defines a constant value that can be referenced by name.

```chialisp
(mod ()
    (defconstant MAGIC_NUMBER 314159)

    MAGIC_NUMBER ; Replaced with the actual value.
)
```
