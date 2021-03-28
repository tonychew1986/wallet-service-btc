
const axios = require('axios');

var txBTC = require('../core/transaction.js');

const FEELIMIT = 0.01; //0.01BTC

let sendBTC = async function(signatureAPI, network, balance, amountInPrimaryDenomination, amountInLowestDenomination, senderAdd, receiverAdd, fee, utxo, change, user, requiredBalance) {
  console.log("signatureAPI", signatureAPI)
  var promise = new Promise(async function(resolve, reject){

    let checkDenomination = await txBTC.checkDenomination(amountInPrimaryDenomination, amountInLowestDenomination);
    if (checkDenomination != "success") return resolve({"message": "denomination is wrong"});

    let feeLimitInLowestDenomination = await txBTC.convertDenomination(FEELIMIT);
    if (fee >= feeLimitInLowestDenomination) return resolve({"message": "fee is too high"});

    if(balance >= requiredBalance){
      axios.post(signatureAPI + '/send', {
        network: network,
        amount: amountInLowestDenomination,
        senderAdd: senderAdd,
        receiverAdd: receiverAdd,
        fee: fee,
        utxo: utxo,
        change: change
      })
      .then(async function (response) {
        signedTx = response["data"]

        console.log("signedTx", signedTx)

        tx = await txBTC.txBroadcast(network, signedTx)
        console.log("tx", tx)

        txBTC.txActionLog(network, user, "send", amountInPrimaryDenomination, "")


        if(tx[0] == "success"){
          resolve({"signedValueTx": signedTx, "txHash": tx[1]["tx"]["hash"]});
        }else{
          resolve({"signedValueTx": signedTx, "txHash": tx[1]});
        }
        // resolve({"signedValueTx": signedTx, "txHash": tx});

      })
      .catch(function (error) {
        console.log(error);
      });
    }else{
      //return res.json({"message": "Sender address have insufficient balance"});
      resolve({"message": "Sender address have insufficient balance"});
    }

  });
  return promise;
}


let sendStaggeredBTC = async function(network, balance, amountInPrimaryDenomination, amountInLowestDenomination, senderAdd, receiverAdd, user, useCase, walletName) {
  var promise = new Promise(async function(resolve, reject){
    let checkDenomination = await txBTC.checkDenomination(amountInPrimaryDenomination, amountInLowestDenomination);
    if (checkDenomination != "success") return resolve({"message": "denomination is wrong"});

    console.log("balance", balance)
    console.log("amountInLowestDenomination", amountInLowestDenomination)

    if(balance >= amountInLowestDenomination){
      txBTC.txActionLog(network, user, "send::holding area", amountInPrimaryDenomination, "")
      txBTC.txAddHoldingArea(network, user, senderAdd, receiverAdd, amountInPrimaryDenomination, "", "", useCase, walletName)

      resolve({"signedValueTx": "", "txHash": ""});
    }else{
      //return res.json({"message": "Sender address have insufficient balance"});
      resolve({"message": "Sender address have insufficient balance"});
    }
  });
  return promise;
}

let sentFromHoldingArea = async function(network, amount, senderAdd, receiverAdd, user, id, txHash) {
  var promise = new Promise(async function(resolve, reject){
    txBTC.txActionLog(network, user, "sent complete::holding area", amount, "")
    txBTC.txUpdateHoldingArea(network, user, senderAdd, receiverAdd, amount, "", "", id, txHash)

    resolve("done");
  });
  return promise;
}

// only for deposit, need to change significantly to cater for withdrawal
let sendBatchedDepositBTC = async function(signatureAPI, network, senderAddMany, receiverAddMany, fee, user) {
  var promise = new Promise(async function(resolve, reject){
    // utxo from sender
    var utxo = [];
    let utxoTotalCount = 0;
    let amountCombined = 0;
    let utxoTotalBalance = 0;

    console.log("senderAddMany", senderAddMany);
    // loop thru all senderAdd to get their utxo
    for(var i=0; i<senderAddMany.length; i++){
      console.log("senderAddMany[i][0]", senderAddMany[i][0]);
      let entryUTXO = await txBTC.getUTXO(network, senderAddMany[i][0], "unspent");

      console.log("entryUTXO", entryUTXO);
      for(var r=0; r<entryUTXO.length; r++){
        utxo.push(entryUTXO[r]);
        utxoTotalBalance += parseFloat(entryUTXO[r]["balance"]);

        utxoTotalCount ++;
      }

      amountCombined += senderAddMany[i][1];
    }

    console.log("utxo", utxo);
    console.log("amountCombined", amountCombined);
    console.log("utxoTotalCount", utxoTotalCount);
    console.log("utxoTotalBalance", utxoTotalBalance);

    fee = await txBTC.txCalculateFeeUTXO(fee, utxoTotalCount, 1)
    // fee *= (utxoTotalCount*180) + (2*34) + 10;
    let feeLimitInLowestDenomination = await txBTC.convertDenomination(FEELIMIT);
    if (fee >= feeLimitInLowestDenomination) return resolve({"message": "fee is too high"});

    var amountInPrimaryDenomination = amountCombined;

    amountCombined = await txBTC.convertDenomination(amountCombined);

    amountCombined = Math.floor(amountCombined);

    var amountInLowestDenomination = amountCombined;

    let requiredBalance = parseFloat(amountInLowestDenomination) + parseFloat(fee);
    let change = 0; //balance - requiredBalance;

    console.log("fee", fee)
    console.log("amountInLowestDenomination", amountInLowestDenomination)
    console.log("requiredBalance", requiredBalance)

    console.log(network, senderAddMany, receiverAddMany, fee, utxo, change)

    var utxoTotalBalanceInPrimaryDenomination = utxoTotalBalance;

    utxoTotalBalance = await txBTC.convertDenomination(utxoTotalBalance);

    utxoTotalBalance = Math.floor(utxoTotalBalance);

    var utxoTotalBalanceInLowestDenomination = utxoTotalBalance;

    console.log("utxoTotalBalanceInLowestDenomination", utxoTotalBalanceInLowestDenomination)
    console.log("change", change)

    let sendableBalance = amountInLowestDenomination;

    // if amount to send and utxo balance is the same
    // then it means fee is not accounted for
    // thus sendableBalance should be utxo total (or amount) - fee
    if(amountInLowestDenomination == utxoTotalBalanceInLowestDenomination){
      sendableBalance = requiredBalance - parseFloat(fee);
    }
    console.log("sendableBalance", sendableBalance)

    // utxo total should be more than or equal to amount to send (requiredBalance)
    // if(utxoTotalBalanceInLowestDenomination >= requiredBalance){
    if(utxoTotalBalanceInLowestDenomination >= sendableBalance){
      // utxo total minus requiredBalance should be 0 leaving no change amount or address

      if(utxoTotalBalanceInLowestDenomination - sendableBalance == 0){
        axios.post(signatureAPI + '/send/batch', {
          network: network,
          totalAmount: sendableBalance,
          senderAddMany: senderAddMany,
          receiverAddMany: receiverAddMany,
          fee: fee,
          utxo: utxo,
          change: change,
          useCase: "Deposit"
        })
        .then(async function (response) {
          signedTx = response["data"]

          console.log("signedTx", signedTx)

          tx = await txBTC.txBroadcast(network, signedTx)
          console.log("tx", tx)


          if(tx[0] == "success"){
            txBTC.txActionLog(network, user, "send batch", amountInPrimaryDenomination, "")
            resolve({"signedValueTx": signedTx, "txHash": tx[1]["tx"]["hash"]});
          }else{
            resolve({"message": "fail", "txHash": ""})
          }
          // }else{
          //   resolve({"signedValueTx": signedTx, "txHash": tx[1]});
          // }
          // resolve({"signedValueTx": signedTx, "txHash": tx});

        })
        .catch(function (error) {
          console.log(error);
        });
      }else{
        resolve({"message": "Change amount should be 0"});
      }
    }else{
      //return res.json({"message": "Sender address have insufficient balance"});
      resolve({"message": "Sender address have insufficient balance"});
    }
  });
  return promise;
}

// only for withdraw
let sendBatchedWithdrawBTC = async function(signatureAPI, network, senderAddMany, receiverAddMany, fee, user) {
  var promise = new Promise(async function(resolve, reject){
    // utxo from sender
    var utxo = [];
    let utxoTotalCount = 0;
    let amountCombined = 0;
    let utxoTotalBalance = 0;

    // Get utxo from warm wallet (multiple)
		for(var s=0; s<senderAddMany.length; s++){
      let addrUtxo = await txBTC.getUTXO(network, senderAddMany[s][0], "unspent");

      // Arrange utxo
  		for(var u=0; u<addrUtxo.length; u++){
        utxo.push(addrUtxo[u]);
      }
    }


    let utxoOutputNum = receiverAddMany.length;

    // Get total amount to send
    for(var i=0; i<utxoOutputNum; i++){
      amountCombined += receiverAddMany[i][1];
    }

    console.log("utxo", utxo);
    console.log("amountCombined", amountCombined);


    var amountInPrimaryDenomination = amountCombined;

    amountCombined = await txBTC.convertDenomination(amountCombined);

    amountCombined = Math.floor(amountCombined);

    var amountInLowestDenomination = amountCombined;

    // need to optimise utxo selection
    let selectedUTXO = await txBTC.utxoSelection(utxo, amountInLowestDenomination, fee, utxoOutputNum);
    console.log("selectedUTXO", selectedUTXO);

    utxoTotalCount = selectedUTXO.length;

    console.log("utxoTotalCount", utxoTotalCount);

    fee = await txBTC.txCalculateFeeUTXO(fee, utxoTotalCount, utxoOutputNum)
    // fee *= (utxoTotalCount*180) + (utxoOutputNum*34) + 10;
    let feeLimitInLowestDenomination = await txBTC.convertDenomination(FEELIMIT);
    if (fee >= feeLimitInLowestDenomination) return resolve({"message": "fee is too high"});

    let requiredBalance = parseFloat(amountInLowestDenomination); // + parseFloat(fee);

    let balance = 0;

    for(var b=0; b<selectedUTXO.length; b++){
      balance += selectedUTXO[b]["satoshis"];
    }

    let change = balance - requiredBalance;

    console.log("fee", fee)
    console.log("requiredBalance", requiredBalance)
    console.log("change", change)

    console.log(network, senderAddMany, receiverAddMany, fee, utxo, change)

    if(amountInLowestDenomination >= requiredBalance){
      axios.post(signatureAPI + '/send/batch', {
        network: network,
        totalAmount: amountInLowestDenomination,
        senderAddMany: senderAddMany,
        receiverAddMany: receiverAddMany,
        fee: fee,
        utxo: utxo,
        change: change,
        useCase: "Withdraw"
      })
      .then(async function (response) {
        signedTx = response["data"]

        console.log("signedTx", signedTx)

        tx = await txBTC.txBroadcast(network, signedTx)
        console.log("tx", tx)

        txBTC.txActionLog(network, user, "send batch", amountInPrimaryDenomination, "")

        if(tx[0] == "success"){
          resolve({"signedValueTx": signedTx, "txHash": tx[1]["tx"]["hash"]});
        }else{
          resolve({"signedValueTx": signedTx, "txHash": tx[1]});
        }
        // resolve({"signedValueTx": signedTx, "txHash": tx});

      })
      .catch(function (error) {
        console.log(error);
      });
    }else{
      //return res.json({"message": "Sender address have insufficient balance"});
      resolve({"message": "Sender address have insufficient balance"});
    }
  });
  return promise;
}


exports.sendBTC = sendBTC;
exports.sendStaggeredBTC = sendStaggeredBTC;
exports.sentFromHoldingArea = sentFromHoldingArea;
exports.sendBatchedDepositBTC = sendBatchedDepositBTC;
exports.sendBatchedWithdrawBTC = sendBatchedWithdrawBTC;
