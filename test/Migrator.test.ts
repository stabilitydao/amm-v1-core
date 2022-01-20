import { ethers, upgrades } from "hardhat";
import { expect } from "chai";
import {ReactSyrup__factory, ReactToken, ReactToken__factory} from "../types";

describe("Migrator", function () {
  before(async function () {
    this.signers = await ethers.getSigners()
    this.alice = this.signers[0]
    this.bob = this.signers[1]
    this.dev = this.signers[2]
    this.minter = this.signers[3]

    this.UniswapV2Factory = await ethers.getContractFactory("ReactSwapFactory")
    this.UniswapV2Pair = await ethers.getContractFactory("Pair")
    this.ERC20Mock = await ethers.getContractFactory("ERC20Mock", this.minter)
    this.ReactToken = (await ethers.getContractFactory('ReactToken')) as ReactToken__factory
    this.ReactSyrup = (await ethers.getContractFactory("ReactSyrup")) as ReactSyrup__factory

    this.ReactFarm = await ethers.getContractFactory("ReactFarm")
    this.Migrator = await ethers.getContractFactory("Migrator")
  })

  beforeEach(async function () {
    this.factory1 = await this.UniswapV2Factory.deploy(this.alice.address)
    await this.factory1.deployed()

    this.factory2 = await this.UniswapV2Factory.deploy(this.alice.address)
    await this.factory2.deployed()

    this.react = (await upgrades.deployProxy(this.ReactToken, {
      kind: 'uups',
    })) as ReactToken
    await this.react.deployed()

    this.syrup = await this.ReactSyrup.deploy(this.react.address)
    await this.syrup.deployed()

    this.weth = await this.ERC20Mock.deploy("WETH", "WETH", "100000000")
    await this.weth.deployed()

    this.token = await this.ERC20Mock.deploy("TOKEN", "TOKEN", "100000000")
    await this.token.deployed()

    const pair1 = await this.factory1.createPair(this.weth.address, this.token.address)

    this.lp1 = await this.UniswapV2Pair.attach((await pair1.wait()).events[0].args.pair)

    const pair2 = await this.factory2.createPair(this.weth.address, this.token.address)

    this.lp2 = await this.UniswapV2Pair.attach((await pair2.wait()).events[0].args.pair)

    this.chief = await this.ReactFarm.deploy(this.react.address, this.syrup.address, this.dev.address, "1000", "0", "100000")
    await this.chief.deployed()

    this.migrator = await this.Migrator.deploy(this.chief.address, this.factory1.address, this.factory2.address, "0")
    await this.migrator.deployed()

    this.react.grantRole(ethers.utils.id('MINTER_ROLE'), this.chief.address)

    await this.chief.add("100", this.lp1.address, true)
  })

  it("should do the migration successfully", async function () {
    await this.token.connect(this.minter).transfer(this.lp1.address, "10000000", { from: this.minter.address })
    await this.weth.connect(this.minter).transfer(this.lp1.address, "500000", { from: this.minter.address })
    await this.lp1.mint(this.minter.address)
    expect(await this.lp1.balanceOf(this.minter.address)).to.equal("2235067")

    // Add some fake revenue
    await this.token.connect(this.minter).transfer(this.lp1.address, "100000", { from: this.minter.address })
    await this.weth.connect(this.minter).transfer(this.lp1.address, "5000", { from: this.minter.address })
    await this.lp1.sync()
    await this.lp1.connect(this.minter).approve(this.chief.address, "100000000000", { from: this.minter.address })
    await this.chief.connect(this.minter).deposit(1, "2000000", { from: this.minter.address })
    expect(await this.lp1.balanceOf(this.chief.address), "2000000")
    await expect(this.chief.migrate(1)).to.be.revertedWith("migrate: no migrator")

    await this.chief.setMigrator(this.migrator.address)
    await expect(this.chief.migrate(1)).to.be.revertedWith("migrate: bad")

    await this.factory2.setMigrator(this.migrator.address)
    await this.chief.migrate(1)
    expect(await this.lp1.balanceOf(this.chief.address)).to.equal("0")
    expect(await this.lp2.balanceOf(this.chief.address)).to.equal("2000000")

    await this.chief.connect(this.minter).withdraw(1, "2000000", { from: this.minter.address })
    await this.lp2.connect(this.minter).transfer(this.lp2.address, "2000000", { from: this.minter.address })
    await this.lp2.burn(this.bob.address)
    expect(await this.token.balanceOf(this.bob.address)).to.equal("9033718")
    expect(await this.weth.balanceOf(this.bob.address)).to.equal("451685")
  })

  it("should allow first minting from public only after migrator is gone", async function () {
    await this.factory2.setMigrator(this.migrator.address)

    this.tokenx = await this.ERC20Mock.deploy("TOKENX", "TOKENX", "100000000")
    await this.tokenx.deployed()

    const pair = await this.factory2.createPair(this.weth.address, this.tokenx.address)

    this.lpx = await this.UniswapV2Pair.attach((await pair.wait()).events[0].args.pair)

    await this.weth.connect(this.minter).transfer(this.lpx.address, "10000000", { from: this.minter.address })
    await this.tokenx.connect(this.minter).transfer(this.lpx.address, "500000", { from: this.minter.address })
    await expect(this.lpx.mint(this.minter.address)).to.be.revertedWith("Must not have migrator")
  })
})
