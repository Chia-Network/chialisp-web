---
id: high_level_lang
title: Language Overview
slug: /
---

Chialisp is a high-level, LISP-like language for implementing smart-contract capabilities called **puzzles** on Chia. Chialisp program compiles into Chialisp Virtual Machine (CLVM). CLVM is serialized and stored directly on the blockchain and is a matter of consensus; it can never be changed. While CLVM powers Chialip, they share many fundamental concepts. Click through the [CLVM basic](clvm/basics) to learn more about CLVM.

If you are new to Chialisp, check out the [Chialisp Getting Started Guides](getting_started/intro_to_chialisp) first.

## Values
There are no variables in Chialisp. Values are stored in two different objects: [atoms](https://en.wikipedia.org/wiki/Lisp_(programming_language)#Atoms) and [cons boxes](https://en.wikipedia.org/wiki/Cons). A cons box is a pair of objects; the objects in a cons box can either be an atom or another cons box.

### Atoms
An atom is an array of bytes. These bytes can be interpreted both as a signed big-endian integer or a byte string, depending on the operator using it. 

All atoms are immutable; therefore, operators that perform computations on atoms create new atoms for the result.

Atoms can be printed in three different ways: decimal, hexadecimal, and string. Hexadecimal values are prefixed by `0x`, and strings are quoted in `"`.

### Cons Boxes
Cons boxes are represented as parentheses with two elements separated by a `.`.
For example,
```chialisp
(200 . "hello")

("hello" . ("world" . "!!!"))
```


A cons box always has two elements. For example, the following is not a valid cons box,
```chialisp
(200 . 300 . 400)
```

## Chialisp program

The building blocks of the Chialisp program are lists and operators. A list is any space-separated, ordered group of one or more items inside parenthesis brackets. A strict definition of a list is a representation of consecutive cons boxes terminated in a null atom `()`. 
Chialisp simplified the representation by allowing omitting implied inner parenthesis brackets in the list. For example, the following expressions are equal:
```chialisp
(200 . (300 . (400 . ())))

(200 300 400)
```

A Chialisp program is a list of [prefix notation](https://en.wikipedia.org/wiki/Polish_notation) form. A valid Chialisp program requires:
1. The first item in the list must be a valid operator
2. Every item after the first must be a valid program

Take the arithmetic addition operator '+' for example; the list (+ 2 3) computes the sum of integers 2 and 3. 

```chialisp
run '(+ 2 3)'
5
```

## Operators 
### Arithematic 
The arithmetic operators `+, -, *, /` and divmod treat their arguments as signed integers.

| Operator | Syntax   | Description|
| :---: | ---------- |-------------- |
| <pre>+</pre> |  <pre>(+ a0 a1 ...)</pre>| It takes any number of integer operands and sums them. If given no arguments, zero is returned. |
| <pre>-</pre>| <pre>(- a0 a1 ...)</pre> | It takes one or more integer operands and adds a0 to the negative of the rest. Giving zero arguments returns 0.|
| <pre>*</pre>|  <pre>(* a0 a1 ...)</pre> | It takes any number of integer operands and returns the product.|
|<pre>/</pre>|<pre>(/ A B)</pre> | It divides two integers and returns the floored quotient. Rounding for `/`: <ul> <li>`(/ 1 2)` => ()</li> <li>`(/ 2 2)` => 1</li> <li>`(/ 4 2)` => 2 </li></ul> The treatment of negative dividend and divisors is as follows:<ul><li>`(/ -1 1)` => -1</li><li>`(/ 1 -1)` => -1</li><li>`(/ -1 -1)` =>  1</li></ul> A division with a remainder always rounds towards negative infinity, not toward zero:<ul><li>`(/ -3 2)` => -2</li><li>`(/ 3 2)` => 1</li></ul> This means that `-a / b` is not always equal to `-(a / b)` |
|<pre>divmod</pre>|<pre>(divmod A B)</pre> | Ittakes two integers and returns a cons-box containing the floored quotient and the remainder. | 

:::note
Once Chia’s blockchain reaches a height of 2,300,000 (around July 22, 2022), all nodes running version 1.3 or greater will reject all spends which attempt to use the div operator for negative division. [Learn more about the change.](https://www.chia.net/2022/03/04/divided-we-fork.en.html)
:::

### Control Flow
| Operator | Syntax   | Description|
| :---: | ---------- |-------------- |
|<pre>if</pre> | <pre> (if A B C) </pre> |If A is (), return C, otherwise return B. `if` condition takes exactly three operands .|
|<pre> x</pre> | <pre>(x X Y ...)</pre> | `x` raises exception and immediately fails execution, with the argument list passed up into the (python) exception. No other CLVM instructions are run after this instruction is evaluated It takes an arbitrary number of arguments (even zero). |

:::note
`if` does a lazy evaluation form, so we do not need to worry about the unused code path being evaluated.

```chialisp
$ run '(if 1 (q . "success") (x))' '(100)'
"success"

$ run '(if 0 (q . "success") (x))' '(100)'
FAIL: clvm raise ()
```
:::

### Comparison
| Operator | Syntax   | Description|
| :---: | ---------- |-------------- |
|<pre>=</pre> |<pre>(= A B)</pre>| `=` equal returns 1 if A and B are both atoms and both equal. Otherwise (). Do not use this to test if two programs are identical. That is determined by their tree hash. Nil tests equal to zero, but nil is not equal to a single zero byte.|
|<pre>></pre> | <pre>(> A B)</pre>| Returns 1 if A and B are both atoms and A is greater than B, interpreting both as two's complement signed integers. Otherwise (). (> A B) means A > B in infix syntax.|
|<pre>>s</pre> |<pre>(>s A B)</pre> |Returns 1 if A and B are both atoms and A is greater than B, interpreting both as an array of unsigned bytes. Otherwise (). Compared to strcmp. (>s "a" "b") => ()|
|<pre>not</pre>|<pre>(not A)</pre>| Returns 1 if A evaluates to (). Otherwise, returns ().|
|<pre>all</pre> |<pre>(all A B ...)</pre> |Takes an arbitrary number of arguments (even zero). Returns () if any of the arguments evaluate to (). Otherwise, returns 1.|
|<pre> any</pre> |<pre>(any A B ...)</pre> |Takes an arbitrary number of arguments (even zero). Returns 1 if any of the arguments evaluate to something other than (). Otherwise, returns ().|

### Constructing a List
`list` takes any number of parameters and returns them put inside a list.
This saves us from having to manually create nested `(c (A) (c (B) (q ())))` calls, which can get messy quickly.

```chialisp
$ run '(list 100 "test" 0xdeadbeef)'
(100 "test" 0xdeadbeef)
```



### Quote 

`qq` allows us to quote something with selected portions being evaluated inside by using `unquote`.
The advantages of this may not be immediately obvious but are extremely useful in practice as it allows us to substitute sections of predetermined code.

Suppose we are writing a program that returns another coin's puzzle.
We know that a puzzle takes the form: `(c (c (q . 50) (c (q . 0xpubkey) (c (sha256 2) (q . ())))) (a 5 11))`
However, we will want to change 0xpubkey to a value passed to us through our solution.

Note: `@` allows us to access the arguments in the higher-level language (`@` == 1)

```chialisp
$ run '(qq (c (c (q . 50) (c (q . (unquote (f @))) (c (sha256 2) ()))) (a 5 11)))' '(0xdeadbeef)'

(c (c (q . 50) (c (q . 0xdeadbeef) (c (sha256 2) ()))) (a 5 11))
```

## Program Structure

### mod
`(mod A B)` takes two or more parameters. The first is used to name parameters that are passed in, and the rest are the higher-level script that is to be compiled.

Below we name our arguments `arg_one` and `arg_two` and then access `arg_one` inside our main program.

```chialisp
$ run '(mod (arg_one arg_two) (list arg_one))'
(c 2 ())
```

As you can see, it returns our program in compiled lower level form.

```chialisp
$ brun '(c 2 ())' '(100 200 300)'
(100)
```

You may be wondering what other parameters `mod` takes between variable names and source code.


### include

If you want to import some functionality that you frequently use without having to copy/paste it between files, you can use `include`:

```chialisp
;; condition_codes.clvm
(
 (defconstant AGG_SIG_ME 50)
 (defconstant CREATE_COIN 51)
)
```

```chialisp
;;main.clvm
(mod (pubkey msg puzzle_hash amount)

 (include "condition_codes.clvm")

 (list (list AGG_SIG_ME pubkey msg) (list CREATE_COIN puzzle_hash amount))

)
```

When running main.clvm with `run`, make sure to use the `-i` option to specify in which directories to look for includable files.
If our condition_codes.clvm file was in the directory `./libraries/chialisp/`, then you would pass that to `run` so that it knows where to find it:

```
run -i ./libraries/chialisp/ main.clvm
```

Also, note that the included files are in a special format. Everything that is defined goes into a single set of parentheses like in condition_codes.clvm above.
You can then use any of those constants/functions when writing your program without having to import each one individually.
The compiler will only include things that you use, so don't worry about including a large library file when attempting to optimize the size of your program.

### Functions, Macros and Constants

In the higher-level language we can define functions, macros, and constants before our program by using `defun`, `defun-inline`, `defmacro`, and `defconstant`.

We can define as many of these as we like before the main source code.
Usually, a program will be structured like this:

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

- Functions can reference themselves in their code, but macros and inlines cannot as they are inserted at compile time.
- Both functions and macros can reference other functions, macros, and constants.
- Macros that refer to their parameters must be quasiquoted with the parameters unquoted
- Be careful of infinite loops in macros that reference other macros.
- Comments can be written with semicolons
- Inline functions are generally more cost-effective than regular functions except when reusing calculated arguments: `(defun-inline foo (X) (+ X X)) (foo (* 200 300))` will perform the expensive multiplication twice


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

We can save these files to .clvm files, which can be run from the command line.
Saving the above example as `factorial.clvm` allows us to do the following.

```chialisp
$ run factorial.clvm
(a (q 2 2 (c 2 (c 5 ()))) (c (q 2 (i (= 5 (q . 1)) (q 1 . 1) (q 18 (a 2 (c 2 (c (- 5 (q . 1)) ()))) 5)) 1) 1))

$ brun '(a (q 2 2 (c 2 (c 5 ()))) (c (q 2 (i (= 5 (q . 1)) (q 1 . 1) (q 18 (a 2 (c 2 (c (- 5 (q . 1)) ()))) 5)) 1) 1))' '(5)'
120
```

### Example: Squaring a List

Now let's do an example that uses macros as well.
When writing a macro, it must be quasiquoted with the parameters being unquoted.

We can also take this time to show another feature of the compiler.
You can name each parameter in a list or name the list itself.
This works at any place where you name parameters and allows you to handle lists where you aren't sure of the size.

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