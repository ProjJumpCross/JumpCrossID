import {
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox-viem/network-helpers";
import { expect } from "chai";
import hre from "hardhat";
import { parseEther, BaseError, parseAbiItem } from "viem";
import { getCustomError } from "./utils";
import { account0, account1, defaultTokenURI } from "./config";


describe("JumpCrossIDTest", function () {
  async function deploy() {

    const jcid = await hre.viem.deployContract("JumpCrossID", [
      account0,
      defaultTokenURI
    ])

    const publicClient = await hre.viem.getPublicClient();

    return {
      jcid,
      publicClient,
    };
  }

  describe("Deployment", function () {
    it("Should set the right initial values", async function () {
      const { jcid } = await loadFixture(deploy);
      
      expect(await jcid.read.owner()).to.equal(account0);
      expect(await jcid.read.defaultTokenURI()).to.equal(defaultTokenURI);
    });
  });

  describe("ERC721SBT functions", function () {
    it("transferFrom should be revert", async function () {
      const { jcid } = await loadFixture(deploy);
      try {
        await jcid.read.transferFrom([account0, account1, BigInt(0)]);
        throw new Error("Should not be here, since the account is not the owner");
      } catch(err) {
        if (err instanceof BaseError) {
          const customError = getCustomError(err);
          expect(customError).to.equal("SBTLocked()");
        } else {
          throw err;
        }
      }
    });

    it("approve should be revert", async function () {
      const { jcid } = await loadFixture(deploy);
      try {
        await jcid.read.approve([account1, BigInt(0)]);
        throw new Error("Should not be here, since the account is not the owner");
      } catch(err) {
        if (err instanceof BaseError) {
          const customError = getCustomError(err);
          expect(customError).to.equal("SBTLocked()");
        } else {
          throw err;
        }
      }
    });

    it("setApprovalForAll should be revert", async function () {
      const { jcid } = await loadFixture(deploy);
      try {
        await jcid.read.setApprovalForAll([account0, true]);
        throw new Error("Should not be here, since the account is not the owner");
      } catch(err) {
        if (err instanceof BaseError) {
          const customError = getCustomError(err);
          expect(customError).to.equal("SBTLocked()");
        } else {
          throw err;
        }
      }
    });

    it("safeTransferFrom should be revert", async function () {
      const { jcid } = await loadFixture(deploy);
      try {
        await jcid.read.safeTransferFrom([account0, account1, BigInt(0)]);
        throw new Error("Should not be here, since the account is not the owner");
      } catch(err) {
        if (err instanceof BaseError) {
          const customError = getCustomError(err);
          expect(customError).to.equal("SBTLocked()");
        } else {
          throw err;
        }
      }
    });

    it("safeTransferFrom should be revert", async function () {
      const { jcid } = await loadFixture(deploy);
      try {
        await jcid.read.safeTransferFrom([account0, account1, BigInt(0), "0x00"]);
        throw new Error("Should not be here, since the account is not the owner");
      } catch(err) {
        if (err instanceof BaseError) {
          const customError = getCustomError(err);
          expect(customError).to.equal("SBTLocked()");
        } else {
          throw err;
        }
      }
    });

    it("getApproved should be address(0)", async function () {
      const { jcid } = await loadFixture(deploy);
      const approved = await jcid.read.getApproved([BigInt(0)]);
      expect(approved).to.equal("0x0000000000000000000000000000000000000000");
    });

    it("isApprovedForAll should be false", async function () {
      const { jcid } = await loadFixture(deploy);
      const approved = await jcid.read.isApprovedForAll([account0, account1]);
      expect(approved).to.equal(false);
    });
  });

  describe("The Fee", function () {
    it("The nameFee should be 0 ether", async function () {
      const { jcid } = await loadFixture(deploy);
      const wordFee = await jcid.read.calculateWordFee(["testName"]);
      expect(wordFee).to.equal(parseEther("0"));
    })

    it("The nameFee should be 0.0003 ether", async function () {
      const { jcid } = await loadFixture(deploy);
      const wordFee = await jcid.read.calculateWordFee(["test0"]);
      expect(wordFee).to.equal(parseEther("0.0003"));
    })

    it("The wordFee should be 0.003 ether", async function () {
      const { jcid } = await loadFixture(deploy);
      const wordFee = await jcid.read.calculateWordFee(["test"]);
      expect(wordFee).to.equal(parseEther("0.003"));
    })

    it("The wordFee should be 0.03 ether", async function () {
      const { jcid } = await loadFixture(deploy);
      const wordFee = await jcid.read.calculateWordFee(["x"]);
      expect(wordFee).to.equal(parseEther("0.03"));
    })
  })

  describe("Minting", function () {
    it("Mint with charcter number > 5, require amount == 0.0003 ether", async function () {
      const { jcid, publicClient } = await loadFixture(deploy);

      const addr = account0
      const tx = await jcid.write.mint([addr, "testName"], {value: parseEther("0.0003")});
      const receipt = await publicClient.waitForTransactionReceipt({hash: tx});
      expect(receipt.status).to.equal("success");
      expect(await jcid.read.balanceOf([addr])).to.equal(BigInt(1));
      expect(await jcid.read.ownerOf([BigInt(0)])).to.equal(addr);
      expect(await jcid.read.forwardResolution(["testName"])).to.equal(addr);
      expect(await jcid.read.reverseResolution([addr])).to.equal("testName");

      try {
        const filter = await publicClient.createEventFilter({ 
          address: jcid.address,
          event: parseAbiItem('event Transfer(address indexed,address indexed,uint256 indexed)'),
        })
        const logs = await publicClient.getFilterLogs({ filter })
        const eventName = logs[0].eventName
        const args = logs[0].args

        expect(eventName).to.equal("Transfer")
        expect(args[0]).to.equal("0x0000000000000000000000000000000000000000")
        expect(args[1]).to.equal(addr)
        expect(args[2]).to.equal(BigInt(0))
      } catch (err) {
        throw err
      }
    })

    it("Mint with charcter number == 5, require amount == 0.0006 ether", async function () {
      const { jcid, publicClient } = await loadFixture(deploy);

      const addr = account0
      const tx = await jcid.write.mint([addr, "testName"], {value: parseEther("0.0006")});
      const receipt = await publicClient.waitForTransactionReceipt({hash: tx});
      expect(receipt.status).to.equal("success");
      expect(await jcid.read.balanceOf([addr])).to.equal(BigInt(1));
      expect(await jcid.read.ownerOf([BigInt(0)])).to.equal(addr);
      expect(await jcid.read.forwardResolution(["testName"])).to.equal(addr);
      expect(await jcid.read.reverseResolution([addr])).to.equal("testName");
    })

    it("Mint with charcter number >= 3 && < 5, require amount == 0.0033 ether", async function () {
      const { jcid, publicClient } = await loadFixture(deploy);

      // Should be failed, due to insufficient funds
      try {
        const addr = account0
        await jcid.write.mint([addr, "test"], {value: parseEther("0.002")});
        
        throw new Error("Should not be here, since it should be reverted due to insufficient funds");
      } catch (err) {
        if (err instanceof BaseError) {
          const customError = getCustomError(err);
          expect(customError).to.equal(`InssufficientFunds(${parseEther("0.0033")}, ${parseEther("0.002")})`);
        } else {
          throw err;
        }
      }

      // Should be successful
      const addr = account0
      const tx = await jcid.write.mint([addr, "test"], {value: parseEther("0.0033")});
      const receipt = await publicClient.waitForTransactionReceipt({hash: tx});
      expect(receipt.status).to.equal("success");

      // Should be failed, due to SBT already exists
      try {
        const addr = account0
        await jcid.write.mint([addr, "test"], {value: parseEther("0.006")});
        
        throw new Error("Should not be here, since it should be reverted due to SBT already exists");
      } catch (err) {
        if (err instanceof BaseError) {
          const customError = getCustomError(err);
          expect(customError).to.equal("UserNameHasBeenTaken()");
        } else {
          throw err;
        }
      }
    })

    it("Mint with charcter number >= 1 && < 3, require amount == 0.0303 ether", async function () {
      const { jcid, publicClient } = await loadFixture(deploy);

      const addr = account0
      const tx = await jcid.write.mint([addr, "x"], {value: parseEther("0.0303")});
      const receipt = await publicClient.waitForTransactionReceipt({hash: tx});
      expect(receipt.status).to.equal("success");
      expect(await jcid.read.balanceOf([addr])).to.equal(BigInt(1));
      expect(await jcid.read.ownerOf([BigInt(0)])).to.equal(addr);
      expect(await jcid.read.forwardResolution(["x"])).to.equal(addr);
      expect(await jcid.read.reverseResolution([addr])).to.equal("x");

      // Test using the name that has already been taken
      try {
        const addr = account1
        await jcid.write.mint([addr, "x"], {value: parseEther("0.0303")});
        
        throw new Error("Should not be here, since it should be reverted due to SBT already exists");
      } catch (err) {
        if (err instanceof BaseError) {
          const customError = getCustomError(err);
          expect(customError).to.equal("UserNameHasBeenTaken()");
        } else {
          throw err;
        }
      }
    })

    it ("Mint with charcter number == 0", async function () {
      const { jcid } = await loadFixture(deploy);

      try {
        const addr = account0
        await jcid.write.mint([addr, ""], {value: parseEther("0.0006")});
        throw new Error("Should not be here, since it should be reverted due to name length == 0");
      } catch (err) {
        if (err instanceof BaseError) {
          const customError = getCustomError(err);
          expect(customError).to.equal("InvalidUserName(0)");
        } else {
          throw err;
        }
      }
    })

    it ("Mint with charcter number > 32", async function () {
      const { jcid } = await loadFixture(deploy);

      try {
        const addr = account0
        const testName = "a".repeat(33);
        await jcid.write.mint([addr, testName], {value: parseEther("0.0006")});
        throw new Error("Should not be here, since it should be reverted due to name length == 0");
      } catch (err) {
        if (err instanceof BaseError) {
          const customError = getCustomError(err);
          expect(customError).to.equal("InvalidUserName(33)");
        } else {
          throw err;
        }
      }
    })
  });

  describe("Owner tests", function () {
    it("Set mint fee", async function () {
      const { jcid, publicClient } = await loadFixture(deploy);

      const tx = await jcid.write.setMintFee([parseEther("0.01")]);
      const receipt = await publicClient.waitForTransactionReceipt({hash: tx});

      expect(receipt.status).to.equal("success");
      expect(await jcid.read.mintFee()).to.equal(parseEther("0.01"));

      try {
        const filter = await publicClient.createEventFilter({ 
          address: jcid.address,
          event: parseAbiItem('event UpdateMintFee(uint256 indexed)'),
        })
        const logs = await publicClient.getFilterLogs({ filter })
        const eventName = logs[0].eventName
        const args = logs[0].args

        expect(eventName).to.equal("UpdateMintFee")
        expect(args[0]).to.equal(parseEther("0.01"))
      } catch (err) {
        throw err
      }
    })

    it("Set mint fee with not owner", async function () {
      const { jcid } = await loadFixture(deploy);

      try {
        await jcid.write.setMintFee(
          [parseEther("0.01")], 
          {account: account1}
        );
        throw new Error("Should not be here, since the account is not the owner");
      } catch(err) {
        if (err instanceof BaseError) {
          const customError = getCustomError(err);
          expect(customError).to.equal("OnlyOwnerExecutable()");
        } else {
          throw err;
        }
      }
    })

    it("Update token URI", async function () {
      const { jcid, publicClient } = await loadFixture(deploy);

      let tx = await jcid.write.mint(
        [account0, "testName"],
        {value: parseEther("0.0006")}
      );
      let receipt = await publicClient.waitForTransactionReceipt({hash: tx});

      expect(receipt.status).to.equal("success");
      expect(await jcid.read.tokenURI([BigInt(0)])).to.equal(defaultTokenURI);

      tx = await jcid.write.updateTokenURI([BigInt(0), "ipfs://test"]);
      receipt = await publicClient.waitForTransactionReceipt({hash: tx});

      expect(receipt.status).to.equal("success");
      expect(await jcid.read.tokenURI([BigInt(0)])).to.equal("ipfs://test");
    });

    it("Update token URI with not owner", async function () {
      const { jcid } = await loadFixture(deploy);

      try {
        await jcid.write.updateTokenURI([BigInt(0), "ipfs://test"], {account: account1});
        throw new Error("Should not be here, since the account is not the owner");
      } catch (err) {
        if (err instanceof BaseError) {
          const customError = getCustomError(err);
          expect(customError).to.equal("OnlyOwnerExecutable()");
        } else {
          throw err;
        }
      }
    });

    it("Update token URI with nonexistent tokenId", async function () {
      const { jcid } = await loadFixture(deploy);

      try {
        await jcid.write.updateTokenURI([BigInt(1), "ipfs://test"]);
        throw new Error("Should not be here, since the tokenId is not valid");
      } catch (err) {
        if (err instanceof BaseError) {
          const customError = getCustomError(err);
          expect(customError).to.equal("NonExistentToken()");
        } else {
          throw err;
        }
      }
    })

    it("Set base word fee", async function () {
      const { jcid, publicClient } = await loadFixture(deploy);

      const tx = await jcid.write.setBaseWordFee([parseEther("0.001")]);
      const receipt = await publicClient.waitForTransactionReceipt({hash: tx});

      expect(receipt.status).to.equal("success");
      expect(await jcid.read.wordFee()).to.equal(parseEther("0.001"));

      try {
        const filter = await publicClient.createEventFilter({ 
          address: jcid.address,
          event: parseAbiItem('event UpdateWordFee(uint256 indexed)'),
        })
        const logs = await publicClient.getFilterLogs({ filter })
        const eventName = logs[0].eventName
        const args = logs[0].args

        expect(eventName).to.equal("UpdateWordFee")
        expect(args[0]).to.equal(parseEther("0.001"))
      } catch (err) {
        throw err
      }
    })

    it("Set base word fee with not owner", async function () {
      const { jcid } = await loadFixture(deploy);

      try {
        await jcid.write.setBaseWordFee(
          [parseEther("0.001")], 
          {account: account1}
        );
        throw new Error("Should not be here, since the account is not the owner");
      } catch(err) {
        if (err instanceof BaseError) {
          const customError = getCustomError(err);
          expect(customError).to.equal("OnlyOwnerExecutable()");
        } else {
          throw err;
        }
      }
    })

    it("Set word fee tier", async function () {
      const { jcid, publicClient } = await loadFixture(deploy);
      
      const tx = await jcid.write.setWordFeeTier([BigInt(2), BigInt(60)]);
      const receipt = await publicClient.waitForTransactionReceipt({hash: tx});

      expect(receipt.status).to.equal("success");
      expect(await jcid.read.wordFeeTiers([BigInt(2)])).to.equal(BigInt(60));

      try {
        const filter = await publicClient.createEventFilter({ 
          address: jcid.address,
          event: parseAbiItem('event UpdateWordMultiplier(uint256 indexed,uint256 indexed)'),
        })
        const logs = await publicClient.getFilterLogs({ filter })
        const eventName = logs[0].eventName
        const args = logs[0].args

        expect(eventName).to.equal("UpdateWordMultiplier")
        expect(args[0]).to.equal(BigInt(2))
        expect(args[1]).to.equal(BigInt(60))
      } catch (err) {
        throw err
      }
    })

    it("Change owner", async function () {
      const { jcid, publicClient } = await loadFixture(deploy);

      const newAddr = account1
      const tx = await jcid.write.changeOwner([newAddr]);
      const receipt = await publicClient.waitForTransactionReceipt({hash: tx});

      expect(receipt.status).to.equal("success");
      expect(await jcid.read.owner()).to.equal(newAddr);
    })

    it("Change owner with not owner", async function () {
      const { jcid } = await loadFixture(deploy);

      const newAddr = account1
      
      try {
        await jcid.write.changeOwner([newAddr], {account: newAddr});
        throw new Error("Should not be here, since the account is not the owner");
      } catch (err) {
        if (err instanceof BaseError) {
          const customError = getCustomError(err);
          expect(customError).to.equal("OnlyOwnerExecutable()");
        } else {
          throw err;
        }
      }
    });

    it("Change owner with same address", async function () {
      const { jcid } = await loadFixture(deploy);

      const newAddr = account0
      
      try {
        await jcid.write.changeOwner([newAddr], {account: newAddr});
        throw new Error("Should not be here, since the account is same as the owner");
      } catch (err) {
        if (err instanceof BaseError) {
          const customError = getCustomError(err);
          expect(customError).to.equal("InvalidAddress()");
        } else {
          throw err;
        }
      }
    });

    it("Test withdraw", async function () {
      const { jcid, publicClient } = await loadFixture(deploy);
    
      let tx = await jcid.write.mint(
        [account1, "x"], 
        {
          account: account1,
          value: parseEther("0.0303")
        }
      );
      let receipt = await publicClient.waitForTransactionReceipt({hash: tx});
      expect(receipt.status).to.equal("success");

      const initBalance = await publicClient.getBalance({
        address: account0,
        blockTag: 'safe'
      })

      tx = await jcid.write.withdraw();
      receipt = await publicClient.waitForTransactionReceipt({hash: tx});

      expect(receipt.status).to.equal("success");

      const newBalance = await publicClient.getBalance({
        address: account0,
        blockTag: 'safe'
      })

      const tolerance = Number(parseEther("0.0001"));
      expect(Number(newBalance - initBalance)).to.approximately(Number(parseEther("0.0303")), tolerance);
     
    });

    it("Test withdraw with not owner", async function () {
      const { jcid } = await loadFixture(deploy);

      try {
        await jcid.write.withdraw({account: account1});
        throw new Error("Should not be here, since the account is not the owner");
      } catch (err) {
        if (err instanceof BaseError) {
          const customError = getCustomError(err);
          expect(customError).to.equal("OnlyOwnerExecutable()");
        } else {
          throw err;
        }
      }
    })
  });
});
