---
id: high_level_lang
title: 4 - The High Level Language, Compiler, and Functions
---

This guide assumes that you have already read the previous parts.
It is highly recommended that you do so as the higher level language is built directly on top of the lower level language.

## CLVM vs Chialisp

Until now, we have been using what we call CLVM to write our programs.
CLVM is what is serialized and stored directly on the blockchain and is a matter of consensus. It can never be changed.

Normally, we will write a higher level language called **Chialisp** instead of CLVM.
Chialisp compiles into CLVM, and since it is going through the compiler first, it can actually be changed to add more features.
Chialisp shares a lot of the fundamentals of how programs work with CLVM, but also includes some helpful functionality to make writing large programs easier.

## Run

The first difference you need to be aware of for the higher level language is that you should call `run` instead of `brun`.
This lets the runtime know that it should be including higher level operators and behavior.

The first higher level feature you should be aware of is that **it is no longer necessary to quote atoms!**

Compare `brun` and `run` here:

```chialisp
$ brun '(+ 200 200)'
FAIL: first of non-cons ()
$ run '(+ 200 200)'
400
```

Run also gives us access to a number of convenient high level operators, which we will cover now.

## list

`list` takes any number of parameters and returns them put inside a list.
This saves us from having to manually create nested `(c (A) (c (B) (q ())))` calls, which can get messy quickly.

```chialisp
$ run '(list 100 "test" 0xdeadbeef)'
(100 "test" 0xdeadbeef)
```

## if

`if` automatically puts our `i` statement into the lazy evaluation form so we do not need to worry about the unused code path being evaluated.

```chialisp
$ run '(if 1 (q . "success") (x))' '(100)'
"success"

$ run '(if 0 (q . "success") (x))' '(100)'
FAIL: clvm raise ()
```

## qq unquote

`qq` allows us to quote something with selected portions being evaluated inside by using `unquote`.
The advantages of this may not be immediately obvious but are extremely useful in practice as it allows us to substitute out sections of predetermined code.

Suppose we are writing a program that returns another coin's puzzle.
We know that a puzzle takes the form: `(c (c (q . 50) (c (q . 0xpubkey) (c (sha256 2) (q . ())))) (a 5 11))`
However we will want to change 0xpubkey to a value passed to us through our solution.

**Note: `@` allows us to access the arguments in the higher level language (`@` == 1)**

```chialisp
$ run '(qq (c (c (q . 50) (c (q (unquote (f @))) (c (sha256 2) ()))) (a 5 11)))' '(0xdeadbeef)'

(c (c (q . 50) (c (q . 0xdeadbeef) (c (sha256 2) ()))) (a 5 11))
```


## Compiling to CLVM with Mod

It is important to remember that in practice smart coins will run using the lower level language, so none of the above operators will work on the network.
What we *can* do however is compile them down to the lower level language.
This is where `mod` comes in.
`mod` is an operator that lets the runtime know that it needs to be compiling the code rather than actually running it.

`(mod A B)` takes two or more parameters. The first is used to name parameters that are passed in, and the last is the higher level script which is to be compiled.

Below we name our arguments `arg_one` and `arg_two` and then access `arg_one` inside our main program

```chialisp
$ run '(mod (arg_one arg_two) (list arg_one))'
(c 2 ())
```

As you can see it returns our program in compiled lower level form.

```chialisp
$ brun '(c 2 ())' '(100 200 300)'
(100)
```

You may be wondering what other parameters `mod` takes, between variable names and source code.

## Functions, Macros and Constants

In the higher level language we can define functions, macros, and constants before our program by using `defun`, `defun-inline`, `defmacro` and `defconstant`.

We can define as many of these as we like before the main source code.
Usually a program will be structured like this:

```chialisp
(mod (arg_one arg_two)
  (defconstant const_name value)
  (defun function_name (parameter_one parameter_two) *function_code*)
  (defun another_function (param_one param_two param_three) *function_code*)
  (defun-inline utility_function (param_one param_two) *function_code*)
  (defmacro macro_name (param_one param_two) *macro_code*)

  (main *program*)
)
```

A few things to note:

- Functions can reference themselves in their code but macros and inlines cannot as they are inserted at compile time.
- Both functions and macros can reference other functions, macros and constants.
- Macros that refer to their parameters must be quasiquoted with the parameters unquoted
- Be careful of infinite loops in macros that reference other macros.
- Comments can be written with semicolons
- Inline functions are generally more cost effective than regular functions except when reusing calculated arguments: `(defun-inline foo (X) (+ X X)) (foo (* 200 300))` will perform the expensive multiplication twice


## Factorial

```chialisp
(mod (arg_one)
  ; function definitions
  (defun factorial (input)
    (if (= input 1) 1 (* (factorial (- input 1)) input))
  )

  ; main
  (factorial arg_one)
)
```

We can save these files to .clvm files which can be run from the command line.
Saving the above example as `factorial.clvm` allows us to do the following.

```chialisp
$ run factorial.clvm
(a (q 2 2 (c 2 (c 5 ()))) (c (q 2 (i (= 5 (q . 1)) (q 1 . 1) (q 18 (a 2 (c 2 (c (- 5 (q . 1)) ()))) 5)) 1) 1))

$ brun '(a (q 2 2 (c 2 (c 5 ()))) (c (q 2 (i (= 5 (q . 1)) (q 1 . 1) (q 18 (a 2 (c 2 (c (- 5 (q . 1)) ()))) 5)) 1) 1))' '(5)'
120
```

## Squaring a List

Now lets do an example which uses macros as well.
When writing a macro it must be quasiquoted with the parameters being unquoted.

We can also take this time to show another feature of the compiler.
You can name each parameter in a list or you can name the list itself.
This works at any place where you name parameters, and allows you to handle lists where you aren't sure of the size.

Here we define a macro to square a parameter and then a function to square a list.

```chialisp
(mod (args)

  (defmacro square (input)
    (qq (* (unquote input) (unquote input)))
  )

  (defun sqre_list (my_list)
    (if my_list
      (c (square (f my_list)) (sqre_list (r my_list)))
      my_list
    )
  )

  (sqre_list args)
)
```

Compiling and running this code results in this:

```chialisp
$ run square_list.clvm
(a (q 2 2 (c 2 (c 5 ()))) (c (q 2 (i 5 (q 4 (* 9 9) (a 2 (c 2 (c 13 ())))) (q . 5)) 1) 1))

$ brun '(a (q 2 2 (c 2 (c 5 ()))) (c (q 2 (i 5 (q 4 (* 9 9) (a 2 (c 2 (c 13 ())))) (q . 5)) 1) 1))' '((10 9 8 7))'
(100 81 64 49)
```

## Conclusion

You should now have the context and knowledge needed to write your own Chialisp programs.
Remember from [our discussion of coins](/docs/coins_spends_and_wallets/) that these programs run on the blockchain and instruct the blockchain what to do with the coin's value.

If you have further questions feel free to ask on [Keybase](https://keybase.io/team/chia_network.public).
