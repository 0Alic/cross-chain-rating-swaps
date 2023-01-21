pragma solidity ^0.8.17;
import "./Rating.sol";

contract Res_Pay_Perm {

    event LogWithdrawal(address receiver, string msg, uint key);
    event LogRefund(address to, string msg);

    uint public startTime =  block.timestamp; 
    uint public timelock;        
    bytes32 public hashlock;      
    address public user;       
    address public restaurant;   
    bool public permission = false;
    address payable public addrRecensioni;  

    constructor (bytes32 _hashlock, 
                 uint _timelock,
                 address payable _user,
                 address payable _addrRecensioni
                 ) 
    public{ 
        user = _user;
        hashlock = _hashlock;
        timelock = _timelock;
        addrRecensioni = _addrRecensioni;

        restaurant = msg.sender; 
        permission = true;

    } 

    modifier claimable(uint k){
        require((keccak256(abi.encodePacked(k))) == hashlock, "Hash doesn't match!");  
        require(startTime + timelock > block.timestamp, "Timelock expired, refund available!"); 
        _;
    }


    modifier refundable(){
        require( block.timestamp >= startTime + timelock, "Timelock not expired yet!");
        _;
    }


    function withdraw (uint _key)
    public
    claimable(_key)
    {   
        require(msg.sender == user, "Only the user can withdraw the permission");
        require(permission == true);

        Rating(addrRecensioni).grantPermission(user); 
        permission = false;
        emit LogWithdrawal(user, "Permission to review set in contract to user", _key);
    } 

    function refund () 
    public
    refundable()
    { 
        require(msg.sender == restaurant, "Only the restaurant can refund the permission");
        permission = false;
        emit LogRefund(restaurant, "Permission refunded to restaurant");
    }


    fallback () external {}

}