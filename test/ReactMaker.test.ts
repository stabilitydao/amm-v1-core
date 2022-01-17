import { expect } from "chai";
import { prepare, deploy, getBigNumber, createSLP } from "./utilities"

describe("ReactMaker", function () {
  before(async function () {
    await prepare(this, ["ReactMaker", "ReactBar", "ReactMakerExploitMock", "ERC20Mock", "Factory", "Pair"])
  })

  beforeEach(async function () {
    await deploy(this, [
      ["react", this.ERC20Mock, ["REACT", "REACT", getBigNumber("10000000")]],
      ["dai", this.ERC20Mock, ["DAI", "DAI", getBigNumber("10000000")]],
      ["mic", this.ERC20Mock, ["MIC", "MIC", getBigNumber("10000000")]],
      ["usdc", this.ERC20Mock, ["USDC", "USDC", getBigNumber("10000000")]],
      ["weth", this.ERC20Mock, ["WETH", "ETH", getBigNumber("10000000")]],
      ["strudel", this.ERC20Mock, ["$TRDL", "$TRDL", getBigNumber("10000000")]],
      ["factory", this.Factory, [this.alice.address]],
    ])
    await deploy(this, [["bar", this.ReactBar, [this.react.address]]])
    await deploy(this, [["reactMaker", this.ReactMaker, [this.factory.address, this.bar.address, this.react.address, this.weth.address]]])
    await deploy(this, [["exploiter", this.ReactMakerExploitMock, [this.reactMaker.address]]])
    await createSLP(this, "reactEth", this.react, this.weth, getBigNumber(10))
    await createSLP(this, "strudelEth", this.strudel, this.weth, getBigNumber(10))
    await createSLP(this, "daiEth", this.dai, this.weth, getBigNumber(10))
    await createSLP(this, "usdcEth", this.usdc, this.weth, getBigNumber(10))
    await createSLP(this, "micUSDC", this.mic, this.usdc, getBigNumber(10))
    await createSLP(this, "reactUSDC", this.react, this.usdc, getBigNumber(10))
    await createSLP(this, "daiUSDC", this.dai, this.usdc, getBigNumber(10))
    await createSLP(this, "daiMIC", this.dai, this.mic, getBigNumber(10))
  })
  describe("setBridge", function () {
    it("does not allow to set bridge for React", async function () {
      await expect(this.reactMaker.setBridge(this.react.address, this.weth.address)).to.be.revertedWith("ReactMaker: Invalid bridge")
    })

    it("does not allow to set bridge for WETH", async function () {
      await expect(this.reactMaker.setBridge(this.weth.address, this.react.address)).to.be.revertedWith("ReactMaker: Invalid bridge")
    })

    it("does not allow to set bridge to itself", async function () {
      await expect(this.reactMaker.setBridge(this.dai.address, this.dai.address)).to.be.revertedWith("ReactMaker: Invalid bridge")
    })

    it("emits correct event on bridge", async function () {
      await expect(this.reactMaker.setBridge(this.dai.address, this.react.address))
        .to.emit(this.reactMaker, "LogBridgeSet")
        .withArgs(this.dai.address, this.react.address)
    })
  })
  describe("convert", function () {
    it("should convert REACT - ETH", async function () {
      await this.reactEth.transfer(this.reactMaker.address, getBigNumber(1))
      await this.reactMaker.convert(this.react.address, this.weth.address)
      expect(await this.react.balanceOf(this.reactMaker.address)).to.equal(0)
      expect(await this.reactEth.balanceOf(this.reactMaker.address)).to.equal(0)
      expect(await this.react.balanceOf(this.bar.address)).to.equal("1897569270781234370")
    })

    it("should convert USDC - ETH", async function () {
      await this.usdcEth.transfer(this.reactMaker.address, getBigNumber(1))
      await this.reactMaker.convert(this.usdc.address, this.weth.address)
      expect(await this.react.balanceOf(this.reactMaker.address)).to.equal(0)
      expect(await this.usdcEth.balanceOf(this.reactMaker.address)).to.equal(0)
      expect(await this.react.balanceOf(this.bar.address)).to.equal("1590898251382934275")
    })

    it("should convert $TRDL - ETH", async function () {
      await this.strudelEth.transfer(this.reactMaker.address, getBigNumber(1))
      await this.reactMaker.convert(this.strudel.address, this.weth.address)
      expect(await this.react.balanceOf(this.reactMaker.address)).to.equal(0)
      expect(await this.strudelEth.balanceOf(this.reactMaker.address)).to.equal(0)
      expect(await this.react.balanceOf(this.bar.address)).to.equal("1590898251382934275")
    })

    it("should convert USDC - REACT", async function () {
      await this.reactUSDC.transfer(this.reactMaker.address, getBigNumber(1))
      await this.reactMaker.convert(this.usdc.address, this.react.address)
      expect(await this.react.balanceOf(this.reactMaker.address)).to.equal(0)
      expect(await this.reactUSDC.balanceOf(this.reactMaker.address)).to.equal(0)
      expect(await this.react.balanceOf(this.bar.address)).to.equal("1897569270781234370")
    })

    it("should convert using standard ETH path", async function () {
      await this.daiEth.transfer(this.reactMaker.address, getBigNumber(1))
      await this.reactMaker.convert(this.dai.address, this.weth.address)
      expect(await this.react.balanceOf(this.reactMaker.address)).to.equal(0)
      expect(await this.daiEth.balanceOf(this.reactMaker.address)).to.equal(0)
      expect(await this.react.balanceOf(this.bar.address)).to.equal("1590898251382934275")
    })

    it("converts MIC/USDC using more complex path", async function () {
      await this.micUSDC.transfer(this.reactMaker.address, getBigNumber(1))
      await this.reactMaker.setBridge(this.usdc.address, this.react.address)
      await this.reactMaker.setBridge(this.mic.address, this.usdc.address)
      await this.reactMaker.convert(this.mic.address, this.usdc.address)
      expect(await this.react.balanceOf(this.reactMaker.address)).to.equal(0)
      expect(await this.micUSDC.balanceOf(this.reactMaker.address)).to.equal(0)
      expect(await this.react.balanceOf(this.bar.address)).to.equal("1590898251382934275")
    })

    it("converts DAI/USDC using more complex path", async function () {
      await this.daiUSDC.transfer(this.reactMaker.address, getBigNumber(1))
      await this.reactMaker.setBridge(this.usdc.address, this.react.address)
      await this.reactMaker.setBridge(this.dai.address, this.usdc.address)
      await this.reactMaker.convert(this.dai.address, this.usdc.address)
      expect(await this.react.balanceOf(this.reactMaker.address)).to.equal(0)
      expect(await this.daiUSDC.balanceOf(this.reactMaker.address)).to.equal(0)
      expect(await this.react.balanceOf(this.bar.address)).to.equal("1590898251382934275")
    })

    it("converts DAI/MIC using two step path", async function () {
      await this.daiMIC.transfer(this.reactMaker.address, getBigNumber(1))
      await this.reactMaker.setBridge(this.dai.address, this.usdc.address)
      await this.reactMaker.setBridge(this.mic.address, this.dai.address)
      await this.reactMaker.convert(this.dai.address, this.mic.address)
      expect(await this.react.balanceOf(this.reactMaker.address)).to.equal(0)
      expect(await this.daiMIC.balanceOf(this.reactMaker.address)).to.equal(0)
      expect(await this.react.balanceOf(this.bar.address)).to.equal("1200963016721363748")
    })

    it("reverts if it loops back", async function () {
      await this.daiMIC.transfer(this.reactMaker.address, getBigNumber(1))
      await this.reactMaker.setBridge(this.dai.address, this.mic.address)
      await this.reactMaker.setBridge(this.mic.address, this.dai.address)
      await expect(this.reactMaker.convert(this.dai.address, this.mic.address)).to.be.reverted
    })

    it("reverts if caller is not EOA", async function () {
      await this.reactEth.transfer(this.reactMaker.address, getBigNumber(1))
      await expect(this.exploiter.convert(this.react.address, this.weth.address)).to.be.revertedWith("ReactMaker: must use EOA")
    })

    it("reverts if pair does not exist", async function () {
      await expect(this.reactMaker.convert(this.mic.address, this.micUSDC.address)).to.be.revertedWith("ReactMaker: Invalid pair")
    })

    it("reverts if no path is available", async function () {
      await this.micUSDC.transfer(this.reactMaker.address, getBigNumber(1))
      await expect(this.reactMaker.convert(this.mic.address, this.usdc.address)).to.be.revertedWith("ReactMaker: Cannot convert")
      expect(await this.react.balanceOf(this.reactMaker.address)).to.equal(0)
      expect(await this.micUSDC.balanceOf(this.reactMaker.address)).to.equal(getBigNumber(1))
      expect(await this.react.balanceOf(this.bar.address)).to.equal(0)
    })
  })

  describe("convertMultiple", function () {
    it("should allow to convert multiple", async function () {
      await this.daiEth.transfer(this.reactMaker.address, getBigNumber(1))
      await this.reactEth.transfer(this.reactMaker.address, getBigNumber(1))
      await this.reactMaker.convertMultiple([this.dai.address, this.react.address], [this.weth.address, this.weth.address])
      expect(await this.react.balanceOf(this.reactMaker.address)).to.equal(0)
      expect(await this.daiEth.balanceOf(this.reactMaker.address)).to.equal(0)
      expect(await this.react.balanceOf(this.bar.address)).to.equal("3186583558687783097")
    })
  })
})
