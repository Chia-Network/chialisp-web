---
id: commands
title: Commands
slug: /commands
---

Chialisp has a set of commands that make developing, compiling, and running programs easy.

You will need to install [chia-dev-tools](https://github.com/Chia-Network/chia-dev-tools) globally or inside of a virtual environment to get started.

:::note

This is a brief overview of each command. If you want more information, use `-h` or `--help` on a given command.

:::

## Chia Dev Tools

### Retrieve

You can use this command to get one or more of the default library files:

```bash
cdv clsp retrieve condition_codes sha256tree # ...
```

Here is a list of things you can retrieve:

| Library            | Description                            |
| ------------------ | -------------------------------------- |
| condition_codes    | Condition opcode constants.            |
| curry_and_treehash | Utilities for currying puzzle hashes.  |
| sha256tree         | A function that tree hashes a value.   |
| singleton_truths   | Truth struct functions for singletons. |
| utility_macros     | Some helpful utility macros.           |

### Build

You can build your programs like this:

```bash
cdv clsp build # Builds all files in the directory.
cdv clsp build program.clsp # Builds a single file.
```

When you use the `include` operator, it will look for files in the `include` folder by default.

You can add more include directories like this:

```bash
cdv clsp build program.clsp --include libraries
```

You can also use `-i` instead of `--include` if you prefer.

### Curry

You can [curry](/chialisp-currying) values into your program like this:

```bash
cdv clsp curry program.clsp --args '0xCAFEF00D' --args '(hello there)'
```

You can also use `-a` instead of `--args` if you prefer.

### Uncurry

You can reverse the currying process of compiled CLVM like this:

```bash
cdv clsp uncurry compiled.clvm
```

### Disassemble

You can convert compiled CLVM back into the readable form like this:

```bash
cdv clsp disassemble compiled.clvm
```

### Tree Hash

You can calculate the tree hash (analagous to puzzle hash) of compiled CLVM like this:

```bash
cdv clsp treehash compiled.clvm
```

## Chialisp

### Compile

You can use this command to directly compile Chialisp into CLVM:

```bash
run program.clsp
```

However, you will need to include libraries manually:

```bash
run program.clsp --include include
```

You can also use `-i` instead of `--include` if you prefer.

### Run

You can execute bytecode directly on CLVM like this:

```bash
brun compiled.clvm
```

Or if you have the serialized form:

```bash
brun --hex compiled.clvm.hex
```

You can also use `-x` instead of `--hex` if you prefer.

Note that if you want to run it with an environment (analagous to solution), you can do so like this:

```bash
brun compiled.clvm '(arguments here)'
```

### Serialize

You can serialize CLVM into bytecode like this:

```bash
opc 'CLVM'
```

Note that you cannot use a file with this command.

### Deserialize

You can deserialize bytecode into CLVM like this:

```bash
opd 'bytecode'
```

Note that you cannot use a file with this command.
