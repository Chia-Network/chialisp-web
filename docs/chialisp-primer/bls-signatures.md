---
slug: /chialisp-bls-signatures
title: 5. BLS Signatures
---

When creating a spend bundle previously, we have left the `aggregated_signature` field set to the default value of `c0` followed by 190 zeros. This value indicates that there are no signatures. We will detail what signatures are, and how you can use them on the blockchain.

Chia uses a specific kind of signature called a [BLS Signature](https://crypto.stanford.edu/~dabo/pubs/papers/BLSmultisig.html). It's a form of elliptic curve cryptography.

One helpful feature of BLS signatures is that they can be non-interactively aggregated. You can take a signature from a party you don't trust, and combine it with another signature to produce a single signature that verifies the combination of all of the messages they were signing.

## Digital Signatures

A [digital signature](https://en.wikipedia.org/wiki/Digital_signature) is a cryptographically secure way to check the author of a message. It is quite similar to written signatures.

To create a signature, first you need a [key pair](https://en.wikipedia.org/wiki/Public-key_cryptography) that consists of a private key and its corresponding public key. The private key is used to sign messages, whereas the public key is used to verify the signature created for the message.

## Example

:::danger
Your private key should _never_ be shared with anyone other than yourself unless you are fine with them having complete control over the wallet it is for, as well as signing messages on your behalf. The same is true for the mnemonic seed phrase used to generate the key pair.
:::

The first thing you need to do is find the fingerprint of the wallet you are going to be using for message signing.

You can use the following command to do this:

```bash
chia keys show
```

:::info
You are not going to be using the root key pair itself to sign messages, but rather a child key derived from it. The `hd_path` represents the path used for deriving the child key from the root.

The `12381` is specific to BLS signatures, whereas `8444` is specific to Chia. Wallets use the index `2`, and finally the last value is just the key index, starting at `0`.

You will not need to change the value in this guide, but you can tweak the last value if you want.
:::

You can now sign messages using this key pair like so:

```bash
chia keys sign --fingerprint "FingerPrint" --hd_path "m/12381/8444/2/0" --message "Message"
```

It will show you the derived public key and signature based on the path and message specified.

You can use those values to verify that the signature is correct like this:

```bash
chia keys verify --public_key "PublicKey" --signature "Signature" --message "Message"
```

If the result is `True`, it is valid. Otherwise, either the public key, signature, or message is incorrect.

## Conclusion

This was just a primer on BLS signatures, and in practice it can be a bit more complicated. They will be put to good use in future guides, and it's a good idea to understand how they work before you dive into them. If you have any questions about BLS signature, feel free to ask on our [Discord](https://discord.gg/chia)!
