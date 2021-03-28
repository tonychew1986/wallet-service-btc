const request = require('supertest');
const app = require('../index');
const tx = require('../core/transaction');

var expect  = require('chai').expect;

describe('Basic endpoint to test if service is active', function () {
    it('GET /test', function (done) {
        request(app)
          .get('/test')
          .expect(200)
          .end((err, res) => {
             if (err) {
               return done(err);
             }
             expect(res.text).to.be.equal('test');
             return done();
          });
    });
});

describe('Check database connectivity', function () {
    it('GET /nonce/check', function (done) {
        request(app)
          .get('/nonce/check')
          .expect(200)
          .end((err, res) => {
             if (err) {
               return done(err);
             }
             var resBody = res["body"];
             var nonce = resBody["nonce"];
             
             expect(nonce).to.satisfy(Number.isInteger);
             return done();
          });
    });
});

describe('Check btc fee limit', function () {
  it('POST /send ', function (done) {
      request(app)
        .post('/send')
        .send({
          network: 'testnet',
          amount_in_btc: "0.00111",
          sender_add: "myojAkBMnpiL1WKWM6mkyZuhKZRgPu7L5d",
          receiver_add: "mx5DRB8Gsb7ypMU8cXvYxaadJgN6rjVs5x",
        })
        .expect(200)
        .end((err, res) => {
           if (err) {
             return done(err);
           }
           var resBody = res["body"];
           var signedValueTx = resBody["signedValueTx"];
           var txHash = resBody["txHash"];
           console.log("signedValueTx is", signedValueTx);
           console.log("txHash is", txHash);
           return done();
        });
  });

  it('POST /stagger/send deposit ', function (done) {
    request(app)
      .post('/stagger/send')
      .send({
        network: 'testnet',
        amount_in_btc: "0.00111",
        sender_add: "myojAkBMnpiL1WKWM6mkyZuhKZRgPu7L5d",
        receiver_add: "mx5DRB8Gsb7ypMU8cXvYxaadJgN6rjVs5x",
        use_case: "hot wallet to warm wallet",
      })
      .expect(200)
      .end((err, res) => {
         if (err) {
           return done(err);
         }
         var resBody = res["body"];
         var signedValueTx = resBody["signedValueTx"];
         var txHash = resBody["txHash"];
         console.log("signedValueTx is", signedValueTx);
         console.log("txHash is", txHash);
         expect(signedValueTx).to.be.equal("");
         expect(txHash).to.be.equal("");
         return done();
      });
});

it('POST /stagger/send withdraw ', function (done) {
  request(app)
    .post('/stagger/send')
    .send({
      network: 'testnet',
      amount_in_btc: "0.00112",
      sender_add: "mx5DRB8Gsb7ypMU8cXvYxaadJgN6rjVs5x",
      receiver_add: "myojAkBMnpiL1WKWM6mkyZuhKZRgPu7L5d",
      use_case: "Withdraw",
    })
    .expect(200)
    .end((err, res) => {
       if (err) {
         return done(err);
       }
       var resBody = res["body"];
       var signedValueTx = resBody["signedValueTx"];
       var txHash = resBody["txHash"];
       console.log("signedValueTx is", signedValueTx);
       console.log("txHash is", txHash);
       expect(signedValueTx).to.be.equal("");
       expect(txHash).to.be.equal("");
       return done();
    });
});

it('POST /holding-area/send ', function (done) {
  request(app)
    .post('/holding-area/send')
    .send({
      network: 'testnet',
    })
    .expect(200)
    .end((err, res) => {
       if (err) {
         return done(err);
       }
       var resBody = res["body"];
       console.log("holdingAreaTx is", resBody);
       return done();
    });
});
  
});

describe("Test denomination", function() {
  it("test demonination", async function(){
    let amountPrimary = 0.123;
    let amountLeast = await tx.convertDenomination(amountPrimary);
    amountLeast = Math.floor(amountLeast);

    let checkResult = await tx.checkDenomination(amountPrimary, amountLeast);
    console.log("check result is", checkResult);
    expect(checkResult).to.equal("success");
  });
});