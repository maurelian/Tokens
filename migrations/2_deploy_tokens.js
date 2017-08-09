const BambooToken = artifacts.require(`./BambooToken.sol`)

module.exports = (deployer, network) => {
    if (network == "ropsten") {
        // don't deploy again
    } else {
        deployer.deploy(BambooToken);
    }
}
