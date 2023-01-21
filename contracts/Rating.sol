pragma solidity ^0.8.17;

contract Rating {

    mapping (address => bool) public enabledHTLCs; 
    mapping (address => bool) public permissionMap;         
    uint[] private ratings;                        
    address owner;                  

    constructor() public {
        owner = msg.sender;
        ratings.push(0);    // <== Quick patch otherwise the storeReview fails at the instruction ratings.push(rating). To understand why
    }

    function getPerm(address payable addr) public view returns(bool) {
        return permissionMap[addr];
    }

    function enableHTLC(address _htlc) public {
        require(msg.sender == owner, "Only the owner can enable HTLCs");
        enabledHTLCs[_htlc] = true;
    }

    function grantPermission(address addr) public {
        require(enabledHTLCs[msg.sender] == true, "HTLC not enabled");
        enabledHTLCs[msg.sender] = false;
        permissionMap[addr] = true;
    }

    function storeReview(uint rating, address addr) public {
        require(enabledHTLCs[msg.sender] == true, "HTLC not enabled");
        require(permissionMap[addr] == true, "User not allowed!");

        enabledHTLCs[msg.sender] = false;
        permissionMap[addr] = false;

        ratings.push(rating);
    }

    function getRatings() public view returns(uint[] memory) {
        return ratings;
    }
}
