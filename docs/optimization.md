---
id: optimization
title: Optimization
slug: /optimization
---

It is possible to optimize the cost of your programs by making certain changes and keeping things in mind as you write code using the language. Let's explore some of these methods now.

## Conditions

If you are writing a puzzle for the Chia blockchain, minimize the number of spends and conditions used. Specifically, the `CREATE_COIN`, `AGG_SIG_ME`, and `AGG_SIG_UNSAFE` conditions have a massive cost associated with them. This is because they are an expensive operation to perform on the node.

For example, instead of creating a coin in each spend, you can aggregate them all into a single coin created from one of the spends. The other coins just contribute to the overall value.

## Utilize Operators

Check out the [list of operator costs](/costs) to understand the implications of each, and how you can use them to more efficiently perform an operation.

For example, this costly method to check if a number is odd:

```chialisp
(r (divmod value 2))
```

Can be replaced with this simpler and more efficient method:

```chialisp
(logand value 1)
```

Sometimes it may not always be obvious, but optimizing these things can make a difference over time.

## Functions

It may be tempting to break up all of your code into functions to make it cleaner and easier to read, but that's not always the best option. Functions are essentially a new program that has to be executed whenever called, which means creating a new environment and passing all of the parameters into it.

Sometimes, functions can actually help you save on cost, by reusing the same parameter multiple times. Instead of repeating it, you are simply using the value from the environment.

Here is an example of a good use of a function:

```chialisp
(defun square (number)
    (* number number) ; The number is reused twice here.
)
```

However, when you only use the values once, you are just wasting cost on the function call. This is where inline functions come in.

We can use an inline function to insert code at compile time:

```chialisp
(defun-inline double (number)
    (* number 2) ; This code will be directly inserted when the function is called.
)
```

This is a form of macro, and allows you to clean up your code without adding any additional overhead.

However, if you used an inline function for the previous example, you can see what happens:

```chialisp
(defun-inline square (number)
    (* number number) ; The expression for number is reused twice here.
)

; This usage of the function:
(square (* 2 3))

; Becomes the following:
(* (* 2 3) (* 2 3))
```

The expression passed in as the parameter gets verbatim copied multiple times, which is very inefficient.

When writing a function, decide whether it should be inline or not based on whether the parameters are reused or not.

## Minimize Parameters

Accessing values from the environment has a cost that grows the deeper the values are in the tree. Because of this, the more parameters a function or program has, the more cost will be paid.

Try to keep the number of parameters relatively low if possible. This also has the added benefit of making your code more readable.

This becomes especially important if you are passing many different values between inner puzzles or functions.
