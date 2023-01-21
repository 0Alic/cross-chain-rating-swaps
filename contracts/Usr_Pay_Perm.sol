pragma solidity ^0.8.17;

contract Usr_Pay_Perm  {

    event LogWithdrawal(address receiver, string msg, uint amount, uint key);
    event LogRefund(address to, string msg, uint amount);
    
    uint public startTime = block.timestamp;        
    uint public timelock;                        
    uint public payment;
    bytes32 public hashlock;               
    address payable public restaurant;     
    address payable public user;    
    address payable public addrRecensioni;   
    
    constructor (bytes32 _hashlock, 
                uint _timelock,
                address payable _restaurant
                ) 
    payable 
    public{
        hashlock = _hashlock;
        timelock = _timelock;
        restaurant = payable(_restaurant);

        user = payable(msg.sender); 
        payment = msg.value;
    } 


    modifier claimable(uint256 k){
        require((keccak256(abi.encodePacked(k))) == hashlock , "Hash doesn't match!");     
        require(startTime + timelock >  block.timestamp, "Timelock expired - Refund allowed"); 
        _;
    }

    modifier refundable(){
        require(startTime + timelock <=  block.timestamp, "Timelock not expired!");  
        _;
    }    

    function withdraw (uint256 _key)
    public
    claimable(_key)
    {   
        require(msg.sender == restaurant, "Only the restaurant can withdraw the payment.");

        uint _p = payment;
        payment = 0;
        restaurant.transfer(_p);
        emit LogWithdrawal(restaurant, "Restaurant got paid", _p, _key);
    } 


    function refund () 
    public
    refundable()
    { 
        require(msg.sender == user, "Only the customer can refund the payment.");
        uint _p = payment;
        payment = 0;
        user.transfer(_p);

        emit LogRefund(user, "Customer got refunded", _p);
    }

  
    fallback () external {}

}