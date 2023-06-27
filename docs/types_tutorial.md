# Tutorial for typed chialisp

## Where is it

Currently in branch 20220629-typed-language in https://github.com/Chia-Network/clvm_tools_rs
Build with cargo

## How to use

Type annotations are optional.  Here's a simple chialisp program:

    (mod (X)
      (defun F (P X) (if X (F (sha256 P (f X)) (r X)) P))
      (F (sha256 1) X)
      )
      
(testx.cl)

You can run it, or type check with

    run --typecheck testx.cl
    
If the typecheck succeeds, it outputs the program.

Let's say we want to guarantee that the program returns a hash-like atom.

    (mod (X) -> Atom32
      (defun F (P X) (if X (F (sha256 P (f X)) (r X)) P))
      (F (sha256 1) X)
      )

Adding -> and a type after the arguments in a function or mod is one way to
add a type annotation.

You can run typecheck to see that this doesn't complain.
By default, functions in chialisp are maximally permissive, taking and
returning the Any type.  This is equivalent.

    (mod (X) -> Atom32
      (defun F (P X) : (Any -> Any) (if X (F (sha256 P (f X)) (r X)) P))
      (F (sha256 1) X)
      )

You can specify the whole type of a chialisp function by following the arguments
with a : and a function type (type -> type).  Note that in chialisp, the only
real punctuation is ( and ), so you must separate type punctuation with spaces.

This typechecks, because Any is able to fit any time, just like when there's no
type checking at all.

You can try something that won't type check:

    (mod (X) -> Atom32
      (defun F (P X) : (Any -> Atom) (if X (F (sha256 P (f X)) (r X)) P))
      (F (sha256 1) X)
      )

The failed type check messages are evolving, but it will say something like:

    subtype, don't know what to do with: Atom Atom32
    
Pointing to testx3.cl(2):28-testx3.cl(2):32

    (mod (X) -> Atom32
      (defun F (P X) : (Any -> Atom) (if X (F (sha256 P (f X)) (r X)) P))
                               ^^^^
      (F (sha256 1) X)
      )

What it's trying to convey (and will improve with better error messages) is that
Atom is not a subtype of Atom32 (which is the result of the function as a whole).
We've detected an error of a kind; the program is supposed to return a hash-like
Atom, called Atom32 but it's declared to return just an Atom, which is the number,
string and byte array type in chialisp.

We can fix this by giving it a more specific result:

     (mod (X) -> Atom32
       (defun F (P X) : (Any -> Atom32) (if X (F (sha256 P (f X)) (r X)) P))
       (F (sha256 1) X)
       )

Ok but how does this help?  Let's try tightening it up by specifing the type of
P.  To specify a parameter type in a function definition or struct definition,
put it in a list with a : and a type.

    (mod (X) -> Atom32
      (defun F ((P : Atom) X) -> Atom32 (if X (F (sha256 P (f X)) (r X)) P))
      (F (sha256 1) X)
      )

     testx5.cl(2):18-testx5.cl(2):22: subtype, don't know what to do with: Atom Atom32

Because it returns either its own result or P, if the type of P can't unify with
that type (here Atom32), then it doesn't typecheck.

Let's try a different failure:

    (mod (X) -> Atom32
      (defun F ((P : Atom32) X) -> Atom32 (if X (F (* P (f X)) (r X)) P))
      (F (sha256 1) X)
      )

And after fixing that, we can try giving F the wrong type of argument in the
body of the module:

    (mod (X) -> Atom32
      (defun F ((P : Atom32) X) -> Atom32 (if X (F (sha256 P (f X)) (r X)) P))
      (F 1 X)
      )

It fails:

    ./testx7.cl(3):6: subtype, don't know what to do with: Atom Atom32
    
Here:

    (mod (X) -> Atom32
      (defun F ((P : Atom32) X) -> Atom32 (if X (F (sha256 P (f X)) (r X)) P))
      (F 1 X)
         ^
      )

We've tried to make gradual typing as gradual as possible, but also provide
decent power.

That having been said, here's the same thing with types fully specified:

    (mod ((X : (List Atom))) -> Atom32
      (defun F ((P : Atom32) (X : (List Atom))) -> Atom32 (if X (F (sha256 P (f X)) (r X)) P))
      (F (sha256 1) X)
      )

This makes the code more rigid in some ways, but may help diagnose bugs that
are difficult to see visually.  You get to define the type environment of your
programs for the most part, the builtins are all things that serve specific
roles in allowing basic typing to work as one might think of it:

    Unit -> The type of () expressions in chialisp.

    Atom -> The type of numbers and strings in chialisp.

    Atom32 -> The type of atoms that are hash-sized when we're certain.

    (Nullable x) -> Any type X or Unit

    (Pair a b) -> The result of (c a b)
    
    structs -> more on this later
    
    Any -> A type which fits all other types and allows all other types.

    (List x) -> (Nullable (Pair x (List x))), which allows you
    to talk about chialisp lists that contain all things of one
    type.

    (FixedList a b ... z) -> Pairs containing things of type a, b, ...
    in their left hand and a follower in the right, like this:
    
    (mod () -> (FixedList Atom Unit Atom32)
      (list 1 () (sha256 1))
      )

Underneath, the type given by (FixedList Atom Unit Atom32) is

    (Pair Atom (Pair Unit (Pair Atom32 Unit)))
    
You can see this in what list evaluates to (here I'm using the repl to
partially evaluate the list macro's output by using variables I haven't
defined yet).
    
    $ ./target/debug/repl 
    >>> (list x y z)
    (c x (c y (c z (q))))
        
There is one other type that is more complicated, which I'll talk about later.

What else can we do?

We can keep f and r from working on things we know are Atoms.

    (mod () (f 1))

    testfa.cl(1):12: subtype, don't know what to do with: Atom (Pair (exists tvar_$_23) (exists tvar_$_24))
    
There are type variables here (exists tvar_$_23) and (exists tvar_$_24) because
the type system hasn't determined what might have been intended at the step it's
at in type checking.  In this case there'd be no way to know.

But we can do this:

    (mod () (f (list 1 2 3)))

Note that since list is a macro returning a definite result, the first element
is definitely a pair.

What about this:

    (mod () (defun F () -> (List Atom) (list 1 2 3)) (f (F)))

Yes, but how?  Doesn't List x = (Nullable (Pair x (List x))) ?

I will talk about that in detail in a while, but for now, I defined f and r
with a complicated type so they don't take away any expected uses.  In the
future, there'll be tighter, safer ways to work on lists that distinguish
empty lists.

Let's talk about the types of functions.  In this type system, function types are
like anything else, but chialisp has rules most functional languages don't, so
what i came up with is:

- All functions in chialisp are unary (they logically take one argument).

- They all provide one return value (which can be in the form of a complex type).

- Code you can run in apply (a operator) is something else that I'll talk about
later on.

So we model the type of a chialisp function in the actual way it's called in
clvm code, with an environment that has bindings:

    (mod (X Y Z) (if X Z Y))

We call it like this:

    ./target/debug/cldb '(mod (X Y Z) (if X Z Y))' '(0 2 3)'
    ...
    - 'Final': '2'
      'Final-Location': '*command*(1):22'

Note that the actual argument structure is typed:

    (Pair Any (Pair Any (Pair Any Unit)))

Now I can explain the type of the clvm f operator; i cheated.  The type level
definition of the f operator (r is similar) are:

    (forall f0
      (forall r0 
        ((Pair (Nullable (Pair f0 r0)) ()) -> f0)
        )
      )

There is a wrapping pair for the argument type, because all clvm operators
take arguments as pairs.  If it was a defun, we'd give it this way:

    (defun fdef (L) : (forall f (forall r ((FixedList (Nullable (Pair f r))) -> f))) (f L))

As in:

    (mod ()
      (defun fdef (L) : (forall f (forall r ((FixedList (Nullable (Pair f r))) -> f))) (f L))
      (defun F () -> (List Atom) (list 1 2 3))
      (fdef (F))
      )

It's complicated, but we can write functions that pass on types from their
arguments using type variables.  You declare your own type variables using
forall.  There are complicated ways to use type variables for type erasure
but they are beyond the scope of this document and untested atm.

Something to note here is that there are type variables in this type system.
Most of the time end users won't need to use them directly, but they can be used
to make data structures and abstractions for many purposes.

So let's look at what we can do with types we define ourselves:

Let's try the repl:

    $ ./target/debug/repl 
    >>> (deftype Counter ((count : Atom)))
    (q)
    >>> (defun bump_ctr (c) (new_Counter (+ (get_Counter_count c) 1)))
    (q)
    >>> (bump_ctr (bump_ctr (new_Counter 1)))
    (q 3)

So that gives us a way to make data structures with constructors and accessors.
What else can we do?

    (mod ((V : Atom)) -> Counter
      (deftype Counter ((count : Atom)))
      (list V)
      )

Leads to

    typect1.cl(3):9-typect1.cl(9):30: subtype, don't know what to do with: (Pair Atom ()) Counter

So a struct isn't just its representation, it's its own type.

    (mod ((V : Atom)) -> Counter
      (deftype Counter ((count : Atom)))
      (new_Counter V)
      )

This is better.

Structs can have arguments that allow you to do more with them:

    (mod ((V : Atom)) -> Atom
      (deftype A ((thing : Atom)))
      (deftype Counter x ((count : Atom) (obj : x)))
      (get_A_thing (get_Counter_obj (new_Counter V (new_A 3))))
      )

Of course you can use them together:

    (mod ((V : Atom)) -> (FixedList Atom Atom32)
      (deftype A ((thing : Atom)))
      (deftype B ((hash : Atom32)))
      (deftype Counter x ((count : Atom) (obj : x)))
      (list
        (get_A_thing (get_Counter_obj (new_Counter V (new_A 3))))
        (get_B_hash (get_Counter_obj (new_Counter V (new_B (sha256 4)))))
        )
      )

## About the apply operator and abstract types

chialisp is unusual in functional languages (more like lisp, but not exactly) in
that function references with closures are not first class values.  There are
complex historical reasons for this that are outside the scope of this tutorial.
As such, chialisp has an operator for running compiled clvm code.  It's like
when languages have a general FFI call operation that takes a pointer or an
array of actual code for the CPU the program is running on.  In the same way,
chialisp can take code that promises to do a specific thing or create its own
and using the ffi call operation, run it and produce the result.

chialisp also traditionally uses macros for some features, especially 'if', and
because of the way it was structured in its history, passes code out of the macro
wrapped in a special form called 'com' which causes the code to be compiled in
the context the code is returned to.

It looks like this:

    (defmacro clvm-of (S) (qq (com (unquote S))))
    
And the result of this macro is the compiled code for whatever S does.

So let's see what kind of thing it is:

    (mod () -> Unit
      (defmacro simply (S) (qq (com (unquote S))))
      (simply (list 1 2 3))
      )

Something many programmers do (i participated in a study of the way people write
typed functional programs https://twitter.com/jplubin/status/1354134079822647301
which cited others) is to propose the wrong type for something so the compiler
will show you what its idea is:

    *type-prelude*(1):1-*type-prelude*(9):30: subtype, don't know what to do with: (Exec (Any -> (Pair Atom (Pair Atom (Pair Atom ()))))) ()
    
Hmm so the type of the compiled code is (in this case)

    (Exec (Any -> (FixedList Atom Atom Atom)))
    
We don't track the type of the current environment (it's a bit out of scope of
what most people do, so we treat it as Any).  There's a function type in there
returning (FixedList Atom Atom Atom) corresponding to the (list 1 2 3) we gave
this code.

What is Exec?

    (Exec x) <- An abstract type we can use for various purposes.
    
So we can look at the type of 'a'

    (forall f0
      (forall r0 
        ((FixedList (Exec (f0 -> r0)) f0) -> r0)
        )
      )
      
'a' takes this 'Exec' enriched type, a wrapping of function f0 -> r0, and
given a pair of that and the function's argument type f0, yields the function's
result type r0.  We can say this because the type system solves these type
variables based on information it has.

So let's use 'a'

    (mod () -> Unit
      (defmacro simply (S) (qq (com (unquote S))))
      (a (simply (list 1 2 3)) ())
      )

We get:

    typem1.cl(3):20-typem1.cl(9):30: subtype, don't know what to do with: (FixedList Atom Atom Atom) ()
    
The error starts at the '1' and gets wacky due to the end location being in
a different source file in the standard macros (in list).  I need to fix that
:-).  The important thing is we know that 'a' passed through the type of the
code given by com.  We can write the type and it's fine.

    (mod () -> (List Atom) ;; or (FixedList Atom Atom Atom)
      (defmacro simply (S) (qq (com (unquote S))))
      (a (simply (list 1 2 3)) ())
      )

When given code from the outside, you can properly describe what it does at the
type level:

    (mod ((code : (Exec ((FixedList Atom Atom) -> Atom)))) -> Atom
      (+ 1 (a code (list 2 3)))
      )

And we can run it:

    $ ./target/debug/cldb testm2.cl '((+ 2 5))'
    ...
    - 'Final': '6'
      'Final-Location': 'typem2.cl(2):4'

And like this:

    $ ./target/debug/cldb testm2.cl '((* 2 5))'
    ...
    - 'Final': '7'
      'Final-Location': 'typem2.cl(2):4'

We can write the type of the curry function:

    (mod ((code : (Exec ((FixedList Atom Atom) -> Atom)))) -> Atom
      (defun curry-1 (code arg) : (forall a (forall b (forall c ((FixedList (Exec ((Pair a b) -> c)) a) -> (Exec (b -> c))))))
        (coerce (list 2 (c 1 code) (list 4 (c 1 arg) 1)))
        )
      (a (curry-1 code 2) (list 3))
      )

Which introduces the 'coerce' function.  You can use it to promise that things
turn out like you say.  The chialisp type system can't analyze clvm code
(and doesn't know what's in the argument to the program beyond what you promise).
You can write functions that are type sound, but do specific things using coerce
whose type is (Any -> Any).
