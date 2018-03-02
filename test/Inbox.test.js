const assert = require('assert');
const ganache = require('ganache-cli');
const Web3 = require('web3');
const provider = ganache.provider();
const web3 = new Web3(provider);
const {interface, bytecode } = require('../compile');

let accounts;
let inbox;

const INITAL_MESSAGE = "Hello network!";

beforeEach(async ()=>{
  // Get a list of all accounts
  accounts = await web3.eth.getAccounts();
  // Use one of those accounts to deply the contract
  inbox = await new web3.eth.Contract(JSON.parse(interface))
    .deploy({data: bytecode, arguments:[INITAL_MESSAGE] })
    .send({from: accounts[0], gas: '1000000'})
  inbox.setProvider(provider);
});

describe('Inbox',()=>{

  it('deploys a contract',()=>{
    assert.ok(inbox.options.address);
  });

  it('has a default message', async ()=>{
    const message = await inbox.methods.message().call();
    assert.equal(message,INITAL_MESSAGE);
  });

  it('can change the message', async ()=>{
    await inbox.methods.setMessage('I have changed!').send({from: accounts[0]});
    const message = await inbox.methods.message().call();
    assert.equal('I have changed!',message);
  });
});
