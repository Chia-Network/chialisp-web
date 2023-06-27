---
id: modern_chialisp
title: Modern Chialisp
slug: /modern_chialisp
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

## Description of the new language

### An example of modern chialisp exercising many of the new features:

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

## Complete list of new features

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

### defconst constants

The new defconst form has access to the program surrounding it at compile time.
The value that results is computed at compile time (and causes an error if that
isn't possible for some reason, such as it depends on its own constant, causes
a clvm exception or some other problem) and the compiler chooses the smaller
representation of inlining it or placing it in the environment.

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

    $ brun defconsthash.clvm '(3)'
    0xf60efb25b9e6e3587acd9cf01c332707bb771801bdb5e4f50ea957a29c8dde89
    $ opc -H '(hello . world)'
    9d1890eef772e63013f481b4313eeaae7de4b0601268f380124ad1d74d694d15
    $ brun '(sha256 (q . 0x9d1890eef772e63013f481b4313eeaae7de4b0601268f380124ad1d74d694d15) (q . 3))'
    0xf60efb25b9e6e3587acd9cf01c332707bb771801bdb5e4f50ea957a29c8dde89

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

    (mod (Z)
  
      (include *standard-cl-23*)
  
      (let ((X (+ Z 1))
            (Y (- Z 1)))
        (* X Y)
        )
      )
    
    $ brun simple-let.clvm '(5)'
    24

### at capture

Chialisp supports overlapping variable bindings in which one gives a name to a
collection of further destructuring.

In haskell, it's possible to bind both a container and its contents:

    > data Pt = Pt Int Int deriving Show
    > f p@(Pt x y) = if x == 0 then p else Pt (x - 1) y

Scheme and lisp argument destructuring can stand in for destructuring objects.
In the above case, we can refer to the object's fields separately and the object
itself if we just want to pass it on whole or return it.

You can also use this to simulate Maybe or Options type in a convenient way.

    haskell:
    > f p = fromMaybe 0 $ (\(Pt x y) -> x + y) <$> p
    > f (Just (Pt 3 5))
    8
    > f Nothing
    0

In chialisp:

    chialisp:
    (mod (p) 
      (include *standard-cl-23*) 
      
      (defun F ((@ p (x y))) (if p (+ x y) 0)) 
      
      (F p)
      )
      
    $ brun maybe.clvm '((3 5))'
    8
    $ brun maybe.clvm '(())'
    0

You can also do this with a higher order functions similarly.  In this
implementation, maybe is always a list so that (Just 0) is distinct from
Nothing.  This is longer but more general.  If used to construct fully
generic algorithms, it might be needed.

    (mod (p)
    
      (include *standard-cl-23*)
    
      (defun fromMaybe (v (@ m (content))) (if m content v))
      (defun mapMaybe (f (@ m (content))) (if m (list (a f (list content))) ()))
    
      (fromMaybe 0 (mapMaybe (lambda ((@ pt (x y))) (+ x y)) p))
      )

    $ brun maybe.clvm '(((3 5)))' # Note: ((3 5)) is like (Some (Pt 3 5))
    8
    # brun maybe.clvm '(())'
    ()

### optional types

There is an optional type system described [here](/docs/types_tutorial.md)

### Function closures

Chialisp allows function names to be treated as closures when used as values.
The resulting function is callable with the 'a' operator in the way other
foreign code would be when passed into your program or as a result of a lambda
expression.

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

    $ brun map.clvm '((1 2 3))'
    (a 3 4)

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

    (mod (Z)
    
      (include *standard-cl-23*)
    
      (embed-file hello-data bin "hello.txt")
    
      (sha256 hello-data Z)
      )
      
    $ xxd hello.txt
    00000000: 6865 6c6c 6f0a                           hello.
    $ ./target/debug/brun embedhello.clvm '(world)'
    0x26c60a61d01db5836ca70fefd44a6a016620413c8ef5f259a6c5612d4f79d3b8
    $ ./target/debug/brun '(sha256 (q . 0x68656c6c6f0a) (q . world))'
    0x26c60a61d01db5836ca70fefd44a6a016620413c8ef5f259a6c5612d4f79d3b8

### trace output via cldb

## Complete example: ABC problem

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

## Complete example: Babbage problem

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
