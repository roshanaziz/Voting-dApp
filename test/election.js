const Voting = artifacts.require("./Voting.sol");

contract("Voting", function(accounts) {
  let votingInstance;

  beforeEach(async () => {
    votingInstance = await Voting.deployed();
  });

  it("initializes with two candidates", async () => {
    const count = await votingInstance.candidatesCount();
    assert.equal(count, 2, "There should be two candidates initially");
  });

  it("candidates have the correct values", async () => {
    const candidate1 = await votingInstance.candidates(1);
    assert.equal(candidate1.id, 1, "contains the correct id");
    assert.equal(candidate1.name, "Candidate 1", "contains the correct name");
    assert.equal(candidate1.voteCount, 0, "contains the correct vote count");

    const candidate2 = await votingInstance.candidates(2);
    assert.equal(candidate2.id, 2, "contains the correct id");
    assert.equal(candidate2.name, "Candidate 2", "contains the correct name");
    assert.equal(candidate2.voteCount, 0, "contains the correct vote count");
  });

  it("allows a voter to cast a vote", async () => {
    await votingInstance.vote(1, { from: accounts[0] });
    const candidate = await votingInstance.candidates(1);
    const hasVoted = await votingInstance.voters(accounts[0]);

    assert.equal(candidate.voteCount, 1, "increments the candidate's vote count");
    assert(hasVoted, "the voter was marked as voted");
  });

  it("throws an exception for invalid candidates", async () => {
    try {
      await votingInstance.vote(99, { from: accounts[1] });
      assert.fail("expected error not received");
    } catch (error) {
      assert(error.message.indexOf('revert') >= 0, "error message must contain revert");
    }

    const candidate1 = await votingInstance.candidates(1);
    const candidate2 = await votingInstance.candidates(2);
    assert.equal(candidate1.voteCount, 1, "candidate 1 did not receive any votes");
    assert.equal(candidate2.voteCount, 0, "candidate 2 did not receive any votes");
  });

  it("throws an exception for double voting", async () => {
    await votingInstance.vote(2, { from: accounts[1] });
    const candidate = await votingInstance.candidates(2);
    assert.equal(candidate.voteCount, 1, "accepts first vote");

    try {
      await votingInstance.vote(2, { from: accounts[1] });
      assert.fail("expected error not received");
    } catch (error) {
      assert(error.message.indexOf('revert') >= 0, "error message must contain revert");
    }

    const candidate1 = await votingInstance.candidates(1);
    const candidate2 = await votingInstance.candidates(2);
    assert.equal(candidate1.voteCount, 1, "candidate 1 did not receive any votes");
    assert.equal(candidate2.voteCount, 1, "candidate 2 did not receive any additional votes");
  });

  it("prevents voting after the voting period has ended", async () => {
    // Advance the blockchain time by 2 minutes
    await increaseTime(2 * 60);

    try {
      await votingInstance.vote(1, { from: accounts[2] });
      assert.fail("expected error not received");
    } catch (error) {
      assert(error.message.indexOf('Voting period has ended') >= 0, "error message must contain 'Voting period has ended'");
    }

    const candidate1 = await votingInstance.candidates(1);
    assert.equal(candidate1.voteCount, 1, "candidate 1 did not receive any additional votes");
  });

  // Helper function to increase time in the blockchain
  async function increaseTime(duration) {
    const id = Date.now();
    return new Promise((resolve, reject) => {
      web3.currentProvider.send({
        jsonrpc: "2.0",
        method: "evm_increaseTime",
        params: [duration],
        id: id
      }, (err1) => {
        if (err1) return reject(err1);

        web3.currentProvider.send({
          jsonrpc: "2.0",
          method: "evm_mine",
          id: id + 1
        }, (err2, res) => {
          return err2 ? reject(err2) : resolve(res);
        });
      });
    });
  }
});
