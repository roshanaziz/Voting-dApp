//Creates the App
App = {
  //Initilizes variables
  web3Provider: null,
  contracts: {},
  account: '0x0',
  hasVoted: false,
  votingEnd: null,
  //Initializes application and starts the process
  init: function() {
    console.log("App initialized");
    return App.initWeb3();
  },

  initWeb3: function() {
    console.log("Initializing Web3");
    if (typeof web3 !== 'undefined') {
      App.web3Provider = web3.currentProvider;
      web3 = new Web3(web3.currentProvider);
    } else {
      App.web3Provider = new Web3.providers.HttpProvider('http://localhost:7545');
      web3 = new Web3(App.web3Provider);
    }
    console.log("Web3 initialized");
    return App.initContract();
  },

  initContract: function() {
    console.log("Initializing contract");
    $.getJSON("Voting.json", function(election) {
      App.contracts.Election = TruffleContract(election);
      App.contracts.Election.setProvider(App.web3Provider);
      console.log("Contract initialized");
      App.listenForEvents();
      return App.render();
    });
  },

  listenForEvents: function() {
    console.log("Listening for events");
    App.contracts.Election.deployed().then(function(instance) {
      instance.voteCast({}, {
        fromBlock: 0,
        toBlock: 'latest'
      }).watch(function(error, event) {
        console.log("Event triggered", event);
        App.render();
      });
    });
  },

  render: function() {
    console.log("Rendering the application");
    var electionInstance;
    var loader = $("#loader");
    var content = $("#content");

    loader.show();
    content.hide();

    // Load account data
    web3.eth.getCoinbase(function(err, account) {
      if (err === null) {
        App.account = account;
        $("#accountAddress").html("Your Account: " + account);
      }
    });

    // Load contract data
    App.contracts.Election.deployed().then(function(instance) {
      electionInstance = instance;
      console.log("Election instance obtained");
      return electionInstance.getVotingEnd();
    }).then(function(votingEnd) {
      App.votingEnd = votingEnd.toNumber();
      console.log("Voting end time retrieved:", App.votingEnd);
      App.updateRemainingTime();
      return App.contracts.Election.deployed();
    }).then(function(instance) {
      electionInstance = instance;
      return electionInstance.candidatesCount();
    }).then(function(candidatesCount) {
      console.log("Candidates count:", candidatesCount);
      var candidatesResults = $("#candidatesResults");
      candidatesResults.empty();

      var candidatesSelect = $('#candidatesSelect');
      candidatesSelect.empty();

      var promises = [];
      for (var i = 1; i <= candidatesCount; i++) {
        promises.push(electionInstance.candidates(i));
      }

      return Promise.all(promises);
    }).then(function(candidates) {
      candidates.forEach(function(candidate) {
        var id = candidate[0];
        var name = candidate[1];
        var voteCount = candidate[2];

        // Render candidate Result
        var candidateTemplate = "<tr><th>" + id + "</th><td>" + name + "</td><td>" + voteCount + "</td></tr>";
        $("#candidatesResults").append(candidateTemplate);

        // Render candidate ballot option
        var candidateOption = "<option value='" + id + "' >" + name + "</option>";
        $("#candidatesSelect").append(candidateOption);
      });

      return App.contracts.Election.deployed().then(function(instance) {
        return instance.voters(App.account);
      });
    }).then(function(hasVoted) {
      console.log("Has voted:", hasVoted);
      if (hasVoted) {
        $('form').hide();
      }
      loader.hide();
      content.show();
    }).catch(function(error) {
      console.error("Error:", error);
    });
  },

  updateRemainingTime: function() {
    setInterval(function() {
      var now = Math.floor(Date.now() / 1000);
      var remaining = App.votingEnd - now;
      if (remaining > 0) {
        var minutes = Math.floor(remaining / 60);
        var seconds = remaining % 60;
        $("#remainingTime").html("Time remaining: " + minutes + "m " + seconds + "s");
      } else {
        $("#remainingTime").html("Voting period has ended.");
        $('form').hide();
      }
    }, 1000);
  },

  castVote: function() {
    var candidateId = $('#candidatesSelect').val();
    App.contracts.Election.deployed().then(function(instance) {
      return instance.vote(candidateId, { from: App.account });
    }).then(function(result) {
      $("#content").hide();
      $("#loader").show();
    }).catch(function(err) {
      console.error("Error casting vote:", err);
    });
  }
};

$(function() {
  $(window).load(function() {
    App.init();
  });
});