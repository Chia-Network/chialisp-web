---
slug: /chialisp-currying
title: Currying
---

When you are writing puzzles in Chialisp you may want to have certain parameters decided before the coins are created. This is called **currying**. It allows puzzles to be reused but have different content and produce a different hash.

An example of this is the standard transaction puzzle. One of its parameters is the `SYNTHETIC_PUBLIC_KEY`, which is unique for each address in your wallet. It represents a synthetic child key of your root public key. As such, the puzzle has to be changed for every address. This would be tedious to do without currying, since it allows the original puzzle (also known as the mod) to be used as a template.

## Example

We're going to write a simple example to try currying on the command line.

Write this in a file named `multiply.clsp`:

```chialisp title="multiply.clsp"
(mod (first second)
    (* first second)
)
```

### Currying

Now, we are going to make an instance of this program that will set the value of the parameter `first` to `2`. This will effectively turn this program from a multiplier to a doubler.

You can curry it like this:

```bash
cdv clsp curry multiply.clsp -a 2
```

Which should produce the following curried result:

```chialisp
(a (q 18 2 5) (c (q . 2) 1))
```

:::info
This is no longer in Chialisp form, but rather has been compiled to CLVM. You don't need to understand how this works or be able to read it, but only be aware that it does what was mentioned before.
:::

You can now run this curried CLVM, and include the value to be doubled as the second parameter, like so:

```bash
brun "(a (q 18 2 5) (c (q . 2) 1))" "(5)"
```

It should output twice the value of `5`:

```chialisp
10
```

### Reuse

The real use of currying comes from the fact that you can curry it again with a new value:

```bash
cdv clsp curry multiply.clsp -a 5
```

Which should produce the following curried result:

```chialisp
(a (q 18 2 5) (c (q . 5) 1))
```

This will do the same thing as the previous curried program, except it will multiply by `5` instead of by `2`.

## Convention

In the previous example, we curried a value into a program, but the program did not declare that this was required. However, often times (especially with puzzles), you will be required to curry the value beforehand to use it properly. To indicate that a parameter is meant to be curried in, you write it in `SCREAMING_SNAKE_CASE`.

Let's rewrite the previous example with this convention:

```chialisp title="multiply.clsp"
(mod (FIRST second)
    (* FIRST second)
)
```

Writing parameters like this doesn't change anything in how they function, but rather how they are expected to be used. This convention makes it clear that you _need_ to specify the value of it before creating coins with it on-chain.

## Conclusion

This is very useful for writing reusable and composable puzzles in Chialisp. It is also commonly used in tandem with [inner puzzles](/chialisp-inner-puzzles). However, currying can be a pretty confusing topic, so if you have any further questions, feel free to ask them on our [Discord](https://discord.gg/chia).
