# maci-domainobjs

This module implements domain objects. A domain object is:

> a logical container of purely domain information, usually represents a
> logical entity in the problem domain space

https://wiki.c2.com/?DomainObject

In effect, domain objects are representations of objects shared between other
modules in this codebase. They also encapsulate helper functions which make it
easy to use them with said modules.

## `Command`

The `Command` domain object represents a request by a user to cast a vote
and/or change one's public key.

## `Message`

The `Message` domain object is an encrypted `Command` and signature. That is, a
`Message` is a `Ciphertext` (defined in [`maci-crypto`](../crypto/README.md))
which is the encrypted `Command` and its `Signature` (also defined in
`maci-crypto`). In other terms:

```
Message = Encrypt([Command, Signature], Key)
```

## `VoteOptionTreeLeaf`

## `StateLeaf`
