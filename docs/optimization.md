---
id: optimization
title: 10 - Optimization
---

Before you deploy a smart coin to the network, you should closely examine the code to find ways to optimize its execution.
Remember, the code you write is going to be deployed on millions of nodes; if it is slow, you slow down the whole network. This is why the block constraint on the Chia Network is dependent on the [program execution cost](https://chialisp.com/docs/ref/clvm/#costs) of Chialisp that has to be run in that block.
If you want to write a bigger, slow running coin, you're going to need to pay more fees every time you want to spend it.
Let's go over some techniques you can use to optimize your puzzles.

## Minimize the number spends

At the end of the day, one of the biggest drains on cost is going to be how often you have to spend the coin.
Quite commonly, you will find ways to build coins where participants are required to spend the coin in order to interact with it.
The coin may traverse through multiple states as they do so.
Every time the coin has to be spent, it acts as a multiplier for your base program cost.
Even if you are not traversing an expensive path through the code, the full puzzle must still be revealed and there will most likely be `CREATE_COIN` and `AGG_SIG_ME` conditions which often represent a large chunk of the cost.

It is also important that you have as few signatures and signature operations as possible.
It is usually best practice to collect everything in your program that needs signing, hash it all together and ask for a single signature on that hash.
You can also sometimes be clever with announcements where an unsigned coin can assert its relevant information from a signed coin.
Be creative, but always remember to double check that every piece of important information is signed or asserted.

## `defun` vs `defun-inline`

In most instances, it is better to use inline functions rather than regular functions.
Inline functions get inserted where they are called at compile time which will eliminate the function call overhead and will not store the function separately in the code.

There is a potential scenario where this is not true.
If you are using an inline function with an argument that has been calculated, you will end up paying for that calculation every time the argument is referenced:

```chialisp
(defun-inline add_to_self (x) (+ x x))

(add_to_self (* 200 200))
```

The above code snippet will result in the following expansion:

```chialisp
(+ (* 200 200) (* 200 200))
```

As you can see, the expensive multiplication operation has now been performed twice!

## Familiarize yourself with all of the operators

Make sure to check out the [reference section](https://chialisp.com/docs/ref/clvm) to find out every operator that you can use and what they cost.
A lot of common operators that you might be tempted to use have a surprisingly high cost and are best to steer clear of.

For example, you may want to evaluate differently based on whether a number is even or odd:

```chialisp
(if (r (divmod value 2))
  ; do odd things
  ; do even things
)
```
*Note that the if takes advantage of the fact that 0 == (). This technique is handy when recursing through lists too.
The last item in a list is always () which evaluates to false, so in that case you can break the recursion.*

However, `divmod` is a pretty expensive operation, and we have to add an `r` to access the remainder once the operation has completed.
Instead, we can just use `logand` to evaluate just the last bit:

```chialisp
(if (logand value 1)
  ; do odd things
  ; do even things
)
```

We have now saved ourselves at least 50% of the cost of this code block!

## Keep argument numbers small

This tip is both good for optimization and readability.
As the program is running, it needs to pay cost to look up a value from the environment.
It is not a large cost, but it gets larger the deeper it has to go into the environment tree to search for the value.
If you can keep the argument numbers small, you can trim off cost every time your program uses an argument in its evaluation.

One way to do this is to batch arguments that always end up in the same place together.
Here's an example:

```chialisp
(mod (
      CURRIED_PUBKEY
      some_data
      some_other_data
      some_more_data
      even_more_data
      pubkey
      my_amount
      my_id
     )

     (import "condition_codes.clvm")
     (import "sha256tree.clvm")

     (defun-inline agg_sig (CURRIED_PUBKEY some_data some_other_data some_more_data even_more_data)
        (AGG_SIG_ME CURRIED_PUBKEY (sha256tree (list some_data some_other_data some_more_data even_more_data)))
     )

     (defun-inline assert_amount_and_sig (CURRIED_PUBKEY some_data some_other_data some_more_data even_more_data my_amount)
        (c (ASSERT_MY_AMOUNT my_amount) (agg_sig CURRIED_PUBKEY some_data some_other_data some_more_data even_more_data))
     )

     (defun-inline assert_id_and_amount_and_sig (CURRIED_PUBKEY some_data some_other_data some_more_data even_more_data my_amount my_id)
        (c ASSERT_MY_ID my_id (assert_amount_and_sig CURRIED_PUBKEY some_data some_other_data some_more_data even_more_data my_amount))
     )

     (assert_id_and_amount_and_sig CURRIED_PUBKEY some_data some_other_data some_more_data even_more_data my_amount my_id)
)
```

You can see the code is a little bit out of control from a readability standpoint, and when accessing `my_amount` and `my_id` we have to go deep into the environment tree to read their values.
Instead, we should just batch all of our data into a list to start with.

```chialisp
(mod (
      CURRIED_PUBKEY
      all_data
      pubkey
      my_amount
      my_id
     )

     (import "condition_codes.clvm")
     (import "sha256tree.clvm")

     (defun-inline agg_sig (CURRIED_PUBKEY all_data)
        (AGG_SIG_ME CURRIED_PUBKEY (sha256tree all_data))
     )

     (defun-inline assert_amount_and_sig (CURRIED_PUBKEY all_data my_amount)
        (c (ASSERT_MY_AMOUNT my_amount) (agg_sig CURRIED_PUBKEY all_data))
     )

     (defun-inline assert_id_and_amount_and_sig (CURRIED_PUBKEY all_data my_amount my_id)
        (c ASSERT_MY_ID my_id (assert_amount_and_sig CURRIED_PUBKEY all_data my_amount))
     )

     (assert_id_and_amount_and_sig CURRIED_PUBKEY all_data my_amount my_id)
)
```

This is much more concise, and we can rely on the solver to put the relevant data in a list for us, so we can subtract that cost as well.
This is usually somewhat niche, but it becomes important when trying to pass data down through inner puzzles.
If the outermost puzzle wants to communicate with the innermost puzzle, it will have to pass all the data it needs through every step of the puzzles in between.
That is much easier if it is packaged into a single bundle.

## Don't use functions by reflex

Oftentimes, using a common function can become a matter of habit and you can end up using it where it actually creates more complexity than is necessary.
A good example is [sha256tree](/docs/common_functions#sha256tree1).
Since the function works on either cons boxes or atoms, you may be tempted to use it on a single atom (maybe you're currying it into a function).
The function needs to work this way because it recurses and will always run into atoms as it does so.
However, using it to hash only an atom actually adds unnecessary cost to the program.
Not only do you add the function call overhead, but you also add the check to see if it's an atom or a list, even though you know its an atom!  A more cost effective method is to manually hash it like it would be hashed in a tree: `(sha256 1 some_atom)`.

## Conclusion

A lot of optimizations that you can make may seem silly for the small amount of cost that they save.
However, if you expect your coin to become widely used, then there will be thousands of users paying for that in fees every day.
Over time it can add up to a lot of money wasted.
It's important to take the time to review your code and make sure that you can save as much cost as possible before you deploy it to the network.
