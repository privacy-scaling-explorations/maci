#!/bin/bash

node ./build/index.js create \
    -d 0xc87509a1c067bbde78beb793e6fa76530b6382a4c0241e5e4a9ec0a0f44dc0d3 \
    -sk macisk.8715ab59a3e88a7ceec80f214ec24a95287ef2cb399a329b6964a87f85cf51c \
    -e http://localhost:8545 -s 120 -o 120 -bm 8 -bv 8 -u 4294967296 -m 4294967296 && \
node ./build/index.js signup \
    -d 0xc87509a1c067bbde78beb793e6fa76530b6382a4c0241e5e4a9ec0a0f44dc0d3 \
    -e http://localhost:8545 \
    -p macipk.a8edcf537cd83ab10157e567ff9313c10dd4561734cb56befe941b4ec546280a \
    -x 0x2C2B9C9a4a25e24B174f26114e8926a9f2128FE4 && \
node ./build/index.js signup \
    -d 0xc87509a1c067bbde78beb793e6fa76530b6382a4c0241e5e4a9ec0a0f44dc0d3 \
    -e http://localhost:8545 \
    -p macipk.a8edcf537cd83ab10157e567ff9313c10dd4561734cb56befe941b4ec546280a \
    -x 0x2C2B9C9a4a25e24B174f26114e8926a9f2128FE4 && \
node ./build/index.js signup \
    -d 0xc87509a1c067bbde78beb793e6fa76530b6382a4c0241e5e4a9ec0a0f44dc0d3 \
    -e http://localhost:8545 \
    -p macipk.a8edcf537cd83ab10157e567ff9313c10dd4561734cb56befe941b4ec546280a \
    -x 0x2C2B9C9a4a25e24B174f26114e8926a9f2128FE4 && \
node ./build/index.js signup \
    -d 0xc87509a1c067bbde78beb793e6fa76530b6382a4c0241e5e4a9ec0a0f44dc0d3 \
    -e http://localhost:8545 \
    -p macipk.a8edcf537cd83ab10157e567ff9313c10dd4561734cb56befe941b4ec546280a \
    -x 0x2C2B9C9a4a25e24B174f26114e8926a9f2128FE4 && \
node ./build/index.js signup \
    -d 0xc87509a1c067bbde78beb793e6fa76530b6382a4c0241e5e4a9ec0a0f44dc0d3 \
    -e http://localhost:8545 \
    -p macipk.a8edcf537cd83ab10157e567ff9313c10dd4561734cb56befe941b4ec546280a \
    -x 0x2C2B9C9a4a25e24B174f26114e8926a9f2128FE4 && \
node ./build/index.js signup \
    -d 0xc87509a1c067bbde78beb793e6fa76530b6382a4c0241e5e4a9ec0a0f44dc0d3 \
    -e http://localhost:8545 \
    -p macipk.a8edcf537cd83ab10157e567ff9313c10dd4561734cb56befe941b4ec546280a \
    -x 0x2C2B9C9a4a25e24B174f26114e8926a9f2128FE4 && \
node ./build/index.js signup \
    -d 0xc87509a1c067bbde78beb793e6fa76530b6382a4c0241e5e4a9ec0a0f44dc0d3 \
    -e http://localhost:8545 \
    -p macipk.a8edcf537cd83ab10157e567ff9313c10dd4561734cb56befe941b4ec546280a \
    -x 0x2C2B9C9a4a25e24B174f26114e8926a9f2128FE4 && \
node ./build/index.js publish \
    -d 0xc87509a1c067bbde78beb793e6fa76530b6382a4c0241e5e4a9ec0a0f44dc0d3 \
    -e http://localhost:8545 \
    -x 0x2C2B9C9a4a25e24B174f26114e8926a9f2128FE4 \
    -sk macisk.adc328e5009b0267537dccc35998a04348eed1b93dd6d866c0f0401490b2f33 \
    -p macipk.a8edcf537cd83ab10157e567ff9313c10dd4561734cb56befe941b4ec546280a \
    -i 1 -v 0 -w 9 -n 1 && \
node ./build/index.js publish \
    -d 0xc87509a1c067bbde78beb793e6fa76530b6382a4c0241e5e4a9ec0a0f44dc0d3 \
    -e http://localhost:8545 \
    -x 0x2C2B9C9a4a25e24B174f26114e8926a9f2128FE4 \
    -sk macisk.adc328e5009b0267537dccc35998a04348eed1b93dd6d866c0f0401490b2f33 \
    -p macipk.a8edcf537cd83ab10157e567ff9313c10dd4561734cb56befe941b4ec546280a \
    -i 1 -v 0 -w 9 -n 1 && \
node ./build/index.js publish \
    -d 0xc87509a1c067bbde78beb793e6fa76530b6382a4c0241e5e4a9ec0a0f44dc0d3 \
    -e http://localhost:8545 \
    -x 0x2C2B9C9a4a25e24B174f26114e8926a9f2128FE4 \
    -sk macisk.adc328e5009b0267537dccc35998a04348eed1b93dd6d866c0f0401490b2f33 \
    -p macipk.a8edcf537cd83ab10157e567ff9313c10dd4561734cb56befe941b4ec546280a \
    -i 1 -v 0 -w 9 -n 1 && \
node ./build/index.js publish \
    -d 0xc87509a1c067bbde78beb793e6fa76530b6382a4c0241e5e4a9ec0a0f44dc0d3 \
    -e http://localhost:8545 \
    -x 0x2C2B9C9a4a25e24B174f26114e8926a9f2128FE4 \
    -sk macisk.adc328e5009b0267537dccc35998a04348eed1b93dd6d866c0f0401490b2f33 \
    -p macipk.a8edcf537cd83ab10157e567ff9313c10dd4561734cb56befe941b4ec546280a \
    -i 1 -v 0 -w 9 -n 1 && \
node ./build/index.js publish \
    -d 0xc87509a1c067bbde78beb793e6fa76530b6382a4c0241e5e4a9ec0a0f44dc0d3 \
    -e http://localhost:8545 \
    -x 0x2C2B9C9a4a25e24B174f26114e8926a9f2128FE4 \
    -sk macisk.adc328e5009b0267537dccc35998a04348eed1b93dd6d866c0f0401490b2f33 \
    -p macipk.a8edcf537cd83ab10157e567ff9313c10dd4561734cb56befe941b4ec546280a \
    -i 1 -v 0 -w 9 -n 1 && \
node ./build/index.js publish \
    -d 0xc87509a1c067bbde78beb793e6fa76530b6382a4c0241e5e4a9ec0a0f44dc0d3 \
    -e http://localhost:8545 \
    -x 0x2C2B9C9a4a25e24B174f26114e8926a9f2128FE4 \
    -sk macisk.adc328e5009b0267537dccc35998a04348eed1b93dd6d866c0f0401490b2f33 \
    -p macipk.a8edcf537cd83ab10157e567ff9313c10dd4561734cb56befe941b4ec546280a \
    -i 1 -v 0 -w 9 -n 1 && \
node ./build/index.js publish \
    -d 0xc87509a1c067bbde78beb793e6fa76530b6382a4c0241e5e4a9ec0a0f44dc0d3 \
    -e http://localhost:8545 \
    -x 0x2C2B9C9a4a25e24B174f26114e8926a9f2128FE4 \
    -sk macisk.adc328e5009b0267537dccc35998a04348eed1b93dd6d866c0f0401490b2f33 \
    -p macipk.a8edcf537cd83ab10157e567ff9313c10dd4561734cb56befe941b4ec546280a \
    -i 1 -v 0 -w 9 -n 1 && \
node ./build/index.js publish \
    -d 0xc87509a1c067bbde78beb793e6fa76530b6382a4c0241e5e4a9ec0a0f44dc0d3 \
    -e http://localhost:8545 \
    -x 0x2C2B9C9a4a25e24B174f26114e8926a9f2128FE4 \
    -sk macisk.adc328e5009b0267537dccc35998a04348eed1b93dd6d866c0f0401490b2f33 \
    -p macipk.a8edcf537cd83ab10157e567ff9313c10dd4561734cb56befe941b4ec546280a \
    -i 1 -v 0 -w 9 -n 1 && \
node ./build/index.js publish \
    -d 0xc87509a1c067bbde78beb793e6fa76530b6382a4c0241e5e4a9ec0a0f44dc0d3 \
    -e http://localhost:8545 \
    -x 0x2C2B9C9a4a25e24B174f26114e8926a9f2128FE4 \
    -sk macisk.adc328e5009b0267537dccc35998a04348eed1b93dd6d866c0f0401490b2f33 \
    -p macipk.a8edcf537cd83ab10157e567ff9313c10dd4561734cb56befe941b4ec546280a \
    -i 1 -v 0 -w 9 -n 1

time node build/index.js genProofs \
    -x 0x2C2B9C9a4a25e24B174f26114e8926a9f2128FE4 \
    -sk macisk.8715ab59a3e88a7ceec80f214ec24a95287ef2cb399a329b6964a87f85cf51c \
    -o proofs.json \
    -t tally.json \
    -m macistate32.test.json
