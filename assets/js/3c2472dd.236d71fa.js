"use strict";(self.webpackChunkchialisp_web=self.webpackChunkchialisp_web||[]).push([[660],{7415:(e,n,i)=>{i.r(n),i.d(n,{assets:()=>a,contentTitle:()=>c,default:()=>h,frontMatter:()=>r,metadata:()=>d,toc:()=>o});var s=i(4848),l=i(8453);const r={id:"commands",title:"Commands",slug:"/commands"},c=void 0,d={id:"commands",title:"Commands",description:"Chialisp has a set of commands that make developing, compiling, and running programs easy.",source:"@site/docs/commands.md",sourceDirName:".",slug:"/commands",permalink:"/commands",draft:!1,unlisted:!1,editUrl:"https://github.com/Chia-Network/chialisp-web/blob/main/docs/commands.md",tags:[],version:"current",frontMatter:{id:"commands",title:"Commands",slug:"/commands"},sidebar:"someSidebar",previous:{title:"Condition Morphing",permalink:"/chialisp-condition-morphing"},next:{title:"Syntax",permalink:"/syntax"}},a={},o=[{value:"Chia Dev Tools",id:"chia-dev-tools",level:2},{value:"Retrieve",id:"retrieve",level:3},{value:"Build",id:"build",level:3},{value:"Curry",id:"curry",level:3},{value:"Uncurry",id:"uncurry",level:3},{value:"Disassemble",id:"disassemble",level:3},{value:"Tree Hash",id:"tree-hash",level:3},{value:"Chialisp",id:"chialisp",level:2},{value:"Compile",id:"compile",level:3},{value:"Run",id:"run",level:3},{value:"Serialize",id:"serialize",level:3},{value:"Deserialize",id:"deserialize",level:3}];function t(e){const n={a:"a",admonition:"admonition",code:"code",h2:"h2",h3:"h3",p:"p",pre:"pre",table:"table",tbody:"tbody",td:"td",th:"th",thead:"thead",tr:"tr",...(0,l.R)(),...e.components};return(0,s.jsxs)(s.Fragment,{children:[(0,s.jsx)(n.p,{children:"Chialisp has a set of commands that make developing, compiling, and running programs easy."}),"\n",(0,s.jsxs)(n.p,{children:["You will need to install ",(0,s.jsx)(n.a,{href:"https://github.com/Chia-Network/chia-dev-tools",children:"chia-dev-tools"})," globally or inside of a virtual environment to get started."]}),"\n",(0,s.jsx)(n.admonition,{type:"note",children:(0,s.jsxs)(n.p,{children:["This is a brief overview of each command. If you want more information, use ",(0,s.jsx)(n.code,{children:"-h"})," or ",(0,s.jsx)(n.code,{children:"--help"})," on a given command."]})}),"\n",(0,s.jsx)(n.h2,{id:"chia-dev-tools",children:"Chia Dev Tools"}),"\n",(0,s.jsx)(n.h3,{id:"retrieve",children:"Retrieve"}),"\n",(0,s.jsx)(n.p,{children:"You can use this command to get one or more of the default library files:"}),"\n",(0,s.jsx)(n.pre,{children:(0,s.jsx)(n.code,{className:"language-bash",children:"cdv clsp retrieve condition_codes sha256tree # ...\n"})}),"\n",(0,s.jsx)(n.p,{children:"Here is a list of things you can retrieve:"}),"\n",(0,s.jsxs)(n.table,{children:[(0,s.jsx)(n.thead,{children:(0,s.jsxs)(n.tr,{children:[(0,s.jsx)(n.th,{children:"Library"}),(0,s.jsx)(n.th,{children:"Description"})]})}),(0,s.jsxs)(n.tbody,{children:[(0,s.jsxs)(n.tr,{children:[(0,s.jsx)(n.td,{children:"condition_codes"}),(0,s.jsx)(n.td,{children:"Condition opcode constants."})]}),(0,s.jsxs)(n.tr,{children:[(0,s.jsx)(n.td,{children:"curry_and_treehash"}),(0,s.jsx)(n.td,{children:"Utilities for currying puzzle hashes."})]}),(0,s.jsxs)(n.tr,{children:[(0,s.jsx)(n.td,{children:"sha256tree"}),(0,s.jsx)(n.td,{children:"A function that tree hashes a value."})]}),(0,s.jsxs)(n.tr,{children:[(0,s.jsx)(n.td,{children:"singleton_truths"}),(0,s.jsx)(n.td,{children:"Truth struct functions for singletons."})]}),(0,s.jsxs)(n.tr,{children:[(0,s.jsx)(n.td,{children:"utility_macros"}),(0,s.jsx)(n.td,{children:"Some helpful utility macros."})]})]})]}),"\n",(0,s.jsx)(n.h3,{id:"build",children:"Build"}),"\n",(0,s.jsx)(n.p,{children:"You can build your programs like this:"}),"\n",(0,s.jsx)(n.pre,{children:(0,s.jsx)(n.code,{className:"language-bash",children:"cdv clsp build # Builds all files in the directory.\ncdv clsp build program.clsp # Builds a single file.\n"})}),"\n",(0,s.jsxs)(n.p,{children:["When you use the ",(0,s.jsx)(n.code,{children:"include"})," operator, it will look for files in the ",(0,s.jsx)(n.code,{children:"include"})," folder by default."]}),"\n",(0,s.jsx)(n.p,{children:"You can add more include directories like this:"}),"\n",(0,s.jsx)(n.pre,{children:(0,s.jsx)(n.code,{className:"language-bash",children:"cdv clsp build program.clsp --include libraries\n"})}),"\n",(0,s.jsxs)(n.p,{children:["You can also use ",(0,s.jsx)(n.code,{children:"-i"})," instead of ",(0,s.jsx)(n.code,{children:"--include"})," if you prefer."]}),"\n",(0,s.jsx)(n.h3,{id:"curry",children:"Curry"}),"\n",(0,s.jsxs)(n.p,{children:["You can ",(0,s.jsx)(n.a,{href:"/chialisp-currying",children:"curry"})," values into your program like this:"]}),"\n",(0,s.jsx)(n.pre,{children:(0,s.jsx)(n.code,{className:"language-bash",children:"cdv clsp curry program.clsp --args '0xCAFEF00D' --args '(hello there)'\n"})}),"\n",(0,s.jsxs)(n.p,{children:["You can also use ",(0,s.jsx)(n.code,{children:"-a"})," instead of ",(0,s.jsx)(n.code,{children:"--args"})," if you prefer."]}),"\n",(0,s.jsx)(n.h3,{id:"uncurry",children:"Uncurry"}),"\n",(0,s.jsx)(n.p,{children:"You can reverse the currying process of compiled CLVM like this:"}),"\n",(0,s.jsx)(n.pre,{children:(0,s.jsx)(n.code,{className:"language-bash",children:"cdv clsp uncurry compiled.clvm\n"})}),"\n",(0,s.jsx)(n.h3,{id:"disassemble",children:"Disassemble"}),"\n",(0,s.jsx)(n.p,{children:"You can convert compiled CLVM back into the readable form like this:"}),"\n",(0,s.jsx)(n.pre,{children:(0,s.jsx)(n.code,{className:"language-bash",children:"cdv clsp disassemble compiled.clvm\n"})}),"\n",(0,s.jsx)(n.h3,{id:"tree-hash",children:"Tree Hash"}),"\n",(0,s.jsx)(n.p,{children:"You can calculate the tree hash (analagous to puzzle hash) of compiled CLVM like this:"}),"\n",(0,s.jsx)(n.pre,{children:(0,s.jsx)(n.code,{className:"language-bash",children:"cdv clsp treehash compiled.clvm\n"})}),"\n",(0,s.jsx)(n.h2,{id:"chialisp",children:"Chialisp"}),"\n",(0,s.jsx)(n.h3,{id:"compile",children:"Compile"}),"\n",(0,s.jsx)(n.p,{children:"You can use this command to directly compile Chialisp into CLVM:"}),"\n",(0,s.jsx)(n.pre,{children:(0,s.jsx)(n.code,{className:"language-bash",children:"run program.clsp\n"})}),"\n",(0,s.jsx)(n.p,{children:"However, you will need to include libraries manually:"}),"\n",(0,s.jsx)(n.pre,{children:(0,s.jsx)(n.code,{className:"language-bash",children:"run program.clsp --include include\n"})}),"\n",(0,s.jsxs)(n.p,{children:["You can also use ",(0,s.jsx)(n.code,{children:"-i"})," instead of ",(0,s.jsx)(n.code,{children:"--include"})," if you prefer."]}),"\n",(0,s.jsx)(n.h3,{id:"run",children:"Run"}),"\n",(0,s.jsx)(n.p,{children:"You can execute bytecode directly on CLVM like this:"}),"\n",(0,s.jsx)(n.pre,{children:(0,s.jsx)(n.code,{className:"language-bash",children:"brun compiled.clvm\n"})}),"\n",(0,s.jsx)(n.p,{children:"Or if you have the serialized form:"}),"\n",(0,s.jsx)(n.pre,{children:(0,s.jsx)(n.code,{className:"language-bash",children:"brun --hex compiled.clvm.hex\n"})}),"\n",(0,s.jsxs)(n.p,{children:["You can also use ",(0,s.jsx)(n.code,{children:"-x"})," instead of ",(0,s.jsx)(n.code,{children:"--hex"})," if you prefer."]}),"\n",(0,s.jsx)(n.p,{children:"Note that if you want to run it with an environment (analagous to solution), you can do so like this:"}),"\n",(0,s.jsx)(n.pre,{children:(0,s.jsx)(n.code,{className:"language-bash",children:"brun compiled.clvm '(arguments here)'\n"})}),"\n",(0,s.jsx)(n.h3,{id:"serialize",children:"Serialize"}),"\n",(0,s.jsx)(n.p,{children:"You can serialize CLVM into bytecode like this:"}),"\n",(0,s.jsx)(n.pre,{children:(0,s.jsx)(n.code,{className:"language-bash",children:"opc 'CLVM'\n"})}),"\n",(0,s.jsx)(n.p,{children:"Note that you cannot use a file with this command."}),"\n",(0,s.jsx)(n.h3,{id:"deserialize",children:"Deserialize"}),"\n",(0,s.jsx)(n.p,{children:"You can deserialize bytecode into CLVM like this:"}),"\n",(0,s.jsx)(n.pre,{children:(0,s.jsx)(n.code,{className:"language-bash",children:"opd 'bytecode'\n"})}),"\n",(0,s.jsx)(n.p,{children:"Note that you cannot use a file with this command."})]})}function h(e={}){const{wrapper:n}={...(0,l.R)(),...e.components};return n?(0,s.jsx)(n,{...e,children:(0,s.jsx)(t,{...e})}):t(e)}},8453:(e,n,i)=>{i.d(n,{R:()=>c,x:()=>d});var s=i(6540);const l={},r=s.createContext(l);function c(e){const n=s.useContext(r);return s.useMemo((function(){return"function"==typeof e?e(n):{...n,...e}}),[n,e])}function d(e){let n;return n=e.disableParentContext?"function"==typeof e.components?e.components(l):e.components||l:c(e.components),s.createElement(r.Provider,{value:n},e.children)}}}]);