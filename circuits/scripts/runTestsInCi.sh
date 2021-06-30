#!/bin/bash -xe

cd "$(dirname "$0")"
cd ..

npm run circom-helper &
sleep 25 &&
npx jest CalculateTotal.test.ts &&
npx jest PrivToPubKey.test.ts &&
npx jest TallyVotes.test.ts &&
npx jest ProcessMessages.test.ts &&
npx jest UnpackElement.test.ts &&
npx jest Ecdh.test.ts &&
npx jest MessageToCommand.test.ts &&
npx jest Splicer.test.ts &&
npx jest Hasher.test.ts &&
npx jest MessageValidator.test.ts &&
npx jest StateLeafAndBallotTransformer.test.ts &&
npx jest VerifySignature.test.ts 
