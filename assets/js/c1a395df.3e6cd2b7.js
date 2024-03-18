"use strict";(self.webpackChunkwebsite=self.webpackChunkwebsite||[]).push([[643],{5130:(e,n,t)=>{t.r(n),t.d(n,{assets:()=>c,contentTitle:()=>d,default:()=>h,frontMatter:()=>i,metadata:()=>a,toc:()=>o});var s=t(5250),r=t(720);const i={},d="SignUpTokenGatekeeper",a={id:"solidity-docs/gatekeepers/SignUpTokenGatekeeper",title:"SignUpTokenGatekeeper",description:"This contract allows to gatekeep MACI signups",source:"@site/versioned_docs/version-v1.x/solidity-docs/gatekeepers/SignUpTokenGatekeeper.md",sourceDirName:"solidity-docs/gatekeepers",slug:"/solidity-docs/gatekeepers/SignUpTokenGatekeeper",permalink:"/docs/solidity-docs/gatekeepers/SignUpTokenGatekeeper",draft:!1,unlisted:!1,editUrl:"https://github.com/privacy-scaling-explorations/maci/edit/dev/website/versioned_docs/version-v1.x/solidity-docs/gatekeepers/SignUpTokenGatekeeper.md",tags:[],version:"v1.x",frontMatter:{},sidebar:"version-1.x/mySidebar",previous:{title:"SignUpGatekeeper",permalink:"/docs/solidity-docs/gatekeepers/SignUpGatekeeper"},next:{title:"HatsGatekeeperBase",permalink:"/docs/solidity-docs/gatekeepers/hatsGatekeepers/HatsGatekeeperBase"}},c={},o=[{value:"token",id:"token",level:3},{value:"maci",id:"maci",level:3},{value:"registeredTokenIds",id:"registeredtokenids",level:3},{value:"AlreadyRegistered",id:"alreadyregistered",level:3},{value:"NotTokenOwner",id:"nottokenowner",level:3},{value:"OnlyMACI",id:"onlymaci",level:3},{value:"constructor",id:"constructor",level:3},{value:"Parameters",id:"parameters",level:4},{value:"setMaciInstance",id:"setmaciinstance",level:3},{value:"Parameters",id:"parameters-1",level:4},{value:"register",id:"register",level:3},{value:"Parameters",id:"parameters-2",level:4}];function l(e){const n={code:"code",h1:"h1",h3:"h3",h4:"h4",p:"p",pre:"pre",table:"table",tbody:"tbody",td:"td",th:"th",thead:"thead",tr:"tr",...(0,r.a)(),...e.components};return(0,s.jsxs)(s.Fragment,{children:[(0,s.jsx)(n.h1,{id:"signuptokengatekeeper",children:"SignUpTokenGatekeeper"}),"\n",(0,s.jsx)(n.p,{children:"This contract allows to gatekeep MACI signups\nby requiring new voters to own a certain ERC721 token"}),"\n",(0,s.jsx)(n.h3,{id:"token",children:"token"}),"\n",(0,s.jsx)(n.pre,{children:(0,s.jsx)(n.code,{className:"language-solidity",children:"contract SignUpToken token\n"})}),"\n",(0,s.jsx)(n.p,{children:"the reference to the SignUpToken contract"}),"\n",(0,s.jsx)(n.h3,{id:"maci",children:"maci"}),"\n",(0,s.jsx)(n.pre,{children:(0,s.jsx)(n.code,{className:"language-solidity",children:"address maci\n"})}),"\n",(0,s.jsx)(n.p,{children:"the reference to the MACI contract"}),"\n",(0,s.jsx)(n.h3,{id:"registeredtokenids",children:"registeredTokenIds"}),"\n",(0,s.jsx)(n.pre,{children:(0,s.jsx)(n.code,{className:"language-solidity",children:"mapping(uint256 => bool) registeredTokenIds\n"})}),"\n",(0,s.jsx)(n.p,{children:"a mapping of tokenIds to whether they have been used to sign up"}),"\n",(0,s.jsx)(n.h3,{id:"alreadyregistered",children:"AlreadyRegistered"}),"\n",(0,s.jsx)(n.pre,{children:(0,s.jsx)(n.code,{className:"language-solidity",children:"error AlreadyRegistered()\n"})}),"\n",(0,s.jsx)(n.p,{children:"custom errors"}),"\n",(0,s.jsx)(n.h3,{id:"nottokenowner",children:"NotTokenOwner"}),"\n",(0,s.jsx)(n.pre,{children:(0,s.jsx)(n.code,{className:"language-solidity",children:"error NotTokenOwner()\n"})}),"\n",(0,s.jsx)(n.h3,{id:"onlymaci",children:"OnlyMACI"}),"\n",(0,s.jsx)(n.pre,{children:(0,s.jsx)(n.code,{className:"language-solidity",children:"error OnlyMACI()\n"})}),"\n",(0,s.jsx)(n.h3,{id:"constructor",children:"constructor"}),"\n",(0,s.jsx)(n.pre,{children:(0,s.jsx)(n.code,{className:"language-solidity",children:"constructor(contract SignUpToken _token) public payable\n"})}),"\n",(0,s.jsx)(n.p,{children:"creates a new SignUpTokenGatekeeper"}),"\n",(0,s.jsx)(n.h4,{id:"parameters",children:"Parameters"}),"\n",(0,s.jsxs)(n.table,{children:[(0,s.jsx)(n.thead,{children:(0,s.jsxs)(n.tr,{children:[(0,s.jsx)(n.th,{children:"Name"}),(0,s.jsx)(n.th,{children:"Type"}),(0,s.jsx)(n.th,{children:"Description"})]})}),(0,s.jsx)(n.tbody,{children:(0,s.jsxs)(n.tr,{children:[(0,s.jsx)(n.td,{children:"_token"}),(0,s.jsx)(n.td,{children:"contract SignUpToken"}),(0,s.jsx)(n.td,{children:"the address of the SignUpToken contract"})]})})]}),"\n",(0,s.jsx)(n.h3,{id:"setmaciinstance",children:"setMaciInstance"}),"\n",(0,s.jsx)(n.pre,{children:(0,s.jsx)(n.code,{className:"language-solidity",children:"function setMaciInstance(address _maci) public\n"})}),"\n",(0,s.jsx)(n.p,{children:"Adds an uninitialised MACI instance to allow for token signups"}),"\n",(0,s.jsx)(n.h4,{id:"parameters-1",children:"Parameters"}),"\n",(0,s.jsxs)(n.table,{children:[(0,s.jsx)(n.thead,{children:(0,s.jsxs)(n.tr,{children:[(0,s.jsx)(n.th,{children:"Name"}),(0,s.jsx)(n.th,{children:"Type"}),(0,s.jsx)(n.th,{children:"Description"})]})}),(0,s.jsx)(n.tbody,{children:(0,s.jsxs)(n.tr,{children:[(0,s.jsx)(n.td,{children:"_maci"}),(0,s.jsx)(n.td,{children:"address"}),(0,s.jsx)(n.td,{children:"The MACI contract interface to be stored"})]})})]}),"\n",(0,s.jsx)(n.h3,{id:"register",children:"register"}),"\n",(0,s.jsx)(n.pre,{children:(0,s.jsx)(n.code,{className:"language-solidity",children:"function register(address _user, bytes _data) public\n"})}),"\n",(0,s.jsx)(n.p,{children:"Registers the user if they own the token with the token ID encoded in\n_data. Throws if the user does not own the token or if the token has\nalready been used to sign up."}),"\n",(0,s.jsx)(n.h4,{id:"parameters-2",children:"Parameters"}),"\n",(0,s.jsxs)(n.table,{children:[(0,s.jsx)(n.thead,{children:(0,s.jsxs)(n.tr,{children:[(0,s.jsx)(n.th,{children:"Name"}),(0,s.jsx)(n.th,{children:"Type"}),(0,s.jsx)(n.th,{children:"Description"})]})}),(0,s.jsxs)(n.tbody,{children:[(0,s.jsxs)(n.tr,{children:[(0,s.jsx)(n.td,{children:"_user"}),(0,s.jsx)(n.td,{children:"address"}),(0,s.jsx)(n.td,{children:"The user's Ethereum address."})]}),(0,s.jsxs)(n.tr,{children:[(0,s.jsx)(n.td,{children:"_data"}),(0,s.jsx)(n.td,{children:"bytes"}),(0,s.jsx)(n.td,{children:"The ABI-encoded tokenId as a uint256."})]})]})]})]})}function h(e={}){const{wrapper:n}={...(0,r.a)(),...e.components};return n?(0,s.jsx)(n,{...e,children:(0,s.jsx)(l,{...e})}):l(e)}},720:(e,n,t)=>{t.d(n,{Z:()=>a,a:()=>d});var s=t(79);const r={},i=s.createContext(r);function d(e){const n=s.useContext(i);return s.useMemo((function(){return"function"==typeof e?e(n):{...n,...e}}),[n,e])}function a(e){let n;return n=e.disableParentContext?"function"==typeof e.components?e.components(r):e.components||r:d(e.components),s.createElement(i.Provider,{value:n},e.children)}}}]);