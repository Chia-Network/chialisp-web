(self.webpackChunkchialisp_web=self.webpackChunkchialisp_web||[]).push([[30],{773:function(e,t,n){"use strict";n.d(t,{Z:function(){return k}});var l=n(7462),a=n(2949),r=n(171),o=n(3746),i=n(7410),s=n(7294),u=n(5154),c=n(460),p=n.n(c),m=n(9042),d=n.n(m),f=n(23),h=n.n(f);function g(e){return e instanceof Array||(0,s.isValidElement)(e)?s.Children.toArray(e).reduce((function(e,t){var n="";return n=(0,s.isValidElement)(t)&&b(t)?g(t.props.children):(0,s.isValidElement)(t)&&!b(t)?"":y(t),e.concat(n)}),""):y(e)}function y(e){return null==e||"boolean"==typeof e||"{}"===JSON.stringify(e)?"":e.toString()}function b(e){return(0,s.isValidElement)(e)&&Boolean(e.props.children)}function k(e){var t,n,l=e.children,c=e.flavor,p=e.input,m=e.tests,f=e.reporter,y=(0,a.I)().colorMode,b=(0,s.useMemo)((function(){return g(l).trim()}),[]),k=(0,s.useState)(b),x=k[0],E=k[1],N=(0,s.useState)(null!=(t=null!=p?p:null==(n=Object.keys(null!=m?m:{})[0])?void 0:n.trim())?t:""),w=N[0],C=N[1],S=(0,s.useState)(""),R=S[0],q=S[1],Z=(0,s.useState)(0n),M=Z[0],T=Z[1],A=(0,s.useState)(null),F=A[0],I=A[1],P=function(e){return e.replace("Error: ","")},D=function(e,t){try{return e.run(t)}catch(n){return q("While evaluating: "+P(""+n)),null}},W=function(){var e=function(){try{return r.Program.fromSource(x)}catch(e){return q("While parsing: "+P(""+e)),null}}();if(e){var t="clvm"===c||e.isCons&&e.first.equals(r.Program.fromText("mod")),n=function(e){if(c&&"chialisp"!==c)return e;try{return e.compile().value}catch(t){return q("While compiling: "+P(""+t)),null}}(e);if(n){var l=w?r.Program.fromSource(w):r.Program.nil,a=t?D(n,l):{value:n,cost:0n};a&&(q(a.value.toSource()),T(a.cost));for(var o=!0,i=0,s=Object.entries(null!=m?m:{});i<s.length;i++){var u,p=s[i],d=p[0],h=p[1],g=r.Program.fromSource(d),y=t?null==(u=D(n,g))?void 0:u.value:n;if(!y||y.toSource()!==h){o=!1;break}}null==f||f(o),I(o)}}},B=F?u.l_A:u.aHS,G=s.useState(!1),O=G[0],V=G[1];return(0,s.useEffect)((function(){return V(!0)}),[]),s.createElement(o.ZP,{Prism:i.Z,theme:O&&("dark"===y?d():h()),code:x,language:"chialisp"},(function(e){var t=e.className,n=e.style;return s.createElement("pre",{className:t,style:Object.assign({},n,{position:"relative"})},w?s.createElement(s.Fragment,null,s.createElement(v,{code:w,setCode:C,language:"chialisp"}),s.createElement("hr",{style:{marginTop:"14px",marginBottom:"14px"}})):"",s.createElement(v,{code:x,setCode:E,language:"chialisp"}),s.createElement("div",{style:{position:"absolute",top:"16px",right:"16px"}},s.createElement("div",{style:{display:"flex",alignItems:"center",gap:"14px"}},s.createElement("span",{style:{marginRight:"8px"}},c&&"chialisp"!==c?"CLVM":"Chialisp"),!w&&s.createElement(u.A0H,{size:24,className:"icon-button",cursor:"pointer",onClick:function(){return C("()")}}),s.createElement(u.gmG,{size:24,className:"icon-button",cursor:"pointer",onClick:W}))),R?s.createElement(s.Fragment,null,s.createElement("hr",{style:{marginTop:"14px",marginBottom:"14px"}}),s.createElement("div",{style:{display:"inline-block"}},s.createElement(v,{code:R,language:"chialisp"})),R&&s.createElement(s.Fragment,null,s.createElement("div",{style:{display:"inline-block",position:"absolute",right:"60px"}},s.createElement(v,{code:"Cost: "+M,language:"chialisp"})),s.createElement(B,{size:24,color:F?"#77FF77":"#FF7777",style:{position:"absolute",bottom:"16px",right:"16px"}}))):"")}))}function v(e){var t=e.code,n=e.setCode,r=e.language,u=(0,a.I)().colorMode,c=s.useState(!1),m=c[0],f=c[1];return(0,s.useEffect)((function(){return f(!0)}),[]),s.createElement(s.Fragment,null,s.createElement(o.ZP,{Prism:i.Z,theme:m&&("dark"===u?d():h()),code:t,language:r},(function(e){var a=e.tokens,r=e.getLineProps,o=e.getTokenProps,i=a.map((function(e,t){return s.createElement("div",(0,l.Z)({key:t},r({line:e})),e.map((function(e,t){return s.createElement("span",(0,l.Z)({key:t},o({token:e})))})))}));return n?s.createElement(p(),{value:t,onValueChange:function(e){return n(e)},highlight:function(){return i},padding:0}):i})))}},9042:function(e){e.exports={plain:{color:"#F8F8F2",backgroundColor:"#282A36",fontWeight:"bold"},styles:[{types:["keyword"],style:{color:"rgb(189, 147, 249)"}},{types:["listop","class-name","quotes"],style:{color:"rgb(80, 250, 123)"}},{types:["builtin"],style:{color:"rgb(5, 227, 223)"}},{types:["number","hexadecimal","string","boolean"],style:{color:"rgb(255, 184, 108)",fontWeight:"normal"}},{types:["punctuation","symbol"],style:{color:"rgb(248, 248, 242)"}},{types:["variable"],style:{fontStyle:"italic"}},{types:["comment"],style:{color:"rgb(98, 114, 164)",fontWeight:"normal"}},{types:["function","car"],style:{color:"rgb(241, 250, 140)"}}]}},23:function(e){e.exports={plain:{color:"#383a42",backgroundColor:"#fafafa",fontWeight:"bold"},styles:[{types:["keyword"],style:{color:"#990096"}},{types:["listop","class-name","quotes"],style:{color:"#006100"}},{types:["builtin"],style:{color:"#127EAF"}},{types:["number","hexadecimal","string","boolean"],style:{color:"#B35C00",fontWeight:"normal"}},{types:["punctuation","symbol"],style:{color:"#383a42"}},{types:["variable"],style:{fontStyle:"italic"}},{types:["comment"],style:{color:"#73737D",fontWeight:"normal"}},{types:["function","car"],style:{color:"#0045DB"}}]}},4381:function(e,t,n){"use strict";n.r(t),n.d(t,{assets:function(){return p},contentTitle:function(){return u},default:function(){return f},frontMatter:function(){return s},metadata:function(){return c},toc:function(){return m}});var l=n(7462),a=n(3366),r=(n(7294),n(3905)),o=n(773),i=["components"],s={id:"examples",title:"Examples",slug:"/examples"},u=void 0,c={unversionedId:"examples",id:"examples",title:"Examples",description:"This is a set of examples for various operators. If you want to see their documentation, checkout the Operators page.",source:"@site/docs/examples.md",sourceDirName:".",slug:"/examples",permalink:"/examples",draft:!1,editUrl:"https://github.com/Chia-Network/chialisp-web/blob/main/docs/examples.md",tags:[],version:"current",frontMatter:{id:"examples",title:"Examples",slug:"/examples"},sidebar:"someSidebar",previous:{title:"Operators",permalink:"/operators"},next:{title:"Costs",permalink:"/costs"}},p={},m=[{value:"Modules",id:"modules",level:2},{value:"mod",id:"mod",level:3},{value:"include",id:"include",level:3},{value:"defun",id:"defun",level:3},{value:"defun-inline",id:"defun-inline",level:3},{value:"lambda",id:"lambda",level:3},{value:"defmacro, qq, unquote",id:"defmacro",level:3},{value:"defconstant",id:"defconstant",level:3}],d={toc:m};function f(e){var t=e.components,n=(0,a.Z)(e,i);return(0,r.kt)("wrapper",(0,l.Z)({},d,n,{components:t,mdxType:"MDXLayout"}),(0,r.kt)("p",null,"This is a set of examples for various operators. If you want to see their documentation, checkout the ",(0,r.kt)("a",{parentName:"p",href:"/operators"},"Operators page"),"."),(0,r.kt)("h2",{id:"modules"},"Modules"),(0,r.kt)("h3",{id:"mod"},"mod"),(0,r.kt)("p",null,"Compiles an entire program into a single executable expression. You can define other constants within it."),(0,r.kt)(o.Z,{flavor:"chialisp",input:"(42)",mdxType:"Runnable"},(0,r.kt)("pre",null,(0,r.kt)("code",{parentName:"pre",className:"language-chialisp"},"(mod (value)\n\n    ;; Doubles the value as the output.\n    (* value 2)\n)\n"))),(0,r.kt)("h3",{id:"include"},"include"),(0,r.kt)("p",null,"Includes all of the constants defined in a library file in the module."),(0,r.kt)("pre",null,(0,r.kt)("code",{parentName:"pre",className:"language-bash"},"cdv clsp retrieve sha256tree\n")),(0,r.kt)("pre",null,(0,r.kt)("code",{parentName:"pre",className:"language-chialisp"},"(mod (thing-to-hash)\n\n    ;; Includes the constants defined in the file.\n    (include sha256tree.clib)\n\n    ;; Calls the utility function as the output.\n    (sha256tree thing-to-hash)\n)\n")),(0,r.kt)("h3",{id:"defun"},"defun"),(0,r.kt)("p",null,"Defines a function that can be called from anywhere within the module."),(0,r.kt)(o.Z,{flavor:"chialisp",mdxType:"Runnable"},(0,r.kt)("pre",null,(0,r.kt)("code",{parentName:"pre",className:"language-chialisp"},"(mod ()\n    (defun square (number)\n        ;; Returns the number squared.\n        (* number number)\n    )\n\n    (square 16)\n)\n"))),(0,r.kt)("h3",{id:"defun-inline"},"defun-inline"),(0,r.kt)("p",null,"Defines an inline function that can be called from anywhere within the module. It simply replaces the call with the code within (like an easier to write but limited macro)."),(0,r.kt)(o.Z,{flavor:"chialisp",mdxType:"Runnable"},(0,r.kt)("pre",null,(0,r.kt)("code",{parentName:"pre",className:"language-chialisp"},"(mod ()\n    (defun-inline double (number)\n        ;; Returns twice the number.\n        (* number 2)\n    )\n\n    (double 9)\n)\n"))),(0,r.kt)("h3",{id:"lambda"},"lambda"),(0,r.kt)("p",null,"Compiles a block of code into a single executable expression. Useful for writing functions as arguments to other functions."),(0,r.kt)(o.Z,{flavor:"chialisp",input:"(3 2)",mdxType:"Runnable"},(0,r.kt)("pre",null,(0,r.kt)("code",{parentName:"pre",className:"language-chialisp"},"(lambda (n1 n2)\n    ;; Returns the two added together.\n    (+ n1 n2)\n)\n"))),(0,r.kt)("h3",{id:"defmacro"},"defmacro, qq, unquote"),(0,r.kt)("p",null,"Defines a macro that can manually structure the source code it is replaced with. Allows for advanced compile time behavior."),(0,r.kt)(o.Z,{flavor:"chialisp",mdxType:"Runnable"},(0,r.kt)("pre",null,(0,r.kt)("code",{parentName:"pre",className:"language-chialisp"},"(mod ()\n    (defmacro or ARGS\n        (if ARGS\n            (qq (if (unquote (f ARGS))\n                1\n                (unquote (c or (r ARGS)))\n            ))\n        0)\n    )\n\n    (or () () 1)\n)\n"))),(0,r.kt)("h3",{id:"defconstant"},"defconstant"),(0,r.kt)("p",null,"Defines a constant value that can be referenced by name."),(0,r.kt)(o.Z,{flavor:"chialisp",mdxType:"Runnable"},(0,r.kt)("pre",null,(0,r.kt)("code",{parentName:"pre",className:"language-chialisp"},"(mod ()\n    (defconstant MAGIC_NUMBER 314159) ; (0x04cb2f in hex)\n\n    MAGIC_NUMBER ; Replaced with the actual value.\n)\n"))))}f.isMDXComponent=!0}}]);