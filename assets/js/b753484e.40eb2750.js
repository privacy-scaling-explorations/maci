"use strict";(self.webpackChunkwebsite=self.webpackChunkwebsite||[]).push([[9237],{7414:(e,t,s)=>{s.r(t),s.d(t,{assets:()=>l,contentTitle:()=>n,default:()=>h,frontMatter:()=>a,metadata:()=>d,toc:()=>c});var r=s(5250),i=s(720);const a={},n="HatsGatekeeperMultiple",d={id:"solidity-docs/gatekeepers/hatsGatekeepers/HatsGatekeeperMultiple",title:"HatsGatekeeperMultiple",description:"A gatekeeper contract which allows users to sign up to MACI",source:"@site/versioned_docs/version-v1.x/solidity-docs/gatekeepers/hatsGatekeepers/HatsGatekeeperMultiple.md",sourceDirName:"solidity-docs/gatekeepers/hatsGatekeepers",slug:"/solidity-docs/gatekeepers/hatsGatekeepers/HatsGatekeeperMultiple",permalink:"/docs/solidity-docs/gatekeepers/hatsGatekeepers/HatsGatekeeperMultiple",draft:!1,unlisted:!1,editUrl:"https://github.com/privacy-scaling-explorations/maci/edit/dev/website/versioned_docs/version-v1.x/solidity-docs/gatekeepers/hatsGatekeepers/HatsGatekeeperMultiple.md",tags:[],version:"v1.x",frontMatter:{},sidebar:"version-1.x/mySidebar",previous:{title:"HatsGatekeeperBase",permalink:"/docs/solidity-docs/gatekeepers/hatsGatekeepers/HatsGatekeeperBase"},next:{title:"HatsGatekeeperSingle",permalink:"/docs/solidity-docs/gatekeepers/hatsGatekeepers/HatsGatekeeperSingle"}},l={},c=[{value:"NotCriterionHat",id:"notcriterionhat",level:3},{value:"criterionHat",id:"criterionhat",level:3},{value:"constructor",id:"constructor",level:3},{value:"Parameters",id:"parameters",level:4},{value:"register",id:"register",level:3},{value:"Parameters",id:"parameters-1",level:4}];function o(e){const t={code:"code",h1:"h1",h3:"h3",h4:"h4",p:"p",pre:"pre",table:"table",tbody:"tbody",td:"td",th:"th",thead:"thead",tr:"tr",...(0,i.a)(),...e.components};return(0,r.jsxs)(r.Fragment,{children:[(0,r.jsx)(t.h1,{id:"hatsgatekeepermultiple",children:"HatsGatekeeperMultiple"}),"\n",(0,r.jsx)(t.p,{children:"A gatekeeper contract which allows users to sign up to MACI\nonly if they are wearing one of the specified hats"}),"\n",(0,r.jsx)(t.h3,{id:"notcriterionhat",children:"NotCriterionHat"}),"\n",(0,r.jsx)(t.pre,{children:(0,r.jsx)(t.code,{className:"language-solidity",children:"error NotCriterionHat()\n"})}),"\n",(0,r.jsx)(t.h3,{id:"criterionhat",children:"criterionHat"}),"\n",(0,r.jsx)(t.pre,{children:(0,r.jsx)(t.code,{className:"language-solidity",children:"mapping(uint256 => bool) criterionHat\n"})}),"\n",(0,r.jsx)(t.p,{children:"Tracks hats that users must wear to be eligible to register"}),"\n",(0,r.jsx)(t.h3,{id:"constructor",children:"constructor"}),"\n",(0,r.jsx)(t.pre,{children:(0,r.jsx)(t.code,{className:"language-solidity",children:"constructor(address _hats, uint256[] _criterionHats) public payable\n"})}),"\n",(0,r.jsx)(t.p,{children:"Deploy an instance of HatsGatekeeperMultiple"}),"\n",(0,r.jsx)(t.h4,{id:"parameters",children:"Parameters"}),"\n",(0,r.jsxs)(t.table,{children:[(0,r.jsx)(t.thead,{children:(0,r.jsxs)(t.tr,{children:[(0,r.jsx)(t.th,{children:"Name"}),(0,r.jsx)(t.th,{children:"Type"}),(0,r.jsx)(t.th,{children:"Description"})]})}),(0,r.jsxs)(t.tbody,{children:[(0,r.jsxs)(t.tr,{children:[(0,r.jsx)(t.td,{children:"_hats"}),(0,r.jsx)(t.td,{children:"address"}),(0,r.jsx)(t.td,{children:"The Hats Protocol contract"})]}),(0,r.jsxs)(t.tr,{children:[(0,r.jsx)(t.td,{children:"_criterionHats"}),(0,r.jsx)(t.td,{children:"uint256[]"}),(0,r.jsx)(t.td,{children:"Array of accepted criterion hats"})]})]})]}),"\n",(0,r.jsx)(t.h3,{id:"register",children:"register"}),"\n",(0,r.jsx)(t.pre,{children:(0,r.jsx)(t.code,{className:"language-solidity",children:"function register(address _user, bytes _data) public\n"})}),"\n",(0,r.jsx)(t.p,{children:"Registers the user"}),"\n",(0,r.jsx)(t.h4,{id:"parameters-1",children:"Parameters"}),"\n",(0,r.jsxs)(t.table,{children:[(0,r.jsx)(t.thead,{children:(0,r.jsxs)(t.tr,{children:[(0,r.jsx)(t.th,{children:"Name"}),(0,r.jsx)(t.th,{children:"Type"}),(0,r.jsx)(t.th,{children:"Description"})]})}),(0,r.jsxs)(t.tbody,{children:[(0,r.jsxs)(t.tr,{children:[(0,r.jsx)(t.td,{children:"_user"}),(0,r.jsx)(t.td,{children:"address"}),(0,r.jsx)(t.td,{children:"The address of the user"})]}),(0,r.jsxs)(t.tr,{children:[(0,r.jsx)(t.td,{children:"_data"}),(0,r.jsx)(t.td,{children:"bytes"}),(0,r.jsx)(t.td,{children:"additional data"})]})]})]})]})}function h(e={}){const{wrapper:t}={...(0,i.a)(),...e.components};return t?(0,r.jsx)(t,{...e,children:(0,r.jsx)(o,{...e})}):o(e)}},720:(e,t,s)=>{s.d(t,{Z:()=>d,a:()=>n});var r=s(79);const i={},a=r.createContext(i);function n(e){const t=r.useContext(a);return r.useMemo((function(){return"function"==typeof e?e(t):{...t,...e}}),[t,e])}function d(e){let t;return t=e.disableParentContext?"function"==typeof e.components?e.components(i):e.components||i:n(e.components),r.createElement(a.Provider,{value:t},e.children)}}}]);