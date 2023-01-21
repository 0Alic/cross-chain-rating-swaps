pragma solidity ^0.8.17;
import "./Rating.sol";
contract Usr_Rev_Rew {

    event LogWithdrawal(address receiver, string msg, uint rating, uint key);
    event LogRefund(address receiver, uint val);


    uint public startTime = block.timestamp;
    uint public timelock;      
    bytes32 public hashlock;                              
    address public user;                            
    address public restaurant;                      
    address public addrRecensioni;                  
    uint public rating;                                     
    
    constructor (bytes32 _hashlock,
                uint _timelock,
                address payable _restaurant,
                address payable _addrRecensioni,
                uint _rating) 
    public{ 
        require(_rating >= 1 && _rating <= 10, "Rating must be in scale 1-10.");

        rating = _rating;
        restaurant = _restaurant; 
        hashlock = _hashlock;
        timelock = _timelock;
        addrRecensioni = _addrRecensioni;

        user = msg.sender;
    } 


    modifier claimable(uint _k){
        require((keccak256(abi.encodePacked(_k))) == hashlock, "Hashlock doesn't match!");
        require(startTime + timelock >  block.timestamp, "Timelock expired, refund allowed!"); 
        _;
    }


    modifier refundable(){
        require(startTime + timelock <=  block.timestamp, "Timelock not expired yet!");
        _;
    }

    function withdraw (uint _key)
    public
    claimable(_key)
    { 
        require(msg.sender == restaurant, "Only the restaurant can retrieve the review");
        Rating(addrRecensioni).storeReview(rating, user);

        emit LogWithdrawal(restaurant, "Review stored in contract", rating, _key);
    } 


    function refund () 
    public
    refundable()
    { 
        require(msg.sender == user, "Only the user can refund the review");
        emit LogRefund(user, rating);
        rating = 0;
    }


    fallback () external {}

}