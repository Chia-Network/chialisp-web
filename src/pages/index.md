# Chialisp

Chialisp is a powerful and secure LISP-like language for encumbering and releasing funds with smart-contract capabilities.
This website is a consolidated place to learn about Chialisp, CLVM and the conditions language.

Here's a sample:
```
(mod (password new_puzhash amount)
  (defconstant CREATE_COIN 51)

  (if (= (sha256 password) (q . 0x2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824))
    (list (list CREATE_COIN new_puzhash amount))
    (x)
  )
)
```

## Introductory Material

- Bram’s introductory post on [Chialisp](https://www.chia.net/2019/11/27/chialisp.en.html)
- Bram’s introduction to our [MVP of Coloured coins](https://www.chia.net/2020/04/29/coloured-coins-launch.en.html)
- [Download Chialisp 0.4 in tar.gz format](https://github.com/Chia-Network/clvm/archive/0.4.tar.gz)

## Developer Documentation

- [ChiaLisp Compiler Repository](https://github.com/Chia-Network/clvm)
- [A video introduction to developing in Chialisp](https://www.youtube.com/watch?v=dEFLJSU87K8)

1. [CLVM Basics](/docs/)
2. [Coins, Spends and Wallets](/docs/coins_spends_and_wallets/)
3. [Deeper into CLVM](/docs/deeper_into_clvm/)
4. [The Compiler and Other Useful Information](/docs/high_level_lang/)
5. [Glossary of Chialisp terms](/docs/glossary/)

* [Lower Level Language Reference Document](/docs/ref/clvm/)

## Coloured Coins

The first Chialisp smart transaction that we integrated into chia-blockchain were Coloured Coins. We will be integrating additional smart transactions and wallets into chia-blockchain in most releases.

### Video Overviews of Coloured Coins:

- [Non Technical Overview and Guide](https://www.youtube.com/watch?v=YOlpmCBK8zY)
- [Technical Guide (Part 1) - Smart Transactions and ChiaLisp](https://www.youtube.com/watch?v=17pa2t_FQQM)
- [Technical Guide (Part 2) - The Coloured Coins Contract & Offers](https://www.youtube.com/watch?v=P33gWX4WmEQ)
