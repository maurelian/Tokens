var BambooToken = artifacts.require('./BambooToken.sol')
var SampleRecipientSuccess = artifacts.require('./SampleRecipientSuccess.sol')
var SampleRecipientThrow = artifacts.require('./SampleRecipientThrow.sol')

// const bambooToken = BambooToken.at('0xa54f364dd6189481c608c5d405d15cf0b705abe7');
let bambooToken;
let totalSupply;
let tokenEthBalance;
      // msg.value / eth_balance > _amount / token_balance_after) throw;
let reserve;
let buyPrice;

contract('BambooToken', function (accounts) {
// Setup/funding
  
  it("Should deploy", function() {
      return BambooToken.new(10000, 'Simon Bucks', 1, 'SBX', {from: accounts[0], value: web3.toWei(0.1, "ether")}).then(function (_bambooToken) {
      bambooToken = _bambooToken;
      debugger;
      assert.ok(bambooToken.address.indexOf('0x') > -1);
      return bambooToken.totalSupply.call();
    }).catch((err) => { 
      console.log("there was an error");
      throw new Error(err) });
  });


  it('buy: should credit me some balance when I call buy', function () {
    bambooToken.buy(100, {from: accounts[0], value:100000000}).then(function (tx) {
      return bambooToken.balanceOf.call(accounts[0])
    }).then(function (result) {
      assert.strictEqual(result.toNumber(), 100)
    }).catch((err) => { throw new Error(err) })
  })
  
// TRANSERS
// normal transfers without approvals.

    // this is not *good* enough as the contract could still throw an error otherwise.
    // ideally one should check balances before and after, but estimateGas currently always throws an error.
    // it's not giving estimate on gas used in the event of an error.
  it('transfers: ether transfer should be reversed.', function () {
      return web3.eth.sendTransaction({from: accounts[0], to: bambooToken.address, value: web3.toWei('10', 'Ether')})
    }).catch(function (result) {
      assert(true)
    }).catch((err) => { throw new Error(err) })
  })

  it('transfers: should transfer 10000 to accounts[1] with accounts[0] having 10000', function () {
    var ctr
    return BambooToken.new(10000, 'Simon Bucks', 1, 'SBX', {from: accounts[0]}).then(function (result) {
      ctr = result
      return ctr.transfer(accounts[1], 10000, {from: accounts[0]})
    }).then(function (result) {
      return ctr.balanceOf.call(accounts[1])
    }).then(function (result) {
      assert.strictEqual(result.toNumber(), 10000)
    }).catch((err) => { throw new Error(err) })
  })

  it('transfers: should fail when trying to transfer 10001 to accounts[1] with accounts[0] having 10000', function () {
    var ctr
    return BambooToken.new(10000, 'Simon Bucks', 1, 'SBX', {from: accounts[0]}).then(function (result) {
      ctr = result
      return ctr.transfer.call(accounts[1], 10001, {from: accounts[0]})
    }).then(function (result) {
      assert.isFalse(result)
    }).catch((err) => { throw new Error(err) })
  })

  it('transfers: should handle zero-transfers normally', function () {
    var ctr
    return BambooToken.new(10000, 'Simon Bucks', 1, 'SBX', {from: accounts[0]}).then(function (result) {
      ctr = result
      return ctr.transfer.call(accounts[1], 0, {from: accounts[0]})
    }).then(function (result) {
      assert.isTrue(result)
    }).catch((err) => { throw new Error(err) })
  })

    // NOTE: testing uint256 wrapping is impossible in this standard token since you can't supply > 2^256 -1.

    // todo: transfer max amounts.

// APPROVALS

  it('approvals: msg.sender should approve 100 to accounts[1]', function () {
    var ctr = null
    return BambooToken.new(10000, 'Simon Bucks', 1, 'SBX', {from: accounts[0]}).then(function (result) {
      ctr = result
      return ctr.approve(accounts[1], 100, {from: accounts[0]})
    }).then(function (result) {
      return ctr.allowance.call(accounts[0], accounts[1])
    }).then(function (result) {
      assert.strictEqual(result.toNumber(), 100)
    }).catch((err) => { throw new Error(err) })
  })

  it('approvals: msg.sender should approve 100 to SampleRecipient and then NOTIFY SampleRecipient. It should succeed.', function () {
    var ctr = null
    var sampleCtr = null
    return BambooToken.new(10000, 'Simon Bucks', 1, 'SBX', {from: accounts[0]}).then(function (result) {
      ctr = result
      return SampleRecipientSuccess.new({from: accounts[0]})
    }).then(function (result) {
      sampleCtr = result
      return ctr.approveAndCall(sampleCtr.address, 100, '0x42', {from: accounts[0]})
    }).then(function (result) {
      return ctr.allowance.call(accounts[0], sampleCtr.address)
    }).then(function (result) {
      assert.strictEqual(result.toNumber(), 100)
      return sampleCtr.value.call()
    }).then(function (result) {
      assert.strictEqual(result.toNumber(), 100)
    }).catch((err) => { throw new Error(err) })
  })

  it('approvals: msg.sender should approve 100 to SampleRecipient and then NOTIFY SampleRecipient and throw.', function () {
    var ctr = null
    var sampleCtr = null
    return BambooToken.new(10000, 'Simon Bucks', 1, 'SBX', {from: accounts[0]}).then(function (result) {
      ctr = result
      return SampleRecipientThrow.new({from: accounts[0]})
    }).then(function (result) {
      sampleCtr = result
      return ctr.approveAndCall.call(sampleCtr.address, 100, '0x42', {from: accounts[0]})
    }).catch(function (result) {
            // It will catch OOG.
      assert(true)
    })
  })

    // bit overkill. But is for testing a bug
  it('approvals: msg.sender approves accounts[1] of 100 & withdraws 20 once.', function () {
    var ctr = null
    return BambooToken.new(10000, 'Simon Bucks', 1, 'SBX', {from: accounts[0]}).then(function (result) {
      ctr = result
      return ctr.balanceOf.call(accounts[0])
    }).then(function (result) {
      assert.strictEqual(result.toNumber(), 10000)
      return ctr.approve(accounts[1], 100, {from: accounts[0]})
    }).then(function (result) {
      return ctr.balanceOf.call(accounts[2])
    }).then(function (result) {
      assert.strictEqual(result.toNumber(), 0)
      return ctr.allowance.call(accounts[0], accounts[1])
    }).then(function (result) {
      assert.strictEqual(result.toNumber(), 100)
      return ctr.transferFrom.call(accounts[0], accounts[2], 20, {from: accounts[1]})
    }).then(function (result) {
      return ctr.transferFrom(accounts[0], accounts[2], 20, {from: accounts[1]})
    }).then(function (result) {
      return ctr.allowance.call(accounts[0], accounts[1])
    }).then(function (result) {
      assert.strictEqual(result.toNumber(), 80)
      return ctr.balanceOf.call(accounts[2])
    }).then(function (result) {
      assert.strictEqual(result.toNumber(), 20)
      return ctr.balanceOf.call(accounts[0])
    }).then(function (result) {
      assert.strictEqual(result.toNumber(), 9980)
    }).catch((err) => { throw new Error(err) })
  })

    // should approve 100 of msg.sender & withdraw 50, twice. (should succeed)
  it('approvals: msg.sender approves accounts[1] of 100 & withdraws 20 twice.', function () {
    var ctr = null
    return BambooToken.new(10000, 'Simon Bucks', 1, 'SBX', {from: accounts[0]}).then(function (result) {
      ctr = result
      return ctr.approve(accounts[1], 100, {from: accounts[0]})
    }).then(function (result) {
      return ctr.allowance.call(accounts[0], accounts[1])
    }).then(function (result) {
      assert.strictEqual(result.toNumber(), 100)
      return ctr.transferFrom(accounts[0], accounts[2], 20, {from: accounts[1]})
    }).then(function (result) {
      return ctr.allowance.call(accounts[0], accounts[1])
    }).then(function (result) {
      assert.strictEqual(result.toNumber(), 80)
      return ctr.balanceOf.call(accounts[2])
    }).then(function (result) {
      assert.strictEqual(result.toNumber(), 20)
      return ctr.balanceOf.call(accounts[0])
    }).then(function (result) {
      assert.strictEqual(result.toNumber(), 9980)
            // FIRST tx done.
            // onto next.
      return ctr.transferFrom(accounts[0], accounts[2], 20, {from: accounts[1]})
    }).then(function (result) {
      return ctr.allowance.call(accounts[0], accounts[1])
    }).then(function (result) {
      assert.strictEqual(result.toNumber(), 60)
      return ctr.balanceOf.call(accounts[2])
    }).then(function (result) {
      assert.strictEqual(result.toNumber(), 40)
      return ctr.balanceOf.call(accounts[0])
    }).then(function (result) {
      assert.strictEqual(result.toNumber(), 9960)
    }).catch((err) => { throw new Error(err) })
  })

    // should approve 100 of msg.sender & withdraw 50 & 60 (should fail).
  it('approvals: msg.sender approves accounts[1] of 100 & withdraws 50 & 60 (2nd tx should fail)', function () {
    var ctr = null
    return BambooToken.new(10000, 'Simon Bucks', 1, 'SBX', {from: accounts[0]}).then(function (result) {
      ctr = result
      return ctr.approve(accounts[1], 100, {from: accounts[0]})
    }).then(function (result) {
      return ctr.allowance.call(accounts[0], accounts[1])
    }).then(function (result) {
      assert.strictEqual(result.toNumber(), 100)
      return ctr.transferFrom(accounts[0], accounts[2], 50, {from: accounts[1]})
    }).then(function (result) {
      return ctr.allowance.call(accounts[0], accounts[1])
    }).then(function (result) {
      assert.strictEqual(result.toNumber(), 50)
      return ctr.balanceOf.call(accounts[2])
    }).then(function (result) {
      assert.strictEqual(result.toNumber(), 50)
      return ctr.balanceOf.call(accounts[0])
    }).then(function (result) {
      assert.strictEqual(result.toNumber(), 9950)
            // FIRST tx done.
            // onto next.
      return ctr.transferFrom.call(accounts[0], accounts[2], 60, {from: accounts[1]})
    }).then(function (result) {
      assert.isFalse(result)
    }).catch((err) => { throw new Error(err) })
  })

  it('approvals: attempt withdrawal from acconut with no allowance (should fail)', function () {
    var ctr = null
    return BambooToken.new(10000, 'Simon Bucks', 1, 'SBX', {from: accounts[0]}).then(function (result) {
      ctr = result
      return ctr.transferFrom.call(accounts[0], accounts[2], 60, {from: accounts[1]})
    }).then(function (result) {
      assert.isFalse(result)
    }).catch((err) => { throw new Error(err) })
  })

  it('approvals: allow accounts[1] 100 to withdraw from accounts[0]. Withdraw 60 and then approve 0 & attempt transfer.', function () {
    var ctr = null
    return BambooToken.new(10000, 'Simon Bucks', 1, 'SBX', {from: accounts[0]}).then(function (result) {
      ctr = result
      return ctr.approve(accounts[1], 100, {from: accounts[0]})
    }).then(function (result) {
      return ctr.transferFrom(accounts[0], accounts[2], 60, {from: accounts[1]})
    }).then(function (result) {
      return ctr.approve(accounts[1], 0, {from: accounts[0]})
    }).then(function (result) {
      return ctr.transferFrom.call(accounts[0], accounts[2], 10, {from: accounts[1]})
    }).then(function (result) {
      assert.isFalse(result)
    }).catch((err) => { throw new Error(err) })
  })

  it('approvals: approve max (2^256 - 1)', function () {
    var ctr = null
    return BambooToken.new(10000, 'Simon Bucks', 1, 'SBX', {from: accounts[0]}).then(function (result) {
      ctr = result
      return ctr.approve(accounts[1], '115792089237316195423570985008687907853269984665640564039457584007913129639935', {from: accounts[0]})
    }).then(function (result) {
      return ctr.allowance(accounts[0], accounts[1])
    }).then(function (result) {
      var match = result.equals('1.15792089237316195423570985008687907853269984665640564039457584007913129639935e+77')
      assert.isTrue(match)
    }).catch((err) => { throw new Error(err) })
  })
})
