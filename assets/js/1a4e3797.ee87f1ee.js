"use strict";(self.webpackChunkchialisp_web=self.webpackChunkchialisp_web||[]).push([[7920],{895:function(e,t,n){n.d(t,{Hk:function(){return s},Iz:function(){return l},_k:function(){return a},dK:function(){return r},qo:function(){return o},rx:function(){return c},vc:function(){return u}});n(1336);var r=["en"],a=!1,u=null,c="ea07ee36",o=8,s=50,l={search_placeholder:"Search",see_all_results:"See all results",no_results:"No results.",search_results_for:'Search results for "{{ keyword }}"',search_the_documentation:"Search the documentation",count_documents_found_plural:"{{ count }} documents found",count_documents_found:"{{ count }} document found",no_documents_were_found:"No documents were found"}},7731:function(e,t,n){n.r(t),n.d(t,{default:function(){return Z}});var r=n(8214),a=n(5861),u=n(7294),c=n(2263),o=n(6698),s=n(9105),l=n(6742),i=n(5977),f=n(412);var m=function(){var e=(0,i.k6)(),t=(0,i.TH)(),n=(0,c.Z)().siteConfig.baseUrl;return{searchValue:f.Z.canUseDOM&&new URLSearchParams(t.search).get("q")||"",updateSearchPath:function(n){var r=new URLSearchParams(t.search);n?r.set("q",n):r.delete("q"),e.replace({search:r.toString()})},generateSearchPageLink:function(e){return n+"search?q="+encodeURIComponent(e)}}},h=n(22),d=n(206),p=n(2539),_=n(9481),v=n(1073),E=n(4041),g=n(7365);function w(e,t){return e.replace(/\{\{\s*(\w+)\s*\}\}/g,(function(e,n){return Object.prototype.hasOwnProperty.call(t,n)?String(t[n]):e}))}var S="searchQueryInput_5r-w",y="searchResultItem_18XW",k="searchResultItemPath_TjRL",I="searchResultItemSummary_5qSX";function b(e){var t=e.searchResult,n=t.document,r=t.type,a=t.page,c=t.tokens,o=t.metadata,s=0===r,i=2===r,f=(s?n.b:a.b).slice(),m=i?n.s:n.t;return s||f.push(a.t),u.createElement("article",{className:y},u.createElement("h2",null,u.createElement(l.Z,{to:n.u+(n.h||""),dangerouslySetInnerHTML:{__html:i?(0,p.C)(m,c):(0,_.o)(m,(0,v.m)(o,"t"),c,100)}})),f.length>0&&u.createElement("p",{className:k},f.join(" \u203a ")),i&&u.createElement("p",{className:I,dangerouslySetInnerHTML:{__html:(0,_.o)(n.t,(0,v.m)(o,"t"),c,100)}}))}var Z=function(){var e=(0,c.Z)().siteConfig.baseUrl,t=m(),n=t.searchValue,l=t.updateSearchPath,i=(0,u.useState)(n),f=i[0],p=i[1],_=(0,u.useState)(),v=_[0],y=_[1],k=(0,u.useState)(),I=k[0],Z=k[1],C=(0,u.useMemo)((function(){return f?w(g.Iz.search_results_for,{keyword:f}):g.Iz.search_the_documentation}),[f]);(0,u.useEffect)((function(){l(f),v&&(f?v(f,(function(e){Z(e)})):Z(void 0))}),[f,v]);var R=(0,u.useCallback)((function(e){p(e.target.value)}),[]);return(0,u.useEffect)((function(){n&&n!==f&&p(n)}),[n]),(0,u.useEffect)((function(){function t(){return(t=(0,a.Z)((0,r.Z)().mark((function t(){var n,a,u;return(0,r.Z)().wrap((function(t){for(;;)switch(t.prev=t.next){case 0:return t.next=2,(0,h.w)(e);case 2:n=t.sent,a=n.wrappedIndexes,u=n.zhDictionary,y((function(){return(0,d.v)(a,u,100)}));case 6:case"end":return t.stop()}}),t)})))).apply(this,arguments)}!function(){t.apply(this,arguments)}()}),[e]),u.createElement(o.Z,{title:C},u.createElement(s.Z,null,u.createElement("meta",{property:"robots",content:"noindex, follow"})),u.createElement("div",{className:"container margin-vert--lg"},u.createElement("h1",null,C),u.createElement("input",{type:"search",name:"q",className:S,"aria-label":"Search",onChange:R,value:f,autoComplete:"off",autoFocus:!0}),!v&&f&&u.createElement("div",null,u.createElement(E.Z,null)),I&&(I.length>0?u.createElement("p",null,w(1===I.length?g.Iz.count_documents_found:g.Iz.count_documents_found_plural,{count:I.length})):u.createElement("p",null,g.Iz.no_documents_were_found)),u.createElement("section",null,I&&I.map((function(e){return u.createElement(b,{key:e.document.i,searchResult:e})})))))}}}]);