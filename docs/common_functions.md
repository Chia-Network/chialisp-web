---
id: common_functions
title: Common Functions and Design Patterns 
---

When you start to write full smart coins, you will start to realize that you will need certain common functionality in a lot of puzzles.
Let's go over how to include them and what some of them are:



## sha256tree

When puzzles are hashed, they are not simply serialized and passed to sha256.
Instead, we take the *tree hash* of the puzzle.

Recall that every clvm program can be represented as a binary tree.
Every object is either an atom (a leaf of the tree) or a cons box (a branch of the tree).
When we hash the puzzle, we start at the leaves of the tree and hash our way up, concatenating either a 1 or a 2 to denote that it's either an atom or a cons box.
Once a cons box is hashed, it becomes a new leaf to be hashed into its parent cons box and the process recurses.
Here's what that looks like in Chialisp:

```chialisp
(defun sha256tree
 (TREE)
 (if (l TREE)
 (sha256 2 (sha256tree (f TREE)) (sha256tree (r TREE)))
 (sha256 1 TREE)
 )
)
```

It is extremely useful to calculate tree hashes within a Chialisp puzzle.
You can assert puzzles of other coins, condense puzzles for easier signing, and make CREATE_COIN conditions that are dependent on some passed-in data.


## Currying

_Currying_ is named in honor of the mathematician Haskell Curry. In math, currying is the technique of converting a function that takes multiple arguments into a sequence of functions that each take a single argument. For more information on the mathematical concept of currying, see [Wikipedia](https://en.wikipedia.org/wiki/Currying "Currying in math").

In Chialisp, currying is a technique of pre-committing a portion of the solution to a puzzle. It works like hard-coding, but it's more versatile because it allows for the same puzzle to be reused. 

For example, if a puzzle requires a password in its solution, a Chialisp developer could hard-code the password into the puzzle. But what if the developer later wanted to create a new smart coin with a different password? He or she would have to make a copy of the puzzle and swap out all instances of the old password for the new one. This would be quite inconvenient, especially in a puzzle with a complex solution.

The developer could avoid this inconvenience by using a variable for the password. But that wouldn't be secure -- a farmer could change the password and steal the coin. This is where currying comes in -- it allows the developer to pre-commit without hard-coding.

Currying is an extremely important concept in Chialisp that is responsible for almost the entirety of how the state is stored in coins.
The idea is to pass in arguments to a puzzle *before* it is hashed.
When you curry, you commit to solution values so that the individual solving the puzzle cannot change them.
Let's take a look at how this is implemented in Chialisp:

```chialisp
; curry.clvm
(
 ;; utility function used by curry
 (defun fix_curry_args (items core)
 (if items
 (qq (c (q . (unquote (f items))) (unquote (fix_curry_args (r items) core))))
 core
 )
 )

 ; (curry sum (list 50 60)) => returns a function that is like (sum 50 60 ...)
 (defun curry (func list_of_args) (qq (a (q . (unquote func)) (unquote (fix_curry_args list_of_args (q . 1))))))
)
```

The reason this is so useful is that you may want to create the blueprint of a puzzle but use different values for certain parameters every time you create it.
You can't rely on the puzzle solver to honestly and correctly pass in the information you want to use, so you need to make sure it is passed in before they ever get the chance to solve it.

The above function may look complex, but all it's really doing is wrapping the function in an `a` and prepending the arguments to `1`, which (when compiled to clvm) will refer to the rest of the puzzle arguments.
Absent of all the quotes, the above code reduces to something like this:

```chialisp
(a func (c curry_arg_1 (c curry_arg_2 1)))
```

You can also do the reverse operation.
Given a program, you can *uncurry* the list of arguments with a simple `(f (r (r )))`:

```chialisp
(f (r (r curried_func)))
; (c curry_arg_1 (c curry_arg_2 1))
```

Let's take our password locked coin example from earlier, this time as a Chialisp puzzle:

```chialisp
(mod (password new_puzhash amount)
 (defconstant CREATE_COIN 51)

 (defun check_password (password new_puzhash amount)

 (if (= (sha256 password) (q . 0x2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824))
 (list (list CREATE_COIN new_puzhash amount))
 (x)
 )
 )

 ; main
 (check_password password new_puzhash amount)
)
```

You can see that the password hash is baked into the source of the puzzle.
This means that every time you want to lock up a coin with a new password, you have to recreate the file containing the code's source.
It would be much nicer if we fully generalized it:

```chialisp
; password_coin.clvm
(mod (PASSWORD_HASH password new_puzhash amount)
 (defconstant CREATE_COIN 51)

 (defun check_password (PASSWORD_HASH password new_puzhash amount)

 (if (= (sha256 password) PASSWORD_HASH)
 (list (list CREATE_COIN new_puzhash amount))
 (x)
 )
 )

 ; main
 (check_password PASSWORD_HASH password new_puzhash amount)
)
```

However, now we have the problem that anyone can pass in whatever password/hash combo that they please and unlock this coin.
When we create this coin, we need the password hash to be committed to. Before determining the puzzle hash of the coin we're going to create, we need to curry in the hash with something like this:

```chialisp
; curry_password_coin.clvm
(mod (password_hash password_coin_mod)
 (include "curry.clvm")

 (curry password_coin_mod (list password_hash))
)
```

If we compile this function and pass it parameters like this:

```
brun <curry_password_coin mod> '((q . 0xcafef00d) (q . <password_coin mod>))'
```

We will receive a puzzle that looks very similar to our password coin module but has been expanded to include the hash we passed in.
You can now run the currying mod above with a different password hash, and it will output a new puzzle every time.
We can then hash that puzzle and create a coin with the returned puzzle hash.

Note that this required that we run the currying module using `brun` in our own environment off-chain in order to create the puzzle we would lock up our coin with.
A lot of the time, this currying will happen in python, or whatever wrapper language is being used by the software creating the coins.
However, there are some use cases in which we would want to use currying within the scope of a puzzle.
Let's look at one now.

## Outer and Inner puzzles

A common design pattern, and one of the most powerful features of Chialisp, is the ability to have an outer puzzle that "wraps" an inner puzzle.
This concept is extremely handy because it allows a coin to retain all of its standard functionality and programmability within the inner puzzle but be bound to an extra set of rules by the outer puzzle.

For this example, we're going to continue with our password locking, but this time we're going to require that every time the coin is spent, it requires a new password to be set.
Let's look at all the code, and then we'll break it down:

```chialisp
(mod (
 MOD_HASH ;; curried in
 PASSWORD_HASH ;; curried in
 INNER_PUZZLE ;; curried in
 inner_solution
 password
 new_password_hash
 )

 (include "condition_codes.clvm")
 (include "sha256tree.clvm")
 (include "curry-and-treehash.clvm")

 (defun pw-puzzle-hash (MOD_HASH mod_hash_hash new_password_hash_hash inner_puzzle_hash)
 (puzzle-hash-of-curried-function
 MOD_HASH
 inner_puzzle_hash new_password_hash_hash mod_hash_hash ; parameters must be passed in reverse order
 )
 )

 ;; tweak `CREATE_COIN` condition by wrapping the puzzle hash, forcing it to be a password locked coin
 (defun-inline morph-condition (condition new_password_hash MOD_HASH)
 (if (= (f condition) CREATE_COIN)
 (list CREATE_COIN
 (pw-puzzle-hash MOD_HASH (sha256tree MOD_HASH) (sha256tree new_password_hash) (f (r condition)))
 (f (r (r condition)))
 )
 condition
 )
 )

 ;; tweak all `CREATE_COIN` conditions, enforcing created coins to be locked by passwords
 (defun morph-conditions (conditions new_password_hash MOD_HASH)
 (if conditions
 (c
 (morph-condition (f conditions) new_password_hash MOD_HASH)
 (morph-conditions (r conditions) new_password_hash MOD_HASH)
 )
 ()
 )
 )

 ; main
 (if (= (sha256 password) PASSWORD_HASH)
 (morph-conditions (a INNER_PUZZLE inner_solution) new_password_hash MOD_HASH)
 (x "wrong password")
 )

)
```

You may notice that we imported a new library called `curry-and-treehash`.
We'll talk about that in a few steps.

First, let's talk about the arguments.
When you create this puzzle for the first time, you need to curry in 3 things: `MOD_HASH`, which is the tree hash of this code with no curried arguments, `PASSWORD_HASH`, which is the hash of the password that will unlock this coin, and `INNER_PUZZLE` which is a completely separate puzzle that will have its own rules about how the coin can be spent.

Chialisp puzzles have the tendency to be read from the bottom up, so let's start with this chunk:

```chialisp
; main
(if (= (sha256 password) PASSWORD_HASH)
 (morph-conditions (a INNER_PUZZLE inner_solution) new_password_hash MOD_HASH)
 (x "wrong password")
)
```

All that's happening here is that we're making sure the password is correct and, if it is, we're going to run the curried in `INNER_PUZZLE` with the passed in `inner_solution`.
This will return a list of conditions that we will pass to the next function along with the new password hash and `MOD_HASH`.

```chialisp
;; tweak all `CREATE_COIN` conditions, enforcing created coins to be locked by passwords
(defun morph-conditions (conditions new_password_hash MOD_HASH)
 (if conditions
 (c
 (morph-condition (f conditions) new_password_hash MOD_HASH)
 (morph-conditions (r conditions) new_password_hash MOD_HASH)
 )
 ()
 )
)
```

Recursion is the foundation of Chialisp and functions like these very commonly show up when writing it.
In order to iterate through the list of conditions, we first check if there are still items left (remember that an empty list `()` or **nil** evaluates to false). Then, we morph the first condition and concatenate it with the recursive output of the rest of the list.
In the end, we will have the same list of items in the same order, but all of them will have passed thru `morph-condition`.

```chialisp
;; tweak `CREATE_COIN` condition by wrapping the puzzle hash, forcing it to be a password locked coin
(defun-inline morph-condition (condition new_password_hash MOD_HASH)
 (if (= (f condition) CREATE_COIN)
 (list CREATE_COIN
 (pw-puzzle-hash MOD_HASH (sha256tree MOD_HASH) (sha256tree new_password_hash) (f (r condition)))
 (f (r (r condition)))
 )
 condition
 )
)
```

This function is also pretty simple. We're first checking if the opcode (first item in the list) is CREATE_COIN.
If it's not, just return the condition as usual.
If it is, return a condition that is almost exactly the same, except we're passing the puzzle hash into a function that will modify it:

```chialisp
(defun pw-puzzle-hash (MOD_HASH mod_hash_hash new_password_hash_hash inner_puzzle_hash
 (puzzle-hash-of-curried-function
 MOD_HASH
 inner_puzzle_hash new_password_hash_hash mod_hash_hash ; parameters must be passed in reverse order
 )
)
```

This is where the exciting stuff happens.
Since we don't know the inner puzzle, only it's hash, it's impossible to curry it directly into the next puzzle we want to create.
Furthermore, if we don't want to pass in the whole source of this current module every time that we spend it, we don't have a puzzle to curry things into either.

However, all we care about is generating the correct *puzzle hash* for the next puzzle, and we do have the tree hashes for both this module and the inner puzzle.
We can use `puzzle-hash-of-curried-function` which allows us to create the puzzle hash of a function given: a) the puzzle hash of that function and b) the puzzle hashes of all of its arguments in reverse order _as though they were a part of a tree hash_. This means that arguments that are atoms and numbers are expected to be in tree hash form, with a 1 prefix like ```(sha256 (q . 1) my-argument-value)``` and the output of `sha256tree` is suitable for anything involving cons cells. It would be possible for `puzzle-hash-of-curried-function` to guess these if it took the parameter values themselves but that might require recomputation of expensive hashes.

Other implementation details of this library are a bit much to go into in this part of the tutorial, but, in essence, it allows us to *resume* a tree hash that we have completed except for the last step.

And that's it! When this coin is created, it can only be spent by a password that hashes to the curried in PASSWORD_HASH.
The inner puzzle can be anything that you want, including other outer puzzles that have their own inner puzzles.
Whatever coins get created as a result of that inner puzzle will be "wrapped" by this same outer puzzle, ensuring that every child of this coin is locked by a password *forever*.

We created a simple coin, but you can see the potential of this. You can enforce a set of rules not only on a coin that you lock up but on *every* descendant coin.
Not only that, the rules can be enforced *on top of other smart coins*.
In the Chialisp ecosystem, all smart coins are interoperable with each other unless otherwise specified by one of the puzzles in the stack. The possibilities are endless and represent the vast programmability that Chialisp enables for coins.

In the next section, we'll talk about the standard transaction format on the Chia network.

