pragma solidity ^0.8.17;

contract Res_Rev_Rew {

    event LogWithdrawal(address receiver, string msg, uint amount, uint key);
    event LogRefund(address to, string msg, uint amount);


    uint public startTime = block.timestamp;
    uint public timelock;   
    bytes32 public hashlock;  
    address payable public user;   
    address payable public restaurant; 
    uint public reward;    
    

    constructor (bytes32 _hashlock,
                uint _timelock, 
                address payable _user)
    payable 
    public{ 
        user = payable(_user); 
        hashlock = _hashlock;
        timelock = _timelock;

        restaurant = payable(msg.sender);
        reward = msg.value;

    } 

    modifier claimable(uint _k){
        require((keccak256(abi.encodePacked(_k))) == hashlock, "Hash1 doesn't match!");  
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
        require(msg.sender == user, "Only the user can withdraw the reward");
        uint _rew = reward;
        reward = 0;                        
        user.transfer(_rew);
        emit LogWithdrawal(user, "Reward sent to customer", _rew, _key);
    } 

    function refund ()
    public 
    refundable()
    { 
        require(msg.sender == restaurant, "Only the restaurant can refund the reward");
        uint _rew = reward;
        reward = 0;
        restaurant.transfer(_rew);
        emit LogRefund(restaurant, "Reward refunded to restaurant", _rew);
    }

    fallback () external {}

}