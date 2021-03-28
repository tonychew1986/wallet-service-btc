
const axios = require('axios');
// var SoChain = require('sochain');

require('dotenv').config()

const config = require('config');

var database = require('./db.js');

var dbTableSelect = require('./database-table-selector.js');

var nodeExplorerIP = process.env.NODE_EXPLORER_IP;
var nodeExplorerPort = process.env.NODE_EXPLORER_PORT

global.db = database.setupDB(
  process.env.DB_HOST,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  process.env.DB_DATABASE
);

global.dbAction = database.setupDB(
  process.env.DB_HOST,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  process.env.DB_DATABASE_ACTION
);

global.dbHoldingArea = database.setupDB(
  process.env.DB_HOST,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  process.env.DB_DATABASE_HOLDINGAREA
);

let checkNonce = async function(network) {
  let nonce = await getNonceFromDB(network)
  if(nonce){
    nonce = await updateNonceToDB(network, nonce["nonce"], nonce["id"]);
  }else{
    let nonceInit = await initNonceToDB(network);
    nonce = await updateNonceToDB(network, 0, nonceInit["insertId"]);
  }

  return nonce
}

// getNonceFromDB has to return full result due to usage by other function
let getNonceFromDB = async function(network) {
  let tableName = await dbTableSelect.dbTableSelector(network, "nonce");

   var promise = new Promise(function(resolve, reject){
     let query = "SELECT nonce from `" + tableName + "` LIMIT 1";
     db.query(query, (err, result) => {
       if (err) {
           // return res.status(500).send(err);
       }

       console.log("result", result[0])

       let nonce;
       if(result[0] !== undefined){
         nonce = result[0]
         resolve(nonce);
       }else{
         resolve(false)
       }

     });
   });
   return promise;
}

let updateNonceToDB = async function(network, nonce, id) {
  let tableName = await dbTableSelect.dbTableSelector(network, "nonce");

  var promise = new Promise(function(resolve, reject){
    newNonce = nonce + 1
    let query = "UPDATE `" + tableName + "` SET `nonce` = '" + newNonce + "' WHERE `" + tableName + "`.`id` = '" + id + "'";
    db.query(query, (err, result) => {
        if (err) {
            // return res.status(500).send(err);
        }

        resolve([nonce, newNonce]);
    });
  });
  return promise;
}


let initNonceToDB = async function(network) {
  let tableName = await dbTableSelect.dbTableSelector(network, "nonce");

  var promise = new Promise(function(resolve, reject){
    let query = "INSERT INTO `" + tableName + "` (nonce) VALUES(0);";
    db.query(query, (err, result) => {
        if (err) {
            // return res.status(500).send(err);
        }

        console.log("result", result)

        resolve(result);
    });
  });
  return promise;
}

let resetNonce = async function(network) {
  let tableName = await dbTableSelect.dbTableSelector(network, "nonce");

  let nonce = await getNonceFromDB(network);
  let id = nonce["id"]

  var promise = new Promise(function(resolve, reject){
    newNonce = 0
    let query = "UPDATE `" + tableName + "` SET `nonce` = '" + newNonce + "' WHERE `" + tableName + "`.`id` = '" + id + "'";
    db.query(query, (err, result) => {
        if (err) {
            return res.status(500).send(err);
        }

        console.log("newNonce", newNonce);
        resolve(newNonce);
    });
  });
  return promise;
}

let getTransactionConfirmation = async function(network, txHash) {
  let url = "http://" + nodeExplorerIP + ":" + nodeExplorerPort + "/tx/confirmations/?txHash="+txHash+"&network="+network;

  let promise = await new Promise(function(resolve, reject) {
    axios.get(url)
    .then(function (response) {
      // utxos = response["data"];
      conf = response["data"];

      // console.log(response["data"])

      resolve(conf);
    })
    .catch(function (error) {
      console.log(error);
    });

  })

  return promise
}

let getUTXO = async function(network, addr, spent) {
  //// if use this need to use "vout"
  // let url = "https://testnet.blockexplorer.com/api/addr/" + addr + "/utxo?noCache=1";
  // if(network == "mainnet"){
  //   url = "https://blockexplorer.com/api/addr/" + addr + "/utxo?noCache=1"
  // }

  let url = "http://" + nodeExplorerIP + ":" + nodeExplorerPort + "/utxo/?address="+addr+"&network="+network+"&spent="+spent;


  //// if use this need to use "output_no"
  // let url = "https://sochain.com/api/v2/get_tx_unspent/BTCTEST/" + addr;
  // if(network == "mainnet"){
  //   url = "https://sochain.com/api/v2/get_tx_unspent/BTC/" + addr;
  // }

  //// if use this need to use "output_no"
  // var chain = new SoChain('BTCTEST');
  // if(network == "mainnet"){
  //   chain = new SoChain('BTC');
  // }

  // Get network info
  // chain.info().then(console.log);
  // chain.utxos(addr).then(console.log);


  let promise = await new Promise(function(resolve, reject) {
    axios.get(url)
    .then(function (response) {
      // utxos = response["data"];
      utxos = response["data"]["data"];

      // console.log(response["data"])

      resolve(utxos);
    })
    .catch(function (error) {
      console.log(error);
    });

  })

  return promise
}

let getBalance = async function(network, addr) {
  // var url = "https://api.blockcypher.com/v1/btc/test3/addrs/" + addr + "/balance";
  // if(network == "mainnet"){
  //   url = "https://api.blockcypher.com/v1/btc/main/addrs/" + addr + "/balance";
  // }

  let url = "http://" + nodeExplorerIP + ":" + nodeExplorerPort + "/balance/?address="+addr+"&network="+network;
  console.log("url", url);

  var promise = new Promise(function(resolve, reject){
    axios.get(url)
    .then(function (response) {
      let bal = response["data"]["data"]["balance"];
      console.log("bal", bal);

      resolve(bal);
    })
    .catch(function (error) {
      console.log(error);
    });
  });
  return promise;
}

let getFees = async function(priority) {
  let promise = await new Promise(function(resolve, reject) {
  	let url = "https://bitcoinfees.earn.com/api/v1/fees/recommended";
    axios.get(url)
    .then(function (response) {
      let fees = response["data"]["hourFee"];

      if(priority == "medium"){
        fees = response["data"]["halfHourFee"];
      }else if(priority == "high"){
        fees = response["data"]["fastestFee"];
      }
      // { fastestFee: 32, halfHourFee: 32, hourFee: 22 }

      resolve(fees);
    })
    .catch(function (error) {
      console.log(error);

      //default to this value if bitcoinfees.com is down
      resolve(22);
    });
  })

  return promise;
}

let convertDenomination = async function(amount) {
  let promise = await new Promise(function(resolve, reject) {
    let n = amount * (Math.pow(10, 8))
    n = Number(n).toPrecision();

    resolve(n);
  })

  return promise;
}

let checkDenomination = async function(amountInPrimaryDenomination, amountInLowestDenomination) {
  let promise = await new Promise(function(resolve, reject) {
    let amount = amountInPrimaryDenomination * (Math.pow(10, 8))
    amount = Number(amount).toPrecision();
    let amountAdjusted = Math.floor(amount);
    if(amountAdjusted != amountInLowestDenomination) {
      resolve("fail");
    } else {
      resolve("success");
    }
  })

  return promise;
}

let txActionLog = async function(network, user, action, amount, data) {
  let tableName = await dbTableSelect.dbTableSelector(network, "action");

  var promise = new Promise(function(resolve, reject){
    let query = 'INSERT INTO `' + tableName + '` (created_by, action, amount, data, confirmed) VALUES("' + user +'", "' + action +'", "' + amount +'", "' + data +'", false);'

    dbAction.query(query, (err, result) => {
        if (err) {
            return res.status(500).send(err);
            resolve("fail");
        }

        resolve("success");
    });
  });
  return promise;
}


let txAddHoldingArea = async function(network, user, sender_addr, receiver_addr, amount, token, data, useCase, walletName) {
  let tableName = await dbTableSelect.dbTableSelector(network, "pending");

  var promise = new Promise(function(resolve, reject){
    let query = 'INSERT INTO `' + tableName + '` (created_by, approved_by, sender_addr, receiver_addr, amount, token, data, tx_hash, use_case, processed, flagged, wallet) VALUES("' + user +'", "", "' + sender_addr +'", "' + receiver_addr +'", "' + amount +'", "' + token +'", "' + data +'", "", "' + useCase +'", false, false, "' + walletName + '");'

    dbHoldingArea.query(query, (err, result) => {
        if (err) {
            return res.status(500).send(err);
            resolve("fail");
        }

        resolve("success");
    });
  });
  return promise;
}

let txUpdateHoldingArea = async function(network, user, sender_addr, receiver_addr, amount, token, data, id, txHash) {
  let tableName = await dbTableSelect.dbTableSelector(network, "pending");

  var promise = new Promise(function(resolve, reject){
    // set txhash, approved_by, processed
    // where sender_addr, receiver_addr, amount, token, data
    let query = "UPDATE `" + tableName + "` SET `tx_hash` = '" + txHash + "', `approved_by` = '" + user + "', `processed` = '1' WHERE `id` = '" + id + "'";

    // let query = "UPDATE `" + tableName + "` SET `tx_hash` = '" + txHash + "', `approved_by` = '" + user + "', `processed` = 'true' WHERE `" + tableName + "`.`id` = '" + id + "', `" + tableName + "`.`sender_addr` = '" + sender_addr + "', `" + tableName + "`.`receiver_addr` = '" + receiver_addr + "', `" + tableName + "`.`amount` = '" + amount + "'";

    dbHoldingArea.query(query, (err, result) => {
        if (err) {
            // return result.status(500).send(err);
            console.log("result", result);
            resolve("fail");
        }

        resolve("success");
    });
  });
  return promise;
}


let txCheckHoldingArea = async function(network, processed, pageSize, pageNum, filterProcessed, filterFlagged) {
  let tableName = await dbTableSelect.dbTableSelector(network, "pending");

  let pS = parseInt(pageSize)
  let pN = parseInt(pageNum)

  let startIndex = (pN * pS);
  let endIndex = pS;

  console.log(startIndex, endIndex)


  var promise = new Promise(function(resolve, reject){
    let query = "SELECT * FROM " + tableName + " WHERE `processed` = '" + filterProcessed + "' AND `flagged` = '" + filterFlagged + "' LIMIT " + startIndex +"," + endIndex +";"
    // let query = 'SELECT * FROM `' + tableName + '` LIMIT ' + startIndex +',' + endIndex +';'

    dbHoldingArea.query(query, (err, result) => {
        if (err) {
            return res.status(500).send(err);
            resolve("fail");
        }

        resolve(result);
    });
  });
  return promise;
}

let txCalculateFeeUTXO = async function(fee, inputNum, outputNum) {
  var promise = new Promise(function(resolve, reject){
    let calculatedFee = fee * ((inputNum * 180) + (outputNum * 34) + 10);
    console.log("calculatedFee", calculatedFee);

    resolve(calculatedFee);

  });
  return promise;
}

let txCalculateFeeSegwitUTXO = async function(fee, inputNum, outputNum) {
  var promise = new Promise(function(resolve, reject){
    let calculatedFee = fee * ((inputNum * 148) + (outputNum * 34) + 10);
    resolve(calculatedFee);

  });
  return promise;
}


let utxoSelection = async function(utxo, amount, fee, utxoOutputNum) {
  var promise = new Promise(async function(resolve, reject){
    // 1. Single utxo compare
    let utxoSelectedSingleArray = [];
    let utxoSelectedMultipleArray = [];

    for(var i=0; i<utxo.length; i++){
      // utxoOutputNum unknown since it might require change address
      // thus utxoOutputNum or utxoOutputNum + 1
      let predictedFee = await txCalculateFeeUTXO(fee, 1, utxoOutputNum + 1);
      let utxoSingleCompare = Math.abs(utxo[i]["satoshis"] - amount - predictedFee);

      if(utxoSelectedSingleArray.length > 0){
        if(utxoSingleCompare < utxoSelectedSingleArray[0][0]){
          utxoSelectedSingleArray = [];
          utxoSelectedSingleArray.push([utxoSingleCompare, [utxo[i]] ]);
        }
      }else{
        utxoSelectedSingleArray.push([utxoSingleCompare, [utxo[i]] ]);
      }
    }

    // 2. Multiple utxo compare ( 3 max )
    if(utxo.length > 5){
      for(var a=0; a<utxo.length; a++){
        for(var b=0; b<utxo.length; b++){
          for(var c=0; c<utxo.length; c++){
            if(a == b || a == c || b == c){
              //skip
            }else{
              let utxoA = utxo[a]["satoshis"];
              let utxoB = utxo[b]["satoshis"];
              let utxoC = utxo[c]["satoshis"];

              let utxoCombined = utxoA + utxoB + utxoC;

              let predictedFee = await txCalculateFeeUTXO(fee, 3, utxoOutputNum + 1);
              let utxoMultipleCompare = Math.abs(utxoCombined - amount - predictedFee);

              if(utxoSelectedMultipleArray.length > 0){
                if(utxoMultipleCompare < utxoSelectedMultipleArray[0][0]){
                  utxoSelectedMultipleArray = [];
                  utxoSelectedMultipleArray.push([utxoMultipleCompare, [utxo[a], utxo[b], utxo[c]] ]);
                }
              }else{
                utxoSelectedMultipleArray.push([utxoMultipleCompare, [utxo[a], utxo[b], utxo[c]] ]);
              }
            }
          }
        }
      }
    }else{
      utxoSelectedMultipleArray.push([99999999999999999999, ""]);
    }

    console.log("utxoSelectedSingleArray", utxoSelectedSingleArray);
    console.log("utxoSelectedMultipleArray", utxoSelectedMultipleArray);

    if(utxoSelectedSingleArray[0][0] < utxoSelectedMultipleArray[0][0]){
      if(utxoSelectedSingleArray[0][0] < (amount / 10)){
        console.log("all");
        resolve(utxo);
      }else{
        // use single
        console.log("single");
        resolve(utxoSelectedSingleArray[0][1]);
      }
    }else{
      if(utxoSelectedMultipleArray[0][0] < (amount / 10)){
        console.log("all");
        resolve(utxo);
      }else{
        // use multiple
        console.log("multiple");
        resolve(utxoSelectedMultipleArray[0][1]);
      }
    }


  });
  return promise;
}

// let sweepUTXO = async function() {
//   var promise = new Promise(function(resolve, reject){
//   });
//   return promise;
// }

let txBroadcast = async function(network, tx) {
  var url = 'https://api.blockcypher.com/v1/btc/test3/txs/push';
  if(network == "mainnet"){
    // url = "https://blockchain.info/pushtx";
    url = "https://api.blockcypher.com/v1/btc/main/txs/push";
  }

  var promise = new Promise(function(resolve, reject){
    axios.post(url, {
      "tx": tx
    })
    .then(function (response) {
      let txHash = response["data"];
      console.log(txHash);
      console.log(txHash['tx']['hash']);
      resolve(["success", txHash]);
    })
    .catch(function (error) {
      if (error.response) {
        console.log(error.response.data);
        console.log(error.response.status);
        console.log(error.response.headers);
        resolve(["fail", error.response.data]);
      }
    });
  });
  return promise;
}

let txHoldingAreaToggleFlag = async function(network, id, senderAdd, receiverAdd, flagged) {
  let tableName = await dbTableSelect.dbTableSelector(network, "pending");

  var promise = new Promise(function(resolve, reject){
    // set txhash, approved_by, processed
    // where sender_addr, receiver_addr, amount, token, data
    let query = "UPDATE `" + tableName + "` SET `flagged` = " + flagged + " WHERE `sender_addr` = '" + senderAdd + "' AND `receiver_addr` = '" + receiverAdd + "' AND `id` = '" + id + "'";

    // let query = "UPDATE `" + tableName + "` SET `tx_hash` = '" + txHash + "', `approved_by` = '" + user + "', `processed` = 'true' WHERE `" + tableName + "`.`id` = '" + id + "', `" + tableName + "`.`sender_addr` = '" + sender_addr + "', `" + tableName + "`.`receiver_addr` = '" + receiver_addr + "', `" + tableName + "`.`amount` = '" + amount + "'";

    dbHoldingArea.query(query, (err, result) => {
        if (err) {
            // return result.status(500).send(err);
            console.log("result", result);
            resolve("fail");
        }

        resolve("success");
    });
  });
  return promise;
}


let getAddressSync = async function(network, addr) {
  let url = "http://" + nodeExplorerIP + ":" + nodeExplorerPort + "/address/sync/?address="+addr+"&network="+network;
  console.log("url", url);

  var promise = new Promise(function(resolve, reject){
    axios.get(url)
    .then(function (response) {
      let synced = response["data"];
      console.log("synced", synced);

      resolve(synced);
    })
    .catch(function (error) {
      console.log(error);
    });
  });
  return promise;
}

let getTransactionHashInfo = async function(network, txHash) {
  let url = "http://" + nodeExplorerIP + ":" + nodeExplorerPort + "/tx/hashInfo/?txHash="+txHash+"&network="+network;
  console.log("url", url);

  var promise = new Promise(function(resolve, reject){
    axios.get(url)
    .then(function (response) {
      let result = response["data"];
      console.log("result", result);

      resolve(result);
    })
    .catch(function (error) {
      console.log(error);
    });
  });
  return promise;
}


let addAddress = async function(network, addr) {
  let url = "http://" + nodeExplorerIP + ":" + nodeExplorerPort + "/address";
  console.log("url", url);

  var promise = new Promise(function(resolve, reject){
    axios.post(url, {
      "network": tx,
      "address": address
    })
    .then(function (response) {
      let result = response["data"];
      console.log("result", result);

      resolve("success");
    })
    .catch(function (error) {
      console.log(error);
    });
  });
  return promise;
}

exports.txHoldingAreaToggleFlag = txHoldingAreaToggleFlag;
exports.utxoSelection = utxoSelection;
exports.txCalculateFeeUTXO = txCalculateFeeUTXO;
exports.txCalculateFeeSegwitUTXO = txCalculateFeeSegwitUTXO;
exports.txUpdateHoldingArea = txUpdateHoldingArea;
exports.txCheckHoldingArea = txCheckHoldingArea;
exports.txAddHoldingArea = txAddHoldingArea;
exports.txActionLog = txActionLog;
exports.convertDenomination = convertDenomination;
exports.checkDenomination = checkDenomination;
exports.getFees = getFees;
exports.getBalance = getBalance;
exports.getUTXO = getUTXO;
exports.getTransactionConfirmation = getTransactionConfirmation;
exports.checkNonce = checkNonce;
exports.getNonceFromDB = getNonceFromDB;
exports.updateNonceToDB = updateNonceToDB;
exports.resetNonce = resetNonce;
exports.txBroadcast = txBroadcast;

exports.getTransactionHashInfo = getTransactionHashInfo;
exports.getAddressSync = getAddressSync;
exports.addAddress = addAddress;
