id: offers_gui_tutorial
title: Offers, GUI Tutorial
---

# Offers tutorial (GUI)

This tutorial covers Chia offers using the official wallet's graphical user interface.

See also our [command line tutorial](../tutorials/offers_cli_tutorial.md "Offers CLI tutorial") and our [reference document](../puzzles/offers.md "Offers reference").

  >Note: This tutorial occasionally references a token called "CAT King Cole" (CKC). This token is for demonstration purposes only.

## Contents:

* [Add a new CAT wallet](#add-a-new-cat-wallet)
* [Create a single-token offer](#create-a-single-token-offer)
* [Accept a single-token offer](#accept-a-single-token-offer)
* [Cancel an offer](#cancel-an-offer)
* [Create a multiple-token offer](#create-a-multiple-token-offer)
* [Accept a multiple-token offer](#accept-a-multiple-token-offer)
* [Common issues](#common-issues)
* [Further reading](#further-reading)

-----

<br/>

## Add a new CAT wallet

In order to create an offer, you must have a wallet for any Chia Asset Tokens (CATs) you want to acquire. If you don't have such a wallet, it's easy to add one.

For example, here's how to add the Stably USD (USDS) token:
<br/>

   1. Click "+ ADD TOKEN".

<figure>
<img src="../../static/img/offers_img/gui_tutorial/wallet_add/1_xch_balance.png" alt="XCH balance before offer"/>
</figure>
<br/>

   2. Click the "USDS / Stably USD" button.

<figure>
<img src="../../static/img/offers_img/gui_tutorial/wallet_add/2_add_usds.png" alt="Add USDS wallet"/>
</figure>
<br/>

   3. "Adding USDS token" will be displayed while your new wallet is being created. This will take some time.

<figure>
<img src="../../static/img/offers_img/gui_tutorial/wallet_add/3_adding_usds_token.png" alt="Add USDS wallet"/>
</figure>
<br/>

   4. You now have a USDS wallet, in addition to your standard Chia wallet.

<figure>
<img src="../../static/img/offers_img/gui_tutorial/wallet_add/4_two_wallets.png" alt="Two wallets"/>
</figure>

<br/>

-----

<br/>

## Create a single-token offer

In this example, we'll offer 0.1 XCH in exchange for 10 USDS.
<br/>

   1. Click "MANAGE OFFERS".

<figure>
<img src="../../static/img/offers_img/gui_tutorial/offer_single_create/1_usds_wallet.png" alt="Add USDS wallet"/>
</figure>
<br/>

   2. Click "CREATE AN OFFER".

<figure>
<img src="../../static/img/offers_img/gui_tutorial/offer_single_create/2_create_offer.png" alt="Create offer"/>
</figure>
<br/>

   3. The "Create an Offer" dialog will appear. When you select an asset type to be offered, the dialog will display your spendable balance. After you have filled in the details of your offer, you will also be shown the exchange rate of the assets you want to trade, using the values you have entered.
   <br/><br/>When you are satisfied with your offer, click "SAVE OFFER".

<figure>
<img src="../../static/img/offers_img/gui_tutorial/offer_single_create/3_save_offer.png" alt="Save offer"/>
</figure>
<br/>

   4. Choose a name and location for your offer file.
   <br/>(Depending on your operating system, this dialog may appear different to what is shown.)

<figure>
<img src="../../static/img/offers_img/gui_tutorial/offer_single_create/4_save_dialog.png" alt="Save offer"/>
</figure>
<br/>

   5. A new dialog will appear, suggesting a few locations to share your offer. This is strictly optional. You could also directly share your offer file with a friend, or on social media, or anywhere else you want.
   <br/><br/>That said, for this tutorial we'll click the "OFFERBIN" button.

<figure>
<img src="../../static/img/offers_img/gui_tutorial/offer_single_create/5_share_offer.png" alt="Share offer"/>
</figure>
<br/>

   6. You will be shown the details of your offer once again. Click the "SHARE" button to share your offer.

<figure>
<img src="../../static/img/offers_img/gui_tutorial/offer_single_create/6_share_on_offer_bin.png" alt="Share on offer bin"/>
</figure>
<br/>

   7. Your offer has now been shared on Offer Bin, a website dedicated to sharing Chia offers. Offer Bin is not affiliated with Chia Network Inc.
   <br/><br/>You now have the option to view your offer on Offer Bin, copy the URL to share in more locations, or simply wait for someone to accept your offer.

<figure>
<img src="../../static/img/offers_img/gui_tutorial/offer_single_create/7_view_on_offer_bin.png" alt="View on offer bin"/>
</figure>
<br/>

   8. There is now one offer in the "Manage Offers" dialog. Its status is "Pending Accept".

<figure>
<img src="../../static/img/offers_img/gui_tutorial/offer_single_create/8_pending_accept.png" alt="Pending accept"/>
</figure>
<br/>

Congratulations! You have created an offer. A few things to note:
* Your wallet has reserved the coin(s) necessary to complete the offer.
* The blockchain has not recorded this offer.
* You can distribute the offer file wherever you want.
* Anyone who sees the offer file can attempt to accept it.

<br/>

-----

<br/>

## Accept a single-token offer

This example will use a different computer to accept the offer that was created in the previous example. Keep in mind, offers are accepted on a first-come, first-served basis.
<br/>
   1. From your light wallet's main dialog, click "MANAGE OFFERS".

<figure>
<img src="../../static/img/offers_img/gui_tutorial/offer_single_accept/1_chia_wallet.png" alt="Chia wallet"/>
</figure>
<br/>

  2. Click "VIEW AN OFFER".

<figure>
<img src="../../static/img/offers_img/gui_tutorial/offer_single_accept/2_view_an_offer.png" alt="View an offer"/>
</figure>
<br/>

   3. You can either paste the contents of an offer file, or load the whole file. In this example, we'll do the latter.

<figure>
<img src="../../static/img/offers_img/gui_tutorial/offer_single_accept/3_select_offer_file.png" alt="Select offer file"/>
</figure>
<br/>

   4. A new dialog will open. This may look different than what is pictured, depending on your operating system.
   <br/>Find the offer file and click "Open". Keep in mind, the name of the offer file doesn't necessarily reflect the actual offer.

<figure>
<img src="../../static/img/offers_img/gui_tutorial/offer_single_accept/4_open.png" alt="Open"/>
</figure>
<br/>

  5. You'll be shown a summary of the offer. You can add an optional fee (payable in XCH) if you want Chia's blockchain to prioritize your offer. If you agree with the terms, click "ACCEPT OFFER".

<figure>
<img src="../../static/img/offers_img/gui_tutorial/offer_single_accept/5_accept_offer.png" alt="Accept offer"/>
</figure>
<br/>

  6. You'll be given a chance to cancel your acceptance of the offer. Click "ACCEPT OFFER" to continue.

<figure>
<img src="../../static/img/offers_img/gui_tutorial/offer_single_accept/6_accept_offer.png" alt="Accept offer"/>
</figure>
<br/>

   7. After a few seconds, you'll receive a "Success" message. This means the offer has been completed and sent to the blockchain for confirmation.

<figure>
<img src="../../static/img/offers_img/gui_tutorial/offer_single_accept/7_success.png" alt="Success"/>
</figure>
<br/>

   8. The offer is now in the "Pending Confirm" state.

<figure>
<img src="../../static/img/offers_img/gui_tutorial/offer_single_accept/8_pending_confirm.png" alt="Pending confirm"/>
</figure>
<br/>

   9. The offer will take a few minutes to be confirmed. Note that this time can vary, depending on how full the mempool is and whether you included a fee upon accepting the offer.

<figure>
<img src="../../static/img/offers_img/gui_tutorial/offer_single_accept/9_confirmed.png" alt="Confirmed"/>
</figure>
<br/>

   10. After the offer has been confirmed, your new balance will be shown in your wallet.

<figure>
<img src="../../static/img/offers_img/gui_tutorial/offer_single_accept/10_wallet_post_trade.png" alt="Wallet post trade"/>
</figure>

<br/>

-----

<br/>

## Cancel an offer

You can cancel any offer you created, as long as it has not already been accepted.
<br/>

   1. In the "Manage Offers" dialog, locate the offer you want to cancel. It must be in the "Pending Accept" state.
   <br/>Click the three dots in the "Actions" column.

<figure>
<img src="../../static/img/offers_img/gui_tutorial/cancel/1_actions.png" alt="Offer actions"/>
</figure>
<br/>

   2. Click "Cancel Offer".

<figure>
<img src="../../static/img/offers_img/gui_tutorial/cancel/2_cancel.png" alt="Cancel an offer"/>
</figure>
<br/>

   3. The "Cancel Offer" dialog will appear. The default option is to cancel on the blockchain. This option will use your wallet to buy the coins you offered, which will ensure that nobody can accept your offer in the future.

<figure>
<img src="../../static/img/offers_img/gui_tutorial/cancel/3_cancel_on_chain.png" alt="Cancel on chain"/>
</figure>
<br/>

   4. If you uncheck the checkbox, your wallet will un-reserve the coins for your offer. However, nothing will be recorded on the blockchain. If you copied your offer file elsewhere, someone could still accept it.
   
   The advantages of this option are that it will cancel your offer instantly, and there's no need to include a fee.

<figure>
<img src="../../static/img/offers_img/gui_tutorial/cancel/4_cancel_off_chain.png" alt="Cancel off chain"/>
</figure>
<br/>

   5. If you left the checkbox checked in the previous step, your offer will enter the "Pending Cancel" state while the cancellation is being recorded on the blockchain. This could take several minutes.

<figure>
<img src="../../static/img/offers_img/gui_tutorial/cancel/5_pending_cancel.png" alt="Pending cancel"/>
</figure>
<br/>

   6. When your order has been successfully canceled, it will enter the "Cancelled" state. Your funds are now available in your wallet.

<figure>
<img src="../../static/img/offers_img/gui_tutorial/cancel/6_cancelled.png" alt="Cancelled"/>
</figure>

<br/>

-----

<br/>

## Create a multiple-token offer

It's easy to create an offer with multiple tokens, on one or both ends of the trade.
<br/>

   1. In the "Create an Offer" dialog, click the "+" to add more tokens. In order for the "+" to be accessible, you must have a wallet with a token that has not been used in this offer.

<figure>
<img src="../../static/img/offers_img/gui_tutorial/offer_multiple_create/1_plus_buttons.png" alt="Plus buttons"/>
</figure>
<br/>

   2. When you are satisfied with the number of tokens being offered and received, click "SAVE OFFER".

<figure>
<img src="../../static/img/offers_img/gui_tutorial/offer_multiple_create/2_save_multiple_offer.png" alt="Save multiple offer"/>
</figure>
<br/>

   3. Your new offer, including all tokens, is now in the "Pending Accept" state.

<figure>
<img src="../../static/img/offers_img/gui_tutorial/offer_multiple_create/3_manage_multiple.png" alt="Manage multiple offer"/>
</figure>

You now free to share your offer file anywhere you wish, just as you were with the single-token offer.

<br/>

-----

<br/>

## Accept a multiple-token offer
   1. The process to accept a multiple-token offer is the same as for a single-token offer.

   You don't need to have a wallet for all tokens being offered. If you see "Unknown CAT", you should verify that the asset ID matches the CAT you want to receive. For more info on why this is important, see the [Potential issues](#taker-accepts-an-unknown-cat-offer) section.

<figure>
<img src="../../static/img/offers_img/gui_tutorial/offer_multiple_accept/1_multiple_accept_dialog.png" alt="Multiple accept dialog"/>
</figure>
<br/>

   2. After accepting the offer, a new wallet will be created for any unknown tokens.

<figure>
<img src="../../static/img/offers_img/gui_tutorial/offer_multiple_accept/2_new_wallet.png" alt="New wallet"/>
</figure>

<br/>

-----

<br/>

## Potential issues

This section will detail a non-comprehensive list of issues you might encounter while making or taking offers.

## Contents:

* [Maker doesn't have enough money](#maker-doesnt-have-enough-money)
* [Taker doesn't have enough money](#taker-doesnt-have-enough-money)
* [Taker accepts an unknown CAT offer](#taker-accepts-an-unknown-cat-offer)
* [Taker attempts to accept an invalid offer](#taker-attempts-to-accept-an-invalid-offer)
* [Maker cancels an offer locally, Taker accepts the offer](#maker-cancels-an-offer-locally-taker-accepts-the-offer)
* [Whole coins must be reserved](#whole-coins-must-be-reserved)

<br/>

-----

<br/>

### Maker doesn't have enough money

Let's say a Maker has wallets for XCH and CKC, with no money in either of them.

<figure>
<img src="../../static/img/offers_img/gui_tutorial/issues/01_xch_wallet.png" alt="0 XCH wallet"/>
</figure>
<figure>
<img src="../../static/img/offers_img/gui_tutorial/issues/02_ckc_wallet.png" alt="0 CKC wallet"/>
</figure>

<br/>

The maker attempts to make an ambitious offer: 100 XCH for 1 million CKC.

<figure>
<img src="../../static/img/offers_img/gui_tutorial/issues/03_100xch_for_1mckc.png" alt="Offer 100 XCH for 1 million CKC"/>
</figure>
<br/>

However, the Maker does not have enough money to create this offer. As a result, an Error is displayed:
<figure>
<img src="../../static/img/offers_img/gui_tutorial/issues/04_100xch_for_1mckc_fail.png" alt="Amount exceeds spendable balance"/>
</figure>

<br/>

-----

<br/>

### Taker doesn't have enough money

Let's say the Taker has a wallet with no money in it:

<figure>
<img src="../../static/img/offers_img/gui_tutorial/issues/01_xch_wallet.png" alt="0 XCH wallet"/>
</figure>
<br/>

And there's an outstanding offer requesting 0.1 XCH for 10,000 CKC:

TODO: create image file

<br/>

However, the Taker does not have enough money to accept this offer. As a result, an Error is displayed:

TODO: create image file

<br/>

-----

<br/>

### Taker accepts an unknown CAT offer

You should be extra careful before accepting offers for unknown CATs. This is because the offer _might_ be a scam where a different -- and worthless -- token is actually being offered.

Here's how the scam would work:

Let's say a potential Taker has 0.1 XCH in their wallet.

<figure>
<img src="../../static/img/offers_img/gui_tutorial/issues/07_0.1xch_wallet.png" alt="0.1 XCH wallet"/>
</figure>
<br/>

There is an offer of 0.25 Shibe (an unknown CAT) in exchange for 0.1 XCH.

Here's the offer from the Taker's perspective:
<figure>
<img src="../../static/img/offers_img/gui_tutorial/issues/08_0.25_shibe_for_0.1_xch.png" alt="Offer shibe for XCH"/>
</figure>
<br/>

The Taker decides to accept the offer.

There is a warning dialog about the unknown cat, after which the offer is confirmed successfully:
<figure>
<img src="../../static/img/offers_img/gui_tutorial/issues/09_accept_unknown_warning.png" alt="Unknown CAT warning"/>
</figure>
<figure>
<img src="../../static/img/offers_img/gui_tutorial/issues/10_unknown_success.png" alt="Unknown CAT success"/>
</figure>
<br/>



Notice that the offer file was named `0.25_Shibe_for_0.1_XCH.offer`, but the file name itself does _not_ dictate the contents of the offer. The Taker may have inadvertently accepted an offer for a worthless token!

Luckily, it is easy to avoid this scam by cross-referencing the unknown CAT's ID before accepting the offer. In this case, the Taker should verify from a trusted source that `4ac6a35e5fecb50d85604b19250a942afdc81876fe11db1f9d970c95dcf2c43f` indeed corresponds to Shibe.

Chia does install a list of known CATs by default, so this scam should be rare, but you should always be diligent in scrutinizing offers for unknown CATs.

<br/>

-----

<br/>

### Taker attempts to accept an invalid offer

If the Maker has canceled the offer on the blockchain, or a Taker has already taken the offer, it is no longer valid.

Any potential Takers will be conveyed this information upon viewing the offer. For example:

<figure>
<img src="../../static/img/offers_img/gui_tutorial/issues/11_invalid_offer.png" alt="Invalid offer"/>
</figure>

<br/>

-----

<br/>

### Maker cancels an offer locally, Taker accepts the offer

This example will demonstrate that if you need to cancel an offer, you should always do so on-chain unless you are certain the offer file has not left your computer.

Let's say a Maker has 0.1 XCH and 1 USDS:
<figure>
<img src="../../static/img/offers_img/gui_tutorial/issues/12_0.1xch_wallet.png" alt="0.1 XCH in wallet"/>
</figure>
<figure>
<img src="../../static/img/offers_img/gui_tutorial/issues/13_1usds_wallet.png" alt="1 USDS in wallet"/>
</figure>
<br/>

The Maker offers 0.1 XCH in exchange for 10 USDS:
<figure>
<img src="../../static/img/offers_img/gui_tutorial/issues/14_view_offer_0.1xch_10usds.png" alt="Offer 0.1 XCH for 10 USDS"/>
</figure>
<br/>

The Maker then decides to cancel the offer, and unchecks the "Cancel on blockchain" checkbox:
<figure>
<img src="../../static/img/offers_img/gui_tutorial/issues/15_cancel_off_chain.png" alt="Cancel offer off chain"/>
</figure>
<br/>

The offer's state is immediately changed to "Cancelled".
<figure>
<img src="../../static/img/offers_img/gui_tutorial/issues/16_canceled_off_chain.png" alt="Canceled offer off chain"/>
</figure>
<br/>

After the offer has been canceled, a Taker notices the offer file and decides to accept it:

<figure>
<img src="../../static/img/offers_img/gui_tutorial/issues/17_accept_a_canceled_offer.png" alt="Accept a canceled offer"/>
</figure>
<figure>
<img src="../../static/img/offers_img/gui_tutorial/issues/18_confirmed_canceled_offer.png" alt="Confirm a canceled offer"/>
</figure>
<br/>

Later, the Maker notices that the offer has gone through, despite having been canceled:

<figure>
<img src="../../static/img/offers_img/gui_tutorial/issues/19_0xch_wallet.png" alt="Post-offer 0 XCH"/>
</figure>
<figure>
<img src="../../static/img/offers_img/gui_tutorial/issues/20_11usds_wallet.png" alt="Post-offer 11 USDS"/>
</figure>
<br/>

If the offer had been canceled on-chain, the reserved coins would have been spent. At that point, even if someone else had gotten access to the offer file, the offer itself would've been invalid.

The lesson here is do _not_ uncheck the "Cancel on blockchain" checkbox unless you're certain the offer file has never left your computer.


<br/>

-----

<br/>

### Whole coins must be reserved

Under the coin set model, coins can be of any value. When an offer is created, the Maker's wallet must reserve enough coins to meet the requirements of the offer. 

The coin set model [has many advantages](https://docs.chia.net/docs/04coin-set-model/what-is-a-coin "Coin set model") over the account model, but it can create some situations that take time to understand.

For example, let's say a Maker has 1 XCH and 0 USDS:

<figure>
<img src="../../static/img/offers_img/gui_tutorial/issues/21_1xch_wallet.png" alt="1 XCH in wallet"/>
</figure>
<figure>
<img src="../../static/img/offers_img/gui_tutorial/issues/22_0usds_wallet.png" alt="0 USDS in wallet"/>
</figure>
<br/>

The Maker creates an offer of 0.1 XCH for 10 USDS.

The Maker received the XCH in one lump sum, so there is a single coin worth 1 XCH in the Maker's wallet.

This is viewable in the offer's details:

<figure>
<img src="../../static/img/offers_img/gui_tutorial/issues/23_pending_accept.png" alt="Offer in Pending Accept state"/>
</figure>
<figure>
<img src="../../static/img/offers_img/gui_tutorial/issues/24_show_details.png" alt="Show offer's details"/>
</figure>
<figure>
<img src="../../static/img/offers_img/gui_tutorial/issues/25_one_coin.png" alt="One coin used for offer"/>
<figcaption>
<em>Scroll to the bottom to view coins reserved for the offer.</em>
</figcaption>
</figure>
<br/>

While the offer is pending, the Maker attempts to send 0.1 XCH to another address.

Notice that while the Total Balance is 1, the Spendable Balance is 0.

<figure>
<img src="../../static/img/offers_img/gui_tutorial/issues/26_cant_send_offer_pending.png" alt="Can't send while offer pending"/>
</figure>
<br/>

This should be possible -- the Maker has 0.9 XCH, even after taking the offer into account. The reason for the Exception is because the Maker only has a single coin worth 1 XCH, and that coin has already been reserved for the offer.

It's similar to using a $10 bill to buy something for $1. Before you receive your change, you can't buy anything else. On the other hand, if you had started with two $5 bills and bought the same $1 item, you could've purchased something else while waiting for your change.

The Maker can work around this issue by canceling the offer, then breaking the single large coin into multiple small ones. One simple way to do this would be to send money to him/herself:

<figure>
<img src="../../static/img/offers_img/gui_tutorial/issues/27_send_0.1xch_to_self.png" alt="Maker sends money to him/herself"/>
</figure>
<br/>

The Maker can then recreate the same offer. The new offer's details show a coin worth 0.9 XCH being reserved:
<figure>
<img src="../../static/img/offers_img/gui_tutorial/issues/28_0.1_coin_in_offer.png" alt="New details of Maker's offer"/>
</figure>
<br/>

The Maker's wallet shows a Total Balance of 1 XCH. This is the same as before, but there are now two coins that sum to 1 XCH.

Because there are now two coins in the Maker's wallet, and only one (worth 0.9 XCH) has been reserved for the offer, the Spendable Balance is 0.1 XCH:
<figure>
<img src="../../static/img/offers_img/gui_tutorial/issues/29_0.1xch_available.png" alt="Maker has 0.1 XCH available"/>
</figure>
<br/>

The Maker can now send 0.1 XCH to another wallet, even while the offer is still pending:
<figure>
<img src="../../static/img/offers_img/gui_tutorial/issues/30_send_while_offer_pending.png" alt="Successful send while offer pending"/>
</figure>
<br/>

One of the Maker's coins has been reserved for the offer, and the other has been sent to another wallet. The Maker can further break apart the large coin as needed.

<br/>

-----

<br/>

## Further reading

* [Offers blog entry]()
* [Offers reference](../puzzles/offers.md "Offers reference")
* [CLI tutorial](../tutorials/offers_cli_tutorial.md "Offers CLI tutorial")
* [Info on the coin set model](https://docs.chia.net/docs/04coin-set-model/what-is-a-coin "Coin set model")