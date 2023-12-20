/// Import the necessary libraries:

import Principal "mo:base/Principal";
import Timer "mo:base/Timer";
import Debug "mo:base/Debug";
import List "mo:base/List";


/// Next, define the actor fort he jambo platform:

actor {
  /// Define an item for the jambo: 
  type Item = {
    /// Define a title for the jambo:
    title : Text;
    /// Define a description for the jambo:
    description : Text;
  };

  /// Define the jambo's pledge:
  type pledge = {
    /// Define the Coins for the pledge using ICP as the currency:
    Coins : Nat;
    /// Define the time the pledge was placed, measured as the time remaining in the jambo: 
    time : Nat;
    /// Define the authenticated user ID of the pledge:
    Client : Principal.Principal;
  };

  /// Define a jambo ID to uniquely identify the jambo:
  type jamboId = Nat;

  /// Define a jambo overview:
  type jamboOverview = {
    id : jamboId;
    /// Define the jambo sold at the item:
    item : Item;
  };

  /// Define the details of the jambo:
  type jamboDetails = {
    /// Item sold in the jambo:
    item : Item;
    /// pledges submitted in the jambo:
    pledgeHistory : [pledge];
    /// Time remaining in the jambo:
    /// the jambo winner.
    remainingTime : Nat;
  };

  /// Define an internal, non-shared type for storing info about the jambo:
  type jambo = {
    id : jamboId;
    item : Item;
    var pledgeHistory : List.List<pledge>;
    var remainingTime : Nat;
  };

  /// Create a stable variable to store the jambos:
  stable var jambos = List.nil<jambo>();
  /// Define a counter for generating new jambo IDs.
  stable var idCounter = 0;

  /// Define a timer that occurs every second, used to define the time remaining in the open jambo:
  func tick() : async () {
    for (jambo in List.toIter(jambos)) {
      if (jambo.remainingTime > 0) {
        jambo.remainingTime -= 1;
      };
    };
  };

  /// Install a timer: 
  let timer = Timer.recurringTimer(#seconds 1, tick);

  /// Define a function to generating a new jambo:
  func newjamboId() : jamboId {
    let id = idCounter;
    idCounter += 1;
    id;
  };

  /// Define a function to register a new jambo that is open for the defined duration:
  public func newjambo(item : Item, duration : Nat) : async () {
    let id = newjamboId();
    let pledgeHistory = List.nil<pledge>();
    let newjambo = { id; item; var pledgeHistory; var remainingTime = duration };
    jambos := List.push(newjambo, jambos);
  };

  /// Define a function to retrieve all jambos: 
  /// Specific jambos can be separately retrieved by `getjamboDetail`:
  public query func getOverviewList() : async [jamboOverview] {
    func getOverview(jambo : jambo) : jamboOverview = {
      id = jambo.id;
      item = jambo.item;
    };
    let overviewList = List.map<jambo, jamboOverview>(jambos, getOverview);
    List.toArray(List.reverse(overviewList));
  };

  /// Define an internal helper function to retrieve jambos by ID: 
  func findjambo(jamboId : jamboId) : jambo {
    let result = List.find<jambo>(jambos, func jambo = jambo.id == jamboId);
    switch (result) {
      case null Debug.trap("Inexistent id");
      case (?jambo) jambo;
    };
  };

  /// Define a function to retrieve detailed info about an jambo using its ID: 
  public query func getjamboDetails(jamboId : jamboId) : async jamboDetails {
    let jambo = findjambo(jamboId);
    let pledgeHistory = List.toArray(List.reverse(jambo.pledgeHistory));
    { item = jambo.item; pledgeHistory; remainingTime = jambo.remainingTime };
  };

  /// Define an internal helper function to retrieve the minimum Coins for an jambo's next pledge; the next pledge must be one unit of currency larger than the last pledge: 
  func minimumCoins(jambo : jambo) : Nat {
    switch (jambo.pledgeHistory) {
      case null 1;
      case (?(lastpledge, _)) lastpledge.Coins + 1;
    };
  };

  /// Make a new pledge for a specific jambo specified by the ID:
  /// Checks that:
  /// * The user (`message.caller`) is authenticated.
  /// * The Coins is valid, higher than the last pledge, if existing.
  /// * The jambo is still open.
  /// If valid, the pledge is appended to the pledge history.
  /// Otherwise, traps with an error.
  public shared (message) func makepledge(jamboId : jamboId, Coins : Nat) : async () {
    let Client = message.caller;
    if (Principal.isAnonymous(Client)) {
      Debug.trap("Anonymous caller");
    };
    let jambo = findjambo(jamboId);
    if (Coins < minimumCoins(jambo)) {
      Debug.trap("Coins too low");
    };
    let time = jambo.remainingTime;
    if (time == 0) {
      Debug.trap("jambo closed");
    };
    let newpledge = { Coins; time; Client };
    jambo.pledgeHistory := List.push(newpledge, jambo.pledgeHistory);
  };
};
