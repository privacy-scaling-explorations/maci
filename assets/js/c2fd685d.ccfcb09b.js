"use strict";(self.webpackChunkwebsite=self.webpackChunkwebsite||[]).push([[2598],{5203:(e,n,t)=>{t.r(n),t.d(n,{assets:()=>c,contentTitle:()=>s,default:()=>l,frontMatter:()=>o,metadata:()=>r,toc:()=>d});var i=t(5893),a=t(1151);const o={title:"Integrating MACI",description:"How to integrate MACI into your application",sidebar_label:"Integrating",sidebar_position:9},s="Integrating MACI",r={id:"v1.x/integrating",title:"Integrating MACI",description:"How to integrate MACI into your application",source:"@site/docs/v1.x/integrating.md",sourceDirName:"v1.x",slug:"/v1.x/integrating",permalink:"/maci/docs/v1.x/integrating",draft:!1,unlisted:!1,editUrl:"https://github.com/facebook/docusaurus/tree/main/packages/create-docusaurus/templates/shared/docs/v1.x/integrating.md",tags:[],version:"current",sidebarPosition:9,frontMatter:{title:"Integrating MACI",description:"How to integrate MACI into your application",sidebar_label:"Integrating",sidebar_position:9},sidebar:"docSidebar",previous:{title:"Trusted Setup",permalink:"/maci/docs/v1.x/trusted-setup"},next:{title:"Circuits",permalink:"/maci/docs/v1.x/circuits"}},c={},d=[{value:"MACI Contract",id:"maci-contract",level:2},{value:"Poll Contract",id:"poll-contract",level:2}];function u(e){const n={a:"a",code:"code",h1:"h1",h2:"h2",p:"p",pre:"pre",...(0,a.a)(),...e.components};return(0,i.jsxs)(i.Fragment,{children:[(0,i.jsx)(n.h1,{id:"integrating-maci",children:"Integrating MACI"}),"\n",(0,i.jsxs)(n.p,{children:["MACI can be used in any protocol that requires collusion resistance, for instance it has been proven to be quite efficient when integrated in quadratic funding applications such as ",(0,i.jsx)(n.a,{href:"https://github.com/clrfund/monorepo",children:"clr.fund"})," and ",(0,i.jsx)(n.a,{href:"https://github.com/quadratic-funding/qfi/tree/feat/code-freeze",children:"qfi"}),"."]}),"\n",(0,i.jsx)(n.p,{children:"Here we will be looking at QFI and how it was used. Please note that this will be expanded as QFI is updated to use the newest version of MACI. Should you decide to integrate MACI in the meantime, feel free to open an issue on the GitHub repo."}),"\n",(0,i.jsx)(n.h2,{id:"maci-contract",children:"MACI Contract"}),"\n",(0,i.jsx)(n.p,{children:"The MACI contract is the core of the protocol. Contracts can inherit from MACI and thus expose the signup and topup functions. As with standalone MACI, one would need to deploy a sign up gatekeeper as well as the voice credit proxy."}),"\n",(0,i.jsx)(n.p,{children:"As an example, within the quadratic funding infrastructure project, the QFI contract inherits from MACI and allows sign up via the contribute function."}),"\n",(0,i.jsx)(n.pre,{children:(0,i.jsx)(n.code,{className:"language-javascript",children:"function contribute(\n    PubKey calldata pubKey, \n    uint256 amount\n    ) external {\n\n    [..snip]\n\n    uint256 voiceCredits = amount / voiceCreditFactor;\n    // The user is marked as registered here upon contribution\n    grantRoundToContributors[nextGrantRoundId][msg.sender] = ContributorStatus(voiceCredits, true);\n    \n    // Increase the number of contributors for this round\n    grantRoundToContributorsCount[nextGrantRoundId]++;\n\n    bytes memory signUpGatekeeperAndInitialVoiceCreditProxyData = abi.encode(\n        msg.sender,\n        voiceCredits\n    );\n\n    signUp(\n        pubKey, \n        signUpGatekeeperAndInitialVoiceCreditProxyData, \n        signUpGatekeeperAndInitialVoiceCreditProxyData\n    );\n\n    [..snip]\n\n    emit ContributionSent(msg.sender, amount);\n}\n"})}),"\n",(0,i.jsx)(n.h2,{id:"poll-contract",children:"Poll Contract"}),"\n",(0,i.jsx)(n.p,{children:"On the other hand, the Poll contract can be inherited to expose functionality such as top ups and publishing of messages/commands."}),"\n",(0,i.jsxs)(n.p,{children:["For instance, within QFI, the ",(0,i.jsx)(n.code,{children:"publishMessageBatch"})," function call the ",(0,i.jsx)(n.code,{children:"publishMessage"})," function of Poll, as shown below:"]}),"\n",(0,i.jsx)(n.pre,{children:(0,i.jsx)(n.code,{className:"language-javascript",children:'function publishMessageBatch(\n    Message[] calldata _messages,\n    PubKey[] calldata _encPubKeys\n) external {\n    // Check that the two arrays have the same length\n    require(\n        _messages.length == _encPubKeys.length, \n        "GrantRound: _messages and _encPubKeys should be the same length"\n    );\n    \n    uint256 batchSize = _messages.length;\n    for (uint8 i = 0; i < batchSize; ++i) {\n        publishMessage(_messages[i], _encPubKeys[i]);\n    }\n\n    emit Voted(msg.sender);\n}\n'})})]})}function l(e={}){const{wrapper:n}={...(0,a.a)(),...e.components};return n?(0,i.jsx)(n,{...e,children:(0,i.jsx)(u,{...e})}):u(e)}},1151:(e,n,t)=>{t.d(n,{Z:()=>r,a:()=>s});var i=t(7294);const a={},o=i.createContext(a);function s(e){const n=i.useContext(o);return i.useMemo((function(){return"function"==typeof e?e(n):{...n,...e}}),[n,e])}function r(e){let n;return n=e.disableParentContext?"function"==typeof e.components?e.components(a):e.components||a:s(e.components),i.createElement(o.Provider,{value:n},e.children)}}}]);