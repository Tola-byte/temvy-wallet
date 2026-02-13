// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console2} from "forge-std/Script.sol";
import {StableToken} from "../src/Currency.sol";
import {ITIP20} from "../src/interfaces/ITIP20.sol";

contract DeployScript is Script {
    
    // Configuration - Can be overridden via environment variables
    string public tokenName = "Invisible U";
    string public tokenSymbol = "iUSD";
    string public tokenCurrency = "USD";
    address public quoteTokenAddress = address(0x20C0000000000000000000000000000000000000); //
    
    function setUp() public {
        // Override with env vars if provided
        try vm.envString("TOKEN_NAME") returns (string memory name) {
            tokenName = name;
        } catch {}
        
        try vm.envString("TOKEN_SYMBOL") returns (string memory symbol) {
            tokenSymbol = symbol;
        } catch {}
        
        try vm.envString("TOKEN_CURRENCY") returns (string memory currency) {
            tokenCurrency = currency;
        } catch {}
    }
    
    function run() public returns (StableToken) {
        console2.log("=====================================");
        console2.log("Starting StableToken Deployment");
        console2.log("=====================================");
        console2.log("");
        
        // Get deployer from private key
        uint256 deployerPrivateKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        
        console2.log("Deployer Address:", deployer);
      
        // Configuration
        console2.log("Configuration:");
        console2.log("  Token Name:", tokenName);
        console2.log("  Token Symbol:", tokenSymbol);
        console2.log("  Currency:", tokenCurrency);
        console2.log("  Quote Token:", quoteTokenAddress);
        console2.log("  Admin:", deployer);
        console2.log("");
        
        // Start broadcast
        vm.startBroadcast(deployerPrivateKey);
        
        // Deploy StableToken
        console2.log("Deploying StableToken...");
        StableToken token = new StableToken(
            tokenName,
            tokenSymbol,
            tokenCurrency,
            ITIP20(quoteTokenAddress),
            deployer,      // admin
            deployer       // sender (for event attribution)
        );
        
        console2.log("StableToken deployed at:", address(token));
        console2.log("");
        
        vm.stopBroadcast();
        
        // Verify deployment
        _verifyDeployment(token);
        
        // Save deployment info
       // _saveDeployment(address(token));
        
        return token;
    }
    
    function _verifyDeployment(StableToken token) internal view {
        console2.log("=====================================");
        console2.log("Verifying Deployment");
        console2.log("=====================================");
        console2.log("");
        
        console2.log("Name:", token.name());
        console2.log("Symbol:", token.symbol());
        console2.log("Currency:", token.currency());
        console2.log("Decimals:", token.decimals());
        console2.log("Total Supply:", token.totalSupply());
        console2.log("Paused:", token.paused());
        console2.log("Transfer Policy ID:", token.transferPolicyId());
        console2.log("Supply Cap:", token.supplyCap());
        console2.log("");
        
        console2.log(" Deployment Verified!");
        console2.log("");
    }
    
    // function _saveDeployment(address tokenAddress) internal {
    //     string memory deploymentInfo = string.concat(
    //         "{\n",
    //         '  "tokenAddress": "', vm.toString(tokenAddress), '",\n',
    //         '  "tokenName": "', tokenName, '",\n',
    //         '  "tokenSymbol": "', tokenSymbol, '",\n',
    //         '  "tokenCurrency": "', tokenCurrency, '",\n',
    //         '  "network": "', _getNetworkName(), '",\n',
    //         '  "deployedAt": "', vm.toString(block.timestamp), '"\n',
    //         "}"
    //     );
        
    //     string memory outputPath = string.concat(
    //         "deployments/",
    //         _getNetworkName(),
    //         "-deployment.json"
    //     );
        
    //     vm.writeFile(outputPath, deploymentInfo);
    //     console2.log("Deployment info saved to:", outputPath);
    // }
    
    // function _getNetworkName() internal view returns (string memory) {
    //     uint256 chainId = block.chainid;
        
    //     if (chainId == 1234) return "tempo-testnet"; // Update with actual chain ID
    //     if (chainId == 5678) return "tempo-mainnet"; // Update with actual chain ID
        
    //     return string.concat("chain-", vm.toString(chainId));
    // }
}