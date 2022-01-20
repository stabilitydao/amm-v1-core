import { ethers } from "hardhat"
const { keccak256, defaultAbiCoder } = require("ethers")
import { expect } from "chai"
import { prepare, deploy, getBigNumber, createSLP } from "../utilities"

describe("KashiReactMaker", function () {
  before(async function () {
    await prepare(this, [
      "XLendFees",
      "XStakeBar",
      "ReactMakerKashiExploitMock",
      "ERC20Mock",
      "Factory",
      "Pair",
      "BentoBoxV1",
      "KashiPairMediumRiskV1",
      "PeggedOracleV1",
    ])
  })

  beforeEach(async function () {
    // Deploy ERC20 Mocks and Factory
    await deploy(this, [
      ["react", this.ERC20Mock, ["REACT", "REACT", getBigNumber("10000000")]],
      ["dai", this.ERC20Mock, ["DAI", "DAI", getBigNumber("10000000")]],
      ["mic", this.ERC20Mock, ["MIC", "MIC", getBigNumber("10000000")]],
      ["usdc", this.ERC20Mock, ["USDC", "USDC", getBigNumber("10000000")]],
      ["weth", this.ERC20Mock, ["WETH", "ETH", getBigNumber("10000000")]],
      ["strudel", this.ERC20Mock, ["$TRDL", "$TRDL", getBigNumber("10000000")]],
      ["factory", this.Factory, [this.alice.address]],
    ])
    // Deploy React and Kashi contracts
    await deploy(this, [["bar", this.XStakeBar, [this.react.address]]])
    await deploy(this, [["vault", this.BentoBoxV1, [this.weth.address]]])
    await deploy(this, [["banker", this.KashiPairMediumRiskV1, [this.vault.address]]])
    await deploy(this, [
      [
        "reactMaker",
        this.XLendFees,
        [this.factory.address, this.bar.address, this.vault.address, this.react.address, this.weth.address, this.factory.pairCodeHash()],
      ],
    ])
    await deploy(this, [["exploiter", this.ReactMakerKashiExploitMock, [this.reactMaker.address]]])
    await deploy(this, [["oracle", this.PeggedOracleV1]])
    // Create SLPs
    await createSLP(this, "reactEth", this.react, this.weth, getBigNumber(10))
    await createSLP(this, "strudelEth", this.strudel, this.weth, getBigNumber(10))
    await createSLP(this, "daiEth", this.dai, this.weth, getBigNumber(10))
    await createSLP(this, "usdcEth", this.usdc, this.weth, getBigNumber(10))
    await createSLP(this, "micUSDC", this.mic, this.usdc, getBigNumber(10))
    await createSLP(this, "reactUSDC", this.react, this.usdc, getBigNumber(10))
    await createSLP(this, "daiUSDC", this.dai, this.usdc, getBigNumber(10))
    await createSLP(this, "daiMIC", this.dai, this.mic, getBigNumber(10))
    // Set Kashi fees to Maker
    await this.banker.setFeeTo(this.reactMaker.address)
    // Whitelist Kashi on Bento
    await this.vault.whitelistMasterContract(this.banker.address, true)
    // Approve and make Bento token deposits
    await this.react.approve(this.vault.address, getBigNumber(10))
    await this.dai.approve(this.vault.address, getBigNumber(10))
    await this.mic.approve(this.vault.address, getBigNumber(10))
    await this.usdc.approve(this.vault.address, getBigNumber(10))
    await this.weth.approve(this.vault.address, getBigNumber(10))
    await this.strudel.approve(this.vault.address, getBigNumber(10))
    await this.vault.deposit(this.react.address, this.alice.address, this.alice.address, getBigNumber(10), 0)
    await this.vault.deposit(this.dai.address, this.alice.address, this.alice.address, getBigNumber(10), 0)
    await this.vault.deposit(this.mic.address, this.alice.address, this.alice.address, getBigNumber(10), 0)
    await this.vault.deposit(this.usdc.address, this.alice.address, this.alice.address, getBigNumber(10), 0)
    await this.vault.deposit(this.weth.address, this.alice.address, this.alice.address, getBigNumber(10), 0)
    await this.vault.deposit(this.strudel.address, this.alice.address, this.alice.address, getBigNumber(10), 0)
    // Approve Kashi to spend 'alice' Bento tokens
    await this.vault.setMasterContractApproval(
      this.alice.address,
      this.banker.address,
      true,
      "0",
      "0x0000000000000000000000000000000000000000000000000000000000000000",
      "0x0000000000000000000000000000000000000000000000000000000000000000"
    )
    // **TO-DO - Initialize Kashi Pair**
    //const oracleData = await this.oracle.getDataParameter("1")
    //const initData = defaultAbiCoder.encode(["address", "address", "address", "bytes"], [this.react.address, this.dai.address, this.oracle.address, oracleData])
    //await this.vault.deploy(this.KashiMaster.address, initData, true)
  })

  describe("setBridge", function () {
    it("only allows the owner to set bridge", async function () {
      await expect(
        this.reactMaker.connect(this.bob).setBridge(this.react.address, this.weth.address, { from: this.bob.address })
      ).to.be.revertedWith("Ownable: caller is not the owner")
    })

    it("does not allow to set bridge for React", async function () {
      await expect(this.reactMaker.setBridge(this.react.address, this.weth.address)).to.be.revertedWith("Maker: Invalid bridge")
    })

    it("does not allow to set bridge for WETH", async function () {
      await expect(this.reactMaker.setBridge(this.weth.address, this.react.address)).to.be.revertedWith("Maker: Invalid bridge")
    })

    it("does not allow to set bridge to itself", async function () {
      await expect(this.reactMaker.setBridge(this.dai.address, this.dai.address)).to.be.revertedWith("Maker: Invalid bridge")
    })

    it("emits correct event on bridge", async function () {
      await expect(this.reactMaker.setBridge(this.dai.address, this.react.address))
        .to.emit(this.reactMaker, "LogBridgeSet")
        .withArgs(this.dai.address, this.react.address)
    })
  })

  describe("convert", function () {
    it("reverts if caller is not EOA", async function () {
      await expect(this.exploiter.convert(this.react.address)).to.be.revertedWith("Maker: Must use EOA")
    })
  })
})
