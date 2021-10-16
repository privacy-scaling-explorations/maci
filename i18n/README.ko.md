# 최소 담합 방지 인프라 (Minimal Anti-Collusion Infrastructure)

기술적 세부사항은 [구현 스펙](../specs/)을 참조하고, 
대략적인 개념은 
원문 [ethresear.ch 포스트](https://ethresear.ch/t/minimal-anti-collusion-infrastructure/5413)를 참조하세요.


이 프로젝트에 대한 기여를 환영합니다. 관련 논의가 필요하다면 
[텔레그램 그룹](https://t.me/joinchat/LUgOpE7J2gstRcZqdERyvw)에 가입하세요. 

## 로컬 개발 및 테스트

### 요구 사항

Node 12가 설치되어 있어야 합니다. [`nvm`](https://github.com/nvm-sh/nvm)을 사용하여 
설치하세요.

또한 Intel CPU에 설치된 우분투/데비안 리눅스가 필요합니다.

### 시작하기

dependency를 설치하세요:

```bash
sudo apt-get install build-essential libgmp-dev libsodium-dev git nlohmann-json3-dev nasm g++
```

이 저장소를 clone하고, NodeJS dependency를 설치한 후, 소스코드를 빌드하세요:

```bash
git clone git@github.com:appliedzkp/maci.git && \
cd maci && \
npm i && \
npm run bootstrap && \
npm run build
```

개발을 하기 위해, Solidity 검증 컨트랙트(verifier contract)와 함께 영지식 스나크
(zk-SNARK) 회로를 사용하기 위한 증명 및 검증키를 생성할 수 있습니다.

Rust를 설치하세요:

```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```

또한 [`zkutil`](https://github.com/poma/zkutil) v0.3.2 를 설치하고 `zkutil` 바이너리가 `~/.cargo/bin/` 디렉토리에 존재하는지 확인하세요. 
`maci-config`를 사용해 `zkutil` 바이너리의 경로를 [구성할 수 있습니다](https://lorenwest.github.io/node-config/). 
(예제는 `config/test.yaml` 참고)

```bash
cargo install zkutil --version 0.3.2 &&
zkutil --help
```

zk-SNARKs를 빌드하고 증명 및 검증키를 생성하세요:

```bash
cd circuits
npm run buildBatchUpdateStateTreeSnark
npm run buildQuadVoteTallySnark
```

이 작업은 5분 내에 완료됩니다. 
과거에는 키와 컴파일된 회로 파일의 작업 버전을 다운로드 받기 위한 링크를 제공했지만, 
이제는 `snarkjs`를 사용하여 매우 빠르게 생성할 수 있게 되어, 해당 링크는 더 이상 관리하지 않습니다.

만약 회로를 변경한 후 재컴파일하게 되면, 
`contracts/sol`에 있는 검증 컨트랙트도 업데이트 후 재컴파일해야 합니다. 
그렇지 않으면 테스트가 실패합니다:

```bash
cd contracts
npm run compileSol
```

### 데모

MACI 커맨드라인 인터페이스를 사용해 데모를 실행할 수 있습니다. 참고하세요:
https://github.com/appliedzkp/maci/tree/master/cli#demonstration

### 로컬 개발

이 저장소는 Lerna 서브 모듈로 구성되어 있습니다. 각 서브 모듈에는 고유의 
유닛 테스트가 있습니다.

- `config`: 프로젝트 전반의 구성 파일. 
테스트와 프로덕션을 위한 구성 파일을 포함합니다.
- `crypto`: 로우-레벨 암호화 작업.
- `circuits`: zk-SNARK 회로.
- `contracts`: Solidity 컨트랙트와 개발 코드. 
- `domainobjs`: 이 프로젝트와 관련된 
하이-레벨 [도메인 객체](https://wiki.c2.com/?DomainObject)를 나타내는 클래스.
- `core`: 추상 상태 머신 `MaciState`를 통한 
메시지 처리, 투표 집계, 회로 입력 생성 등을 
위한 비즈니스 로직 기능.
- `cli`: 배포와 MACI 인스턴스와 상호작용을 
할 수 있는 커맨드 라인 인터페이스.
- `integrationTests`: 커맨드 라인 인터페이스를 사용해 e2e 테스트를 
수행할 수 있는 통합 테스트.

### 테스트

#### 유닛 테스트

다음 서브 모듈들은 유닛 테스트를 포함하고 있습니다: `core`, `crypto`, `circuits`,
`contracts`, 그리고 `domainobjs`.

`contracts` 서브 모듈을 제외하고, 다음과 같이 유닛 테스트를 실행합니다 (다음 예는 `crypto`에 
해당하는 예시입니다)

```bash
cd crypto
npm run test
```

`contracts` 와 `integrationTests`의 경우에는, 하나씩 단위 테스트를 실행합니다. 
잘못된 논스 에러를 방지하기 위한 것입니다.

먼저, 별도의 터미널에서 Ganache 인스턴스를 시작합니다:

```bash
cd contracts
npm run ganache
```

별도의 터미널에서 패턴 일치를 통해 `contracts/ts/__tests__/`에 있는 모든 테스트를 
실행하세요, 예를 들어:

```bash
cd contracts
npx jest IncrementalMerkleTree
```

는 `IncrementalMerkleTree.test.ts`를 실행시킬 것입니다.

주의. `npx jest Tree`와 `IncrementalQuinTree.test.ts`는 병렬로 
실행되어 잘못된 논스 에러를 발생시킵니다.

대체안으로, 테스트를 실행하기 전 자체 인스턴스가 시작하게 되므로
 먼저 기존의 Ganache 인스턴스를 종료한 후 
 모든 유닛 테스트를 실행하는 방법도 있습니다.

```bash
cd contracts
./scripts/runTestsInCircleCi.sh
```

아니면 전체 통합 테스트를 실행하세요 (이 역시 별도의 Ganache 인스턴스를 시작시킵니다)

```bash
cd integrationTests
./scripts/runTestsInCircleCi.sh
```

이미 별도의 터미널에서 Ganache를 실행하고 있어야 하므로 이 스크립트에서 발생하는 Ganache 오류를 
무시할 수 있습니다. 그렇지 않으면 `kill` 명령어를 사용하여 
Ganache를 종료해야 합니다.
