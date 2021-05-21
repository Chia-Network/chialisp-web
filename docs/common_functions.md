---
id: common_functions
title: 5 - Common Functions in Chialisp
---

When you start to write full smart contracts, you will start to realize that you will need certain common functionality in a lot of puzzles.  Let's go over how to include them and what some of them are:

## include

If you want to import some functionality that you use frequently without having to copy/paste it between files, you can use `include`:

```lisp
;; temperature.cinc
(
  (defun celcius_to_fahrenheit (celcius) (+ (* celcius (/ 9 5)) 32))
)
```

```lisp
;;main.clisp
(mod create_temp_announcement (temp)

  (include "temperature.cinc")

  (list CREATE_COIN_ANNOUNCEMENT (celcius_to_fahrenheit temp))

)
```

When running main.clisp with `run`, make sure to use the `-i` option to specify which directories to look in for files to include.

Also note that the include files take a special format in which all functions and constants defined end up in just one set of parentheses.

## sha256tree1

When puzzles are hashed, they are not simply serialized and passed to sha256.  Instead, we take the *tree hash* of the puzzle.

Recall that every clvm program can be represented as a binary tree.  Every object is either an atom (a leaf of the tree) or a cons box (a branch of the tree).  When we hash the puzzle we start at the leaves of the tree and hash our way up, concatenating either a 1 or a 2 to denote that it's either an atom or a cons box.  Once a cons box is hashed, it becomes a new leaf to be hashed into its parent cons box and the process recurses.  Here's what that looks like in Chialisp:

```lisp
(defun sha256tree1
   (TREE)
   (if (l TREE)
       (sha256 2 (sha256tree1 (f TREE)) (sha256tree1 (r TREE)))
       (sha256 1 TREE)
   )
)
```

This is extremely useful for a **ton** of things in practice.  You can assert puzzles of other coins, condense puzzles for easier signing, and make CREATE_COIN conditions that are dependent on some passed in data.  

## sha256tree_esc

Remember that when tree hashing a puzzle, we prepend a different value depending on if it's an atom or a cons box.  Suppose we want to hash a tree in which we already know the hashes of some of the subtrees. If we just replace these subtrees at their root with tree hashes, `sha256tree1` will assume they are an atom and will rehash them with a prepended 1 producing an incorrect tree hash.

Because of this, we need a function that takes a list of hashes that it assumes to be already hashed sub trees so that it knows not to rehash them.  Here's what that modification looks like:

```lisp
;;utility function used by sha256tree_esc
(defun is-in-list (atom items)
 ;; returns 1 if `atom` is in the list of `items`
 (if items
   (if (= atom (f items))
     1
     (is-in-list atom (r items))
   )
   0
 )
)

(defun sha256tree_esc
  (TREE LITERALS)
  (if (l TREE)
      (sha256 2 (sha256tree_esc (f TREE) LITERALS) (sha256tree_esc (r TREE) LITERALS))
      (if (is-in-list TREE LITERALS)
          TREE
          (sha256 1 TREE)
      )
  )
)
```

This may potentially seem like an overcomplicated optimization, but its real power comes from the fact that we can hash programs into puzzle hashes *without knowing what those programs are*.  Let's explain one more function to tie it all together.

## Currying

Currying is an extremely important concept in Chialisp that is responsible for almost the entirety of how state is stored in coins.  The idea is to pass in arguments to a puzzle *before* it is hashed.  When you curry, you commit to solution values so that the individual solving the puzzle cannot change them.  Let's take a look at how this is implemented in Chialisp:

```lisp
;; utility function used by curry
(defun fix_curry_args (items core)
 (if items
     (qq (c (q . (unquote (f items))) (unquote (fix_curry_args (r items) core))))
     core
 )
)

; (curry sum (list 50 60)) => returns a function that is like (sum 50 60 ...)
(defun curry (func list_of_args) (qq (a (q . (unquote func)) (unquote (fix_curry_args list_of_args (q . 1))))))
```

The reason this is so useful is because you want to be able to reuse puzzles, but not necessarily always have the same values used inside the puzzle.  You can't rely on the puzzle solver to honestly and correctly pass in the information you want to use, so you need to make sure it is passed in before they ever get the chance to solve it.

Let's take our password locked coin example from earlier, this time as a Chialisp puzzle:

```lisp
(mod (password new_puzhash amount)
  (defconstant CREATE_COIN 51)

  (defun check_password (password new_puzhash amount)

    (if (= (sha256 password) (q . 0x2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824))
      (list (list CREATE_COIN new_puzhash amount))
      (x)
    )
  )

  (check_password password new_puzhash amount)
)
```

You can see that the password hash is baked into the source of the puzzle.  This means every time that you want to lock up a coin with a new password, you have to recreate the file that contains the source of the code.  It would be much nicer if we fully generalized it:

```lisp
(mod (PASSWORD_HASH password new_puzhash amount)
  (defconstant CREATE_COIN 51)

  (defun check_password (PASSWORD_HASH password new_puzhash amount)

    (if (= (sha256 password) PASSWORD_HASH)
      (list (list CREATE_COIN new_puzhash amount))
      (x)
    )
  )

  (check_password PASSWORD_HASH password new_puzhash amount)
)
```

However, now we have the problem that anyone can pass in whatever password/hash combo that they please and unlock this coin.  When we create this coin we need the password hash to be committed to. Before determining the puzzle hash of the coin we're going to create, we need to curry in the hash with something like this:

```lisp
(mod (password_hash password_coin_mod)
  (include "curry.clvm") ; From above

  (curry password_coin_mod (list password_hash))
)
```

If we compile this function and pass it parameters like this:

```
brun <curry mod> '((q . 0xcafef00d) (q . <password coin mod>))'
```

we will receive a puzzle that looks very similar to our password coin module, but has been expanded to include the hash we passed in.  You can now run the currying mod above with a different password hash and it will output a new puzzle every time.  We can then hash that puzzle and create a coin with the returned puzzle hash.

Note that this required that we run the currying module using `brun` in our own environment off the chain in order to create the puzzle we would lock up our coin with.  A lot of the time this currying will happen in python or whatever wrapper language is being used in the software creating the coins.  However there are some use cases in which we would want to use currying within the scope of a puzzle.  Let's look at one now.

## Outer and Inner puzzles

A common design pattern, and one of the most powerful features of Chialisp, is the ability to have an outer smart contract the "wraps" an inner puzzle.  This concept is extremely handy because it allows a coin to retain all of it's standard functionality and programmability within the inner puzzle, but be bound to an extra set of rules by the outer puzzle.

For this example, we're going to continue with our password locking, but this time we're going to require that every time the coin is spent, it requires a new password to be set.  Let's look at all the code and then we'll break it down:

```lisp
(mod (
    MOD_HASH        ;; curried in
    PASSWORD_HASH   ;; curried in
    INNER_PUZZLE    ;; curried in
    inner_solution
    password
    new_password_hash
  )

  (include "condition_codes.clvm")
  (include "curry.clvm")
  (include "sha256tree1.clvm")
  (include "sha256tree_esc.clvm")

  (defun pw-puzzle-hash (MOD_HASH mod_hash_hash new_password_hash inner_puzzle_hash)
     (sha256tree_esc
       (curry MOD_HASH (list mod_hash_hash new_password_hash inner_puzzle_hash)) ;; puzzle to tree hash
       (list MOD_HASH mod_hash_hash inner_puzzle_hash) ;; already hashed values
     )
   )

  ;; tweak `CREATE_COIN` condition by wrapping the puzzle hash, forcing it to be a password locked coin
  (defun-inline morph-condition (condition new_password_hash MOD_HASH)
   (if (= (f condition) CREATE_COIN)
     (list CREATE_COIN
       (pw-puzzle-hash MOD_HASH (sha256tree1 MOD_HASH) new_password_hash (f (r condition)))
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

First, let's talk about the arguments.  When you create this puzzle for the first time you need to curry in 3 things: `MOD_HASH` which is the tree hash of this code, `PASSWORD_HASH` which is the hash of the password that will unlock this coin, and `INNER_PUZZLE` which is a completely separate puzzle that will have its own rules about how the coin can be spent.

Chialisp puzzles have the tendency to be read from the bottom up, so lets start with this chunk:

```lisp
; main
(if (= (sha256 password) PASSWORD_HASH)
  (morph-conditions (a INNER_PUZZLE inner_solution) new_password_hash MOD_HASH)
  (x "wrong password")
)
```

All that's happening here is that we're making sure the password is correct and if it is, we're going to run the curried in `INNER_PUZZLE` with the passed in `inner_solution`.  This will return a list of opcodes like any other spend that we will pass to the next function along with the new password hash and `MOD_HASH`.

```lisp
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

Recursion is the foundation of Chialisp and functions like these very commonly show up when writing it.  In order to iterate through the list of conditions, we first check if there are still items left (remember that an empty list `()` or **nil** evaluates to false). Then, we morph the first condition and concatenate it with the recursive output of the rest of the list.  In the end, we will have the same list of items in the same order, but all of them will have passed thru `morph-condition`.

```lisp
;; tweak `CREATE_COIN` condition by wrapping the puzzle hash, forcing it to be a password locked coin
(defun-inline morph-condition (condition new_password_hash MOD_HASH)
 (if (= (f condition) CREATE_COIN)
   (list CREATE_COIN
     (pw-puzzle-hash MOD_HASH (sha256tree1 MOD_HASH) new_password_hash (f (r condition)))
     (f (r (r condition)))
   )
   condition
 )
)
```

This function is also pretty simple. We're first checking if the opcode (first item in the list) is CREATE_COIN.  If it's not, just return the condition as usual.  If it is, return a condition that is almost exactly the same, except we're passing the puzzle hash into a function that will modify it:

```lisp
(defun pw-puzzle-hash (MOD_HASH mod_hash_hash new_password_hash inner_puzzle_hash)
 (sha256tree_esc
   (curry MOD_HASH (list mod_hash_hash new_password_hash inner_puzzle_hash)) ;; puzzle to tree hash
   (list MOD_HASH mod_hash_hash inner_puzzle_hash) ;; already hashed values
 )
)
```

This is where the exciting stuff happens.  Since we don't know the inner puzzle, only it's hash, it's impossible to curry it directly into the next puzzle we want to create.  Furthermore, if we don't want to pass in the whole source of this current module every time that we spend it, we don't have a puzzle to curry things into either.

However, all we care about is generating the correct puzzle hash for that future puzzle, and we DO have the tree hashes for both this module and the inner puzzle.  We can use `sha256tree_esc` which in some sense allows us to *resume* a partially completed puzzle hash so that we don't have to worry about sub trees that have already been hashed.  In this function we just pretend that the hashes of the module and the inner puzzle are the full puzzles, curry everything as we would normally, and then when taking the tree hash we specify which values represent already hashed subtrees. In this case: `MOD_HASH`, `mod_hash_hash`, and `inner_puzzle_hash`.  Note that `new_password_hash` is a literal value, not the hash of a subtree, so we leave it out of the list.

And that's it!  When this coin is created, it can only be spent by a password that hashes to the curried in PASSWORD_HASH.  The inner puzzle can be anything that you want including other smart contracts that have their own inner puzzles.  Whatever coins get created as a result of that inner puzzle, they will be "wrapped" by this same outer puzzle ensuring that every child of this coin is locked by a password *forever*.

We created a simple coin, but you can see the potential of this. Maybe you issue coins that represent assets whose movement requires a set of signatures every time they move.  Perhaps you want to ensure that all children coins *must* have come from you so that you entirely control the supply.  The possibilities are endless and represent the vast programmability that Chialisp gives to its coins.

In the next section, we'll talk about how the network handles the coins and what you need to know before you try to deploy one yourself.
