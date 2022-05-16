# Chialisp

Chialisp is a powerful and secure LISP-like language for encumbering and releasing funds with smart-contract capabilities.
This website is a consolidated place to learn about Chialisp, CLVM and the conditions language.

Here's a sample:

```chialisp
(mod (password new_puzhash amount)
  (defconstant CREATE_COIN 51)

  (if (= (sha256 password) (q . 0x2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824))
    (list (list CREATE_COIN new_puzhash amount))
    (x)
  )
)
```

## Why Lisp?

Many people come into our keybase channel and ask us why we chose a 60 year old language as our on chain programming language.
We chose it due to a few unique features that make it remarkably well suited to the Chia blockchain:

- **Completely sandboxed.** Chialisp resource utilization is completely controlled.
  The language needs to be run on half a million computers, so it is important that the program cannot reach out and affect everyone's machines in an unintended way.
  A lisp program is _evaluated_ and therefore cannot spawn any new processes or interact with the system it is running on.

- **Composability.** A lisp program is itself just a list.
  This feature allows for powerful techniques that allow you to modify source code during program evaluation.
  Doing so can allow a "smart coin" to enforce rules on a participating coin while still allowing it to utilize the full programmability that Chialisp has to offer.
  Using lisp programs like this allows you to have _layers of smart coins_ in which the output of an "inner" puzzle can be used in the evaluation of the "outer" puzzle.

- **Interoperability.** Every smart coin in the Chia ecosystem, no matter how complex, is fundamentally a coin that is locked up with a Chialisp puzzle. The input to any puzzle will always be a lisp data structure, and the output will always be a list of **conditions** that all puzzles share. This means that everything in Chia interoperates with everything else.
  Any smart coin should be able to interact or communicate with any other smart coin, regardless of whether either coin was specifically designed to do so.

## Getting Started

If you'd like to get started learning and using Chialisp, you can start with the [Intro to Chialisp](/docs) guide. Throughout this series you will write programs in the language, create smart coins on the Chia Blockchain, and spend them on the command-line.

--- 
## [>> Get Started with Chialisp >>](/docs/getting_started/intro_to_chialisp)

---