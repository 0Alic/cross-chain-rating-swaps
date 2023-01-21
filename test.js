const Web3 = require('web3');
const fs = require('fs')

const JSON_Rating = JSON.parse(fs.readFileSync("./build/contracts/Rating.json"))

const JSON_Usr_Pay_perm = JSON.parse(fs.readFileSync("./build/contracts/Usr_Pay_Perm.json"))
const JSON_Res_Pay_perm = JSON.parse(fs.readFileSync("./build/contracts/Res_Pay_Perm.json"))

const JSON_Usr_Rev_rew = JSON.parse(fs.readFileSync("./build/contracts/Usr_Rev_Rew.json"))
const JSON_Res_Rev_rew = JSON.parse(fs.readFileSync("./build/contracts/Res_Rev_Rew.json"))

const web3Rating = new Web3('http://localhost:8545')
const web3Payment = new Web3('http://localhost:7545')

const gas = 3500000
const timelockSize = 15000000
const timelockDelta = 10000000
const bill = 10 // ether
const reward = 1 // ether
const rating = 7

let gasCosts = `Operation,Gas\n`

async function test() {

    // Inizialization
    const accountsRating = await web3Rating.eth.getAccounts()
    const accountsPayment = await web3Payment.eth.getAccounts()
    const aliceR = accountsRating[0]
    const aliceP = accountsPayment[0]
    const carlR = accountsRating[1]
    const carlP = accountsPayment[1]

    let tx
    let gasSpent
    
    const RatingContract = new web3Rating.eth.Contract(JSON_Rating["abi"])
    const ratingContractInstance = await RatingContract.deploy({data: JSON_Rating["bytecode"], arguments: []})
                                                .send({from: carlR, gas: gas})

        // Gas estimation
    gasSpent = await RatingContract.deploy({data: JSON_Rating["bytecode"], arguments: []}).estimateGas({from: carlR, gas: gas})
    gasCosts += `Deploy Ratings, ${gasSpent}\n`

    // Templates
    // HTLC Alice deploys in Payment blockchain to pay Carl (Payment-Permission)
    const HTLC_AlicePP = new web3Payment.eth.Contract(JSON_Usr_Pay_perm["abi"])  
    // HTLC Alice deploys in Rating blockchain to reset the permission (Review-Reward)
    const HTLC_AliceRR = new web3Rating.eth.Contract(JSON_Usr_Rev_rew["abi"])    

    // HTLC Carl deploys in Rating blockchain to set the permission (Payment-Permission)
    const HTLC_CarlPP = new web3Rating.eth.Contract(JSON_Res_Pay_perm["abi"])   

    // HTLC Carl deploys in Payment blockchain to send the reward to Alice (Review-Reward)
    const HTLC_CarlRR = new web3Payment.eth.Contract(JSON_Res_Rev_rew["abi"])     

    // Payment-Permission
    console.log("*** Begin Payment Permission ***")

    const billWei = web3Payment.utils.toWei(web3Payment.utils.BN(bill).toString(), 'ether')
    const s1 = 12345                                // Secret generated by Carl
    const h1 = web3Payment.utils.soliditySha3(s1)   // Hashlock
    const t1 = timelockSize                         // Timelock

        // Carl deploys HTLC
        // Deployment in Rating blockchain
    const htlc_carl1 = await HTLC_CarlPP.deploy({data: JSON_Res_Pay_perm["bytecode"],
                                            arguments: [h1, t1, aliceR, ratingContractInstance._address]})
                                    .send({from: carlR, gas: gas})
    
            // Estimate gas
    gasSpent = await HTLC_CarlPP.deploy({data: JSON_Res_Pay_perm["bytecode"],
                                        arguments: [h1, t1, aliceR, ratingContractInstance._address]})
                                .estimateGas({from: carlR, gas: gas})
    gasCosts += `Deploy HTLC_Carl_PP, ${gasSpent}\n`

    tx = await ratingContractInstance.methods.enableHTLC(htlc_carl1._address).send({from: carlR})
    gasCosts += `enableHTLC, ${tx.gasUsed}\n`

        // Alice learns h1 and deploys HTLC, timelock needs to be lower
        // Deployment in Payment blockchain
    const htlc_alice1 = await HTLC_AlicePP.deploy({data: JSON_Usr_Pay_perm["bytecode"],
                                            arguments: [h1, t1-timelockDelta, carlP]})
                                    .send({from: aliceP, gas: gas, value: billWei})

            // Estimate gas
    gasSpent = await HTLC_AlicePP.deploy({data: JSON_Usr_Pay_perm["bytecode"],
                                        arguments: [h1, t1-timelockDelta, carlP]})
                                .estimateGas({from: aliceP, gas: gas, value: billWei})
    gasCosts += `Deploy HTLC_Alice_PP, ${gasSpent}\n`

    console.log("\tPermission in HTLC set to: " + (await htlc_carl1.methods.permission().call()) )
    console.log("\tPermission in Rating contract for Alice set to: " + (await ratingContractInstance.methods.getPerm(aliceR).call()) )
    console.log("\tPayment in HTLC set to: " + (await htlc_alice1.methods.payment().call()) )
    console.log("\tAlice's balance set to " + (await web3Payment.eth.getBalance(aliceP)))
    console.log("\tCarl's balance set to " + (await web3Payment.eth.getBalance(carlP)))


    console.log("\t*** Withdraw phase ***")
        // Carl unlocks Alice's HTLC to get paid
    tx = await htlc_alice1.methods.withdraw(s1).send({from: carlP})
    gasCosts += `HTLC_Alice_PP.withdraw, ${tx.gasUsed}\n`

        // Alice learns s1 and unlocks Carl's HTLC to get the permission
    tx = await htlc_carl1.methods.withdraw(s1).send({from: aliceR})
    gasCosts += `HTLC_Carl_PP.withdraw, ${tx.gasUsed}\n`

    console.log("\tPermission in HTLC set to: " + (await htlc_carl1.methods.permission().call()) )
    console.log("\tPermission in Rating contract for Alice set to: " + (await ratingContractInstance.methods.getPerm(aliceR).call()) )
    console.log("\tPayment in HTLC set to: " + (await htlc_alice1.methods.payment().call()) )
    console.log("\tAlice's balance set to " + (await web3Payment.eth.getBalance(aliceP)))
    console.log("\tCarl's balance set to " + (await web3Payment.eth.getBalance(carlP)))
    
    // Review-Reward
    console.log("\n")
    console.log("*** Begin Review Reward ***")
    
    const rewardWei = web3Payment.utils.toWei(web3Payment.utils.BN(reward).toString(), 'ether')
    const s2 = 12345                                // Secret generated by Carl
    const h2 = web3Payment.utils.soliditySha3(s2)   // Hashlock
    const t2 = timelockSize                         // Timelock

        // Carl deploys HTLC
        // Deployment in Payment blockchain
    const htlc_carl2 = await HTLC_CarlRR.deploy({data: JSON_Res_Rev_rew["bytecode"],
                                            arguments: [h2, t2, aliceP]})
                                        .send({from: carlP, gas: gas, value: rewardWei})

            // Estimate gas
    gasSpent = await HTLC_CarlRR.deploy({data: JSON_Res_Rev_rew["bytecode"],
                                        arguments: [h2, t2, aliceP]})
                                .estimateGas({from: carlP, gas: gas, value: rewardWei})
    gasCosts += `Deploy HTLC_Carl_RR, ${gasSpent}\n`

        // Alice deploys HTLC
        // Deployment in Rating blockchain
    const htlc_alice2 = await HTLC_AliceRR.deploy({data: JSON_Usr_Rev_rew["bytecode"],
                                                arguments: [h2, t2 - timelockDelta, carlR, ratingContractInstance._address, rating]})
                                           .send({from: aliceR, gas: gas})

            // Estimate gas
    gasSpent =  await HTLC_AliceRR.deploy({data: JSON_Usr_Rev_rew["bytecode"],
                                            arguments: [h2, t2 - timelockDelta, carlR, ratingContractInstance._address, rating]})
                                    .estimateGas({from: aliceR, gas: gas})
    gasCosts += `Deploy HTLC_Alice_RR, ${gasSpent}\n`

    tx = await ratingContractInstance.methods.enableHTLC(htlc_alice2._address).send({from: carlR})

    console.log("\tReward in HTLC set to: " + (await htlc_carl2.methods.reward().call()) )
    console.log("\tRating in HTLC set to: " + (await htlc_alice2.methods.rating().call()) )
    console.log("\tPermission in Rating contract for Alice set to: " + (await ratingContractInstance.methods.getPerm(aliceR).call()) )
    console.log("\tRatings present in Rating contract: " + (await ratingContractInstance.methods.getRatings().call()) )
    console.log("\tAlice's balance set to " + (await web3Payment.eth.getBalance(aliceP)))
    console.log("\tCarl's balance set to " + (await web3Payment.eth.getBalance(carlP)))
 

    console.log("\t*** Withdraw phase ***")
        // Carl unlocks Alice's HTLC to get the rating
            
    tx = await htlc_alice2.methods.withdraw(s2).send({from: carlR})
    gasCosts += `HTLC_Alice_RR.withdraw, ${tx.gasUsed}\n`

        // Alice learns s2 and unlocks Carl's HTLC to get the reward
    tx = await htlc_carl2.methods.withdraw(s2).send({from: aliceP})
    gasCosts += `HTLC_Carl_RR.withdraw, ${tx.gasUsed}\n`

    console.log("\tReward in HTLC set to: " + (await htlc_carl2.methods.reward().call()) )
    console.log("\tRating in HTLC set to: " + (await htlc_alice2.methods.rating().call()) )
    console.log("\tPermission in Rating contract for Alice set to: " + (await ratingContractInstance.methods.getPerm(aliceR).call()) )
    console.log("\tAlice's balance set to " + (await web3Payment.eth.getBalance(aliceP)))
    console.log("\tCarl's balance set to " + (await web3Payment.eth.getBalance(carlP)))

    // NOTE: due to a bug I cannot understand in Rating.sol, the function storeReview() fails at the ratings.push(rating) instruction
        // If in the constructor of Ratings I push a "0" element, the function does not fail
            // To investigate and remove the "0" element
    console.log("\tRatings present in Rating contract: " + (await ratingContractInstance.methods.getRatings().call()) )

    fs.writeFileSync("gasCosts.csv", gasCosts)
}

test()
