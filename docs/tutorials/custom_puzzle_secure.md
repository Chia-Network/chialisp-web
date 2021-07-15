---
id: custom_puzzle_secure
title: How to secure coin with a custom puzzle
sidebar_label: Secure coin with a custom puzzle
---

This tutorial teaches you how to secure a coin with a custom-made puzzle correctly.

## Create a puzzle
Create whatever puzzle you want for your coin. I'll use a password-locked coin as an example for this tutorial.

```chialisp
(mod (password new_puzhash amount)
    (defconstant CREATE_COIN 51)
 
    (if (= (sha256 password) (q . 0x2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824))
        (list (list CREATE_COIN new_puzhash amount))
        (x)
    )
)
```
`0x2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824` is sha256 of the word `hello`. 

**Example valid solution:** `(hello 0x5f5767744f91c1c326d927a63d9b34fa7035c10e3eb838c44e3afe127c1b7675 2)`.

If password is correct, the puzzle will create a new coin with 2 mojos and secure it using a new puzzle hash `0x5f5767744f91c1c326d927a63d9b34fa7035c10e3eb838c44e3afe127c1b7675`.

**Any remaining change goes to a farmer as a fee**.

## Get compiled version of the custom puzzle
There are multiple ways how you can get compiled version of your custom puzzle.

### Using clvm_tools (official)
You can compile your custom puzzle from the terminal using the clvm_tools repository (included in the official Chia repository). All you need to do is to use the `run` command with your puzzle provided as an argument.

```bash
$ run '(mod (password new_puzhash amount)
    (defconstant CREATE_COIN 51)
 
    (if (= (sha256 password) (q . 0x2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824))
        (list (list CREATE_COIN new_puzhash amount))
        (x)
    )
)'
```
results in `(a (q 2 (i (= (sha256 5) (q . 0x2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824)) (q 4 (c 2 (c 11 (c 23 ()))) ()) (q 8)) 1) (c (q . 51) 1))`.

### Using Chialisp web tool (unofficial)
You can obtain a compiled version of the puzzle using [Chialisp web tool](https://clisp.surrealdev.com/). Paste your custom puzzle into the text area and hit **Compile**. The compiled version will appear in the **Run Output** section.

## Get puzzle hash from a puzzle
You can use Chialisp to get the hash of the Chialisp puzzle. The puzzle to get puzzle hash is following:

```chialisp
(mod (puzzle)
    (defconstant TREE 1)
    
    (defun sha256tree1 (TREE)
       (if (l TREE)
           (sha256 2 (sha256tree1 (f TREE)) (sha256tree1 (r TREE)))
           (sha256 1 TREE)
       )
    )
    
    (sha256tree1 puzzle)
)
```

A solution to this puzzle then needs to contain the compiled puzzle we want to hash in the first position (wrap the compiled puzzle with parentheses and provide it as a solution).

**Example solution for the password-locked coin:**
`((a (q 2 (i (= (sha256 5) (q . 0x2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824)) (q 4 (c 2 (c 11 (c 23 ()))) ()) (q 8)) 1) (c (q . 51) 1)))`

The resulting hash for this example puzzle is `0x4843c869bba5f65aa1e806cd372dae5668ca3b69640d067e86837ca96b324e71`.

## Convert puzzle hash to a receive address
You can convert puzzle hash to receive address and vice-versa. It's only a different format for the same information. And since puzzle hash matches specific puzzle, it also means that receive address matches specific puzzle.

You can use [Chia explorer's online tool](https://www.chiaexplorer.com/tools/address-puzzlehash-converter) for converting between puzzle hash to receive address and back. The puzzle hash is converted to bech32m format with xch prefix to form a receive address. Receive address for puzzle hash `0x4843c869bba5f65aa1e806cd372dae5668ca3b69640d067e86837ca96b324e71` is `xch1fppus6dm5hm94g0gqmxnwtdw2e5v5wmfvsxsvl5xsd72j6ejfecsdnkf2e`.

## Send Chia to the receive address
Use Chia GUI to send a transaction as you would typically do with the amount you want. As a receive address set address from the previous step (password-locked coin example: `xch1fppus6dm5hm94g0gqmxnwtdw2e5v5wmfvsxsvl5xsd72j6ejfecsdnkf2e`). That will secure your coin with a new puzzle.
