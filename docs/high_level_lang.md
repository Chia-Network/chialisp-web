---
id: high_level_lang
title: Language Overview
slug: /
---

Chialisp is a high-level, LSIP-like language for implementing smart-contract capabilities called **puzzles** on Chia. Chialisp program compiles into Chialisp Virtual Machine (CLVM). CLVM is serialized and stored directly on the blockchain and is a matter of consensus. It can never be changed. While CLVM powers Chialip, they shares many fundemantals concepts. Click through the [CLVM basic](clvm/basics) to Learn more about CLVM. 

If you are new to Chialisp, check out the [Chialisp Getting Started Guides](getting_started/getting_started) first.

## Values

There is no variables in Chialisp. Values are stored in two different objects: [atoms](https://www.gnu.org/software/emacs/manual/html_node/eintr/Lisp-Atoms.html#:~:text=Technically%20speaking%2C%20a%20list%20in,nothing%20in%20it%20at%20all.) and [cons boxes](https://en.wikipedia.org/wiki/Cons). A cons box is a pair of objects, the objects in a cons box can either be an atom or another cons box.


### Atoms
An atom is a string of bytes. These bytes can be interpreted both as a signed big-endian integer and a byte string, depending on the operator using it. 

All atoms are immutable, therefore all operators that perform computations on atoms create new atoms for the result.

Atoms can be printed in three different ways, decimal, hexadecimal and as a string. Hexadecimal values are prefixed by 0x, and strings are quoted in ".

### Cons Boxes

Cons boxes are represented as a parentheses with two elements separated by a `.`.
For example:
```chialisp
(200 . "hello")

("hello" . ("world" . "!!!"))
```
Are legal cons boxes, but the following is not.
```chialisp
(200 . 300 . 400)
```
A cons box always has two elements.
However, we can chain cons boxes together to construct lists.


## Lists and Opeartors 

The building blocks of Chialisps are lists and opertors. A list is any space-separated, ordered group of one or more elements inside brackets. A valid Chialisp list requires: 

1. The first item in the list must be a valid operator
2. Every item after the first must be a valid list

Take arithematic addion operator '+' for example, the list (+ 2 3) computes the sum of integeger 2 and 3. 

```chialisp
$ run '(+ 2 3)'
5
```

Strict defintion of list is a representation of consecutive cons boxes terminated in a null atom (). Keep in mind the following expressions are equal:
```chialisp
(200 . (300 . (400 . ())))

(200 300 400)
```
### Operators 

#### list
`list` takes any number of parameters and returns them put inside a list.
This saves us from having to manually create nested `(c (A) (c (B) (q ())))` calls, which can get messy quickly.

```chialisp
$ run '(list 100 "test" 0xdeadbeef)'
(100 "test" 0xdeadbeef)
```

#### if

`if` automatically puts our `i` statement into the lazy evaluation form so we do not need to worry about the unused code path being evaluated.

```chialisp
$ run '(if 1 (q . "success") (x))' '(100)'
"success"

$ run '(if 0 (q . "success") (x))' '(100)'
FAIL: clvm raise ()
```

#### qq 

`qq` allows us to quote something with selected portions being evaluated inside by using `unquote`.
The advantages of this may not be immediately obvious but are extremely useful in practice as it allows us to substitute out sections of predetermined code.

Suppose we are writing a program that returns another coin's puzzle.
We know that a puzzle takes the form: `(c (c (q . 50) (c (q . 0xpubkey) (c (sha256 2) (q . ())))) (a 5 11))`
However we will want to change 0xpubkey to a value passed to us through our solution.

Note: `@` allows us to access the arguments in the higher level language (`@` == 1)

```chialisp
$ run '(qq (c (c (q . 50) (c (q . (unquote (f @))) (c (sha256 2) ()))) (a 5 11)))' '(0xdeadbeef)'

(c (c (q . 50) (c (q . 0xdeadbeef) (c (sha256 2) ()))) (a 5 11))
```


#### mod

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


### Example: Factorial

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

### Example: Squaring a List

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
