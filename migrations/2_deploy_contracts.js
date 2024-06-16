//Creates an object version of our contract
var Voting = artifacts.require("./Voting.sol");
//Deploys our 
module.exports = function(deployer) {
    deployer.deploy(Voting);
}