
const bip32 = require('bip32');
const bip39 = require('bip39');
const bitcoin = require('bitcoinjs-lib');
var bip32utils = require('bip32-utils')

const axios = require('axios');

// const key = bitcoin.ECPair.fromWIF(
//   "L1Kzcyy88LyckShYdvoLFg1FYpB5ce1JmTYtieHrhkN65GhVoq73",
//   bitcoin.networks.testnet
// );
// var key = bitcoin.ECKey.fromWIF("L1Kzcyy88LyckShYdvoLFg1FYpB5ce1JmTYtieHrhkN65GhVoq73");

// var mnemonic = "plastic loyal review habit heavy remove foil tide wage lobster budget wine glimpse canal club"
// const seed = bip39.mnemonicToSeed(mnemonic)
// const root = bip32.fromSeed(seed, bitcoin.networks.testnet);
// path = root.derivePath("m/44'/1'/0'/0/11")
// const wif = path.toWIF({ network: bitcoin.networks.testnet });
//
// const key = bitcoin.ECPair.fromWIF(
//   wif,
//   bitcoin.networks.testnet
// );
//
// console.log("key", key)
//
// var outputAmount = 4970329 - 3000;
//
// var tx = new bitcoin.TransactionBuilder(bitcoin.networks.testnet);
//
// tx.addInput("3772a6d577e0574ac7c94526b6fbc4a191221342ccee384d20c67b1787509dc9", 0);
// tx.addInput("15a2bb474911b834f356bfc756f8e847cdfbc597117589926c34a8d7cb585be6", 0);
//
// tx.addOutput("miL26VEQwZ8KaxK2YqQiWwspUSZqgTQp4P", outputAmount);
//
// tx.sign(0, key);
// tx.sign(1, key);
//
// console.log(tx.build().toHex())
//
// axios.post('https://api.blockcypher.com/v1/btc/test3/txs/push', {
//   "tx": tx.build().toHex()
// })
// .then(function (response) {
//
//   console.log(response["data"]);
// })
// .catch(function (error) {
//   console.log(error);
// });

let getBalance = async function(network, addr) {
  var url = "https://testnet.blockexplorer.com/api/addr/" + addr + "/balance";
  if(network == "mainnet"){
    url = "https://blockexplorer.com/api/addr/" + addr + "/balance";
  }

  var promise = new Promise(function(resolve, reject){
    axios.get(url)
    .then(function (response) {

      console.log(response["data"]);

      resolve(response["data"]);
    })
    .catch(function (error) {
      console.log(error);
    });
  });
  return promise;
}

let getFee = async function() {
  var promise = new Promise(function(resolve, reject){
    let url = "https://bitcoinfees.earn.com/api/v1/fees/recommended";

    axios.get(url)
    .then(function (response) {

      console.log(response["data"]);
      // { fastestFee: 32, halfHourFee: 32, hourFee: 22 }

      resolve(response["data"]["hourFee"]);
    })
    .catch(function (error) {
      console.log(error);
    });
  });
  return promise;
}

let getUTXO = async function(network, addr) {
  var url = "https://testnet.blockexplorer.com/api/addr/" + addr + "/utxo?noCache=1";
  if(network == "mainnet"){
    url = "https://blockexplorer.com/api/addr/" + addr + "/utxo?noCache=1";
  }

  var promise = new Promise(function(resolve, reject){
    axios.get(url)
    .then(function (response) {

      console.log(response["data"]);

      resolve(response["data"]);
    })
    .catch(function (error) {
      console.log(error);
    });
  });
  return promise;
}

let txBroadcast = async function(network, tx) {
  var url = 'https://api.blockcypher.com/v1/btc/test3/txs/push';
  if(network == "mainnet"){
    url = "https://blockchain.info/pushtx";
  }

  var promise = new Promise(function(resolve, reject){
    axios.post(url, {
      "tx": tx
    })
    .then(function (response) {

      console.log(response["data"]);
    })
    .catch(function (error) {
      console.log(error);
    });
  });
  return promise;
}

let txSign = async function(network, sender, receiver, amount, changeBal, fee, utxos) {
  var networkType = bitcoin.networks.testnet;
  if(network == "mainnet"){
    networkType = bitcoin.networks.mainnet;
  }

  var tx = new bitcoin.TransactionBuilder(networkType);

  // var totalFundInAddress = 0;
  var utxoCount = 0;
  var utxoSignArray = [];

  let requiredBal;

  let txStatus = false;

  let circuitBreakerNum = 20;
  let circuitBreakerCount = 0;

  var promise = new Promise(function(resolve, reject){
    var mnemonic = "plastic loyal review habit heavy remove foil tide wage lobster budget wine glimpse canal club"
    const seed = bip39.mnemonicToSeed(mnemonic)
    const root = bip32.fromSeed(seed, networkType);

    for(var i = 0; i < 10000; i++){
      path = root.derivePath("m/44'/1'/0'/0/"+i)
      param = { pubkey: path.publicKey, network: networkType }

      addr = bitcoin.payments.p2pkh(param).address
      console.log("addr", addr)

      // use transaction count as circuit breaker
      if(sender == addr && circuitBreakerCount <= circuitBreakerNum){

        console.log("-----------")
        const wif = path.toWIF({ network: networkType });

        const key = bitcoin.ECPair.fromWIF(
          wif,
          networkType
        );

        for(var r = 0; r < utxos.length; r++){
          var txid = utxos[r]["txid"];
          var vout = utxos[r]["vout"];
          // totalFundInAddress += utxos[r]["satoshis"];

          tx.addInput(txid, vout);
          utxoSignArray.push([utxoCount, key]);

          utxoCount++;
        }

        break;
      }else{
        if(circuitBreakerCount == circuitBreakerNum){
          break;
        }else{
          circuitBreakerCount++;
        }
      }
    }

    tx.addOutput(receiver, amount);

    if(changeBal > 0){
      tx.addOutput(sender, changeBal);

      for(var q = 0; q < utxoSignArray.length; q++){
        tx.sign(utxoSignArray[q][0], utxoSignArray[q][1]);
      }

      txHex = tx.build().toHex();
      console.log(txHex);

      resolve(txHex);
    }
  });
  return promise;
}

// let utxoCombineInput = async function(network, tx) {
//   var promise = new Promise(function(resolve, reject){
//
//     resolve("")
//   });
//   return promise;
// }

let sendBTC = async function(network, sender, receiver, amount, sendAllFlag) {
  var networkType = bitcoin.networks.testnet;
  if(network == "mainnet"){
    networkType = bitcoin.networks.mainnet;
  }
  sendAllFlag = typeof sendAllFlag  !== 'undefined' ? sendAllFlag : false;
  console.log(sendAllFlag);

  let addrBal = await getBalance(network, sender);
  let fee = await getFee();
  let utxos = await getUTXO(network, sender);


  fee *= (utxos.length*180) + (2*34) + 10;

  let requiredBal = amount + fee;
  let changeBal = addrBal - requiredBal;

  let txHex;
  if(addrBal > requiredBal){
    txHex = await txSign(network, sender, receiver, amount, changeBal, fee, utxos);

    console.log(txHex);

    txBroadcast(network, txHex);
  }else{
    console.log("not enough balance")
  }
}

sendBTC("testnet", "miL26VEQwZ8KaxK2YqQiWwspUSZqgTQp4P", "mi4pAbA4ow3hVskWQXJ2FmEJ23BNc8pXTk", 123456, false)
