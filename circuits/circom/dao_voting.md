# How to make MACI work for DAO voting

## Remove quadratic voting

### MessageValidator circuit

```ts
// Check that currentVoiceCreditBalance + (currentVotesForOption ** 2) >= (voteWeight ** 2)
component sufficientVoiceCredits = SafeGreaterEqThan(252);
sufficientVoiceCredits.in[0] <== (currentVotesForOption * currentVotesForOption) + currentVoiceCreditBalance;
sufficientVoiceCredits.in[1] <== voteWeight * voteWeight;
```

Remove ** 2 