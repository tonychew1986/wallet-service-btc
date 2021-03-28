// import * as bip32 from 'bip32';
// import * as bip39 from 'bip39';

const bip32 = require('bip32');
const bip39 = require('bip39');
const bitcoin = require('bitcoinjs-lib');
var bip32utils = require('bip32-utils')

const axios = require('axios');

// function getAddress(node, network){
//   return bitcoin.payments.p2pkh({ pubkey: node.publicKey, network }).address;
// }
// const xpriv = 'tprv8ZgxMBicQKsPd7Uf69XL1XwhmjHopUGep8GuEiJDZmbQz6o58LninorQAfcKZWARbtRtfnLcJ5MQ2AtHcQJCCRUcMRvmDUjyEmNUWwx8UbK';

var xpubBTC = "xpub661MyMwAqRbcFBVFhNfMVZWqLysss2sLJgBuxiZv4G6GkiXhcoDeKjyvGEXG9Y1M6XVXsBUwMZ4biK7WtxV9CkECs4FA2DPUUjRK7zcdpHE";

// const node = bip32.fromBase58(xpriv, bitcoin.networks.testnet);
// let hdNode = bitcoin.HDNode.fromBase58(xpubBTC);
// var generatedAddressBTC = (hdNodeBTC.derive(0).derive(0).getAddress());
//
// console.log(generatedAddressBTC);

// var mnemonic = bip39.generateMnemonic();
// var mnemonic = "champion throw note industry cabin news control absent glow odor town prevent" // dont use
var mnemonic = "plastic loyal review habit heavy remove foil tide wage lobster budget wine glimpse canal club"
const seed = bip39.mnemonicToSeed(mnemonic)
const root = bip32.fromSeed(seed);
const wif = root.toWIF();
const alice = bitcoin.ECPair.fromWIF(
  wif,
);

const xprivkey = root.toBase58();
const xpubkey = root.neutered().toBase58();
console.log("mnemonic:", mnemonic)
console.log("seed:", seed)
console.log("root:", root)
console.log("wif:", wif)
console.log("alice:", alice)
console.log("BIP32 Root Key xprivkey:", xprivkey)
console.log("xpubkey:", xpubkey)
// const restored = bip32.fromBase58(strng);
// console.log("xxx:", bitcoin.payments.p2pkh({ pubkey: root.publicKey }).address)
console.log("xxx:", bitcoin.payments.p2pkh({ pubkey: root.publicKey }).address)

const child3 = root.derivePath("m/44'/0'/0'/0/0")
// const child3 = root.derivePath("m/44'/0'/0'/0/0") //mainnet

// const child3Address = bitcoin.payments.p2pkh({ pubkey: child3.publicKey }).address
const child3Address = bitcoin.payments.p2pkh({ pubkey: child3.publicKey }).address

child3Testnet = root.derivePath("m/44'/1'/0'/0/0")
child3AddressTestnet = bitcoin.payments.p2pkh({ pubkey: child3Testnet.publicKey, network: bitcoin.networks.testnet }).address

console.log("child3", child3);
console.log("child3Address", child3Address);
console.log("child3Testnet", child3Testnet);
console.log("child3AddressTestnet", child3AddressTestnet);

// let url = "https://testnet.blockexplorer.com/api/addr/" + child3Testnet + "/utxo?noCache=1";
//
// axios.get(url)
// .then(function (response) {
//   utxos = response["data"];
//
//   // console.log(utxos)
//
//   resolve(utxos);
// })
// .catch(function (error) {
//   console.log(error);
// });

const psbt = new bitcoin.Psbt({ network: bitcoin.networks.testnet })
// For Mainnet: const psbt = new bitcoin.Psbt({ network: bitcoin.networks.bitcoin })

psbt.addInput({
  // if hash is string, txid, if hash is Buffer, is reversed compared to txid
  // output point on electrum for hash and index
  hash: '6c78ffa6471d10c7f49ec8a3a99bf2fa6f320f8980030caadb34b3546ca5444e',
  index: 24,

  // non-segwit inputs now require passing the whole previous tx as Buffer
  nonWitnessUtxo: Buffer.from(
    '0200000001f9f34e95b9d5c8abcd20fc5bd4a825d1517be62f0f775e5f36da944d9' +
      '452e550000000006b483045022100c86e9a111afc90f64b4904bd609e9eaed80d48' +
      'ca17c162b1aca0a788ac3526f002207bb79b60d4fc6526329bf18a77135dc566020' +
      '9e761da46e1c2f1152ec013215801210211755115eabf846720f5cb18f248666fec' +
      '631e5e1e66009ce3710ceea5b1ad13ffffffff01' +
      // value in satoshis (Int64LE) = 0x015f90 = 90000
      '905f010000000000' +
      // scriptPubkey length
      '19' +
      // scriptPubkey
      '76a9148bbc95d2709c71607c60ee3f097c1217482f518d88ac' +
      // locktime
      '00000000',
    'hex',
  )
});

psbt.addOutput({
  address: 'mxwzo8HoTf9pz9daguCCscyUkWvSmmpNzS',
  value: 80000,
});
psbt.signInput(0, alice);
psbt.validateSignaturesOfInput(0);
psbt.finalizeAllInputs();

// txb.setVersion(1)
// txb.addInput('6c78ffa6471d10c7f49ec8a3a99bf2fa6f320f8980030caadb34b3546ca5444e', 17305837)
// txb.addInput('342ed373cf05e95122312ea1e71f48983c42012fd87058eeed82e2fa40b51956', 150000)
// txb.addInput('301ebc1d98c831692387bc7ba2cf89fdd582a7fcfb7b6baf3f537994b934b046', 10000)
// txb.addInput('1ad96146ef18e29068b7a428a04e0cef01f6d26505ea4da6d900da1b877dab2b', 2424293)
//
// txb.addOutput('mxwzo8HoTf9pz9daguCCscyUkWvSmmpNzS', 19890000)
// (in)15000 - (out)12000 = (fee)3000, this is the miner fee

// console.log("txb", txb);
//
// txb.sign({
//   prevOutScriptType: 'p2pkh',
//   vin: 0,
//   keyPair: alice
// })
//
// console.log("txb", txb);

// function buildTransaction(inputs, outputs){
//     var txBuilder = new bitcoin.TransactionBuilder(bitcoin.networks.bitcoin)
//     for(var i = 0; i < inputs.length; i++){
//         var input = inputs[i]
//         txBuilder.addInput(input.txid, input.vout, 0xffffffff, Buffer.from(input.scriptPubKey, 'hex'))
//     }
//
//     for(var i = 0; i < outputs.length; i++){
//         var output = outputs[i]
//         txBuilder.addOutput(output.address, output.amount)
//     }
//     var tx = txBuilder.buildIncomplete().toHex()
//
//     return tx
// }


// const axios = require('axios');
//
// addr = "msjFmUD2R4PMvjW5o8s1ZsJVMwcQuHAejt"
// receiver = "mxwzo8HoTf9pz9daguCCscyUkWvSmmpNzS"
// let utxoURL = "https://testnet.blockexplorer.com/api/addr/" + addr + "/utxo?noCache=1"
//
// axios.get(utxoURL)
// .then(function (response) {
//   utxos = response["data"]
//   utxoArray = [];
//
//   for(var i = 0; i < utxos.length; i++){
//     utxoArray.push(utxos[i]["amount"])
//   }
//
//   console.log(utxoArray);
//   //
//   // tx = await txBTC.txBroadcast(network, signedTx)
//   //
//   // console.log("signedTx", signedTx)
//   // console.log("tx", tx)
//   // return res.json({"signedValueTx": signedTx, "txHash": tx});
// })
// .catch(function (error) {
//   console.log(error);
// });
//
//
// let url = "https://testnet.blockexplorer.com/api/addr/" + addr + "/balance";
// axios.get(url)
// .then(function (response) {
//   acctBal = response["data"];
//
//   console.log(acctBal)
//
//   // return res.send(acctBal);
// })
// .catch(function (error) {
//   console.log(error);
// });
