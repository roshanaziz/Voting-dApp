// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;
//Contract Class
contract Voting {
    //Structure to define a candidate
    struct Candidate {
        uint id;
        string name;
        uint voteCount;
    }
    //Setting up variables to index candidates and voters
    mapping(uint => Candidate) public candidates;
    mapping(address => bool) public voters;
    uint public candidatesCount;
    //Variables for time limit
    uint256 public votingStart;
    uint256 public votingEnd;
    //Event handler
    event VoteCast(address indexed voter, uint indexed candidateId);
    //Constructor to initilize values
    constructor() public {
        votingStart = block.timestamp;
        votingEnd = votingStart + 2 minutes; 
        addCandidate("Candidate 1");
        addCandidate("Candidate 2");
    }
    //Function to add candidate
    function addCandidate(string memory _name) private {
        candidatesCount++;
        candidates[candidatesCount] = Candidate(candidatesCount, _name, 0);
    }
    //Event handler when a vote is cast
    event voteCast (
        uint indexed _candidateId
    );
    //Function to vote
    function vote(uint _candidateId) public {
        require(block.timestamp < votingEnd, "Voting period has ended."); // Check if voting time is over
        require(!voters[msg.sender], "You have already voted.");
        require(_candidateId > 0 && _candidateId <= candidatesCount, "Invalid candidate ID.");

        voters[msg.sender] = true;
        candidates[_candidateId].voteCount++;
        emit voteCast(_candidateId);
    }
    //Function to get candidate
    function getCandidate(uint _candidateId) public view returns (uint, string memory, uint) {
        require(_candidateId > 0 && _candidateId <= candidatesCount, "Invalid candidate ID.");
        Candidate memory candidate = candidates[_candidateId];
        return (candidate.id, candidate.name, candidate.voteCount);
    }
    //Function to get voting end time
    function getVotingEnd() public view returns (uint256) {
        return votingEnd;
    }
}
