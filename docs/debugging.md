---
id: debugging
title: Debugging
slug: /debugging
---

import Runnable from '../src/components/Runnable.tsx';

Debugging Chialisp at times can be frustrating. Due to the nature of how it handles data structures, programs will often continue on with incorrect values only to error out at a later spot that gives no clue to the initial breakage. For example, a variable typo will often result in the variable being evaluated as a string, and if that gets hashed into something it's impossible to tell.

However, there are some tricks you can use to more easily catch bugs in your code.

:::note
It is recommended that you have a strong grasp of CLVM since it underlies all of the processes that happen in Chialisp. It will make it easier to build the picture in your head of the evaluations that are happening and why they may be happening unexpectedly.

For example, topics as environment trees may not make sense until you read about it on the [CLVM page](/clvm).
:::

## Raise Operator

You can use the `x` operator to debug your programs. This allows you to print the value of an expression at runtime, and terminate the program before it can go further.

Here is an example of a program you may want to debug:

<Runnable flavor='chialisp' input='(hello)'>

```chialisp
(mod (something)
    (defun some (something)
        (sha256 something)
    )

    (some something)
)
```

</Runnable>

This would throw an error if you try to use `sha256` on a list (because it's the solution to the program).

Here is how you would debug it by wrapping an expression in the `x` operator:

<Runnable flavor='chialisp' input='(hello)'>

```chialisp
(mod (something)
    (defun some (something)
        (sha256 (x something))
    )

    (some something)
)
```

</Runnable>

As you can see, when it gets to that point, it would raise an error and print the value of `something` rather than continuing and crashing.

This is a very powerful tool when debugging programs in Chialisp.

## Verbose Output

It may be a lot to digest, but if you execute your programs in verbose mode, it will show you the entire evaluation process from start to finish.

You can use the `--verbose` or `-v` flag with `brun` (and `run`, if you want to debug the compiler).

Here is an example:

<details>
  <summary>Verbose Output</summary>

```chialisp
brun '(c (sha256 0xdeadbeef) ())' '()' --verbose

FAIL: path into atom ()

(a 2 3) [((c (sha256 0xdeadbeef) ()))] => (didn't finish)

3 [((c (sha256 0xdeadbeef) ()))] => ()

2 [((c (sha256 0xdeadbeef) ()))] => (c (sha256 0xdeadbeef) ())

(c (sha256 0xdeadbeef) ()) [()] => (didn't finish)

() [()] => ()

(sha256 0xdeadbeef) [()] => (didn't finish)

0xdeadbeef [()] => (didn't finish)
```

In this example, we see that it is trying to run `0xdeadbeef` as a program to access a value in the environment. However, the environment is just `()` which is obviously not deep enough, so it throws an error.

We should have quoted the atom before we passed it to `sha256`. In Chialisp, you don't need to quote atoms, but we are executing CLVM.

</details>

Every verbose output begins with `(a 2 3)` which represents the whole program being run with its environment.

Follow each occurrence of `(didn't finish)` down until you find the deepest failure, then work up from there. Hopefully this will help you figure out what is wrong.

## Symbol Table

When you use the `run` or `cdv clsp build` commands, a symbol table file will be created named `main.sym`. You can use this file to aid in debugging. It keeps track of constant and function names, so you can see them in errors or the verbose output at runtime.

You can use the `--symbol-table` or `-y` flag with the symbol table file to enable this behavior.

Here is an example:

```bash
brun compiled.clvm --verbose --symbol-table main.sym
```

Keep in mind that this will not be able to identify inline functions or macros since they get replaced at compile time. However, you can change inline functions to normal functions while debugging so that they are tracked by the symbol table.

## Common Errors

### Path Into Atom

This is the most common error when running a program. It means that you are trying to access an environment value that is deeper than the tree.

Some common reasons for this are the following:

- Called a function and didn't supply all of the parameters.
- Used a list operator on an atom.
- Used an atom as if it were a program.

### First or Rest of Non-Cons {#non-cons}

This error means you are trying to use either the `f` operator or `r` operator on an atom rather than a cons pair.

Some common reasons for this are the following:

- Parameters are misaligned or missing.
- The type of a parameter is wrong.
- Forgot to check if it's a list with `l` before using list operators.
- An empty list is technically an atom (nil), not a cons pair (use the `l` operator to check).
- Forgot to quote a program and it evaluated too soon.

### Sha256 on List {#sha256tree}

You can only use the `sha256` operator on atoms.

What you are probably looking for instead is the `sha256tree` function, which you can include inside a module like this:

```chialisp
(include sha256tree.clib)
```

Of course, you will need to ensure it's in the include path first:

```bash
cdv clsp retrieve sha256tree
```

Keep in mind that `sha256tree` has a higher cost associated with it and will have a different result (due to prepending a `1` or `2` based on type). If all you are hashing is one atom or multiple atoms of fixed length, you can use the simpler built-in `sha256` operator.

## Deserialization

If you have CLVM bytecode in hex format and need to be able to read it, you can convert it back into normal CLVM form. Even though it may not be super readable either way, it can help to find patterns and check things such as curried in arguments.

Run this command to deserialize CLVM bytecode:

```bash
opd "<CLVM Bytecode>"
```

As well as this, if you want to check the length of the serialized output of your CLVM, you can convert it in the other direction as well.

Run this command to serialize CLVM:

```bash
opc "<CLVM>"
```

You can find more commands in the [Commands page](/commands).
