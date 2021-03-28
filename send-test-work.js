
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

var mnemonic = "plastic loyal review habit heavy remove foil tide wage lobster budget wine glimpse canal club"
const seed = bip39.mnemonicToSeed(mnemonic)
const root = bip32.fromSeed(seed, bitcoin.networks.testnet);
path = root.derivePath("m/44'/1'/0'/0/11")
const wif = path.toWIF({ network: bitcoin.networks.testnet });

const key = bitcoin.ECPair.fromWIF(
  wif,
  bitcoin.networks.testnet
);

console.log("key", key)

var outputAmount = 4970329 - 3000;

var tx = new bitcoin.TransactionBuilder(bitcoin.networks.testnet);

tx.addInput("3772a6d577e0574ac7c94526b6fbc4a191221342ccee384d20c67b1787509dc9", 0);
tx.addInput("15a2bb474911b834f356bfc756f8e847cdfbc597117589926c34a8d7cb585be6", 0);

tx.addOutput("miL26VEQwZ8KaxK2YqQiWwspUSZqgTQp4P", outputAmount);

tx.sign(0, key);
tx.sign(1, key);

console.log(tx.build().toHex())

axios.post('https://api.blockcypher.com/v1/btc/test3/txs/push', {
  "tx": tx.build().toHex()
})
.then(function (response) {

  console.log(response["data"]);
})
.catch(function (error) {
  console.log(error);
});

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


let sendAllFunds = async function(network, warmWallet) {
  var networkType = bitcoin.networks.testnet;
  if(network == "mainnet"){
    networkType = bitcoin.networks.mainnet;
  }

  tx = new bitcoin.TransactionBuilder(networkType);

  var totalFundInSeed = 0;
  var nullCount = 0;
  var utxoCount = 0;
  var utxoSignArray = [];

  for(var i = 3; i < 10000; i++){
    path = root.derivePath("m/44'/1'/0'/0/"+i)
    param = { pubkey: path.publicKey, network: networkType }

    addr = bitcoin.payments.p2pkh(param).address
    console.log("addr", addr)

    // need to add async await here
    let addrBal = await getBalance(network, addr)

    console.log("-----------")
    if(addrBal > 0 && nullCount < 20){
      const wif = path.toWIF({ network: networkType });

      const key = bitcoin.ECPair.fromWIF(
        wif,
        bitcoin.networks.testnet
      );

      // add all utxo of address

      let utxos = await getUTXO(network, addr);

      for(var r = 0; r < utxos.length; r++){
        var txid = utxos[r]["txid"];
        var vout = utxos[r]["vout"];
        totalFundInSeed += utxos[r]["satoshis"];

        tx.addInput(txid, vout);
        utxoSignArray.push([utxoCount, key]);

        utxoCount++;
      }


      nullCount = 0
    }else{
      nullCount++;
    }
    console.log("nullCount", nullCount)
    console.log("nonce", i)

    if(nullCount > 20){
      break
    }
  }

  let fee = await getFee();
  let totalFundInSeedAfterFee = totalFundInSeed - fee;

  tx.addOutput(warmWallet, totalFundInSeedAfterFee);

  console.log("totalFundInSeed", totalFundInSeed)
  console.log("totalFundInSeedAfterFee", totalFundInSeedAfterFee)

  if(totalFundInSeedAfterFee > 0){
    for(var q = 0; q < utxoSignArray.length; q++){
      tx.sign(utxoSignArray[q][0], utxoSignArray[q][1]);
    }

    txHex = tx.build().toHex();
    console.log(txHex);

    txBroadcast(network, txHex);
  }
}

// sendAllFunds("testnet", "n1HynePDTd65AxEiCemUevwcahkYsa2CZ1")
