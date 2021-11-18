---
id: debugging
title: 9 - Debugging
---

Due to the nature of Chialisp programs, it can often be difficult to determine where exactly something is going wrong.
Since Chialisp is serialized to CLVM before it is run, errors that you receive will often appear to make little sense within the context in which you wrote the faulty code.
Let's go over some tricks now that you can use to make catching the bugs in your program a little easier.

## Verbose output

Both `run` and `brun` have a `-v` flag for printing verbose outputs.
This output is *very* verbose and shows every evaluation that the program made before it finished or exited.
Let take a look at an example:

```chialisp
brun '(c (sha256 0xdeadbeef) ())' '()' -v

FAIL: path into atom ()

(a 2 3) [((c (sha256 0xdeadbeef) ()))] => (didn't finish)

3 [((c (sha256 0xdeadbeef) ()))] => ()

2 [((c (sha256 0xdeadbeef) ()))] => (c (sha256 0xdeadbeef) ())

(c (sha256 0xdeadbeef) ()) [()] => (didn't finish)

() [()] => ()

(sha256 0xdeadbeef) [()] => (didn't finish)

0xdeadbeef [()] => (didn't finish)
```

Every verbose output starts with `(a 2 3)` which simply represents the whole puzzle being run with whole solution. If you're debugging, this will likely have an output of `(didn't finish)`. We can trace the appearances of `(didn't finish)` down until we find the deepest failure to evaluate.
In this example, we see that it is trying to run `0xdeadbeef` as a program to access a value in the solution.
The solution is just `()` which is obviously not deep enough, so it throws an error.
We should have quoted the atom before we passed it to `sha256`.

## Common errors

### path into atom

This error is perhaps the most common error that will come up when you run a new program.
It means that you have tried to traverse a tree with an index that is deeper than the tree is.


What this is usually trying to convey is that something is wrong with a variable that you are trying to reference.
Make sure to check your arguments are being properly passed from one function to the next and that all of your code is referencing them within the correct scope.
Maybe you called a function and didn't pass it enough parameters.
Maybe the function was expecting a program and you gave it an atom.
You can look in the verbose output to see what evaluations didn't finish to get a clue of what part might be failing.

### first/rest of non-cons

With this error, clvm is trying to tell you that you have attempted to use `f` or `r` on an atom instead of a cons box.
This is, again, usually due to a misalignment of arguments.
Make sure you know what every variable is allowed to be when it gets passed to another function: an atom, a cons box, or either.
If it can be either, make sure you check if it is a cons before performing list operations on it. Sometimes this can be caused by evaluating a list of an unexpected length and running into `()` before you expect it.
Also, double check that all of the evaluation in your program is happening at the right time.
Perhaps a program was evaluated into an atom too soon.

### sha256 on list

This error is fairly descriptive, but it is important to highlight when this most commonly occurs.
Often when building a program, you will want to hash a commitment to some kind of CLVM program with some other data.
Usually this is done by tree hashing the program using [sha256tree](https://chialisp.com/docs/common_functions#sha256tree1) and then committing to it that way.
However, with the complexity and moving pieces of a lot of applications, you may lose track of which elements are programs and which elements are just tree hashes.
This error often indicates that you are passing in a program when you should be passing in a tree hash.
Go to every reference of `sha256` in your application and you can probably find the culprit.

## Using `(x)` to log

Oftentimes, you would like to be able to see the values of a variable in the middle of a program execution.
Most languages have some sort of log statement with which to do this, but it's somewhat impossible to implement in Chialisp since it's evaluated rather than run.
One of the workarounds you can use is to wrap the statement you are looking to debug in `x`.
The raise operator takes an optional argument to log when it raises.
Let's say you are trying to debug this line of code:

```chialisp
(list CREATE_COIN_ANNOUNCEMENT (sha256tree (list coin-info coin-data)))
```

You can try commenting out that line and creating a new raise to exit out with some information:

```chialisp
; (list CREATE_COIN_ANNOUNCEMENT (sha256tree (list coin-info coin-data)))
(x (list CREATE_COIN_ANNOUNCEMENT (sha256tree (list coin-info coin-data))))
```

Keep in mind that evaluation will happen before the raise message gets created.
Sometimes it's better to just raise a list of the arguments:

```chialisp
; (list CREATE_COIN_ANNOUNCEMENT (sha256tree (list coin-info coin-data)))
(x (list coin-info coin-data))
```

There is also a caveat that occurs when you are trying to debug a series of spends that happen sequentially.
Maybe the puzzle runs the first time and fails the second time.
If you raise during execution, you may cause your first puzzle error out too, which will not get you to the second puzzle.
In scenarios like these, try to figure out a difference between the spends and wrap the raise in an `if` so that you can pass safely through the first puzzle.

## main.sym

When you use `run` on a `mod` that contains constants or functions, the compiler will automatically generate a file called `main.sym`.
This file contains mappings from the constant or function names to their representations in the bytecode.
When you are running the program with `brun`, you can specify the symbol file with the `-y` flag.
Then, when you see errors or print verbose outputs, you will see human readable text rather than the integer or bytecode that is being used to refer to it.

This is particularly useful when dealing with long verbose outputs.
You can scroll up the log until you recognize a snippet of code that isn't finishing.
Without the symbol table, it may be much more difficult to recognize.

Importantly, the symbol table will not be able to identify inline functions or macros since they are inserted at compile time.
If you are debugging, it's probably a good idea to change inline functions into functions so that you can recognize them in the symbol table.

## `opd` and `opc`

There are two more commands in the [clvm_tools repository](https://github.com/Chia-Network/clvm_tools) that are related to the serialization of CLVM.
When the program is run on the blockchain, it is run in its serialized form. It can sometimes be helpful to see that serialized compilation. For example, when the cost of a program is evaluated, it is charged cost for every byte in the puzzle reveal.
You are incentivized to make sure that puzzle reveal is as small as possible.

If you would like to see the serialized output, you can use `opc` to compile or **assemble** the CLVM:

```chialisp
opc '(q "hello" . "world")'
ff01ff8568656c6c6f85776f726c64
```

In addition, other languages like Python usually also handle CLVM in its serialized format.
If you are writing driver code for your puzzles, you may need to debug a spend bundle that contains some serialized CLVM. In this scenario, it can be useful to **disassemble** the serialized program into the human readable form.

```chialisp
opd ff01ff8568656c6c6f85776f726c64
(q "hello" . "world")
```

With large programs, it may not be much clearer in the human readable form, but you can often still distinguish certain patterns. Curried arguments, for example, are relatively easy to pick out and they can often give you the crucial information you need to debug your programs.

## Conclusion

Debugging Chialisp at times can be frustrating. Due to the nature of how lisp handles data structures, programs will often continue on with incorrect values only to error out at a later spot that gives no clue to the initial breakage. For example, a variable typo will often result in the variable being evaluated as a string, and if that gets hashed into something it's impossible to tell!

It is recommended that you have a strong grasp of CLVM since it underlies all of the processes that happen in Chialisp. It will make it easier to build the picture in your head of the evaluations that are happening and why they may be happening unexpectedly.

Hopefully with these tricks you can save yourself a bit of time and get your smart coins out quicker.
