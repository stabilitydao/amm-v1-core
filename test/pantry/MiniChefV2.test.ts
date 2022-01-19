import { expect, assert } from "chai";
import { advanceTime, advanceTimeAndBlock, advanceBlockTo, advanceBlock, prepare, deploy, getBigNumber, ADDRESS_ZERO } from "../utilities"
const { BigNumber } = require("ethers")
import {ethers, upgrades} from "hardhat"
import {ReactToken, ReactToken__factory} from "../../types";

describe("MiniChefV2", function () {
  before(async function () {
    this.ReactToken = (await ethers.getContractFactory(
        'ReactToken'
    )) as ReactToken__factory

    await prepare(this, ['MiniChefV2', 'ERC20Mock', 'RewarderMock', 'RewarderBrokenMock'])
    await deploy(this, [
      ["brokenRewarder", this.RewarderBrokenMock]
    ])
  })

  beforeEach(async function () {
    this.react = (await upgrades.deployProxy(this.ReactToken, {
      kind: 'uups',
    })) as ReactToken

    await this.react.deployed()

    await deploy(this,
      [["lp", this.ERC20Mock, ["LP Token", "LPT", getBigNumber(10)]],
      ["dummy", this.ERC20Mock, ["Dummy", "DummyT", getBigNumber(10)]],
      ['chief', this.MiniChefV2, [this.react.address]],
      ["rlp", this.ERC20Mock, ["LP", "rLPT", getBigNumber(10)]],
      ["r", this.ERC20Mock, ["Reward", "RewardT", getBigNumber(100000)]],
    ])
    await deploy(this, [["rewarder", this.RewarderMock, [getBigNumber(1), this.r.address, this.chief.address]]])

    this.react.grantRole(ethers.utils.id('MINTER_ROLE'), this.signers[0].address)
    await this.react.mint(this.chief.address, getBigNumber(10000))
    await this.lp.approve(this.chief.address, getBigNumber(10))
    await this.chief.setReactPerSecond("10000000000000000")
    await this.rlp.transfer(this.bob.address, getBigNumber(1))
  })

  describe("PoolLength", function () {
    it("PoolLength should execute", async function () {
      await this.chief.add(10, this.rlp.address, this.rewarder.address)
      expect((await this.chief.poolLength())).to.be.equal(1);
    })
  })

  describe("Set", function() {
    it("Should emit event LogSetPool", async function () {
      await this.chief.add(10, this.rlp.address, this.rewarder.address)
      await expect(this.chief.set(0, 10, this.dummy.address, false))
            .to.emit(this.chief, "LogSetPool")
            .withArgs(0, 10, this.rewarder.address, false)
      await expect(this.chief.set(0, 10, this.dummy.address, true))
            .to.emit(this.chief, "LogSetPool")
            .withArgs(0, 10, this.dummy.address, true)
      })

    it("Should revert if invalid pool", async function () {
      let err;
      try {
        await this.chief.set(0, 10, this.rewarder.address, false)
      } catch (e) {
        err = e;
      }

      assert.equal(err.toString(), "Error: VM Exception while processing transaction: invalid opcode")
    })
  })

  describe("PendingReact", function() {
    it("PendingReact should equal ExpectedReact", async function () {
      await this.chief.add(10, this.rlp.address, this.rewarder.address)
      await this.rlp.approve(this.chief.address, getBigNumber(10))
      let log = await this.chief.deposit(0, getBigNumber(1), this.alice.address)
      await advanceTime(86400)
      let log2 = await this.chief.updatePool(0)
      let timestamp2 = (await ethers.provider.getBlock(log2.blockNumber)).timestamp
      let timestamp = (await ethers.provider.getBlock(log.blockNumber)).timestamp
      let expectedReact = BigNumber.from("10000000000000000").mul(timestamp2 - timestamp)
      let pendingReact = await this.chief.pendingReact(0, this.alice.address)
      expect(pendingReact).to.be.equal(expectedReact)
    })
    it("When time is lastRewardTime", async function () {
      await this.chief.add(10, this.rlp.address, this.rewarder.address)
      await this.rlp.approve(this.chief.address, getBigNumber(10))
      let log = await this.chief.deposit(0, getBigNumber(1), this.alice.address)
      await advanceBlockTo(3)
      let log2 = await this.chief.updatePool(0)
      let timestamp2 = (await ethers.provider.getBlock(log2.blockNumber)).timestamp
      let timestamp = (await ethers.provider.getBlock(log.blockNumber)).timestamp
      let expectedReact = BigNumber.from("10000000000000000").mul(timestamp2 - timestamp)
      let pendingReact = await this.chief.pendingReact(0, this.alice.address)
      expect(pendingReact).to.be.equal(expectedReact)
    })
  })

  describe("MassUpdatePools", function () {
    it("Should call updatePool", async function () {
      await this.chief.add(10, this.rlp.address, this.rewarder.address)
      await advanceBlockTo(1)
      await this.chief.massUpdatePools([0])
      //expect('updatePool').to.be.calledOnContract(); //not suported by heardhat
      //expect('updatePool').to.be.calledOnContractWith(0); //not suported by heardhat

    })

    it("Updating invalid pools should fail", async function () {
      let err;
      try {
        await this.chief.massUpdatePools([0, 10000, 100000])
      } catch (e) {
        err = e;
      }

      assert.equal(err.toString(), "Error: VM Exception while processing transaction: invalid opcode")
    })
})

  describe("Add", function () {
    it("Should add pool with reward token multiplier", async function () {
      await expect(this.chief.add(10, this.rlp.address, this.rewarder.address))
            .to.emit(this.chief, "LogPoolAddition")
            .withArgs(0, 10, this.rlp.address, this.rewarder.address)
      })
  })

  describe("UpdatePool", function () {
    it("Should emit event LogUpdatePool", async function () {
      await this.chief.add(10, this.rlp.address, this.rewarder.address)
      await advanceBlockTo(1)
      await expect(this.chief.updatePool(0))
            .to.emit(this.chief, "LogUpdatePool")
            .withArgs(0, (await this.chief.poolInfo(0)).lastRewardTime,
              (await this.rlp.balanceOf(this.chief.address)),
              (await this.chief.poolInfo(0)).accReactPerShare)
    })

    it("Should take else path", async function () {
      await this.chief.add(10, this.rlp.address, this.rewarder.address)
      await advanceBlockTo(1)
      await this.chief.batch(
          [
              this.chief.interface.encodeFunctionData("updatePool", [0]),
              this.chief.interface.encodeFunctionData("updatePool", [0]),
          ],
          true
      )
    })
  })

  describe("Deposit", function () {
    it("Depositing 0 amount", async function () {
      await this.chief.add(10, this.rlp.address, this.rewarder.address)
      await this.rlp.approve(this.chief.address, getBigNumber(10))
      await expect(this.chief.deposit(0, getBigNumber(0), this.alice.address))
            .to.emit(this.chief, "Deposit")
            .withArgs(this.alice.address, 0, 0, this.alice.address)
    })

    it("Depositing into non-existent pool should fail", async function () {
      let err;
      try {
        await this.chief.deposit(1001, getBigNumber(0), this.alice.address)
      } catch (e) {
        err = e;
      }

      assert.equal(err.toString(), "Error: VM Exception while processing transaction: invalid opcode")
    })
  })

  describe("Withdraw", function () {
    it("Withdraw 0 amount", async function () {
      await this.chief.add(10, this.rlp.address, this.rewarder.address)
      await expect(this.chief.withdraw(0, getBigNumber(0), this.alice.address))
            .to.emit(this.chief, "Withdraw")
            .withArgs(this.alice.address, 0, 0, this.alice.address)
    })
  })

  describe("Harvest", function () {
    it("Should give back the correct amount of REACT and reward", async function () {
        await this.r.transfer(this.rewarder.address, getBigNumber(100000))
        await this.chief.add(10, this.rlp.address, this.rewarder.address)
        await this.rlp.approve(this.chief.address, getBigNumber(10))
        expect(await this.chief.lpToken(0)).to.be.equal(this.rlp.address)
        let log = await this.chief.deposit(0, getBigNumber(1), this.alice.address)
        await advanceTime(86400)
        let log2 = await this.chief.withdraw(0, getBigNumber(1), this.alice.address)
        let timestamp2 = (await ethers.provider.getBlock(log2.blockNumber)).timestamp
        let timestamp = (await ethers.provider.getBlock(log.blockNumber)).timestamp
        let expectedReact = BigNumber.from("10000000000000000").mul(timestamp2 - timestamp)
        expect((await this.chief.userInfo(0, this.alice.address)).rewardDebt).to.be.equal("-"+expectedReact)
        await this.chief.harvest(0, this.alice.address)
        expect(await this.react.balanceOf(this.alice.address)).to.be.equal(await this.r.balanceOf(this.alice.address)).to.be.equal(expectedReact)
    })
    it("Harvest with empty user balance", async function () {
      await this.chief.add(10, this.rlp.address, this.rewarder.address)
      await this.chief.harvest(0, this.alice.address)
    })

    it("Harvest for REACT-only pool", async function () {
      await this.chief.add(10, this.rlp.address, ADDRESS_ZERO)
      await this.rlp.approve(this.chief.address, getBigNumber(10))
      expect(await this.chief.lpToken(0)).to.be.equal(this.rlp.address)
      let log = await this.chief.deposit(0, getBigNumber(1), this.alice.address)
      await advanceBlock()
      let log2 = await this.chief.withdraw(0, getBigNumber(1), this.alice.address)
      let timestamp2 = (await ethers.provider.getBlock(log2.blockNumber)).timestamp
      let timestamp = (await ethers.provider.getBlock(log.blockNumber)).timestamp
      let expectedReact = BigNumber.from("10000000000000000").mul(timestamp2 - timestamp)
      expect((await this.chief.userInfo(0, this.alice.address)).rewardDebt).to.be.equal("-"+expectedReact)
      await this.chief.harvest(0, this.alice.address)
      expect(await this.react.balanceOf(this.alice.address)).to.be.equal(expectedReact)
    })
  })

  describe("EmergencyWithdraw", function() {
    it("Should emit event EmergencyWithdraw", async function () {
      await this.r.transfer(this.rewarder.address, getBigNumber(100000))
      await this.chief.add(10, this.rlp.address, this.rewarder.address)
      await this.rlp.approve(this.chief.address, getBigNumber(10))
      await this.chief.deposit(0, getBigNumber(1), this.bob.address)
      //await this.chief.emergencyWithdraw(0, this.alice.address)
      await expect(this.chief.connect(this.bob).emergencyWithdraw(0, this.bob.address))
      .to.emit(this.chief, "EmergencyWithdraw")
      .withArgs(this.bob.address, 0, getBigNumber(1), this.bob.address)
    })
  })
})
