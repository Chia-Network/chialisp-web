"use strict";(self.webpackChunkchialisp_web=self.webpackChunkchialisp_web||[]).push([[853],{6994:(e,n,t)=>{t.r(n),t.d(n,{assets:()=>l,contentTitle:()=>o,default:()=>d,frontMatter:()=>r,metadata:()=>s,toc:()=>h});const s=JSON.parse('{"id":"primitives/offers","title":"Offers","description":"Offers are a way to enable peer-to-peer asset exchange on the Chia blockchain. In other words, you can swap tokens without needing to go through an exchange. Only two parties are required, the maker and the taker. They don\'t need to trust each other, since any attempts to modify the offer will invalidate it.","source":"@site/docs/primitives/offers.md","sourceDirName":"primitives","slug":"/offers","permalink":"/offers","draft":false,"unlisted":false,"editUrl":"https://github.com/Chia-Network/chialisp-web/blob/main/docs/primitives/offers.md","tags":[],"version":"current","frontMatter":{"title":"Offers","slug":"/offers"},"sidebar":"someSidebar","previous":{"title":"DIDs","permalink":"/dids"},"next":{"title":"Pooling","permalink":"/pooling"}}');var a=t(4848),i=t(8453);const r={title:"Offers",slug:"/offers"},o=void 0,l={},h=[{value:"Code Examples",id:"code-examples",level:2},{value:"chia-blockchain",id:"chia-blockchain",level:3},{value:"chia-rs",id:"chia-rs",level:3},{value:"Offer Files",id:"offer-files",level:2},{value:"Settlement Payments Code",id:"code",level:2},{value:"Design Decisions",id:"design-decisions",level:2},{value:"Settlement announces required payments",id:"announcements",level:4},{value:"Offers trade by puzzle not specific coins",id:"nonspecific",level:4},{value:"It is possible to aggregate offers",id:"aggregation",level:4},{value:"Advantages",id:"advantages",level:2},{value:"Secure",id:"secure",level:3},{value:"Immutable",id:"immutable",level:3},{value:"Compliant",id:"compliant",level:3},{value:"Trustless",id:"trustless",level:3},{value:"Simultaneous",id:"simultaneous",level:3},{value:"Non-Custodial",id:"non-custodial",level:3},{value:"Commission-Free",id:"commission-free",level:3},{value:"Multi-Asset",id:"multi-asset",level:3},{value:"Offer States",id:"offer-states",level:2},{value:"Cancellation",id:"cancellation",level:2},{value:"Arbitrage",id:"arbitrage",level:2},{value:"Market Makers",id:"market-makers",level:2},{value:"Offer Aggregation",id:"offer-aggregation",level:3},{value:"Creating Offer Files",id:"creating-offer-files",level:2},{value:"Accepting Offer Files",id:"accepting-offer-files",level:2},{value:"Conclusion",id:"conclusion",level:2}];function c(e){const n={a:"a",admonition:"admonition",code:"code",em:"em",h2:"h2",h3:"h3",h4:"h4",li:"li",ol:"ol",p:"p",pre:"pre",strong:"strong",ul:"ul",...(0,i.R)(),...e.components},{Details:t}=n;return t||function(e,n){throw new Error("Expected "+(n?"component":"object")+" `"+e+"` to be defined: you likely forgot to import, pass, or provide it.")}("Details",!0),(0,a.jsxs)(a.Fragment,{children:[(0,a.jsx)(n.p,{children:"Offers are a way to enable peer-to-peer asset exchange on the Chia blockchain. In other words, you can swap tokens without needing to go through an exchange. Only two parties are required, the maker and the taker. They don't need to trust each other, since any attempts to modify the offer will invalidate it."}),"\n",(0,a.jsx)(n.h2,{id:"code-examples",children:"Code Examples"}),"\n",(0,a.jsx)(n.h3,{id:"chia-blockchain",children:"chia-blockchain"}),"\n",(0,a.jsx)(n.p,{children:"The official Chia wallet has a reference implementation for the following in Python:"}),"\n",(0,a.jsxs)(n.ul,{children:["\n",(0,a.jsx)(n.li,{children:(0,a.jsx)(n.a,{href:"https://github.com/Chia-Network/chia-blockchain/blob/010cedf83718aa8e4d97da76f892fe69387a5d82/chia/wallet/trade_manager.py#L410",children:"Offer multiple assets"})}),"\n"]}),"\n",(0,a.jsx)(n.h3,{id:"chia-rs",children:"chia-rs"}),"\n",(0,a.jsx)(n.p,{children:"Wallet code can use the following reference methods:"}),"\n",(0,a.jsxs)(n.ul,{children:["\n",(0,a.jsx)(n.li,{children:(0,a.jsx)(n.a,{href:"https://github.com/Chia-Network/chia_rs/blob/2334c842f694444da317fa7432f308f159f62d70/chia-wallet/src/wallet.rs#L101",children:"Offer NFT1 for CAT2"})}),"\n"]}),"\n",(0,a.jsx)(n.h2,{id:"offer-files",children:"Offer Files"}),"\n",(0,a.jsx)(n.p,{children:"When you create an offer, you get a string of text that is usually stored in a file. This describes the details of the trade, including the assets you are requesting and the assets you are giving in return. This file can be published on various platforms and downloaded by anyone to fulfill in the wallet of their choice. This allows for the flexibility of exchanges, while keeping it fully decentralized and preventing tampering or relying on a third party or middleman."}),"\n",(0,a.jsx)(n.p,{children:"You can use a wallet to generate an offer file for a given trade, then distribute that offer to platforms such as the following:"}),"\n",(0,a.jsxs)(n.ul,{children:["\n",(0,a.jsx)(n.li,{children:(0,a.jsx)(n.a,{href:"https://dexie.space",children:"Dexie"})}),"\n",(0,a.jsx)(n.li,{children:(0,a.jsx)(n.a,{href:"https://offerpool.io",children:"OfferPool"})}),"\n",(0,a.jsx)(n.li,{children:(0,a.jsx)(n.a,{href:"https://offerbin.io",children:"OfferBin"})}),"\n"]}),"\n",(0,a.jsx)(n.h2,{id:"code",children:"Settlement Payments Code"}),"\n",(0,a.jsxs)(n.p,{children:["This is the source code of the settlement payments puzzle, which can also be found in the chia-blockchain repository in the puzzle ",(0,a.jsx)(n.a,{href:"https://github.com/Chia-Network/chia-blockchain/blob/8224d2fd657780b224a1fc40d3081ce734d70016/chia/wallet/puzzles/settlement_payments.clsp",children:(0,a.jsx)(n.code,{children:"settlement_payments.clvm"})}),"."]}),"\n",(0,a.jsxs)(t,{children:[(0,a.jsx)("summary",{children:"Expand Settlement Payments Puzzle"}),(0,a.jsx)(n.pre,{children:(0,a.jsx)(n.code,{className:"language-chialisp",metastring:'title="settlement_payments.clvm"',children:"(mod notarized_payments\n  ;; `notarized_payments` is a list of notarized coin payments\n  ;; a notarized coin payment is `(nonce . ((puzzle_hash amount ...) (puzzle_hash amount ...) ...))`\n  ;; Each notarized coin payment creates some `(CREATE_COIN puzzle_hash amount ...)` payments\n  ;; and a `(CREATE_PUZZLE_ANNOUNCEMENT (sha256tree notarized_coin_payment))` announcement\n  ;; The idea is the other side of this trade requires observing the announcement from a\n  ;; `settlement_payments` puzzle hash as a condition of one or more coin spends.\n\n  (include condition_codes.clib)\n  (include utility_macros.clib)\n\n  (defun sha256tree (TREE)\n    (if (l TREE)\n        (sha256 2 (sha256tree (f TREE)) (sha256tree (r TREE)))\n        (sha256 1 TREE)\n    )\n  )\n\n  (defun create_coins_for_payment (payment_params so_far)\n    (if payment_params\n        (assert (> (f (r (f payment_params))) 0)  ; assert the amount is positive\n          ; then\n          (c (c CREATE_COIN (f payment_params)) (create_coins_for_payment (r payment_params) so_far))\n        )\n        so_far\n    )\n  )\n\n  (defun-inline create_announcement_for_payment (notarized_payment)\n    (list CREATE_PUZZLE_ANNOUNCEMENT\n    (sha256tree notarized_payment))\n  )\n\n  (defun-inline augment_condition_list (notarized_payment so_far)\n    (c\n      (create_announcement_for_payment notarized_payment)\n      (create_coins_for_payment (r notarized_payment) so_far)\n    )\n  )\n\n  (defun construct_condition_list (notarized_payments)\n    (if notarized_payments\n        (augment_condition_list (f notarized_payments) (construct_condition_list (r notarized_payments)))\n        ()\n    )\n  )\n\n  (construct_condition_list notarized_payments)\n)\n"})})]}),"\n",(0,a.jsxs)(n.p,{children:["Offers use the settlement payments puzzle. Its solution is a list of ",(0,a.jsx)(n.code,{children:"notarized_payments"}),"."]}),"\n",(0,a.jsxs)(n.p,{children:["The ",(0,a.jsx)(n.code,{children:"notarized_payments"})," are structured like this:"]}),"\n",(0,a.jsx)(n.pre,{children:(0,a.jsx)(n.code,{className:"language-chialisp",children:"((N . ((PH1 AMT1 ...) (PH2 AMT2 ...) (PH3 AMT3 ...))) ...)\n"})}),"\n",(0,a.jsxs)(n.ul,{children:["\n",(0,a.jsxs)(n.li,{children:[(0,a.jsx)(n.code,{children:"N"})," is the nonce"]}),"\n",(0,a.jsxs)(n.li,{children:[(0,a.jsx)(n.code,{children:"PH1"})," is the puzzle hash of the first coin"]}),"\n",(0,a.jsxs)(n.li,{children:[(0,a.jsx)(n.code,{children:"AMT1"})," is the amount (or value) of the coin being offered"]}),"\n",(0,a.jsxs)(n.li,{children:[(0,a.jsx)(n.code,{children:"..."})," is an optional memo"]}),"\n"]}),"\n",(0,a.jsxs)(n.p,{children:["For each set of notarized coin payments, this puzzle creates one ",(0,a.jsx)(n.code,{children:"CREATE_PUZZLE_ANNOUNCEMENT"})," condition. For each coin payment within this set, the puzzle creates one ",(0,a.jsx)(n.code,{children:"CREATE_COIN"})," condition."]}),"\n",(0,a.jsxs)(n.p,{children:["The reason for creating these conditions is to match the announcements created in the offer file. The ",(0,a.jsx)(n.code,{children:"settlement_payments"})," puzzle is quite versatile, as it can be used as an inner puzzle inside a CAT or NFT, as a puzzle to spend regular XCH, or in order to spend any other assets in Chia's ecosystem."]}),"\n",(0,a.jsx)(n.h2,{id:"design-decisions",children:"Design Decisions"}),"\n",(0,a.jsx)(n.h4,{id:"announcements",children:"Settlement announces required payments"}),"\n",(0,a.jsx)(n.p,{children:"The settlement payments puzzle announces the payments that are required for the transaction to complete, so that it will fail if either party cannot complete their end of the bargain."}),"\n",(0,a.jsx)(n.h4,{id:"nonspecific",children:"Offers trade by puzzle not specific coins"}),"\n",(0,a.jsx)(n.p,{children:"Payments must be of a certain puzzle with a certain value in mojos, rather than a specific coin. This allows a part of a coin to be sent back as change, and the remainder left up to the offer to claim as its value."}),"\n",(0,a.jsx)(n.p,{children:"Another benefit of doing it this way is that anyone can accept the offer, rather than it being between two specific parties."}),"\n",(0,a.jsx)(n.h4,{id:"aggregation",children:"It is possible to aggregate offers"}),"\n",(0,a.jsx)(n.p,{children:"An Automated Market Maker (AMM) can aggregate offers together and complete them simultaneously. This allows someone to request a large amount of a coin and multiple parties who have a smaller amount can complete the transaction. The small amounts add up to the amount requested, and the large amount of the offered value is divided amongst the smaller offers. As long as the terms of each offer are met, how you get there doesn't matter."}),"\n",(0,a.jsx)(n.h2,{id:"advantages",children:"Advantages"}),"\n",(0,a.jsx)(n.p,{children:"Offers have many properties that we think will make them a valuable tool for Chia's community."}),"\n",(0,a.jsx)(n.h3,{id:"secure",children:"Secure"}),"\n",(0,a.jsx)(n.p,{children:"When using Chia offers, makers and takers retain control of their private keys, as well as their assets. By contrast, centralized exchanges require users to transfer their funds to an account that the exchange controls. If the exchange is hacked or simply goes out of business, users can lose their funds. With Chia offers, self-custody of keys and funds is assured."}),"\n",(0,a.jsxs)(n.admonition,{type:"note",children:[(0,a.jsx)(n.p,{children:"Offer files do not contain private keys or any way to deduce them."}),(0,a.jsx)(n.p,{children:"If an offer file falls into a hacker's hands, they only have two options like anyone else:"}),(0,a.jsxs)(n.ul,{children:["\n",(0,a.jsx)(n.li,{children:"Ignore the offer"}),"\n",(0,a.jsx)(n.li,{children:"Accept it"}),"\n"]})]}),"\n",(0,a.jsx)(n.h3,{id:"immutable",children:"Immutable"}),"\n",(0,a.jsx)(n.p,{children:"Once an offer file is created, any alterations to the file will invalidate it."}),"\n",(0,a.jsx)(n.p,{children:"The offer file only has two possible outcomes:"}),"\n",(0,a.jsxs)(n.ol,{children:["\n",(0,a.jsx)(n.li,{children:"The taker accepts the offer as-is and the transaction is processed"}),"\n",(0,a.jsx)(n.li,{children:"The maker cancels the offer"}),"\n"]}),"\n",(0,a.jsx)(n.p,{children:"The offer will be in a pending state until either outcome is fulfilled. It is possible that the offer never is completed or canceled."}),"\n",(0,a.jsx)(n.admonition,{type:"note",children:(0,a.jsx)(n.p,{children:"Takers are free to propose a counter offer by creating their own offer file. In this case, the original maker could cancel the original offer, and both parties' roles would be reversed."})}),"\n",(0,a.jsx)(n.h3,{id:"compliant",children:"Compliant"}),"\n",(0,a.jsx)(n.p,{children:"As offers are inherently peer-to-peer, they don't constitute an exchange or other regulated market activity."}),"\n",(0,a.jsx)(n.h3,{id:"trustless",children:"Trustless"}),"\n",(0,a.jsxs)(n.p,{children:["Offers are ",(0,a.jsx)(n.em,{children:"not"})," analogous to a handshake or a promise, where one party could renege on the trade. By using Chia offers, the maker and taker don't need to trust each other. They don't even need to ",(0,a.jsx)(n.em,{children:"know"})," each other. As long as a taker matches the offer identically, the offer will be valid."]}),"\n",(0,a.jsx)(n.h3,{id:"simultaneous",children:"Simultaneous"}),"\n",(0,a.jsx)(n.p,{children:"The maker's and taker's transactions must happen in the same block. In Chia, all transactions conducted within a single block happen simultaneously. This eliminates one type of maximum extractable value (MEV), where validators can increase their fees by re-ordering transactions."}),"\n",(0,a.jsx)(n.h3,{id:"non-custodial",children:"Non-Custodial"}),"\n",(0,a.jsx)(n.p,{children:"Neither the maker nor taker are required to send their funds to a trusted intermediary, such as an escrow service or an exchange. This removes the need for Over The Counter (OTC) desks and other middlemen, who require their customers to submit funds before they allow transactions to complete."}),"\n",(0,a.jsx)(n.h3,{id:"commission-free",children:"Commission-Free"}),"\n",(0,a.jsxs)(n.p,{children:["Because offers don't use escrow services or other middlemen, there are also none of the typical fees associated with those intermediaries. However, offers ",(0,a.jsx)(n.em,{children:"are"})," subject to Chia blockchain transaction fees, just like all transactions."]}),"\n",(0,a.jsx)(n.h3,{id:"multi-asset",children:"Multi-Asset"}),"\n",(0,a.jsx)(n.p,{children:"A maker can create an offer for multiple assets on both ends of the offer. For example, they could offer 1 XCH and 1.75 CKC for 100,000 SBX and 3 MRMT."}),"\n",(0,a.jsx)(n.h2,{id:"offer-states",children:"Offer States"}),"\n",(0,a.jsx)(n.p,{children:"An offer has six potential states:"}),"\n",(0,a.jsxs)(n.p,{children:[(0,a.jsx)(n.strong,{children:"PENDING_ACCEPT"})," - The maker has created the offer, but a taker has not yet accepted it. The maker's wallet has reserved the coin(s) to be spent. The spend bundle for the offer has not been sent to the mempool."]}),"\n",(0,a.jsxs)(n.p,{children:[(0,a.jsx)(n.strong,{children:"PENDING_CONFIRM"})," - The taker has accepted the offer. The taker's wallet has reserved the coin(s) to be spent. The completed spend bundle has been sent to the mempool."]}),"\n",(0,a.jsxs)(n.p,{children:[(0,a.jsx)(n.strong,{children:"PENDING_CANCEL"})," - The maker has attempted to cancel the offer by spending the coins being offered. The completed spend bundle has been sent to the mempool."]}),"\n",(0,a.jsxs)(n.p,{children:[(0,a.jsx)(n.strong,{children:"CANCELLED"})," - Depending on which ",(0,a.jsx)(n.a,{href:"#cancellation",children:"type of cancellation"})," has been used, either:"]}),"\n",(0,a.jsxs)(n.ul,{children:["\n",(0,a.jsx)(n.li,{children:"The maker's wallet has released the coins it had been reserving for this offer"}),"\n",(0,a.jsx)(n.li,{children:"The maker's coins have been spent and new ones have been created in the maker's wallet"}),"\n"]}),"\n",(0,a.jsxs)(n.p,{children:[(0,a.jsx)(n.strong,{children:"CONFIRMED"})," - The maker's and taker's reserved coins have been spent in the same spend bundle. The offer has been completed successfully."]}),"\n",(0,a.jsxs)(n.p,{children:[(0,a.jsx)(n.strong,{children:"FAILED"})," - The taker attempted, and failed to accept the offer. This could have happened either because the maker cancelled the offer, or because another taker took the offer first."]}),"\n",(0,a.jsx)(n.h2,{id:"cancellation",children:"Cancellation"}),"\n",(0,a.jsx)(n.p,{children:"There are two ways to cancel an offer, depending on the circumstances."}),"\n",(0,a.jsx)(n.p,{children:"If the offer is already publicly available, it will have to be cancelled on-chain. This is done by spending the coins involved in the offer to (which make the notarized payments invalid)."}),"\n",(0,a.jsx)(n.p,{children:"Otherwise, it is trivial to simply delete the offer or not share the file, as it is not stored anywhere publicly and therefore can't be accepted."}),"\n",(0,a.jsx)(n.h2,{id:"arbitrage",children:"Arbitrage"}),"\n",(0,a.jsx)(n.p,{children:"It is possible to accept an offer, then create or accept another offer in a way that you make a profit. This is known as arbitrage, and drives supply and demand. However, old offers are at risk unless they are cancelled because the price can change in the time it's sitting around."}),"\n",(0,a.jsx)(n.p,{children:"A possible solution for this is a price oracle, which would stabilize the prices and keep them up to date."}),"\n",(0,a.jsx)(n.h2,{id:"market-makers",children:"Market Makers"}),"\n",(0,a.jsxs)(n.p,{children:["Offers in the ",(0,a.jsx)(n.code,{children:"PENDING_CONFIRM"}),' state have been added to the mempool. Farmers and third-party software can observe the current list of offers, and aggregate overlapping ones. This operation is known as a "market maker."']}),"\n",(0,a.jsx)(n.p,{children:"Automated Market Makers (AMMs) are likely to appear in Chia's ecosystem. AMMs can create a single settlement puzzle for each type of asset (for example XCH or a specific type of CAT), and aggregate all of the notarized coin payments of that type in the puzzle."}),"\n",(0,a.jsxs)(n.p,{children:["A taker is part offer-creator, part market-maker. A taker finds an offer of interest and constructs the other side of that offer, using both of the ",(0,a.jsx)(n.code,{children:"settlement_payments"})," puzzles to resolve the cross-asset payments."]}),"\n",(0,a.jsx)(n.h3,{id:"offer-aggregation",children:"Offer Aggregation"}),"\n",(0,a.jsxs)(n.p,{children:["A sophisticated AMM might aggregate multiple ",(0,a.jsx)(n.code,{children:"settlement_payments"})," into a single spend, which means it could combine an arbitrary number of offers, paying through one ",(0,a.jsx)(n.code,{children:"settlement_payments"})," ephemeral coin for each asset type."]}),"\n",(0,a.jsx)(n.p,{children:"For example, a whale wants to buy 10,000 XCH, and is currently sitting on a large stack of stablecoins. There aren't any individuals willing to sell such a large amount of XCH, but the whale doesn't need to create a bunch of small offers. Instead, they create a single offer: X stablecoins (at the current market price) for 10,000 XCH. Several small XCH holders can aggregate their holdings to complete the offer."}),"\n",(0,a.jsx)(n.h2,{id:"creating-offer-files",children:"Creating Offer Files"}),"\n",(0,a.jsx)(n.p,{children:"Here's the basic workflow to create an offer file:"}),"\n",(0,a.jsxs)(n.ol,{children:["\n",(0,a.jsxs)(n.li,{children:["\n",(0,a.jsx)(n.p,{children:"The maker uses either the wallet GUI or CLI to create the terms for an offer. For example, the maker might offer 1 XCH for 251 CKC. If the maker doesn't have sufficient funds, an error is thrown."}),"\n"]}),"\n",(0,a.jsxs)(n.li,{children:["\n",(0,a.jsx)(n.p,{children:"The maker's wallet selects the appropriate coin(s) to spend, starting with the largest coin available."}),"\n"]}),"\n",(0,a.jsxs)(n.li,{children:["\n",(0,a.jsxs)(n.p,{children:["For each coin the maker wants to receive from the offer, the maker's wallet creates a notarized coin payment. This is a list in the form of ",(0,a.jsx)(n.code,{children:"(PH1 AMT1 ...)"}),", where:"]}),"\n",(0,a.jsxs)(n.ul,{children:["\n",(0,a.jsxs)(n.li,{children:[(0,a.jsx)(n.code,{children:"PH1"})," is the puzzle hash of the coin the maker wants to acquire."]}),"\n",(0,a.jsxs)(n.li,{children:[(0,a.jsx)(n.code,{children:"AMT1"})," is the value of the coin the maker wants to acquire."]}),"\n",(0,a.jsxs)(n.li,{children:[(0,a.jsx)(n.code,{children:"..."})," is an optional memo of arbitrary length. The trade manager adds a hint to itself in this memo."]}),"\n"]}),"\n"]}),"\n",(0,a.jsxs)(n.li,{children:["\n",(0,a.jsxs)(n.p,{children:["The maker's wallet creates a nonce ",(0,a.jsx)(n.code,{children:"N"}),", using the treehash of a sorted list of the coinIDs of each coin being offered."]}),"\n"]}),"\n"]}),"\n",(0,a.jsx)(n.admonition,{type:"info",children:(0,a.jsxs)(n.p,{children:["If you're unfamiliar with them, Wikipedia has a good explanation of ",(0,a.jsx)(n.a,{href:"https://en.wikipedia.org/wiki/Cryptographic_nonce",children:"Cryptographic nonces"}),"."]})}),"\n",(0,a.jsx)(n.p,{children:"Every coin id needs to be included in the nonce to prevent the maker from creating two offers that can both be completed with just one payment."}),"\n",(0,a.jsx)(n.admonition,{type:"note",children:(0,a.jsx)(n.p,{children:"Even if two conflicting offers were created, the blockchain would correctly reject one of them as a double-spend."})}),"\n",(0,a.jsx)(n.p,{children:"Because each coin id must be unique, any attempts to change any of the coins being offered will cause the offer to become invalid."}),"\n",(0,a.jsxs)(n.ol,{start:"5",children:["\n",(0,a.jsxs)(n.li,{children:["The maker's wallet combines the nonce with the notarized coin payment(s) to create a list called ",(0,a.jsx)(n.code,{children:"notarized_payments"}),". For example, if three coins are included in the maker's offer, ",(0,a.jsx)(n.code,{children:"notarized_payments"})," will be structured like this:"]}),"\n"]}),"\n",(0,a.jsx)(n.pre,{children:(0,a.jsx)(n.code,{className:"language-chialisp",children:"((N . ((PH1 AMT1 ...) (PH2 AMT2 ...) (PH3 AMT3 ...))) ...)\n"})}),"\n",(0,a.jsxs)(n.ol,{start:"6",children:["\n",(0,a.jsxs)(n.li,{children:["\n",(0,a.jsx)(n.p,{children:"The offer driver calculates the announcements that need to be asserted in order to get paid."}),"\n"]}),"\n",(0,a.jsxs)(n.li,{children:["\n",(0,a.jsxs)(n.p,{children:["The maker's wallet creates a spend bundle paying the puzzle hash of the settlement payments puzzle. Finally, the offer file is created, using ",(0,a.jsx)(n.code,{children:"notarized_payments"})," and the spendbundle."]}),"\n"]}),"\n",(0,a.jsxs)(n.li,{children:["\n",(0,a.jsx)(n.p,{children:"The offer file is now complete. The maker can send this file anywhere others might see it, including social media, message boards, or a website dedicated to maintaining a list of current offers."}),"\n"]}),"\n",(0,a.jsxs)(n.li,{children:["\n",(0,a.jsxs)(n.p,{children:["The offer's status is now ",(0,a.jsx)(n.code,{children:"PENDING_ACCEPT"}),". In order for the offer to be completed, it still requires a ",(0,a.jsx)(n.code,{children:"CREATE_PUZZLE_ANNOUNCEMENT"})," condition for the whole puzzle, and a ",(0,a.jsx)(n.code,{children:"CREATE_COIN"})," condition for each type of asset to be received. The maker's coin(s) can't be spent until a taker creates these conditions."]}),"\n"]}),"\n"]}),"\n",(0,a.jsx)(n.h2,{id:"accepting-offer-files",children:"Accepting Offer Files"}),"\n",(0,a.jsx)(n.p,{children:"The offer file can be named anything, and it contains a bech32 address for an incomplete spend bundle."}),"\n",(0,a.jsx)(n.p,{children:"The taker still must perform several steps before the offer can be confirmed:"}),"\n",(0,a.jsxs)(n.p,{children:[(0,a.jsx)(n.strong,{children:"View the Offer"})," - The taker needs to validate the terms of the offer before choosing whether to accept it. This can be done using either Chia's wallet GUI or the CLI. In either case, the taker can choose whether to load the offer file or paste its contents."]}),"\n",(0,a.jsxs)(n.p,{children:[(0,a.jsx)(n.strong,{children:"Validate the Offer"})," - When the offer is loaded into the taker's wallet, the wallet verifies that the offer is valid by checking that the Maker's coins have not been spent. If any coins have been spent, the wallet will show an error that the offer is no longer valid. If the offer is still valid, the taker's wallet displays the offer's terms and asks whether the taker will accept it."]}),"\n",(0,a.jsxs)(n.p,{children:[(0,a.jsx)(n.strong,{children:"Create a Spend Bundle"})," - If the taker accepts, then the taker's wallet creates a new spend bundle with a combination of both the maker's and taker's ends of the offer. The offer's status is now ",(0,a.jsx)(n.code,{children:"PENDING_CONFIRM"}),"."]}),"\n",(0,a.jsxs)(n.p,{children:[(0,a.jsx)(n.strong,{children:"Push the Spend Bundle"})," - The taker's wallet pushes the spendbundle to the blockchain. After the spend bundle succeeds, all of the relevant coins have been spent or created, and all assertions have been completed. At this point, the offer's status is ",(0,a.jsx)(n.code,{children:"CONFIRMED"}),"."]}),"\n",(0,a.jsx)(n.h2,{id:"conclusion",children:"Conclusion"}),"\n",(0,a.jsx)(n.p,{children:"Offers are a refreshing new way to swap tokens in a decentralized way without a third party exchange or placing trust in others. They can be shared in any method you choose and accepted by anyone without worrying about the offer being tampered with."}),"\n",(0,a.jsxs)(n.p,{children:["For additional details on how Offers work, see ",(0,a.jsx)(n.a,{href:"https://aggsig.me/offers.html",children:"this article"}),"."]})]})}function d(e={}){const{wrapper:n}={...(0,i.R)(),...e.components};return n?(0,a.jsx)(n,{...e,children:(0,a.jsx)(c,{...e})}):c(e)}},8453:(e,n,t)=>{t.d(n,{R:()=>r,x:()=>o});var s=t(6540);const a={},i=s.createContext(a);function r(e){const n=s.useContext(i);return s.useMemo((function(){return"function"==typeof e?e(n):{...n,...e}}),[n,e])}function o(e){let n;return n=e.disableParentContext?"function"==typeof e.components?e.components(a):e.components||a:r(e.components),s.createElement(i.Provider,{value:n},e.children)}}}]);