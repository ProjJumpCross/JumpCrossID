import {
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox-viem/network-helpers";
import { expect } from "chai";
import hre from "hardhat";
import { createTestClient, http, parseEther, publicActions, walletActions, BaseError, ContractFunctionRevertedError } from "viem";
import { hardhat } from "viem/chains";

describe("JumpCrossIDTest", function () {
  async function deploy() {
    const testClient = createTestClient({
      chain: hardhat,
      mode: 'hardhat',
      transport: http(),
    })
    .extend(publicActions)
    .extend(walletActions);

    await testClient.impersonateAccount({ 
      address: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"
    })

    const defaultTokenURI = "ipfs://QmWderTZk6hezjcPui4Ft68Kbtxw3HvvAijEWtCHPUdHE2"

    const jcid = await hre.viem.deployContract("JumpCrossID", [
      "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
      defaultTokenURI
    ])

    const publicClient = await hre.viem.getPublicClient();

    return {
      jcid,
      testClient,
      publicClient,
    };
  }

  describe("Deployment", function () {
    it("Should set the right initial values", async function () {
      const { jcid, testClient, publicClient } = await loadFixture(deploy);

      expect(await jcid.read.owner()).to.equal("0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266");
      expect(await jcid.read.defaultTokenURI()).to.equal("ipfs://QmWderTZk6hezjcPui4Ft68Kbtxw3HvvAijEWtCHPUdHE2");
    });
  });

  describe("The Fee", function () {
    it("The nameFee should be 0 ether", async function () {
      const { jcid, testClient, publicClient } = await loadFixture(deploy);
      const wordFee = await jcid.read.calculateWordFee(["testName"]);
      expect(wordFee).to.equal(parseEther("0"));
    })

    it("The nameFee should be 0.0003 ether", async function () {
      const { jcid, testClient, publicClient } = await loadFixture(deploy);
      const wordFee = await jcid.read.calculateWordFee(["test0"]);
      expect(wordFee).to.equal(parseEther("0.0003"));
    })

    it("The wordFee should be 0.003 ether", async function () {
      const { jcid, testClient, publicClient } = await loadFixture(deploy);
      const wordFee = await jcid.read.calculateWordFee(["test"]);
      expect(wordFee).to.equal(parseEther("0.003"));
    })

    it("The wordFee should be 0.03 ether", async function () {
      const { jcid, testClient, publicClient } = await loadFixture(deploy);
      const wordFee = await jcid.read.calculateWordFee(["x"]);
      expect(wordFee).to.equal(parseEther("0.03"));
    })
  })

  describe("Minting", function () {
    it("Mint with charcter number > 5, require amount == 0.0003 ether", async function () {
      const { jcid, testClient, publicClient } = await loadFixture(deploy);

      const addr = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"
      const tx = await jcid.write.mint([addr, "testName"], {value: parseEther("0.0003")});
      const receipt = await publicClient.waitForTransactionReceipt({hash: tx});
      expect(receipt.status).to.equal("success");
      expect(await jcid.read.balanceOf([addr])).to.equal(BigInt(1));
      expect(await jcid.read.ownerOf([BigInt(0)])).to.equal(addr);
      expect(await jcid.read.forwardResolution(["testName"])).to.equal(addr);
      expect(await jcid.read.reverseResolution([addr])).to.equal("testName");
    })

    it("Mint with charcter number == 5, require amount == 0.0006 ether", async function () {
      const { jcid, testClient, publicClient } = await loadFixture(deploy);

      const addr = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"
      const tx = await jcid.write.mint([addr, "testName"], {value: parseEther("0.0006")});
      const receipt = await publicClient.waitForTransactionReceipt({hash: tx});
      expect(receipt.status).to.equal("success");
      expect(await jcid.read.balanceOf([addr])).to.equal(BigInt(1));
      expect(await jcid.read.ownerOf([BigInt(0)])).to.equal(addr);
      expect(await jcid.read.forwardResolution(["testName"])).to.equal(addr);
      expect(await jcid.read.reverseResolution([addr])).to.equal("testName");
    })

    it("mint with charcter number >= 3 && < 5, require amount == 0.0033 ether", async function () {
      const { jcid, testClient, publicClient } = await loadFixture(deploy);

      // Should be failed, due to insufficient funds
      try {
        const addr = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"
        await jcid.write.mint([addr, "test"], {value: parseEther("0.002")});
        
        throw new Error("Should not be here, since it should be reverted due to insufficient funds");
      } catch (err) {
        if (err instanceof BaseError) {
          const revertError = err.walk(err => err instanceof ContractFunctionRevertedError)

          if (revertError instanceof ContractFunctionRevertedError) {
            const errorName = revertError.data?.errorName ?? ''
            
            expect(errorName).to.equal('InssufficientFunds()');
          }
        }
      }

      // Should be successful
      const addr = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"
      const tx = await jcid.write.mint([addr, "test"], {value: parseEther("0.0033")});
      const receipt = await publicClient.waitForTransactionReceipt({hash: tx});
      expect(receipt.status).to.equal("success");

      // Should be failed, due to SBT already exists
      try {
        const addr = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8"
        await jcid.write.mint([addr, "test"], {value: parseEther("0.006")});
        
        throw new Error("Should not be here, since it should be reverted due to SBT already exists");
      } catch (err) {
        if (err instanceof BaseError) {
          const revertError = err.walk(err => err instanceof ContractFunctionRevertedError)
          if (revertError instanceof ContractFunctionRevertedError) {
            const errorName = revertError.data?.errorName ?? ''
            
            expect(errorName).to.equal('SBTAlreadyExists()');
          }
        }
      }
    })

    it("mint with charcter number >= 1 && < 3, require amount == 0.0303 ether", async function () {
      const { jcid, testClient, publicClient } = await loadFixture(deploy);

      const addr = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"
      const tx = await jcid.write.mint([addr, "x"], {value: parseEther("0.0303")});
      const receipt = await publicClient.waitForTransactionReceipt({hash: tx});
      expect(receipt.status).to.equal("success");
      expect(await jcid.read.balanceOf([addr])).to.equal(BigInt(1));
      expect(await jcid.read.ownerOf([BigInt(0)])).to.equal(addr);
      expect(await jcid.read.forwardResolution(["x"])).to.equal(addr);
      expect(await jcid.read.reverseResolution([addr])).to.equal("x");

      // Test using the name that has already been taken
      try {
        const addr = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8"
        await jcid.write.mint([addr, "x"], {value: parseEther("0.0303")});
        
        throw new Error("Should not be here, since it should be reverted due to SBT already exists");
      } catch (err) {
        if (err instanceof BaseError) {
          const revertError = err.walk(err => err instanceof ContractFunctionRevertedError)
          if (revertError instanceof ContractFunctionRevertedError) {
            const errorName = revertError.data?.errorName ?? ''
            
            expect(errorName).to.equal('UserNameHasBeenTaken()');
          }
        }
      }
    })
  });
});
