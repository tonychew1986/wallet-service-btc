https://hackernoon.com/a-complete-beginners-guide-to-installing-a-bitcoin-full-node-on-linux-2018-edition-cb8e384479ea

https://medium.com/hackernoon/a-complete-beginners-guide-to-installing-a-bitcoin-full-node-on-linux-2018-edition-cb8e384479ea

https://medium.com/@peterjd42/build-your-own-bitcoin-api-using-node-js-and-bitcoin-core-251e613623db

bitcoin.conf need to be in .bitcoin and not .bitcoin/testnet3

curl -X POST http://alice:alice@127.0.0.1:18332/ -d '{"jsonrpc":"2.0","id":"0","method":"getblockcount"}' -H 'Content-Type: application/json'

curl -X POST http://rockx:rockx@127.0.0.1:18332/ -d '{"jsonrpc":"2.0","id":"0","method":"getblockcount"}' -H 'Content-Type: application/json'

bitcoin node and wallet service might not be located together
thus port need to be open for external service to query it

need to have a "middleware" to handle querying address and utxo

endpoint needed are:
- utxo
- balance
- broadcast

```
server=1
daemon=1
testnet=1
rpcuser=alice
rpcpassword=alice
rpcport=18332
rest=1
rpcallowip=0.0.0.0/0
addressindex=1
txindex=1
```

bitcoin-cli -testnet stop

bitcoind -testnet -daemon
