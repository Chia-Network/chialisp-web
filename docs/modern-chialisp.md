---
id: modern-chialisp
title: Modern Chialisp
slug: /modern-chialisp
---
# Modern chialisp

Chialisp can evolve over time and still serve its role in preserving the
representation of older programs in previous iterations of the language by using
a sigil to indicate what tooling version the program was finalized in. The
current sigil is ```*standard-cl-23*```. Use an 'include' form to set the
tooling version. Chialisp has a lot of new features which make programs easier
to understand, read and write. The speed of its optimizer has been improved to
allow faster iteration and several features make chialisp safer. Undefined
variables are no longer treated as values, and return diagnostics instead. Let
bindings and related assign forms allow programs to be structured more logically
and preprocessing is now a separate pass that can be inspected on its own.

It is installable currently from the clvm_tools_rs dev branch:

```shell
$ pip install git+https://github.com/Chia-Network/clvm_tools_rs.git@dev
```

## Description of the new language

### An example of modern chialisp exercising many of the new features:

```chialisp
(mod (X)

  ;; Specify that this program is compiled with *standard-cl-23*.
  ;; After release, the chialisp compiler guarantees that programs
  ;; with a specific sigil (including no sigil) compile to the
  ;; same representation forever (it is a bug that must be fixed
  ;; if a program changes representation in a future compiler
  ;; release).  In this way, program source code can also provide
  ;; enough information to re-produce a puzzle hash from source
  ;; code.
  (include *standard-cl-23*)

  ;; Normal functions are now allowed to be called from macros.
  ;; When run in macro space, they can used special forms to detect
  ;; what language level tokens are given (to differentiate identifiers
  ;; and constants and the like).  Functions can be used both by the
  ;; deployed program and macros or just either.
  (defun n-additions-inner (n value idx)
    (if (> idx n)
      ()
     (qq (c (+ (unquote idx) (unquote value)) (unquote (n-additions-inner n value (+ 1 idx)))))
     )
   )

  ;; The new 'defmac' keyword defines a modern macro.  They're like
  ;; the prior macro system but can't rely on their own definition
  ;; or anything lexically after themselves (like in the C preprocessor).
  ;; You can view the preprocessor expansion of a program before it's
  ;; handed to the compiler proper using the -E switch.
  (defmac n-additions (n value) (n-additions-inner n value 1))

  (defun F (X) (n-additions 3 X))
      
  (defun odd (X) (logand X 1))
      
  ;; Usual higher order functions work like you might hope.
  ;; This filter function takes a predicate, "pred", which
  ;; returns a truthy value to include the result or nil.
  ;; (@ lst (first . rest)) is similar to a similar 
  ;; destructuring form in haskell.
  ;; (@ lst (first . rest))
  ;; generates the same bindings as simultaneously having
  ;; (pred lst)
  ;; and
  ;; (pred (first . rest))
  ;; as an argument list.
  (defun filter (pred (@ lst (first . rest)))
    (if lst
      (if (a pred (list first))
        (c first (filter pred rest))
        (filter pred rest)
        )
      ()
      )
    )
      
  ;; @ destructuring here takes the place of the
  ;; whole argument list.
  (defun sum (@ the-list (first . rest))
    (if the-list
      (+ first (a sum rest))
      0
      )
    )
    
  (assign
    ;; We can destructure the result based on its shape.
    ;; Assign reorders and groups assignments based on their dependencies.
    (A B C) result-list
        
    ;; The bindings can be in any order, like the let forms in elm, haskell
    ;; and others.
    result-list (F X)

    summed (a sum result-list)
    
    ;; We can name 'sum' as a predicate.
    odds (filter odd result-list)

    ;; Result of this form.
    (list summed odds)
    )
  )
```

## Complete list of new features

### defconst constants

The new defconst form has access to the program surrounding it at compile time.
The value that results is computed at compile time (and causes an error if that
isn't possible for some reason, such as it depends on its own constant, causes
a clvm exception or some other problem) and the compiler chooses the smaller
representation of inlining it or placing it in the environment.

```chialisp
(mod (Z)

  (include *standard-cl-23*)

  ; takes a lisp tree and returns the hash of it
  (defun sha256tree1 (TREE)
    (if (l TREE)
      (sha256 2 (sha256tree1 (f TREE)) (sha256tree1 (r TREE)))
      (sha256 1 TREE)
      )
    )

  (defconst HELLO_HASH (sha256tree1 (c "hello" "world")))
    
  (sha256 HELLO_HASH Z)
  )
```
```shell
$ brun defconsthash.clvm '(3)'
0xf60efb25b9e6e3587acd9cf01c332707bb771801bdb5e4f50ea957a29c8dde89
$ opc -H '(hello . world)'
9d1890eef772e63013f481b4313eeaae7de4b0601268f380124ad1d74d694d15
$ brun '(sha256 (q . 0x9d1890eef772e63013f481b4313eeaae7de4b0601268f380124ad1d74d694d15) (q . 3))'
0xf60efb25b9e6e3587acd9cf01c332707bb771801bdb5e4f50ea957a29c8dde89
```

### ```let```, ```let*``` and ```assign``` forms

Chialisp now has local bindings that allow code to be more organized, to use the
same computation more than once without having to explicitly write and call a
separate function to capture the value into a CLVM environment that can be
extracted via variable reference. The bound variables can be referenced in the
body. let and let* forms are classic lisp and scheme, and allow just a name to
be bound from an expression. ```let``` performs all bindings at the same time
(they don't have access to each other) and the other form of let allows each
one to access the values bound before it.  ```assign``` can handle any arrangement
of bindings as long as they don't form a cycle.

```chialisp
(mod (Z)
  
  (include *standard-cl-23*)
  
  (let ((X (+ Z 1))
        (Y (- Z 1)))
    (* X Y)
    )
  )
```
```shell
$ brun simple-let.clvm '(5)'
24
```

### at capture

Chialisp supports overlapping variable bindings in which one gives a name to a
collection of further destructuring.

In haskell, it's possible to bind both a container and its contents:

```haskell
data Pt = Pt Int Int deriving Show
f p@(Pt x y) = if x == 0 then p else Pt (x - 1) y
```

Scheme and lisp argument destructuring can stand in for destructuring objects.
In the above case, we can refer to the object's fields separately and the object
itself if we just want to pass it on whole or return it.

You can also use this to simulate Maybe or Options type in a convenient way.

```haskell
> f p = fromMaybe 0 $ (\(Pt x y) -> x + y) <$> p
> f (Just (Pt 3 5))
8
> f Nothing
0
```

In chialisp:


```chialisp
(mod (p) 
  (include *standard-cl-23*) 
      
  (defun F ((@ p (x y))) (if p (+ x y) 0)) 
      
  (F p)
  )
```
```shell
$ brun maybe.clvm '((3 5))'
8
$ brun maybe.clvm '(())'
0
```

You can also do this with a higher order functions similarly.  In this
implementation, maybe is always a list so that (Just 0) is distinct from
Nothing.  This is longer but more general.  If used to construct fully
generic algorithms, it might be needed.

```chialisp
(mod (p)
    
  (include *standard-cl-23*)
    
  (defun fromMaybe (v (@ m (content))) (if m content v))
  (defun mapMaybe (f (@ m (content))) (if m (list (a f (list content))) ()))
    
  (fromMaybe 0 (mapMaybe (lambda ((@ pt (x y))) (+ x y)) p))
  )
```
```shell
$ brun maybe.clvm '(((3 5)))' # Note: ((3 5)) is like (Some (Pt 3 5))
8
$ brun maybe.clvm '(())'
()
```

### optional types

There is an optional type system described [here](/docs/types-tutorial.md)

### Function closures

Chialisp allows function names to be treated as closures when used as values.
The resulting function is callable with the 'a' operator in the way other
foreign code would be when passed into your program or as a result of a lambda
expression.

```chialisp
(mod (Z)
   
  (include *standard-cl-23*)
    
  (defun add-one (X) (+ X 1))
    
  (defun map (F L)
    (if L
      (c (a F (list (f L))) (map F (r L)))
      ()
      )
    )
    
  (map add-one Z)
  )
```
```shell
$ brun map.clvm '((1 2 3))'
(a 3 4)
```

### lambda forms

Chialisp supports 'lambda' in a similar way to scheme.  The resulting value is
callable with the 'a' operator, has access to the program's functions and constants
and is in general safe to use for higher-order functions.

The above program could be re-stated as:

    (mod (Z)
   
      (include *standard-cl-23*)
    
      (defun map (F L)
        (if L
          (c (a F (list (f L))) (map F (r L)))
          ()
          )
        )
    
      (map (lambda (Y) (+ Y 1)) Z)
      )

### embed and compile include forms

Chialisp programs often need to know the hashes or contents of other programs
and other data and it can be inconvenient to translate it into chialisp source
code (especially if, during development it changes).

Chialisp now gives the ability to embed foreign data, including compiling
programs and embedding their compiled representation.  Since chialisp programs
contain identification about how they should be compiled, it's possible to
include programs from different versions of the language accurately.

```chialisp
(mod (Z)
    
  (include *standard-cl-23*)
    
  (embed-file hello-data bin "hello.txt")
    
  (sha256 hello-data Z)
  )
```
```shell
$ xxd hello.txt
00000000: 6865 6c6c 6f0a                           hello.
$ ./target/debug/brun embedhello.clvm '(world)'
0x26c60a61d01db5836ca70fefd44a6a016620413c8ef5f259a6c5612d4f79d3b8
$ ./target/debug/brun '(sha256 (q . 0x68656c6c6f0a) (q . world))'
0x26c60a61d01db5836ca70fefd44a6a016620413c8ef5f259a6c5612d4f79d3b8
```

### trace output via cldb

The cldb debugger now recognizes a specific clvm expression as indicating a
desire for diagnostic output.  One way to generate it is with a function like

```chialisp
  (defun print (l x) (i (all "$print$" l x) x x))
```

You can use this in your programs to determine what values have been computed
without stopping execution while the program runs:

```chialisp
(mod (X)
  (include *standard-cl-23*)
  
  (defun print (l x) (i (all "$print$" l x) x x))

  (defun C (N X) (if (> 2 (print (list "collatz" N) X)) N (let ((NP1 (+ N 1))) (if (logand 1 X) (C NP1 (+ 1 (* 3 X))) (C NP1 (/ X 2))))))
  
  (C 0 X)
  )
```
```shell
$ ./target/debug/cldb -p c.clsp '(3)'
---
- Print: ((collatz ()) 3)
- Print: ((collatz 1) 10)
- Print: ((collatz 2) 5)
- Print: ((collatz 3) 16)
- Print: ((collatz 4) 8)
- Print: ((collatz 5) 4)
- Print: ((collatz 6) 2)
- Print: ((collatz 7) 1)
- Final: "7"
  Final-Location: "c.clsp(6):50"
```

### defmac and full preprocessing

Preprocessing takes place separately from compilation in modern chialisp.  This
allows easier debugging of macros, allowing the user to view the preprocessor
output and check that generated code is correct, but also separating preprocessing
from CLVM and allowing a greater range of value distinction.  The preprocessor
is running code from the chialisp language, but it operates on values that include
programmer relevant distinctions such as "symbol", "string" and "number" as in
scheme.  The preprocessor can therefore both act differently based on what 
syntactic inputs its presented with and it can also preserve and pass on those
distinctions.  It's necessary to move the preprocessor out of a pure CLVM to be
able to surface errors about misspelled and unbound identifiers.

Chialisp can do a lot with macros.  Just two are builtin because they're useful
for building other macros, 'if' and 'list'.  I'll discuss these later in context
because they require knowing a bit about CLVM.

#### Example: 'and' macro

We can start with an example of a short-circuiting 'and' operator.  In other
versions of lisp and scheme, this operator lets you line up conditions that
depend on each other to keep from having runtime errors.

```chialisp
(mod (X)

  (include *standard-cl-23*)

  (defun and_ (CLAUSES)
    (if (r CLAUSES)
      (qq (if (unquote (f CLAUSES)) (unquote (and_ (r CLAUSES))) ()))
      (f CLAUSES)
      )
    )

  (defmac and CLAUSES (if CLAUSES (and_ CLAUSES) 1))

  (and X (r X) (f (r X)))
  )
```

This works nicely:

```shell
$ run strict-and.clsp > strict-and.clvm
$ brun strict-and.clvm '((1))'
()
$ brun strict-and.clvm '((1 2 3))'
2
```

We can check what this macro unrolls to:

```shell
$ run -E strict-and.clsp
(mod (X) (include *standard-cl-23*) (a (i X (com (a (i (r X) (com (f (r X))) (com ())) @)) (com ())) @))
```

We can format it nicely:

```chialisp
(mod (X)
  (include *standard-cl-23*)

  (a (i X
    (com
      (a (i (r X)
        (com (f (r X)))
        (com ())
        ) @)
      )
    (com ())
    ) @)
  )
```

Below I'll discuss what happened to 'if' (it's a macro itself in this language).
For now, you can think of (a (i X (com Y) (com Z)) @) as a weird way of saying
'(if X Y Z)'.

But what we can see here is:

- First the check of X
  - Then in the true case, a check of (r X)
    - Then in the true case, return (f (r X))
    - Else ()
  - Else ()

Which is just what we want for short-circuiting 'and' in a lisp like language.
Looking again at the central function of the 'and' macro:

```chialisp
  (defun and_ (CLAUSES)
    (if (r CLAUSES)
      (qq (if (unquote (f CLAUSES)) (unquote (and_ (r CLAUSES))) ()))
      (f CLAUSES)
      )
    )
```

One can see that the 'if' it expands to is:

  ```(if (unquote (f CLAUSES)) (unquote (and_ (r CLAUSES))) ())```

Which will cause code for the remaining and_ clauses to run if the first one
was truthy.  and_ is recursive so it'll make a left-heavy tree for any number
of checks we want to proceed the final result.  Each 'if' form emitted by and_
returns nil if its check was false, protecting the remaining ones from running.

We can break down how to develop chialisp macros.  Let's say we want to make 'or'
which returns the first truthy item from a set of input arguments.

We can start with a simple check:

```chialisp
(mod (X Y Z)
  (include *standard-cl-23*)

  (defmac or CLAUSES "hi from or")

  (or X Y Z)
  )
```

```shell
$ run -E or-test.clsp
(mod (X Y Z) (include *standard-cl-23*) "hi from or")
```

And expand on it:

```chialisp
(mod (X Y Z)
  (include *standard-cl-23*)

  (defun or_ (CLAUSES) "hi from or")

  (defmac or CLAUSES (if CLAUSES (or_ CLAUSES) ()))

  (c (or) (or X Y Z))
  )
```

```shell
$ run -E or-test.clsp
(mod (X Y Z) (include *standard-cl-23*) (c () "hi from or"))
```

Then decide how 'or' should work:

  - if there's one item left, then just return it.
  - if the first item is truthy, return it.
  - otherwise return (or ...) of the rest.

Note that CLAUSES is chialisp code the user put in the actual 'or' form, not
the results themselves.

The ```(qq ...)``` form is useful for writing what you'd write in chialisp and
having your macro produce that.  It quotes the code you write so that identifiers
pass through and are interpreted by the compiler after the macro is expanded.
The special 'unquote' form, causes whatever's inside it to be pasted into the
quoted code.  It makes for fairly understandable macros.

```chialisp
(mod (X Y Z)
  (include *standard-cl-23*)

  (defun or_ (CLAUSES)
    (if (r CLAUSES) ;; There are more.
      ;; Mistake: qq is missing.
      (if (unquote (f CLAUSES)) (unquote (f CLAUSES)) (unquote (or_ (r CLAUSES))))
      (f CLAUSES)
      )
    )

  (defmac or CLAUSES (if CLAUSES (or_ CLAUSES) ()))

  (or X Y Z)
  )
```

```shell
or-test1.clsp(7):12-or-test1.clsp(7):19: no such callable 'unquote'
```

So we fix that :-)

```chialisp
(mod (X Y Z)
  (include *standard-cl-23*)

  (defun or_ (CLAUSES)
    (if (r CLAUSES) ;; There are more.
      (qq (if (unquote (f CLAUSES)) (unquote (f CLAUSES)) (unquote (or_ (r CLAUSES)))))
      (f CLAUSES)
      )
    )

  (defmac or CLAUSES (if CLAUSES (or_ CLAUSES) ()))

  (or X Y Z)
  )
```

```shell
$ run -E or-test.clsp
(mod (X Y Z) (include *standard-cl-23*) (a (i X (com X) (com (a (i Y (com Y) (com Z)) @))) @))
```

So this output:

```chialisp
(mod (X Y Z)
  (include *standard-cl-23*)
  (a (i X
    (com X)
    (com (a (i Y
      (com Y)
      (com Z)
      ) @))
    ) @)
  )
```

If X is true then return X, otherwise if Y is true then return Y, else Z.

We can try it:

```shell
$ run or-test.clsp > or-test.clvm
$ $ brun or-test.clvm '(1 0 0)'
1
$ brun or-test.clvm '(0 3 7)'
3
$ brun or-test.clvm '(0 0 7)'
7
$ brun or-test.clvm '(0 0 0)'
()
```

These macros are used together in the ported rosetta code 'ABC' example later.

#### 'if' and 'list' macros

```chialisp
            (defmac if (A B C)
              (qq (a (i (unquote A) (com (unquote B)) (com (unquote C))) @))
              )
```

Which expands ```(if X Y Z)``` to 

```chialisp
(a (i X (com Y) (com Z)) @))
```

'com' is a special form in the chialisp compiler that outputs the code that
does what its argument does, in the context where it's expanded.  Because
chialisp's 'a' operator can run a CLVM value as code, this allows execution
to be passed down to one of two alternatives, based on whether X is truthy.
The 'i' operator returns one of its second or third argument based on the
truthiness of its first.

So the 'if' macro has turned a high level concept 'if' into something that,
with some language support, outputs chialisp that's completely made up of
primitive operators from CLVM.

The 'list' macro is similar:

```chialisp
            (defun __chia__compile-list (args)
              (if args
                (c 4 (c (f args) (c (__chia__compile-list (r args)) ())))
                ()
                )
              )

            (defmac list ARGS (__chia__compile-list ARGS))
```

Which expands ```(list X Y Z)``` to

```chialisp
(4 X (4 Y (4 Z ())))
```

Turning the list again into chialisp that uses CLVM operators in a more
primitive way.  This allows chialisp developers to turn high level ideas into
code that's frugal at the CLVM level.

## Complete example: ABC problem

```chialisp
;; Adapted from https://rosettacode.org/wiki/ABC_problem#Scheme
(mod (word)
    
  (include *standard-cl-23*)
    
  (defconst *blocks*
    (list
      (c "B" "O") (c "X" "K") (c "D" "Q") (c "C" "P") (c "N" "A")
      (c "G" "T") (c "R" "E") (c "T" "G") (c "Q" "D") (c "F" "S")
      (c "J" "W") (c "H" "U") (c "V" "I") (c "A" "N") (c "O" "B")
      (c "E" "R") (c "F" "S") (c "L" "Y") (c "P" "C") (c "Z" "M")))
    
  (defun-inline block-member (e s)
    (logior (= e (f s)) (= e (r s)))
    )
    
  ;; Make short-circuiting and.
  (defun and_ (CLAUSES)
    (if (r CLAUSES)
      (qq (if (unquote (f CLAUSES)) (unquote (and_ (r CLAUSES))) ()))
      (f CLAUSES)
      )
    )

  ;; Chialisp doesn't natively have 'and' and 'or'.
  ;; These macros rewrite (and x y z) ... to (if x (if y (if z 1) ()) ())
  ;; ensuring that y and z execute only if x was true etc.
  ;;
  ;; 'or' stops evaluating if it gets a true result, otherwise continuing.
  (defmac and CLAUSES (if CLAUSES (and_ CLAUSES) 1))
    
  ;; Make short-circuiting or.
  (defun or_ (CLAUSES)
    (if (r CLAUSES)
      (qq (if (unquote (f CLAUSES)) 1 (unquote (or_ (r CLAUSES)))))
      (f CLAUSES)
      )
    )
    
  (defmac or CLAUSES (if CLAUSES (or_ CLAUSES) ()))

  ;; Demonstrates use of higher order functions at call sites.
  ;; CLVM uses the apply operator with an argument list, so
  ;; when functions exist as values, they can be called
  ;; interoperably with foreign code this way.
  ;; ;; p? is a function.
  ;; (a p? (list (f li)) ;; the same as (p? (f li)) if
  ;;                     ;; p? were a defun.
  (defun exists (p? li)
    (and li (or (a p? (list (f li))) (exists p? (r li))))
    )
    
  (defun remove-one (x li)
    (or
      (not li)
      (if (and (= (f (f li)) (f x)) (= (r (f li)) (r x)))
        (r li)
        (c (f li) (remove-one x (r li)))
        )
      )
    )
    
  (defun can-make-list? (li blocks)
    (or
      (not li)
      (exists
        ;; Lambdas now work as one would expect.
        ;; The capture spec (the (& ...) part is similar to
        ;; C++' lambda syntax and it should intuitively reflect
        ;; the cost of the environment capture that the lambda
        ;; carries off.
        (lambda ((& li blocks) block)
          (and
            (block-member (f li) block)
            (can-make-list? (r li) (remove-one block blocks))
            )
          )
        blocks
        )
      )
    )
    
  (defun can-make-word? (word) (can-make-list? word *blocks*))
    
  (defun wordify (W)
    (if W
      (c (substr W 0 1) (wordify (substr W 1)))
      ()
      )
    )
    
  (can-make-word? (wordify word))
  )
```

## Complete example: Babbage problem

```chialisp
;; Adapted from: https://rosettacode.org/wiki/Babbage_problem#Scheme
(mod (N)
  (include *standard-cl-23*)
    
  (defun digits_ (result n)
    ;; The new assign form allows destructuring assignment.
    ;; the clvm divmod instruction returns a pair of (dividend . remainder)
    ;; we can use 'assign' to provide 'd' and 'r' bindings for the two halves
    ;; of the result expression.
    ;;
    ;; Assign can have any number of assignments (they're given as pairs of
    ;; a binding form and an expression).  The assign form is finished with
    ;; a body expression which gives the result.
    (assign
      (d . r) (divmod n 10)
          
      (if d
        (digits_ (c r result) d)
        (c r result)
        )
      )
    )
    
  (defun digits (n) (if n (digits_ () n) ()))
    
  (defun reverse_ (result lst)
    (if lst
      (reverse_ (c (f lst) result) (r lst))
      result
      )
    )
    
  (defun reverse (lst) (reverse_ () lst))
    
  (defun starts-with (lst prefix)
    (if prefix
      (if lst
        (if (= (f prefix) (f lst))
          (starts-with (r lst) (r prefix))
          ()
          )
        ()
        )
      1
      )
    )
    
  (defun ends-with (lst tail)
    ;; does list end with tail?
    (starts-with (reverse lst) (reverse tail))
    )
    
  (defun loop (start fun)
    ;; We can use a let binding to give a name to the result.
    (let ((res (a fun (list start))))
      (if res
        (f res)
        (loop (+ 1 start) fun)
        )
      )
    )
    
  (loop 1
    ;; The loop function calls this inner function to return either a
    ;; wrapped result or nil.  N is captured from the environment where
    ;; the lambda originates from.
    (lambda ((& N) idx)
      (if (ends-with (digits (* idx idx)) (digits N))
        (list idx)
        ()
        )
      )
    )
  )
```

## Complete Example: AVL Tree

```chialisp
;; Port of a verified AVL tree in haskell and agda from:
;; https://doisinkidney.com/posts/2018-07-30-verified-avl.html
;;
;; Given an AVL tree representation and a key and value to add, return
;; the new tree.
(mod (tree k v)
  (include *standard-cl-23*)

  (defconstant LB 0)
  (defconstant IB 1)
  (defconstant UB 2)

  (defconstant LT -1)
  (defconstant EQ 0)
  (defconstant GT 1)

  (deftype Key a ((k : A)))

  (deftype Bound (bound key))
  (defconst lb (new_Bound LB ()))
  (defun ib (k) (new_Bound IB k))
  (defconst ub (new_Bound UB ()))

  (defconstant BalanceL -1)
  (defconstant BalanceO 0)
  (defconstant BalanceR 1)

  (defun-inline max (a b) (if (> a b) a b))

  (deftype Balance (bt))

  (defun-inline balr ((b : Balance)) -> Balance
    (new_Balance
      (if
        (= (get_Balance_bt b) BalanceR)
          BalanceL
          BalanceO
        )
      )
    )

  (defun-inline ball ((b : Balance)) -> Balance
    (new_Balance
      (if
        (= (get_Balance_bt b) BalanceL)
        BalanceL
        BalanceO
        )
      )
    )

  (defconstant Stay 0)
  (defconstant Incr 1)

  (deftype Rebalance t (rt (tree : t)))

  (deftype Node
    (key
     value
     balance
     left
     right
    ))

  (defun-inline rotr-l (x xv left cnode)
    (assign
      y (get_Node_key left)
      yv (get_Node_value left)
      anode (get_Node_left left)
      bnode (get_Node_right left)

      (new_Rebalance Stay (new_Node y yv (new_Balance BalanceO) anode (new_Node x xv (new_Balance BalanceO) bnode cnode)))
      )
    )

  (defun-inline rotr-o (x xv left c)
    (assign
      y (get_Node_key left)
      yv (get_Node_value left)
      a (get_Node_left left)
      b (get_Node_right left)

      (new_Rebalance Incr (new_Node y yv (new_Balance BalanceR) a (new_Node x xv (new_Balance BalanceL) b c)))
      )
    )

  (defun-inline rotr-r (x xv left d)
    (assign
      y (get_Node_key left)
      yv (get_Node_value left)
      a (get_Node_left left)
      left_right (get_Node_right left)
      z (get_Node_key left_right)
      zv (get_Node_value left_right)
      bl (get_Node_balance left_right)
      b (get_Node_left left_right)
      c (get_Node_right left_right)

      (new_Rebalance Stay
        (new_Node z zv
          (new_Balance BalanceO)
          (new_Node z zv (balr bl) a b)
          (new_Node x xv (ball bl) c d)))
      )
    )

  (defun rotr (x xv left right)
    (assign
      balance (get_Node_balance left)
      bt (get_Balance_bt balance)

      (if (= bt BalanceO)
        (rotr-o x xv left right)
        (if (= bt BalanceL)
          (rotr-l x xv left right)
          (rotr-r x xv left right)
          )
        )
      )
    )

  (defun-inline rotl-o (x xv left right)
    (assign
      y (get_Node_key right)
      yv (get_Node_value right)
      b (get_Node_left right)
      a (get_Node_right right)

      (new_Rebalance Incr (new_Node y yv (new_Balance BalanceL) (new_Node x xv (new_Balance BalanceR) left b) a))
      )
    )

  (defun-inline rotl-r (x xv left right)
    (assign
      y (get_Node_key right)
      yv (get_Node_value right)
      b (get_Node_left right)
      a (get_Node_right right)

      (new_Rebalance Stay (new_Node y yv (new_Balance BalanceO) (new_Node x xv (new_Balance BalanceO) left b) a))
      )
    )

  (defun-inline rotl-l (x xv left right)
    (assign
      y (get_Node_key right)
      yv (get_Node_value right)
      left_right (get_Node_left right)
      a (get_Node_right right)

      z (get_Node_key left_right)
      zv (get_Node_value left_right)
      bl (get_Node_balance left_right)
      c (get_Node_left left_right)
      b (get_Node_right left_right)

      (new_Rebalance Stay (new_Node z zv (new_Balance BalanceO) (new_Node x xv (balr bl) left c) (new_Node y yv (ball bl) b a)))
      )
    )

  (defun rotl (x xv left right)
    (assign
      balance (get_Node_balance right)
      bt (get_Balance_bt balance)

      (if (= bt BalanceO)
        (rotl-o x xv left right)
        (if (= bt BalanceR)
          (rotl-r x xv left right)
          (rotl-l x xv left right)
          )
        )
      )
    )

  (defun insert-with-leaf (k v)
    (new_Rebalance Incr (new_Node k v (new_Balance BalanceO) () ()))
    )

  (defun insert-with-node-lt (k kc bl bt tr iw)
    (assign-lambda
      rt (get_Rebalance_rt iw)
      tl_prime (get_Rebalance_tree iw)

      (if (= rt Stay)
        (new_Rebalance Stay (new_Node k kc bl tl_prime tr))
        (if (= bt BalanceL)
          (rotr k kc tl_prime tr)
          (if (= bt BalanceO)
            (new_Rebalance Incr (new_Node k kc (new_Balance BalanceL) tl_prime tr))
            (new_Rebalance Stay (new_Node k kc (new_Balance BalanceO) tl_prime tr))
            )
          )
        )
      )
    )

  (defun insert-with-node-gt (k kc bl bt tl iw)
    (assign
      rt (get_Rebalance_rt iw)
      tr_prime (get_Rebalance_tree iw)

      (if (= rt Stay)
        (new_Rebalance Stay (new_Node k kc bl tl tr_prime))
        (if (= bt BalanceR)
          (rotl k kc tl tr_prime)
          (if (= bt BalanceO)
            (new_Rebalance Incr (new_Node k kc (new_Balance BalanceR) tl tr_prime))
            (new_Rebalance Stay (new_Node k kc (new_Balance BalanceO) tl tr_prime))
            )
          )
        )
      )
    )

  (defun insert-with-node (cmp f v vc node)
    (assign
      tl (get_Node_left node)
      tr (get_Node_right node)
      k (get_Node_key node)
      kc (get_Node_value node)
      bl (get_Node_balance node)
      bt (get_Balance_bt bl)
      compare_result (a cmp (list v k))

      (if (= LT compare_result)
        (insert-with-node-lt k kc bl bt tr (insert-with cmp f v vc tl))
        (if (= EQ compare_result)
          (new_Rebalance Stay (new_Node v (a f (list vc kc)) bl tl tr))
          (insert-with-node-gt k kc bl bt tl (insert-with cmp f v vc tr))
          )
        )
      )
    )

  (defun insert-with (cmp f v vc tree)
    (if tree
      (insert-with-node cmp f v vc tree)
      (insert-with-leaf v vc)
      )
    )

  (defun key-less (A B) (if (> A B) GT (if (> B A) LT EQ)))
  (defun replace-value (A B) B)

  (get_Rebalance_tree (insert-with key-less replace-value k v tree))
  )
```

## Complete Example: Hash Array Mapped Trie (HAMT)

```chialisp
;; HAMT ported from https://github.com/tomjkidd/simple-hamt/blob/master/src/simple_hamt/impl/core.clj
(mod (h idx . rest)
  (include *standard-cl-23*)

  (defconstant number-of-segments 4)
  (defconstant number-of-children 4)
  (defconstant bits-per-segment 2)

  (defun hash* (key)
    (r (divmod key (lsh 1 (+ number-of-children number-of-segments))))
    )

  (deftype HAMT (type bitmap hash-table))
  (deftype HNode (type key value))

  (defun-inline htype (obj) (f obj))

  (defun-inline empty-hash-map* () (new_HAMT "root" 0x00 ()))

  (defun-inline get-hash-segment (hash-value segment)
    (let ((mask 3)
          (shifted (lsh hash-value (* segment -2))))
      (logand mask shifted)
      )
    )

  (defun list-nth (lst n)
    (if n
        (list-nth (r lst) (- n 1))
        (f lst)
        )
    )

  (defun list-replace-nth (lst idx new-item)
    (if idx
        (c (f lst) (list-replace-nth (r lst) (- idx 1) new-item))
        (c new-item (r lst))
        )
    )

  (defun range (n e)
    (if (> e n)
        (c (- (- e n) 1) (range (+ 1 n) e))
        ()
        )
    )

  (defun map (fun l)
    (if l
        (c (a fun (list (f l))) (map fun (r l)))
        ()
        )
    )

  (defun reduce (fun acc lst)
    (if lst
        (reduce fun (a fun (list acc (f lst))) (r lst))
        acc
        )
    )

  (defun drop (idx lst)
    (if idx
        (c (f lst) (drop (- idx 1) (r lst)))
        (r lst)
        )
    )

  (defun segment-seq (hash-value)
    (map
     (lambda ((& hash-value) v) (get-hash-segment hash-value v))
     (range 0 number-of-segments)
     )
    )

  (defun-inline in-bitmap? (bitmap position)
    (logand bitmap (lsh 1 position))
    )

  (defun get-hash-table-index (bitmap position)
    (reduce
     (lambda ((& bitmap) acc cur)
       (if (logand bitmap (lsh 1 cur))
           (+ 1 acc)
           acc
           )
       )
     0
     (range 0 position)
     )
    )

  (defun update-bitmap (bitmap child-index)
    (logior bitmap (lsh 1 child-index))
    )

  (defun update-hash-table (hash-table bitmap child-index k v)
    (assign

     in-bitmap-seq
     (map
      (lambda ((& hash-table bitmap child-index k v) idx)
        (let
            ((node
              (if (= idx child-index)
                  (new_HNode "node" k v)
                  (if (in-bitmap? bitmap idx)
                      (let ((htidx (get-hash-table-index bitmap idx)))
                        (list-nth hash-table htidx)
                        )
                      ()
                      )
                  )
               ))
          (list idx node)
          )
        )
      (range 0 number-of-children)
      )

     (reduce
      (lambda (acc (index node))
        (if node
            (c node acc)
            acc
            )
        )
      ()
      in-bitmap-seq
      )
     )
    )

  (defun get* (hm hash-val seg-index)
    (assign
     bitmap (get_HAMT_bitmap hm)
     hash-table (get_HAMT_hash-table hm)
     index (get-hash-segment hash-val seg-index)
     empty? (not (in-bitmap? bitmap index))

     (if empty?
         ()
         (assign
          hash-table-index (get-hash-table-index bitmap index)
          node (list-nth hash-table hash-table-index)
          type (htype node)
          key (get_HNode_key node)
          value (get_HNode_value node)

          (if (= type "node")
              (if (= key hash-val)
                  value
                  ()
                  )

              (get* node hash-val (+ 1 seg-index))
              )
          )
         )
     )
    )

  (deftype SubhashBuilder (colliding-segs finished subhash-node))

  (defun insert (hm child-index k v)
    (assign
     bitmap (get_HAMT_bitmap hm)
     hash-table (get_HAMT_hash-table hm)
     new-bitmap (update-bitmap bitmap child-index)
     new-hash-table (update-hash-table hash-table bitmap child-index k v)
     (new_HAMT (get_HAMT_type hm) new-bitmap new-hash-table)
     )
    )

  (defun recur-subhash-node (acc rem sh)
    (if (not (f rem))
        sh
        (recur-subhash-node
         acc
         (r rem)
         (new_HAMT
          "subh"
          (update-bitmap 0 (f rem))
          (list sh)
          )
         )
        )
    )

  (defun enumerate-inner (n lst)
    (if lst
        (c (c n (f lst)) (enumerate-inner (+ n 1) (r lst)))
        ()
        )
    )

  (defun enumerate (lst) (enumerate-inner 0 lst))

  (defun has-nonempty-sublist (items)
    (if items
        (l (f items))
        ()
        )
    )

  (defun slices (items)
    (if (has-nonempty-sublist items)
        (c (map (lambda (L) (f L)) items) (slices (map (lambda (L) (r L)) items)))
        ()
        )
    )

  (defun build-subhash (old-node new-node seg-index)
    (assign
     old-segs (drop seg-index (segment-seq (hash* (get_HNode_key old-node))))

     new-segs (drop seg-index (segment-seq (hash* (get_HNode_key new-node))))

     segs (enumerate (slices (list old-segs new-segs)))

     sh (reduce
         (lambda ((& old-node new-node) acc (i o n))
           (let ((finished (get_SubhashBuilder_finished acc))
                 (new-shb (get_SubhashBuilder_colliding-segs acc)))

             (if finished
                 acc
                 (if (= o n)
                     (new_SubhashBuilder
                      (c o new-shb)
                      ()
                      (get_SubhashBuilder_subhash-node acc)
                      )
                     (assign

                      subhash (new_HAMT "subh" 0x00 ())
                      old-hnode (get_HNode_value old-node)

                      subhash-with-old
                      (insert subhash o (get_HNode_key old-node) old-hnode)

                      new-hnode (get_HNode_value new-node)
                      subhash-with-old-and-new
                      (insert subhash-with-old n (get_HNode_key new-node) new-hnode)

                      new-subhash-node
                      (recur-subhash-node
                       acc
                       new-shb
                       subhash-with-old-and-new
                       )

                      (new_SubhashBuilder
                       new-shb
                       1
                       new-subhash-node
                       )
                      )
                     )
                 )
             )
           )

         (new_SubhashBuilder () () ())
         segs
         )

     (get_SubhashBuilder_subhash-node sh)
     )
    )

  (defun assoc-collision (hm k v hash-val seg-index)
    (assign
     bitmap (get_HAMT_bitmap hm)
     hash-table (get_HAMT_hash-table hm)
     child-index (get-hash-segment hash-val seg-index)
     hash-table-index (get-hash-table-index bitmap child-index)
     collision-node (list-nth hash-table hash-table-index)
     type (get_HNode_type collision-node)
     key (get_HNode_key collision-node)
     value (get_HNode_value collision-node)
     hm-type (get_HAMT_type hm)
     hm-bitmap (get_HAMT_bitmap hm)
     old-node collision-node

     (if (= type "node")
         (assign
          hm-table (get_HAMT_hash-table hm)
          (if (= k key)
              (assign
               new-node (new_HNode type key v)
               new-hash-table (list-replace-nth hash-table hash-table-index new-node)

               (new_HAMT hm-type hm-bitmap new-hash-table)
               )
              (assign
               new-node (new_HNode type k v)
               new-subhash-node (build-subhash old-node new-node (+ 1 seg-index))
               new-hash-table (list-replace-nth hash-table hash-table-index new-subhash-node)
               (new_HAMT hm-type hm-bitmap new-hash-table)
               )
              )
          )
         (assign
          new-subhash-node (assoc* collision-node k v hash-val (+ 1 seg-index))
          new-hash-table (list-replace-nth hash-table hash-table-index new-subhash-node)
          (new_HAMT hm-type hm-bitmap new-hash-table)
          )
         )
     )
    )

  (defun assoc* (hm k v hash-val seg-index)
    (assign
     bitmap (get_HAMT_bitmap hm)
     hash-table (get_HAMT_hash-table hm)
     child-index (get-hash-segment hash-val seg-index)
     collision-detected? (in-bitmap? bitmap child-index)

     (if (not collision-detected?)
         (insert hm child-index k v)
         (assoc-collision hm k v hash-val seg-index)
         )
     )
    )

  ;; External interface
  (defun empty-hash-map () empty-hash-map*)

  (defun get (hm k)
    (get* hm (hash* k) 0)
    )

  (defun assoc (hm k v)
    (assoc* hm k v (hash* k) 0)
    )

  (if (not h)
      (new_HAMT () () ())
      (if rest
          (assoc h idx (f rest))
          (get h idx)
          )
      )
  )
```
