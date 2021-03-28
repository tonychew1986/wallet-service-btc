var express = require('express')
var router = express.Router()

const axios = require('axios');

var txBTC = require('../core/transaction.js');
var auth = require('../core/auth.js');
var walletSelect = require('../core/wallet-selector.js');

var send = require('../core/send.js');

const asyncHandler = fn => (req, res, next) =>
  Promise
    .resolve(fn(req, res, next))
    .catch(next)


router.get('/test', (req, res) => {
  return res.send('test');
});

router.get('/signature/test', asyncHandler(async (req, res, next) => {
  let network = req.query.network || "testnet";

  let walletName = req.query.wallet || "hot_wallet";
  let signatureAPI = await walletSelect.walletSelector(network, walletName);

  axios.get(signatureAPI + '/test')
  .then(function (response) {
    console.log(response["data"]);
    return res.send(response["data"]);
  })
  .catch(function (error) {
    console.log(error);
  });
}));

router.get('/utxo', auth.isAuthorised, asyncHandler(async (req, res, next) => {
  let network = req.query.network || "testnet";
  var senderAdd = req.query.sender_add;
  var spent = req.query.spent || "unspent";

  var senderAddArray = senderAdd.split(',')

  let utxoArray = [];
  console.log("senderAddArray", senderAddArray);

  for(var i=0; i<senderAddArray.length; i++){
    let utxo = await txBTC.getUTXO(network, senderAddArray[i], spent);
    utxoArray.push({"address": senderAddArray[i], "utxo": utxo});
  }

  console.log("utxoArray", utxoArray);

  // need to cater for many addresses as string or array
  // let balance = await txBTC.getBalance(network, senderAdd);

  // return res.json({"address": senderAdd, "balance": balance});
  return res.json(utxoArray);
}));

router.get('/balance', auth.isAuthorised, asyncHandler(async (req, res, next) => {
  let network = req.query.network || "testnet";
  var senderAdd = req.query.sender_add;

  var senderAddArray = senderAdd.split(',')

  let balanceArray = [];
  console.log("senderAddArray", senderAddArray);

  for(var i=0; i<senderAddArray.length; i++){
    let bal = await txBTC.getBalance(network, senderAddArray[i]);
    balanceArray.push({"address": senderAddArray[i], "balance": bal});
  }

  console.log("balanceArray", balanceArray);

  // need to cater for many addresses as string or array
  // let balance = await txBTC.getBalance(network, senderAdd);

  // return res.json({"address": senderAdd, "balance": balance});
  return res.json(balanceArray);
}));

// API set nonce
router.get('/wallet', auth.isAuthorised, asyncHandler(async (req, res, next) => {
  let network = req.query.network || "testnet";
  let nonceData = await txBTC.checkNonce(network);
  let nonce = nonceData[0]

  data = {
    network: network,
    nonce: nonce
  }

  let walletName = req.query.wallet || "hot_wallet";
  let signatureAPI = await walletSelect.walletSelector(network, walletName);

  if(walletName == "hot_wallet"){
    axios.post(signatureAPI + '/wallet', data)
    .then(function (response) {
      console.log(response["data"]);
      return res.json({"address": response["data"], "nonce": nonce});
    })
    .catch(function (error) {
      console.log(error);
    });
  }else{
    return res.json({"message": "Wallet service requested is not identified as a hot wallet. This endpoint is not required for non hot wallet. Try using /wallet/query endpoint"});
  }
}));

router.get('/wallet/query', auth.isAuthorised, asyncHandler(async (req, res, next) => {
  let network = req.query.network || "testnet";
  let nonce = req.query.nonce;

  let walletName = req.query.wallet || "hot_wallet";
  let signatureAPI = await walletSelect.walletSelector(network, walletName);

  axios.post(signatureAPI + '/wallet', {
    network: network,
    nonce: nonce
  })
  .then(function (response) {
    console.log(response["data"]);
    return res.json({"address": response["data"], "nonce": parseInt(nonce)});
  })
  .catch(function (error) {
    console.log(error);
  });
}));

router.get('/wallet/query/all', auth.isAuthorised, asyncHandler(async (req, res, next) => {
  let network = req.query.network || "testnet";
  let nonce = req.query.nonce;

  let walletName = req.query.wallet || "hot_wallet";
  let signatureAPI = await walletSelect.walletSelector(network, walletName);

  axios.post(signatureAPI + '/wallet/all', {
    network: network,
    nonce: nonce
  })
  .then(function (response) {
    console.log(response["data"]);
    return res.json({"address": response["data"]});
  })
  .catch(function (error) {
    console.log(error);
  });
}));

router.get('/confirmations', asyncHandler(async (req, res, next) => {
  let network = req.query.network || "testnet";
  var txHash = req.query.txHash;

  let conf = await txBTC.getTransactionConfirmation(network, txHash);

  console.log("conf", conf);

  // need to cater for many addresses as string or array
  // let balance = await txBTC.getBalance(network, senderAdd);

  // return res.json({"address": senderAdd, "balance": balance});
  return res.json({"confirmations": conf});
}));

router.get('/nonce', asyncHandler(async (req, res, next) => {
  let network = req.query.network || "testnet";
  let nonce = await txBTC.checkNonce(network);
  console.log("nonce", nonce);
  return res.json({"nonce": nonce});
}));

router.get('/nonce/check', asyncHandler(async (req, res, next) => {
  let network = req.query.network || "testnet";
  let nonce = await txBTC.getNonceFromDB(network);
  console.log("nonce", nonce);
  return res.json(nonce);
}));

router.get('/nonce/reset', asyncHandler(async (req, res, next) => {
  let network = req.query.network || "testnet";
  let nonce = await txBTC.resetNonce(network);
  console.log("nonce", nonce);
  return res.json({"nonce": nonce});
}));

router.get('/network/fee', asyncHandler(async (req, res, next) => {
  var fee = await txBTC.getFees();

  return res.json({"fee": fee});
}));

router.post('/send', auth.isAuthorised, asyncHandler(async (req, res, next) => {
  let network = req.body.network || "testnet";
  var senderAdd = req.body.sender_add; // "0x9E013304072C0B919e64721cB550B280a1F021f6"
  var receiverAdd = req.body.receiver_add; // "0x8099E1f8B72Dd1881e4ac588722078408543CB2E"
  var utxo = await txBTC.getUTXO(network, senderAdd, "unspent");
  var fee = await txBTC.getFees();
  let balance = await txBTC.getBalance(network, senderAdd);
  balance = await txBTC.convertDenomination(balance);

  let walletName = req.body.wallet || "hot_wallet";
  let signatureAPI = await walletSelect.walletSelector(network, walletName);

  var user = req.body.user || ""

  var amount = req.body.amount_in_btc.toString();
  var amountInPrimaryDenomination = amount;

  amount = await txBTC.convertDenomination(amount);
  console.log("amount", amount)
  amount = Math.floor(amount);
  console.log("amount", amount)
  console.log("utxo", utxo)

  var amountInLowestDenomination = amount;

  fee = await txBTC.txCalculateFeeUTXO(fee, utxo.length, 2)
  // fee *= (utxo.length*180) + (2*34) + 10;

  let requiredBalance = parseFloat(amount) + parseFloat(fee);

  let change = balance - requiredBalance;

  console.log("fee", fee)
  console.log("balance", balance)
  console.log("requiredBalance", requiredBalance)
  console.log("change", change)

  let response = await send.sendBTC(signatureAPI, network, balance, amountInPrimaryDenomination, amountInLowestDenomination, senderAdd, receiverAdd, fee, utxo, change, user, requiredBalance);
  console.log("response", response)

  return res.json(response);
}));




router.post('/stagger/send', auth.isAuthorised, asyncHandler(async (req, res, next) => {
  let network = req.body.network || "testnet";
  var amount = req.body.amount_in_btc.toString();
  var senderAdd = req.body.sender_add;
  var receiverAdd = req.body.receiver_add;

  var useCase = req.body.use_case;

  let wallet = req.body.wallet || "hot_wallet";
  // let signatureAPI = await walletSelect.walletSelector(network, walletName);

  var user = req.body.user || ""

  let balance = await txBTC.getBalance(network, senderAdd);
  balance = await txBTC.convertDenomination(balance);

  console.log("balance", balance)

  // holding area kept in primary unit, sending
  var amountInPrimaryDenomination = amount;

  amount = await txBTC.convertDenomination(amount);

  amount = Math.floor(amount);

  var amountInLowestDenomination = amount;

  let response = await send.sendStaggeredBTC(network, balance, amountInPrimaryDenomination, amountInLowestDenomination, senderAdd, receiverAdd, user, useCase, wallet);
  console.log("response", response)

  return res.json(response);
}));

router.post('/holding-area', auth.isAuthorised, asyncHandler(async (req, res, next) => {
  let network = req.body.network || "testnet";
  let pageSize = req.body.page_size || "20";
  let pageNum = req.body.page_num || "0";

  let filterProcessed = req.body.filter_processed || "0";
  let filterFlagged = req.body.filter_flagged || "0";

  // add filter by wallet option
  let wallet = req.body.wallet || "hot_wallet";

  let response = await txBTC.txCheckHoldingArea(network, 0, pageSize, pageNum, filterProcessed, filterFlagged);
  console.log("response", response)

  return res.json(response);
}));

router.post('/holding-area/flag', auth.isAuthorised, asyncHandler(async (req, res, next) => {
  let network = req.body.network || "testnet";
  let id = req.body.id;
  let senderAdd = req.body.sender_addr;
  let receiverAdd = req.body.receiver_addr;
  let flagged = req.body.flagged;

  if(flagged == 'false' || flagged == false || flagged == '0' || flagged == 0){
    // not flagged
    flagged = false;
  }else{
    // flagged
    flagged = true;
  }

  let response = await txBTC.txHoldingAreaToggleFlag(network, id, senderAdd, receiverAdd, flagged);
  console.log("response", response)

  return res.json(response);
}));

router.post('/holding-area/send', auth.isAuthorised, asyncHandler(async (req, res, next) => {
  let network = req.body.network || "testnet";
  let user = req.body.user || ""

  let pageSize = req.body.page_size || "20";
  let pageNum = req.body.page_num || "0";

  let filterProcessed = req.body.filter_processed || "0";
  let filterFlagged = req.body.filter_flagged || "0";

  // need to shift wallet to below.
  // need to include in holding area db
  let walletName = req.body.wallet || "hot_wallet";
  let signatureAPI = await walletSelect.walletSelector(network, walletName);

  let holdingBalanceTxs = await txBTC.txCheckHoldingArea(network, 0, pageSize, pageNum, filterProcessed, filterFlagged);
  console.log("holdingBalanceTxs", holdingBalanceTxs)

  var senderAddManyDeposit = [];
  var receiverAddManyDeposit = [];
  var senderAddManyWithdrawal = [];
  var receiverAddManyWithdrawal = [];
  var senderAddManyOthers = [];
  var receiverAddManyOthers = [];

  console.log("holdingBalanceTxs.length", holdingBalanceTxs.length)

  let utxoTotalCount = 0;

  var fee = await txBTC.getFees();
  // fee *= (utxo.length*180) + (2*34) + 10;

  for(var i = 0; i < holdingBalanceTxs.length; i++){
    let id = holdingBalanceTxs[i]["id"];
    let senderAdd = holdingBalanceTxs[i]["sender_addr"];
    let receiverAdd = holdingBalanceTxs[i]["receiver_addr"];
    let amount = holdingBalanceTxs[i]["amount"];
    let token = holdingBalanceTxs[i]["token"];
    let data = holdingBalanceTxs[i]["data"];
    let processed = holdingBalanceTxs[i]["processed"];
    let flagged = holdingBalanceTxs[i]["flagged"];
    let useCase = holdingBalanceTxs[i]["use_case"];

    console.log("id", id)

    if(processed == 0){
      if(flagged == 0){
        if(useCase == "hot wallet to warm wallet" || useCase == "Deposit"){

          // var amountInPrimaryDenomination = amount;
          //
          // amount = await txBTC.convertDenomination(amount);
          //
          // amount = Math.floor(amount);
          //
          // var amountInLowestDenomination = amount;

          senderAddManyDeposit.push([senderAdd, amount, id]);

          if(receiverAddManyDeposit.length == 0){
            receiverAddManyDeposit.push([receiverAdd, "all"]);
          }
        }else if(useCase == "Withdraw"){

          if(senderAddManyWithdrawal.length == 0){
            senderAddManyWithdrawal.push([senderAdd, "fixed"]);
          }

          receiverAddManyWithdrawal.push([receiverAdd, amount, id]);
        }else if(useCase == "others"){
          // multiple inputs to multiple outputs
          // consolidate transactions and send to multiple users
          senderAddManyOthers.push([senderAdd, amount, id]);
          receiverAddManyOthers.push([receiverAdd, amount, id]);

          console.log("others. Not sent require separate implementation")
        }
      }else{
        console.log("transaction flagged")
      }
    }
  }
  ////
  if(senderAddManyDeposit.length > 0 && receiverAddManyDeposit.length > 0){
    console.log("sendBatchedDepositBTC")
    console.log(signatureAPI, network, senderAddManyDeposit, receiverAddManyDeposit, fee)
    let responseDeposit = await send.sendBatchedDepositBTC(signatureAPI, network, senderAddManyDeposit, receiverAddManyDeposit, fee);

    console.log("responseDeposit", responseDeposit);

    let txHashDeposit = responseDeposit["txHash"];

    console.log("txHashDeposit", txHashDeposit);

    if(txHashDeposit !== ""){
      for(var d = 0; d < senderAddManyDeposit.length; d++){
        let senderAdd = senderAddManyDeposit[d][0];
        let receiverAdd = receiverAddManyDeposit[0][0];
        let id = senderAddManyDeposit[d][2];

        let amount = senderAddManyDeposit[d][1];

        let individualResult = await send.sentFromHoldingArea(network, amount, senderAdd, receiverAdd, user, id, txHashDeposit);

        console.log("individualResult", individualResult)
      }
    }
  }



  ////
  if(senderAddManyWithdrawal.length > 0 && receiverAddManyWithdrawal.length > 0){
    console.log("sendBatchedWithdrawBTC")
    let responseWithdrawal = await send.sendBatchedWithdrawBTC(signatureAPI, network, senderAddManyWithdrawal, receiverAddManyWithdrawal, fee);

    console.log("responseWithdrawal", responseWithdrawal)

    let txHashWithdrawal = responseWithdrawal["txHash"];

    console.log("txHashWithdrawal", txHashWithdrawal)

    if(txHashWithdrawal !== ""){
      for(var w = 0; w < receiverAddManyWithdrawal.length; w++){
        let senderAdd = senderAddManyWithdrawal[0][0];
        let receiverAdd = receiverAddManyWithdrawal[w][0];
        let id = receiverAddManyWithdrawal[w][2];

        let amount = receiverAddManyWithdrawal[w][1];

        let individualResult = await send.sentFromHoldingArea(network, amount, senderAdd, receiverAdd, user, id, txHashWithdrawal);

        console.log("individualResult", individualResult)
      }
    }
  }

  return res.json(holdingBalanceTxs);
}));





router.get('/explorer/sync/status', asyncHandler(async (req, res, next) => {
  let network = req.query.network || "testnet";
  var address = req.query.address;
  console.log("address", address);

  let synced = await txBTC.getAddressSync(network, address);
  console.log("synced", synced);

  return res.json({"synced": synced});
}));

router.get('/explorer/tx/hashInfo', asyncHandler(async (req, res, next) => {
  let network = req.query.network || "testnet";
  var txHash = req.query.txHash;

  let data = await txBTC.getTransactionHashInfo(network, txHash);
  console.log("data", data);

  return res.json(data);
}));


router.post('/explorer/address/add', auth.isAuthorised, asyncHandler(async (req, res, next) => {
  let network = req.body.network || "testnet";
  var address = req.body.address;

  let status = await txBTC.addAddress(network, address);
  console.log("status", status);

  return res.json({"status": "Address is added to watchlist"});
}));

module.exports = router
