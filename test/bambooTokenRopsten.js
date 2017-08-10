var BambooToken = artifacts.require('./BambooToken.sol')
var SampleRecipientSuccess = artifacts.require('./SampleRecipientSuccess.sol')
var SampleRecipientThrow = artifacts.require('./SampleRecipientThrow.sol')

let bambooToken;
let totalSupply;
let tokenEthBalance;
      // msg.value / eth_balance > _amount / token_balance_after) throw;
let reserve;
let buyPrice;

contract('BambooToken', function (accounts) {
// Setup/funding

  it("Should be found on ropsten", function() {
    return BambooToken.at('0xa54f364dd6189481c608c5d405d15cf0b705abe7').then(function (_bambooToken) {
      bambooToken = _bambooToken;
      assert.ok(bambooToken.address.indexOf('0x') != -1);
      return bambooToken.totalSupply.call();
    }).then(function (_totalSupply) {
      totalSupply = _totalSupply;
      return bambooToken.balanceOf.call(bambooToken.address);
    }).then(function(_reserve) {
      reserve = _reserve;
      debugger;
      assert.ok(reserve.toNumber() > 0);
      debugger;
      // return bambooToken.getBalance.call(bambooToken.address);
    // }).then(function(_tokenEthBalance){
    //   tokenEthBalance = _tokenEthBalance;
    //   debugger;
    //   return buyPrice = function(amount) {
    //     tokenEthBalance/(reserve - amount) 
    //   }; 
    }).catch((err) => { throw new Error(err) });
  });

  it.skip("Should deploy on testrpc", function() {
    BambooToken.new(10000, 'Simon Bucks', 1, 'SBX', {from: accounts[0], value: web3.toWei(0.1, "ether")}).then(function (_bambooToken) {
      bambooToken = _bambooToken;
      assert.ok(bambooToken.address.indexOf('0x') > -1);
      return bambooToken.totalSupply.call();
    }).catch((err) => { 
      console.log("there was an error");
      throw new Error(err) });
  });

  // Price in ETH/BAM
  // 1.7/(75557863725914323419136-1000)
  // 2.24993127e-23
  it('buy: should credit me some balance when I call buy', function () {
    console.log("which accounts do we have? ", accounts);
    return bambooToken.buy(100, {from: accounts[0], value:web3.toWei(0.01, 'ether')}).then(function (tx) {
      return bambooToken.balanceOf.call(accounts[0])
    }).then(function (result) {
      assert.strictEqual(result.toNumber(), 100)
    }).catch((err) => { throw new Error(err) })
  })

  it('sell: should reduce my balance when I call sell', function () {
    return bambooToken.sell(1, {from: accounts[0]}).then(function (tx) {
      return bambooToken.balanceOf.call(accounts[0])
      debugger;
    }).then(function (result) {
      assert.strictEqual(result.toNumber(), 99)
    }).catch((err) => { throw new Error(err) })
  })
  
// TRANSERS
// normal transfers without approvals.

    // this is not *good* enough as the contract could still throw an error otherwise.
    // ideally one should check balances before and after, but estimateGas currently always throws an error.
    // it's not giving estimate on gas used in the event of an error.
  it.skip('transfers: ether transfer should be reversed.', function () {
    return web3.eth.sendTransaction({from: accounts[0], to: bambooToken.address, value: web3.toWei('0.01', 'Ether')}).then(function (result) {
      assert(true)
    }).catch((err) => { throw new Error(err) })
  })

  it('transfers: should transfer 10000 to accounts[1] with accounts[0] having 10000', function () {
      return bambooToken.transfer(accounts[1], 10000, {from: accounts[0]}).then(function (result) {
      return bambooToken.balanceOf.call(accounts[1])
    }).then(function (result) {
      assert.strictEqual(result.toNumber(), 10000)
    }).catch((err) => { throw new Error(err) })
  })

  it('transfers: should fail when trying to transfer 10001 to accounts[1] with accounts[0] having 10000', function () {
      return bambooToken.transfer.call(accounts[1], 10001, {from: accounts[0]}).then(function (result) {
      assert.isFalse(result)
    }).catch((err) => { throw new Error(err) })
  })

  it('transfers: should handle zero-transfers normally', function () {
      return bambooToken.transfer.call(accounts[1], 0, {from: accounts[0]}).then(function (result) {
      assert.isTrue(result)
    }).catch((err) => { throw new Error(err) })
  })

    // NOTE: testing uint256 wrapping is impossible in this standard token since you can't supply > 2^256 -1.

    // todo: transfer max amounts.

// APPROVALS

  it('approvals: msg.sender should approve 100 to accounts[1]', function () {
    return bambooToken.approve(accounts[1], 100, {from: accounts[0]}).then(function (result) {
      return bambooToken.allowance.call(accounts[0], accounts[1])
    }).then(function (result) {
      assert.strictEqual(result.toNumber(), 100)
    }).catch((err) => { throw new Error(err) })
  });

  it.skip('approvals: msg.sender should approve 100 to SampleRecipient and then NOTIFY SampleRecipient. It should succeed.', function () {
    var sampleCtr = null
    return SampleRecipientSuccess.new({from: accounts[0]}).then(function (result) {
      sampleCtr = result
      return bambooToken.approveAndCall(sampleCtr.address, 100, '0x42', {from: accounts[0]})
    }).then(function (result) {
      return bambooToken.allowance.call(accounts[0], sampleCtr.address)
    }).then(function (result) {
      assert.strictEqual(result.toNumber(), 100)
      return sampleCtr.value.call()
    }).then(function (result) {
      assert.strictEqual(result.toNumber(), 100)
    }).catch((err) => { throw new Error(err) })
  })

  it('approvals: msg.sender should approve 100 to SampleRecipient and then NOTIFY SampleRecipient and throw.', function () {
    var sampleCtr = null
    return bambooToken.approve(accounts[1], 100, {from: accounts[0]}).then(function () {
      return SampleRecipientThrow.new({from: accounts[0]})
    }).then(function (result) {
      sampleCtr = result
      return bambooToken.approveAndCall.call(sampleCtr.address, 100, '0x42', {from: accounts[0]})
    }).catch(function (result) {
            // It will catch OOG.
      assert(true)
    })
  })

    // bit overkill. But is for testing a bug
  it('approvals: msg.sender approves accounts[1] of 100 & withdraws 20 once.', function () {
    return bambooToken.balanceOf.call(accounts[0]).then(function (result) {
      assert.strictEqual(result.toNumber(), 10000)
      return bambooToken.approve(accounts[1], 100, {from: accounts[0]})
    }).then(function (result) {
      return bambooToken.balanceOf.call(accounts[2])
    }).then(function (result) {
      assert.strictEqual(result.toNumber(), 0)
      return bambooToken.allowance.call(accounts[0], accounts[1])
    }).then(function (result) {
      assert.strictEqual(result.toNumber(), 100)
      return bambooToken.transferFrom.call(accounts[0], accounts[2], 20, {from: accounts[1]})
    }).then(function (result) {
      return bambooToken.transferFrom(accounts[0], accounts[2], 20, {from: accounts[1]})
    }).then(function (result) {
      return bambooToken.allowance.call(accounts[0], accounts[1])
    }).then(function (result) {
      assert.strictEqual(result.toNumber(), 80)
      return bambooToken.balanceOf.call(accounts[2])
    }).then(function (result) {
      assert.strictEqual(result.toNumber(), 20)
      return bambooToken.balanceOf.call(accounts[0])
    }).then(function (result) {
      assert.strictEqual(result.toNumber(), 9980)
    }).catch((err) => { throw new Error(err) })
  })

    // should approve 100 of msg.sender & withdraw 50, twice. (should succeed)
  it('approvals: msg.sender approves accounts[1] of 100 & withdraws 20 twice.', function () {
    return bambooToken.approve(accounts[1], 100, {from: accounts[0]}).then(function (result) {
      return bambooToken.allowance.call(accounts[0], accounts[1])
    }).then(function (result) {
      assert.strictEqual(result.toNumber(), 100)
      return bambooToken.transferFrom(accounts[0], accounts[2], 20, {from: accounts[1]})
    }).then(function (result) {
      return bambooToken.allowance.call(accounts[0], accounts[1])
    }).then(function (result) {
      assert.strictEqual(result.toNumber(), 80)
      return bambooToken.balanceOf.call(accounts[2])
    }).then(function (result) {
      assert.strictEqual(result.toNumber(), 20)
      return bambooToken.balanceOf.call(accounts[0])
    }).then(function (result) {
      assert.strictEqual(result.toNumber(), 9980)
            // FIRST tx done.
            // onto next.
      return bambooToken.transferFrom(accounts[0], accounts[2], 20, {from: accounts[1]})
    }).then(function (result) {
      return bambooToken.allowance.call(accounts[0], accounts[1])
    }).then(function (result) {
      assert.strictEqual(result.toNumber(), 60)
      return bambooToken.balanceOf.call(accounts[2])
    }).then(function (result) {
      assert.strictEqual(result.toNumber(), 40)
      return bambooToken.balanceOf.call(accounts[0])
    }).then(function (result) {
      assert.strictEqual(result.toNumber(), 9960)
    }).catch((err) => { throw new Error(err) })
  })

    // should approve 100 of msg.sender & withdraw 50 & 60 (should fail).
  it('approvals: msg.sender approves accounts[1] of 100 & withdraws 50 & 60 (2nd tx should fail)', function () {
    return bambooToken.approve(accounts[1], 100, {from: accounts[0]}).then(function (result) {
      return bambooToken.approve(accounts[1], 100, {from: accounts[0]})
    }).then(function (result) {
      return bambooToken.allowance.call(accounts[0], accounts[1])
    }).then(function (result) {
      assert.strictEqual(result.toNumber(), 100)
      return bambooToken.transferFrom(accounts[0], accounts[2], 50, {from: accounts[1]})
    }).then(function (result) {
      return bambooToken.allowance.call(accounts[0], accounts[1])
    }).then(function (result) {
      assert.strictEqual(result.toNumber(), 50)
      return bambooToken.balanceOf.call(accounts[2])
    }).then(function (result) {
      assert.strictEqual(result.toNumber(), 50)
      return bambooToken.balanceOf.call(accounts[0])
    }).then(function (result) {
      assert.strictEqual(result.toNumber(), 9950)
            // FIRST tx done.
            // onto next.
      return bambooToken.transferFrom.call(accounts[0], accounts[2], 60, {from: accounts[1]})
    }).then(function (result) {
      assert.isFalse(result)
    }).catch((err) => { throw new Error(err) })
  })

  it('approvals: attempt withdrawal from acconut with no allowance (should fail)', function () {
    return bambooToken.transferFrom.call(accounts[0], accounts[2], 60, {from: accounts[1]}).then(function (result) {
      assert.isFalse(result)
    }).catch((err) => { throw new Error(err) })
  })

  it('approvals: allow accounts[1] 100 to withdraw from accounts[0]. Withdraw 60 and then approve 0 & attempt transfer.', function () {
    return bambooToken.approve(accounts[1], 100, {from: accounts[0]}).then(function (result) {
      return bambooToken.transferFrom(accounts[0], accounts[2], 60, {from: accounts[1]})
    }).then(function (result) {
      return bambooToken.approve(accounts[1], 0, {from: accounts[0]})
    }).then(function (result) {
      return bambooToken.transferFrom.call(accounts[0], accounts[2], 10, {from: accounts[1]})
    }).then(function (result) {
      assert.isFalse(result)
    }).catch((err) => { throw new Error(err) })
  })

  it('approvals: approve max (2^256 - 1)', function () {
    return bambooToken.approve(accounts[1], '115792089237316195423570985008687907853269984665640564039457584007913129639935', {from: accounts[0]}).then(function (result) {
      return bambooToken.allowance(accounts[0], accounts[1])
    }).then(function (result) {
      var match = result.equals('1.15792089237316195423570985008687907853269984665640564039457584007913129639935e+77')
      assert.isTrue(match)
    }).catch((err) => { throw new Error(err) })
  })
})
