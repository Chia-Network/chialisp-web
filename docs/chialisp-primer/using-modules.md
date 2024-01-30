---
slug: /chialisp-using-modules
title: 2. Using Modules
---

Up to this point, you have written single expressions and evaluated them on the command-line. However, sometimes you want to split your code into multiple functions or include common libraries. In order to do things like that, you will need to understand what modules are.

## Modules

The `mod` operator creates a context for converting the usage of constants into a single expression.

:::note
Functions inside the module will not have direct access to the solution, so values you need access to will need to be passed in as a function parameter manually.

In other words, there is no concept of [scope](<https://en.wikipedia.org/wiki/Scope_(computer_science)>).
:::

This module will add two arbitrary values together:

```chialisp
(mod (first second)
    (+ first second)
)
```

And this is an example of defining a constant and a function, followed by their usage:

```chialisp
;;; Raises the number by one order of magnitude.

(mod (value)
    ; Defines a constant value with a name.
    (defconstant ORDER_OF_MAGNITUDE 10)

    ; Defines a function that can be called with a value.
    (defun raise_magnitude (value)
        (* value ORDER_OF_MAGNITUDE)
    )

    ; Calls the previously defined function.
    (raise_magnitude value)
)
```

1. The module takes in a `value` parameter.
2. `ORDER_OF_MAGNITUDE` is defined as 10.
3. The `raise_magnitude` function takes in a `value` parameter (this is different from the `value` defined as a module parameter).
4. Returns the `value` function parameter multiplied by the `ORDER_OF_MAGNITUDE`.
5. Calls the function with the module parameter `value`.

## Example

By now you have seen how some aspects of the language work, and we can use these concepts to write and run a simple Chialisp program. We will write a module that calculates the factorial of a number using [recursion](https://en.wikipedia.org/wiki/Recursion).

Put this in a file named `factorial.clsp`:

```chialisp title="factorial.clsp"
;;; Calculates a factorial recursively.
;;; f(n) = n * f(n - 1)
;;; f(n) = n if n <= 2

(mod (number)
    ; Defines the factorial function.
    (defun factorial (number)
        (if (> number 1)
            (* number (factorial (- number 1)))
            1
        )
    )

    ; Calls the function with the number provided.
    (factorial number)
)
```

Run this example with the following command:

```bash
brun "$(run factorial.clsp)" "(5)"
```

It will compile it and run the result with a solution where `number` is 5. The result of this should be the factorial of that number, which is 120. There were a few new operators used in these examples. For more information, you should refer to the [operator reference](/operators). Below is a detailed explanation of how this works.

1. The module takes in a `number` parameter.
2. The `factorial` function also takes in a `number` parameter.
3. If the number is greater than 2, returns the number times the previous factorial.
4. Otherwise, returns the number itself.
5. Call the recursive function with the `number` module parameter.

We can visualize this function with the input 5 as follows:

```chialisp
(factorial 5)
(* 5 (factorial 4))
(* 5 (* 4 (factorial 3)))
(* 5 (* 4 (* 3 (factorial 2))))
(* 5 (* 4 (* 3 (* 2 (factorial 1)))))
(* 5 (* 4 (* 3 (* 2 1))))
```

Which then simplifies like this:

```chialisp
(* 5 (* 4 (* 3 2)))
(* 5 (* 4 6))
(* 5 24)
120
```

Everything that would normally be written using iteration in an imperative language, for example array modification, is instead written using recursion in Chialisp. It can be hard to understand at first, but eventually it will make more and more sense.

## Conclusion

Modules allow you to use functional programming in Chialisp, which makes writing it feel more natural. It also allows you to reuse your code and express it in a more clear way.

If you have any questions about modules, or anything else, remember to come ask questions on our [Discord](https://discord.gg/chia).
