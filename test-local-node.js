const Client = require('bitcoin-core');
const client = new Client({
  network: 'testnet3',
  username: 'alice',
  password: 'alice',
  port: 18443
});

client.getBlockchainInfo().then((help) => console.log(help));
