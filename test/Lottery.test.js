const assert = require('assert');
const ganache = require('ganache-cli');
const Web3 = require('web3');
const web3 = new Web3(ganache.provider());

const {interface, bytecode} = require('../compile');

let lottery;
let accounts;

beforeEach(async ()=>{
  accounts = await web3.eth.getAccounts();

  lottery = await new web3.eth.Contract(JSON.parse(interface))
    .deploy({data:bytecode})
    .send({from: accounts[0], gas: '1000000'});
});

describe('Lottery Contract', ()=>{
//Test 1
  it('Deploys a contract', ()=>{
    assert.ok(lottery.options.address);
  });
// Test 2
  it('Allows one account to enter', async ()=>{
    await lottery.methods.enter().send({
      from: accounts[0],
      value: web3.utils.toWei('0.02', 'ether')
    });

    const players = await lottery.methods.getPlayers().call({
      from: accounts[0]
    });

    assert.equal(accounts[0],players[0]);
    assert.equal(1, players.length);
  });
// Test 3
  it('Allows multiple accounts to enter', async ()=>{
    await lottery.methods.enter().send({
      from: accounts[0],
      value: web3.utils.toWei('0.02', 'ether')
    });

    await lottery.methods.enter().send({
      from: accounts[1],
      value: web3.utils.toWei('0.02', 'ether')
    });

    await lottery.methods.enter().send({
      from: accounts[2],
      value: web3.utils.toWei('0.02', 'ether')
    });

    const players = await lottery.methods.getPlayers().call({
      from: accounts[0]
    });

    assert.equal(accounts[0],players[0]);
    assert.equal(accounts[1],players[1]);
    assert.equal(accounts[2],players[2]);
    assert.equal(3, players.length);
  });

//Test 4
it('Requires a minimum amount of ether to enter',async ()=>{
  try{
      await lottery.methods.enter().send({
        from: accounts[0],
        value: 200
      });
      assert(false);
    }catch(err){
      assert(err);
    }

});
//Test 5
it('Doesnt allow anyone else than manager to pick a winner',async ()=>{
  //In beforeEach block the contract was deployed by accounts[0],
  //therefore only sender (accounts[0]) should be allowed to call pickWinner function successfully
  try{
      await lottery.methods.pickWinner().send({
        from: accounts[1]
      });
      assert(false);
    }catch(err){
      assert(err);
    }
});
//Test 6
it('Allows manager to pick a winner', async ()=>{
  //Add some players
  await lottery.methods.enter().send({
    from: accounts[1],
    value: web3.utils.toWei('0.02', 'ether')
  });

  await lottery.methods.enter().send({
    from: accounts[2],
    value: web3.utils.toWei('0.02', 'ether')
  });

  await lottery.methods.enter().send({
    from: accounts[3],
    value: web3.utils.toWei('0.02', 'ether')
  });
  //Let Manager call a function to pick a winner
  await lottery.methods.pickWinner().send({
    from: accounts[0]
  });
});
//Test 7
it('Sends money to the winner and resets players array',async ()=>{
  //Add one player
  await lottery.methods.enter().send({
    from: accounts[1],
    value: web3.utils.toWei('1', 'ether')
  });
  const beforeBalance = await web3.eth.getBalance(accounts[1]);
  //Pick a winner with manager account
  await lottery.methods.pickWinner().send({
    from: accounts[0]
  });
  const afterBalance = await web3.eth.getBalance(accounts[1]);
  const difference = afterBalance - beforeBalance;
  //Assertions
  //1: Check if balance was transfered to winner account
  assert(difference > web3.utils.toWei('0.8','ether'));
  //2:Check if players array was reset
  const players = await lottery.methods.getPlayers().call({
    from: accounts[0]
  });
  assert(players.length == 0);
  //3: Check if contract balance was cleared
  const contractBalance = await web3.eth.getBalance(lottery.options.address);
  assert(contractBalance == 0);
});

});
