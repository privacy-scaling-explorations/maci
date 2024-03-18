"use strict";(self.webpackChunkwebsite=self.webpackChunkwebsite||[]).push([[6425],{5852:(e,t,s)=>{s.r(t),s.d(t,{assets:()=>l,contentTitle:()=>d,default:()=>o,frontMatter:()=>i,metadata:()=>a,toc:()=>h});var r=s(5250),n=s(720);const i={},d="MockHatsProtocol",a={id:"solidity-docs/mocks/MockHatsProtocol",title:"MockHatsProtocol",description:"A mock contract to test the HatsGatekeeper",source:"@site/versioned_docs/version-v1.x/solidity-docs/mocks/MockHatsProtocol.md",sourceDirName:"solidity-docs/mocks",slug:"/solidity-docs/mocks/MockHatsProtocol",permalink:"/docs/solidity-docs/mocks/MockHatsProtocol",draft:!1,unlisted:!1,editUrl:"https://github.com/privacy-scaling-explorations/maci/edit/dev/website/versioned_docs/version-v1.x/solidity-docs/mocks/MockHatsProtocol.md",tags:[],version:"v1.x",frontMatter:{},sidebar:"version-1.x/mySidebar",previous:{title:"IVkRegistry",permalink:"/docs/solidity-docs/interfaces/IVkRegistry"},next:{title:"AccQueue",permalink:"/docs/solidity-docs/trees/AccQueue"}},l={},h=[{value:"hats",id:"hats",level:3},{value:"lastTopHat",id:"lasttophat",level:3},{value:"lastHat",id:"lasthat",level:3},{value:"constructor",id:"constructor",level:3},{value:"Parameters",id:"parameters",level:4},{value:"mintTopHat",id:"minttophat",level:3},{value:"Parameters",id:"parameters-1",level:4},{value:"Return Values",id:"return-values",level:4},{value:"createHat",id:"createhat",level:3},{value:"Parameters",id:"parameters-2",level:4},{value:"Return Values",id:"return-values-1",level:4},{value:"mintHat",id:"minthat",level:3},{value:"Parameters",id:"parameters-3",level:4},{value:"Return Values",id:"return-values-2",level:4},{value:"isWearerOfHat",id:"iswearerofhat",level:3},{value:"Parameters",id:"parameters-4",level:4},{value:"Return Values",id:"return-values-3",level:4}];function c(e){const t={code:"code",em:"em",h1:"h1",h3:"h3",h4:"h4",p:"p",pre:"pre",table:"table",tbody:"tbody",td:"td",th:"th",thead:"thead",tr:"tr",...(0,n.a)(),...e.components};return(0,r.jsxs)(r.Fragment,{children:[(0,r.jsx)(t.h1,{id:"mockhatsprotocol",children:"MockHatsProtocol"}),"\n",(0,r.jsx)(t.p,{children:"A mock contract to test the HatsGatekeeper"}),"\n",(0,r.jsx)(t.h3,{id:"hats",children:"hats"}),"\n",(0,r.jsx)(t.pre,{children:(0,r.jsx)(t.code,{className:"language-solidity",children:"contract IHats hats\n"})}),"\n",(0,r.jsx)(t.h3,{id:"lasttophat",children:"lastTopHat"}),"\n",(0,r.jsx)(t.pre,{children:(0,r.jsx)(t.code,{className:"language-solidity",children:"uint256 lastTopHat\n"})}),"\n",(0,r.jsx)(t.h3,{id:"lasthat",children:"lastHat"}),"\n",(0,r.jsx)(t.pre,{children:(0,r.jsx)(t.code,{className:"language-solidity",children:"uint256 lastHat\n"})}),"\n",(0,r.jsx)(t.h3,{id:"constructor",children:"constructor"}),"\n",(0,r.jsx)(t.pre,{children:(0,r.jsx)(t.code,{className:"language-solidity",children:"constructor(address _hats) public payable\n"})}),"\n",(0,r.jsx)(t.p,{children:"Deploy an instance of MockHatsProtocol"}),"\n",(0,r.jsx)(t.h4,{id:"parameters",children:"Parameters"}),"\n",(0,r.jsxs)(t.table,{children:[(0,r.jsx)(t.thead,{children:(0,r.jsxs)(t.tr,{children:[(0,r.jsx)(t.th,{children:"Name"}),(0,r.jsx)(t.th,{children:"Type"}),(0,r.jsx)(t.th,{children:"Description"})]})}),(0,r.jsx)(t.tbody,{children:(0,r.jsxs)(t.tr,{children:[(0,r.jsx)(t.td,{children:"_hats"}),(0,r.jsx)(t.td,{children:"address"}),(0,r.jsx)(t.td,{children:"The Hats Protocol contract"})]})})]}),"\n",(0,r.jsx)(t.h3,{id:"minttophat",children:"mintTopHat"}),"\n",(0,r.jsx)(t.pre,{children:(0,r.jsx)(t.code,{className:"language-solidity",children:"function mintTopHat(address _target, string _details, string _imageURI) external returns (uint256)\n"})}),"\n",(0,r.jsx)(t.p,{children:'Creates and mints a Hat that is its own admin, i.e. a "topHat"'}),"\n",(0,r.jsx)(t.p,{children:(0,r.jsx)(t.em,{children:"A topHat has no eligibility and no toggle"})}),"\n",(0,r.jsx)(t.h4,{id:"parameters-1",children:"Parameters"}),"\n",(0,r.jsxs)(t.table,{children:[(0,r.jsx)(t.thead,{children:(0,r.jsxs)(t.tr,{children:[(0,r.jsx)(t.th,{children:"Name"}),(0,r.jsx)(t.th,{children:"Type"}),(0,r.jsx)(t.th,{children:"Description"})]})}),(0,r.jsxs)(t.tbody,{children:[(0,r.jsxs)(t.tr,{children:[(0,r.jsx)(t.td,{children:"_target"}),(0,r.jsx)(t.td,{children:"address"}),(0,r.jsx)(t.td,{children:"The address to which the newly created topHat is minted"})]}),(0,r.jsxs)(t.tr,{children:[(0,r.jsx)(t.td,{children:"_details"}),(0,r.jsx)(t.td,{children:"string"}),(0,r.jsx)(t.td,{children:"A description of the Hat [optional]. Should not be larger than 7000 bytes                 (enforced in changeHatDetails)"})]}),(0,r.jsxs)(t.tr,{children:[(0,r.jsx)(t.td,{children:"_imageURI"}),(0,r.jsx)(t.td,{children:"string"}),(0,r.jsx)(t.td,{children:"The image uri for this top hat and the fallback for its                  downstream hats [optional]. Should not be larger than 7000 bytes                  (enforced in changeHatImageURI)"})]})]})]}),"\n",(0,r.jsx)(t.h4,{id:"return-values",children:"Return Values"}),"\n",(0,r.jsxs)(t.table,{children:[(0,r.jsx)(t.thead,{children:(0,r.jsxs)(t.tr,{children:[(0,r.jsx)(t.th,{children:"Name"}),(0,r.jsx)(t.th,{children:"Type"}),(0,r.jsx)(t.th,{children:"Description"})]})}),(0,r.jsx)(t.tbody,{children:(0,r.jsxs)(t.tr,{children:[(0,r.jsx)(t.td,{children:"[0]"}),(0,r.jsx)(t.td,{children:"uint256"}),(0,r.jsx)(t.td,{children:"topHatId The id of the newly created topHat"})]})})]}),"\n",(0,r.jsx)(t.h3,{id:"createhat",children:"createHat"}),"\n",(0,r.jsx)(t.pre,{children:(0,r.jsx)(t.code,{className:"language-solidity",children:"function createHat(uint256 _admin, string _details, uint32 _maxSupply, address _eligibility, address _toggle, bool _mutable, string _imageURI) external returns (uint256)\n"})}),"\n",(0,r.jsxs)(t.p,{children:["Creates a new hat. The msg.sender must wear the ",(0,r.jsx)(t.code,{children:"_admin"})," hat."]}),"\n",(0,r.jsx)(t.p,{children:(0,r.jsx)(t.em,{children:"Initializes a new Hat struct, but does not mint any tokens."})}),"\n",(0,r.jsx)(t.h4,{id:"parameters-2",children:"Parameters"}),"\n",(0,r.jsxs)(t.table,{children:[(0,r.jsx)(t.thead,{children:(0,r.jsxs)(t.tr,{children:[(0,r.jsx)(t.th,{children:"Name"}),(0,r.jsx)(t.th,{children:"Type"}),(0,r.jsx)(t.th,{children:"Description"})]})}),(0,r.jsxs)(t.tbody,{children:[(0,r.jsxs)(t.tr,{children:[(0,r.jsx)(t.td,{children:"_admin"}),(0,r.jsx)(t.td,{children:"uint256"}),(0,r.jsx)(t.td,{children:"The id of the Hat that will control who wears the newly created hat"})]}),(0,r.jsxs)(t.tr,{children:[(0,r.jsx)(t.td,{children:"_details"}),(0,r.jsx)(t.td,{children:"string"}),(0,r.jsx)(t.td,{children:"A description of the Hat. Should not be larger than 7000 bytes (enforced in changeHatDetails)"})]}),(0,r.jsxs)(t.tr,{children:[(0,r.jsx)(t.td,{children:"_maxSupply"}),(0,r.jsx)(t.td,{children:"uint32"}),(0,r.jsx)(t.td,{children:"The total instances of the Hat that can be worn at once"})]}),(0,r.jsxs)(t.tr,{children:[(0,r.jsx)(t.td,{children:"_eligibility"}),(0,r.jsx)(t.td,{children:"address"}),(0,r.jsx)(t.td,{children:"The address that can report on the Hat wearer's status"})]}),(0,r.jsxs)(t.tr,{children:[(0,r.jsx)(t.td,{children:"_toggle"}),(0,r.jsx)(t.td,{children:"address"}),(0,r.jsx)(t.td,{children:"The address that can deactivate the Hat"})]}),(0,r.jsxs)(t.tr,{children:[(0,r.jsx)(t.td,{children:"_mutable"}),(0,r.jsx)(t.td,{children:"bool"}),(0,r.jsx)(t.td,{children:"Whether the hat's properties are changeable after creation"})]}),(0,r.jsxs)(t.tr,{children:[(0,r.jsx)(t.td,{children:"_imageURI"}),(0,r.jsx)(t.td,{children:"string"}),(0,r.jsx)(t.td,{children:"The image uri for this hat and the fallback for its   downstream hats [optional]. Should not be larger than 7000 bytes (enforced in changeHatImageURI)"})]})]})]}),"\n",(0,r.jsx)(t.h4,{id:"return-values-1",children:"Return Values"}),"\n",(0,r.jsxs)(t.table,{children:[(0,r.jsx)(t.thead,{children:(0,r.jsxs)(t.tr,{children:[(0,r.jsx)(t.th,{children:"Name"}),(0,r.jsx)(t.th,{children:"Type"}),(0,r.jsx)(t.th,{children:"Description"})]})}),(0,r.jsx)(t.tbody,{children:(0,r.jsxs)(t.tr,{children:[(0,r.jsx)(t.td,{children:"[0]"}),(0,r.jsx)(t.td,{children:"uint256"}),(0,r.jsx)(t.td,{children:"newHatId The id of the newly created Hat"})]})})]}),"\n",(0,r.jsx)(t.h3,{id:"minthat",children:"mintHat"}),"\n",(0,r.jsx)(t.pre,{children:(0,r.jsx)(t.code,{className:"language-solidity",children:"function mintHat(uint256 _hatId, address _wearer) external returns (bool)\n"})}),"\n",(0,r.jsx)(t.p,{children:'Mints an ERC1155-similar token of the Hat to an eligible recipient, who then "wears" the hat'}),"\n",(0,r.jsx)(t.p,{children:(0,r.jsxs)(t.em,{children:["The msg.sender must wear an admin Hat of ",(0,r.jsx)(t.code,{children:"_hatId"}),", and the recipient must be eligible to wear ",(0,r.jsx)(t.code,{children:"_hatId"})]})}),"\n",(0,r.jsx)(t.h4,{id:"parameters-3",children:"Parameters"}),"\n",(0,r.jsxs)(t.table,{children:[(0,r.jsx)(t.thead,{children:(0,r.jsxs)(t.tr,{children:[(0,r.jsx)(t.th,{children:"Name"}),(0,r.jsx)(t.th,{children:"Type"}),(0,r.jsx)(t.th,{children:"Description"})]})}),(0,r.jsxs)(t.tbody,{children:[(0,r.jsxs)(t.tr,{children:[(0,r.jsx)(t.td,{children:"_hatId"}),(0,r.jsx)(t.td,{children:"uint256"}),(0,r.jsx)(t.td,{children:"The id of the Hat to mint"})]}),(0,r.jsxs)(t.tr,{children:[(0,r.jsx)(t.td,{children:"_wearer"}),(0,r.jsx)(t.td,{children:"address"}),(0,r.jsx)(t.td,{children:"The address to which the Hat is minted"})]})]})]}),"\n",(0,r.jsx)(t.h4,{id:"return-values-2",children:"Return Values"}),"\n",(0,r.jsxs)(t.table,{children:[(0,r.jsx)(t.thead,{children:(0,r.jsxs)(t.tr,{children:[(0,r.jsx)(t.th,{children:"Name"}),(0,r.jsx)(t.th,{children:"Type"}),(0,r.jsx)(t.th,{children:"Description"})]})}),(0,r.jsx)(t.tbody,{children:(0,r.jsxs)(t.tr,{children:[(0,r.jsx)(t.td,{children:"[0]"}),(0,r.jsx)(t.td,{children:"bool"}),(0,r.jsx)(t.td,{})]})})]}),"\n",(0,r.jsx)(t.h3,{id:"iswearerofhat",children:"isWearerOfHat"}),"\n",(0,r.jsx)(t.pre,{children:(0,r.jsx)(t.code,{className:"language-solidity",children:"function isWearerOfHat(address account, uint256 hat) external view returns (bool)\n"})}),"\n",(0,r.jsx)(t.p,{children:"Checks whether a given address wears a given Hat"}),"\n",(0,r.jsx)(t.p,{children:(0,r.jsxs)(t.em,{children:["Convenience function that wraps ",(0,r.jsx)(t.code,{children:"balanceOf"})]})}),"\n",(0,r.jsx)(t.h4,{id:"parameters-4",children:"Parameters"}),"\n",(0,r.jsxs)(t.table,{children:[(0,r.jsx)(t.thead,{children:(0,r.jsxs)(t.tr,{children:[(0,r.jsx)(t.th,{children:"Name"}),(0,r.jsx)(t.th,{children:"Type"}),(0,r.jsx)(t.th,{children:"Description"})]})}),(0,r.jsxs)(t.tbody,{children:[(0,r.jsxs)(t.tr,{children:[(0,r.jsx)(t.td,{children:"account"}),(0,r.jsx)(t.td,{children:"address"}),(0,r.jsx)(t.td,{children:"The address in question"})]}),(0,r.jsxs)(t.tr,{children:[(0,r.jsx)(t.td,{children:"hat"}),(0,r.jsx)(t.td,{children:"uint256"}),(0,r.jsxs)(t.td,{children:["The id of the Hat that the ",(0,r.jsx)(t.code,{children:"_user"})," might wear"]})]})]})]}),"\n",(0,r.jsx)(t.h4,{id:"return-values-3",children:"Return Values"}),"\n",(0,r.jsxs)(t.table,{children:[(0,r.jsx)(t.thead,{children:(0,r.jsxs)(t.tr,{children:[(0,r.jsx)(t.th,{children:"Name"}),(0,r.jsx)(t.th,{children:"Type"}),(0,r.jsx)(t.th,{children:"Description"})]})}),(0,r.jsx)(t.tbody,{children:(0,r.jsxs)(t.tr,{children:[(0,r.jsx)(t.td,{children:"[0]"}),(0,r.jsx)(t.td,{children:"bool"}),(0,r.jsxs)(t.td,{children:["isWearer Whether the ",(0,r.jsx)(t.code,{children:"_user"})," wears the Hat."]})]})})]})]})}function o(e={}){const{wrapper:t}={...(0,n.a)(),...e.components};return t?(0,r.jsx)(t,{...e,children:(0,r.jsx)(c,{...e})}):c(e)}},720:(e,t,s)=>{s.d(t,{Z:()=>a,a:()=>d});var r=s(79);const n={},i=r.createContext(n);function d(e){const t=r.useContext(i);return r.useMemo((function(){return"function"==typeof e?e(t):{...t,...e}}),[t,e])}function a(e){let t;return t=e.disableParentContext?"function"==typeof e.components?e.components(n):e.components||n:d(e.components),r.createElement(i.Provider,{value:t},e.children)}}}]);