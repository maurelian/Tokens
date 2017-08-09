pragma solidity ^0.4.8;

import "./StandardToken.sol";

contract BambooToken is StandardToken {

    event LogBuy(address, uint256, uint256);
    event LogSell(address, uint256, uint256);

    // function getPrice(uint256 _amount) constant returns(uint256){
    //     return this.balance/( totalSupply - _amount);
    // }

    string public name;                   //fancy name: eg Simon Bucks
    uint8 public decimals;                //How many decimals to show. ie. There could 1000 base units with 3 decimals. Meaning 0.980 SBX = 980 base units. It's like comparing 1 wei to 1 ether.
    string public symbol;                 //An identifier: eg SBX
    string public version = 'H0.1';       //human 0.1 standard. Just an arbitrary versioning scheme.

    function BambooToken (
        uint256 _initialAmount,
        string _tokenName,
        uint8 _decimalUnits,
        string _tokenSymbol) 
        payable 
    {
        balances[msg.sender] = _initialAmount;               // Give the creator all initial tokens
        totalSupply = _initialAmount;                        // Update total supply
        name = _tokenName;                                   // Set the name for display purposes
        decimals = _decimalUnits;                            // Amount of decimals for display purposes
        symbol = _tokenSymbol;                               // Set the symbol for display purposes
    }

    function buy(uint256 _amount) 
    payable 
    returns (bool) {
        if (balances[this] < _amount) throw;
        if ((balances[msg.sender] + _amount) < balances[msg.sender]) throw;

        uint old_eth_balance = this.balance - msg.value;
        if (this.balance * _amount > (balances[this] - _amount) * msg.value) throw;
        

        // if (eth_balance * _amount > (token_balance_after) * msg.value) throw;
        // if (eth_balance / msg.value > token_balance_after / _amount) throw;
        // If (msg.value / eth_balance > _amount / token_balance_after) throw;
        //  ratio of eth_sent to eth held, must be greater than amount bought to amount left
        //  ie. The higher the balance, the more expensive

        balances[this] = balances[this] - _amount;
        balances[msg.sender] = balances[msg.sender] + _amount;

        LogBuy(msg.sender, _amount, msg.value);

        return true;
    }   

    function sell(uint256 _amount, uint256 _value) 
    payable 
    returns (bool) {
        
        if (this.balance < _value) throw;
        if (balances[msg.sender] < _amount) throw;
        if (balances[this] + _amount < balances[this]) throw;
        if (msg.value != 0) throw;

        uint old_eth_balance = this.balance;
        uint new_eth_balance = this.balance - _value;
        uint new_amount = balances[this] + _amount;
        if (new_eth_balance * _amount < new_amount * _value) throw;

        balances[this] = new_amount;
        balances[msg.sender] = balances[msg.sender] - _amount;
        LogSell(msg.sender, _amount, _value);
        // some kind of reentrance protection
        // void = msg.sender.default() with _value reentrance { throw; };
        
        return true;
    }
}
// This is the ABI. 
// Notice that all the functions say "payable"
// [
//   {
//     "type": "constructor",
//     "inputs": [
//       {
//         "name": "totalSupply",
//         "type": "uint256"
//       }
//     ],
//     "name": "PreToken",
//     "outputs": [],
//     "payable": true
//   },
//   {
//     "type": "fallback",
//     "inputs": [],
//     "outputs": [],
//     "payable": true
//   },
//   {
//     "type": "event",
//     "inputs": [
//       {
//         "name": "_from",
//         "type": "address",
//         "indexed": true
//       },
//       {
//         "name": "_to",
//         "type": "address",
//         "indexed": true
//       },
//       {
//         "name": "_amount",
//         "type": "uint256",
//         "indexed": false
//       }
//     ],
//     "name": "Transfer"
//   },
//   {
//     "type": "event",
//     "inputs": [
//       {
//         "name": "_buyer",
//         "type": "address",
//         "indexed": true
//       },
//       {
//         "name": "_amount",
//         "type": "uint256",
//         "indexed": false
//       },
//       {
//         "name": "_value",
//         "type": "uint256",
//         "indexed": false
//       }
//     ],
//     "name": "Buy"
//   },
//   {
//     "type": "event",
//     "inputs": [
//       {
//         "name": "_buyer",
//         "type": "address",
//         "indexed": true
//       },
//       {
//         "name": "_amount",
//         "type": "uint256",
//         "indexed": false
//       },
//       {
//         "name": "_value",
//         "type": "uint256",
//         "indexed": false
//       }
//     ],
//     "name": "Sell"
//   },
//   {
//     "type": "event",
//     "inputs": [
//       {
//         "name": "_owner",
//         "type": "address",
//         "indexed": true
//       },
//       {
//         "name": "_spender",
//         "type": "address",
//         "indexed": true
//       },
//       {
//         "name": "_value",
//         "type": "uint256",
//         "indexed": false
//       }
//     ],
//     "name": "Approval"
//   },
//   {
//     "type": "function",
//     "name": "totalSupply",
//     "inputs": [],
//     "outputs": [
//       {
//         "name": "",
//         "type": "uint256"
//       }
//     ],
//     "payable": true
//   },
//   {
//     "type": "function",
//     "name": "balanceOf",
//     "inputs": [
//       {
//         "name": "a",
//         "type": "address"
//       }
//     ],
//     "outputs": [
//       {
//         "name": "",
//         "type": "uint256"
//       }
//     ],
//     "payable": true
//   },
//   {
//     "type": "function",
//     "name": "transfer",
//     "inputs": [
//       {
//         "name": "_to",
//         "type": "address"
//       },
//       {
//         "name": "_amount",
//         "type": "uint256"
//       }
//     ],
//     "outputs": [
//       {
//         "name": "",
//         "type": "bool"
//       }
//     ],
//     "payable": true
//   },
//   {
//     "type": "function",
//     "name": "approve",
//     "inputs": [
//       {
//         "name": "_spender",
//         "type": "address"
//       },
//       {
//         "name": "_amount",
//         "type": "uint256"
//       }
//     ],
//     "outputs": [
//       {
//         "name": "",
//         "type": "bool"
//       }
//     ],
//     "payable": true
//   },
//   {
//     "type": "function",
//     "name": "allowance",
//     "inputs": [
//       {
//         "name": "_owner",
//         "type": "address"
//       },
//       {
//         "name": "_spender",
//         "type": "address"
//       }
//     ],
//     "outputs": [
//       {
//         "name": "",
//         "type": "uint256"
//       }
//     ],
//     "payable": true
//   },
//   {
//     "type": "function",
//     "name": "transferFrom",
//     "inputs": [
//       {
//         "name": "_from",
//         "type": "address"
//       },
//       {
//         "name": "_to",
//         "type": "address"
//       },
//       {
//         "name": "_amount",
//         "type": "uint256"
//       }
//     ],
//     "outputs": [
//       {
//         "name": "",
//         "type": "bool"
//       }
//     ],
//     "payable": true
//   },
//   {
//     "type": "function",
//     "name": "buy",
//     "inputs": [
//       {
//         "name": "_amount",
//         "type": "uint256"
//       }
//     ],
//     "outputs": [
//       {
//         "name": "",
//         "type": "bool"
//       }
//     ],
//     "payable": true
//   },
//   {
//     "type": "function",
//     "name": "sell",
//     "inputs": [
//       {
//         "name": "_amount",
//         "type": "uint256"
//       },
//       {
//         "name": "_value",
//         "type": "uint256"
//       }
//     ],
//     "outputs": [
//       {
//         "name": "",
//         "type": "bool"
//       }
//     ],
//     "payable": true
//   }
// ]