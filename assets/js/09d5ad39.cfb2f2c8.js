(self.webpackChunkchialisp_web=self.webpackChunkchialisp_web||[]).push([[864],{1498:(e,n,l)=>{"use strict";l.r(n),l.d(n,{assets:()=>c,contentTitle:()=>a,default:()=>h,frontMatter:()=>r,metadata:()=>o,toc:()=>d});var t=l(4848),s=l(8453),i=l(3823);const r={id:"examples",title:"Examples",slug:"/examples"},a=void 0,o={id:"examples",title:"Examples",description:"This is a set of examples for various operators. If you want to see their documentation, checkout the Operators page.",source:"@site/docs/examples.md",sourceDirName:".",slug:"/examples",permalink:"/examples",draft:!1,unlisted:!1,editUrl:"https://github.com/Chia-Network/chialisp-web/blob/main/docs/examples.md",tags:[],version:"current",frontMatter:{id:"examples",title:"Examples",slug:"/examples"},sidebar:"someSidebar",previous:{title:"Operators",permalink:"/operators"},next:{title:"Costs",permalink:"/costs"}},c={},d=[{value:"Modules",id:"modules",level:2},{value:"mod",id:"mod",level:3},{value:"include",id:"include",level:3},{value:"defun",id:"defun",level:3},{value:"defun-inline",id:"defun-inline",level:3},{value:"lambda",id:"lambda",level:3},{value:"defmacro, qq, unquote",id:"defmacro",level:3},{value:"defconstant",id:"defconstant",level:3}];function u(e){const n={a:"a",code:"code",h2:"h2",h3:"h3",p:"p",pre:"pre",...(0,s.R)(),...e.components};return(0,t.jsxs)(t.Fragment,{children:[(0,t.jsxs)(n.p,{children:["This is a set of examples for various operators. If you want to see their documentation, checkout the ",(0,t.jsx)(n.a,{href:"/operators",children:"Operators page"}),"."]}),"\n",(0,t.jsx)(n.h2,{id:"modules",children:"Modules"}),"\n",(0,t.jsx)(n.h3,{id:"mod",children:"mod"}),"\n",(0,t.jsx)(n.p,{children:"Compiles an entire program into a single executable expression. You can define other constants within it."}),"\n",(0,t.jsx)(i.A,{flavor:"chialisp",input:"(42)",children:(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:"language-chialisp",children:"(mod (value)\n\n    ;; Doubles the value as the output.\n    (* value 2)\n)\n"})})}),"\n",(0,t.jsx)(n.h3,{id:"include",children:"include"}),"\n",(0,t.jsx)(n.p,{children:"Includes all of the constants defined in a library file in the module."}),"\n",(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:"language-bash",children:"cdv clsp retrieve sha256tree\n"})}),"\n",(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:"language-chialisp",children:"(mod (thing-to-hash)\n\n    ;; Includes the constants defined in the file.\n    (include sha256tree.clib)\n\n    ;; Calls the utility function as the output.\n    (sha256tree thing-to-hash)\n)\n"})}),"\n",(0,t.jsx)(n.h3,{id:"defun",children:"defun"}),"\n",(0,t.jsx)(n.p,{children:"Defines a function that can be called from anywhere within the module."}),"\n",(0,t.jsx)(i.A,{flavor:"chialisp",children:(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:"language-chialisp",children:"(mod ()\n    (defun square (number)\n        ;; Returns the number squared.\n        (* number number)\n    )\n\n    (square 16)\n)\n"})})}),"\n",(0,t.jsx)(n.h3,{id:"defun-inline",children:"defun-inline"}),"\n",(0,t.jsx)(n.p,{children:"Defines an inline function that can be called from anywhere within the module. It simply replaces the call with the code within (like an easier to write but limited macro)."}),"\n",(0,t.jsx)(i.A,{flavor:"chialisp",children:(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:"language-chialisp",children:"(mod ()\n    (defun-inline double (number)\n        ;; Returns twice the number.\n        (* number 2)\n    )\n\n    (double 9)\n)\n"})})}),"\n",(0,t.jsx)(n.h3,{id:"lambda",children:"lambda"}),"\n",(0,t.jsx)(n.p,{children:"Compiles a block of code into a single executable expression. Useful for writing functions as arguments to other functions."}),"\n",(0,t.jsx)(i.A,{flavor:"chialisp",input:"(3 2)",children:(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:"language-chialisp",children:"(lambda (n1 n2)\n    ;; Returns the two added together.\n    (+ n1 n2)\n)\n"})})}),"\n",(0,t.jsx)(n.h3,{id:"defmacro",children:"defmacro, qq, unquote"}),"\n",(0,t.jsx)(n.p,{children:"Defines a macro that can manually structure the source code it is replaced with. Allows for advanced compile time behavior."}),"\n",(0,t.jsx)(i.A,{flavor:"chialisp",children:(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:"language-chialisp",children:"(mod ()\n    (defmacro or ARGS\n        (if ARGS\n            (qq (if (unquote (f ARGS))\n                1\n                (unquote (c or (r ARGS)))\n            ))\n        0)\n    )\n\n    (or () () 1)\n)\n"})})}),"\n",(0,t.jsx)(n.h3,{id:"defconstant",children:"defconstant"}),"\n",(0,t.jsx)(n.p,{children:"Defines a constant value that can be referenced by name."}),"\n",(0,t.jsx)(i.A,{flavor:"chialisp",children:(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:"language-chialisp",children:"(mod ()\n    (defconstant MAGIC_NUMBER 314159) ; (0x04cb2f in hex)\n\n    MAGIC_NUMBER ; Replaced with the actual value.\n)\n"})})})]})}function h(e={}){const{wrapper:n}={...(0,s.R)(),...e.components};return n?(0,t.jsx)(n,{...e,children:(0,t.jsx)(u,{...e})}):u(e)}},3823:(e,n,l)=>{"use strict";l.d(n,{A:()=>b});var t=l(5293),s=l(11),i=l(1765),r=l(6540),a=l(5604),o=l(6069),c=l.n(o),d=l(5871),u=l.n(d),h=l(9031),p=l.n(h);function m(e){return e instanceof Array||(0,r.isValidElement)(e)?r.Children.toArray(e).reduce(((e,n)=>{let l="";return l=(0,r.isValidElement)(n)&&x(n)?m(n.props.children):(0,r.isValidElement)(n)&&!x(n)?"":f(n),e.concat(l)}),""):f(e)}function f(e){return null==e||"boolean"==typeof e||"{}"===JSON.stringify(e)?"":e.toString()}function x(e){return(0,r.isValidElement)(e)&&Boolean(e.props.children)}var g=l(4848);function b(e){var n,l;let{children:o,flavor:c,input:d,tests:h,reporter:f}=e;const{colorMode:x}=(0,t.G)(),b=(0,r.useMemo)((()=>m(o).trim()),[]),[j,v]=(0,r.useState)(b),[k,w]=(0,r.useState)(null!=(n=null!=d?d:null==(l=Object.keys(null!=h?h:{})[0])?void 0:l.trim())?n:""),[C,S]=(0,r.useState)(""),[A,N]=(0,r.useState)(0n),[q,E]=(0,r.useState)(null),F=e=>e.replace("Error: ",""),M=(e,n)=>{try{return e.run(n)}catch(l){return S("While evaluating: "+F(""+l)),null}},R=()=>{const e=(()=>{try{return s.Program.fromSource(j)}catch(e){return S("While parsing: "+F(""+e)),null}})();if(!e)return;const n="clvm"===c||e.isCons&&e.first.equals(s.Program.fromText("mod")),l=(e=>{if(c&&"chialisp"!==c)return e;try{return e.compile().value}catch(n){return S("While compiling: "+F(""+n)),null}})(e);if(!l)return;const t=k?s.Program.fromSource(k):s.Program.nil,i=n?M(l,t):{value:l,cost:0n};i&&(S(i.value.toSource()),N(i.cost));let r=!0;for(const[o,c]of Object.entries(null!=h?h:{})){var a;const e=s.Program.fromSource(o),t=n?null==(a=M(l,e))?void 0:a.value:l;if(!t||t.toSource()!==c){r=!1;break}}null==f||f(r),E(r)},P=q?a.CMH:a.QCr,[T,W]=r.useState(!1);return(0,r.useEffect)((()=>W(!0)),[]),(0,g.jsx)(i.f4,{Prism:globalThis.Prism,theme:T&&("dark"===x?u():p()),code:j,language:"chialisp",children:e=>{let{className:n,style:l}=e;return(0,g.jsxs)("pre",{className:n,style:{...l,position:"relative"},children:[k?(0,g.jsxs)(g.Fragment,{children:[(0,g.jsx)(y,{code:k,setCode:w,language:"chialisp"}),(0,g.jsx)("hr",{style:{marginTop:"14px",marginBottom:"14px"}})]}):"",(0,g.jsx)(y,{code:j,setCode:v,language:"chialisp"}),(0,g.jsx)("div",{style:{position:"absolute",top:"16px",right:"16px"},children:(0,g.jsxs)("div",{style:{display:"flex",alignItems:"center",gap:"14px"},children:[(0,g.jsx)("span",{style:{marginRight:"8px"},children:c&&"chialisp"!==c?"CLVM":"Chialisp"}),!k&&(0,g.jsx)(a.TlQ,{size:24,className:"icon-button",cursor:"pointer",onClick:()=>w("()")}),(0,g.jsx)(a.gSK,{size:24,className:"icon-button",cursor:"pointer",onClick:R})]})}),C?(0,g.jsxs)(g.Fragment,{children:[(0,g.jsx)("hr",{style:{marginTop:"14px",marginBottom:"14px"}}),(0,g.jsx)("div",{style:{display:"inline-block"},children:(0,g.jsx)(y,{code:C,language:"chialisp"})}),C&&(0,g.jsxs)(g.Fragment,{children:[(0,g.jsx)("div",{style:{display:"inline-block",position:"absolute",right:"60px"},children:(0,g.jsx)(y,{code:"Cost: "+A,language:"chialisp"})}),(0,g.jsx)(P,{size:24,color:q?"#77FF77":"#FF7777",style:{position:"absolute",bottom:"16px",right:"16px"}})]})]}):""]})}})}function y(e){let{code:n,setCode:l,language:s}=e;const{colorMode:a}=(0,t.G)(),[o,d]=r.useState(!1);return(0,r.useEffect)((()=>d(!0)),[]),(0,g.jsx)(g.Fragment,{children:(0,g.jsx)(i.f4,{Prism:globalThis.Prism,theme:o&&("dark"===a?u():p()),code:n,language:s,children:e=>{let{tokens:t,getLineProps:s,getTokenProps:i}=e,r=t.map(((e,n)=>(0,g.jsx)("div",{...s({line:e}),children:e.map(((e,n)=>(0,g.jsx)("span",{...i({token:e})},n)))},n)));return l?(0,g.jsx)(c(),{value:n,onValueChange:e=>l(e),highlight:()=>r,padding:0}):r}})})}},5871:e=>{e.exports={plain:{color:"#F8F8F2",backgroundColor:"#282A36",fontWeight:"bold"},styles:[{types:["keyword"],style:{color:"rgb(189, 147, 249)"}},{types:["listop","class-name","quotes"],style:{color:"rgb(80, 250, 123)"}},{types:["builtin"],style:{color:"rgb(5, 227, 223)"}},{types:["number","hexadecimal","string","boolean"],style:{color:"rgb(255, 184, 108)",fontWeight:"normal"}},{types:["punctuation","symbol"],style:{color:"rgb(248, 248, 242)"}},{types:["variable"],style:{fontStyle:"italic"}},{types:["comment"],style:{color:"rgb(98, 114, 164)",fontWeight:"normal"}},{types:["function","car"],style:{color:"rgb(241, 250, 140)"}}]}},9031:e=>{e.exports={plain:{color:"#383a42",backgroundColor:"#fafafa",fontWeight:"bold"},styles:[{types:["keyword"],style:{color:"#990096"}},{types:["listop","class-name","quotes"],style:{color:"#006100"}},{types:["builtin"],style:{color:"#127EAF"}},{types:["number","hexadecimal","string","boolean"],style:{color:"#B35C00",fontWeight:"normal"}},{types:["punctuation","symbol"],style:{color:"#383a42"}},{types:["variable"],style:{fontStyle:"italic"}},{types:["comment"],style:{color:"#73737D",fontWeight:"normal"}},{types:["function","car"],style:{color:"#0045DB"}}]}}}]);