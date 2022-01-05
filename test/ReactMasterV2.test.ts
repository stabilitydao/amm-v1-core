import { expect, assert } from "chai";
import { advanceBlockTo, advanceBlock, prepare, deploy, getBigNumber, ADDRESS_ZERO } from "./utilities"

describe("ReactMasterV2", function () {
  before(async function () {
    await prepare(this, ['ReactMaster', 'ReactToken', 'ERC20Mock', 'ReactMasterV2', 'RewarderMock', 'RewarderBrokenMock'])
    await deploy(this, [
      ["brokenRewarder", this.RewarderBrokenMock]
    ])
  })

  beforeEach(async function () {
    await deploy(this, [
      ["react", this.ReactToken],
    ])

    await deploy(this,
      [["lp", this.ERC20Mock, ["LP Token", "LPT", getBigNumber(10)]],
      ["dummy", this.ERC20Mock, ["Dummy", "DummyT", getBigNumber(10)]],
      ['chief', this.ReactMaster, [this.react.address, this.bob.address, getBigNumber(100), "0", "0"]]
    ])

    await this.react.transferOwnership(this.chief.address)
    await this.chief.add(100, this.lp.address, true)
    await this.chief.add(100, this.dummy.address, true)
    await this.lp.approve(this.chief.address, getBigNumber(10))
    await this.chief.deposit(0, getBigNumber(10))

    await deploy(this, [
        ['chief2', this.ReactMasterV2, [this.chief.address, this.react.address, 1]],
        ["rlp", this.ERC20Mock, ["LP", "rLPT", getBigNumber(10)]],
        ["r", this.ERC20Mock, ["Reward", "RewardT", getBigNumber(100000)]],
    ])
    await deploy(this, [["rewarder", this.RewarderMock, [getBigNumber(1), this.r.address, this.chief2.address]]])
    await this.dummy.approve(this.chief2.address, getBigNumber(10))
    await this.chief2.init(this.dummy.address)
    await this.rlp.transfer(this.bob.address, getBigNumber(1))
  })

  describe("Init", function () {
    it("Balance of dummyToken should be 0 after init(), repeated execution should fail", async function () {
      await expect(this.chief2.init(this.dummy.address))
            .to.be.revertedWith("Balance must exceed 0")
    })
  })

  describe("PoolLength", function () {
    it("PoolLength should execute", async function () {
      await this.chief2.add(10, this.rlp.address, this.rewarder.address)
      expect((await this.chief2.poolLength())).to.be.equal(1);
    })
  })

  describe("Set", function() {
    it("Should emit event LogSetPool", async function () {
      await this.chief2.add(10, this.rlp.address, this.rewarder.address)
      await expect(this.chief2.set(0, 10, this.dummy.address, false))
            .to.emit(this.chief2, "LogSetPool")
            .withArgs(0, 10, this.rewarder.address, false)
      await expect(this.chief2.set(0, 10, this.dummy.address, true))
            .to.emit(this.chief2, "LogSetPool")
            .withArgs(0, 10, this.dummy.address, true)
      })

    it("Should revert if invalid pool", async function () {
      let err;
      try {
        await this.chief2.set(0, 10, this.rewarder.address, false)
      } catch (e) {
        err = e;
      }

      assert.equal(err.toString(), "Error: VM Exception while processing transaction: invalid opcode")
    })
  })

  describe("PendingReact", function() {
    it("PendingReact should equal ExpectedReact", async function () {
      await this.chief2.add(10, this.rlp.address, this.rewarder.address)
      await this.rlp.approve(this.chief2.address, getBigNumber(10))
      let log = await this.chief2.deposit(0, getBigNumber(1), this.alice.address)
      await advanceBlock()
      let log2 = await this.chief2.updatePool(0)
      await advanceBlock()
      let expectedReact = getBigNumber(100).mul(log2.blockNumber + 1 - log.blockNumber).div(2)
      let pendingReact = await this.chief2.pendingReact(0, this.alice.address)
      expect(pendingReact).to.be.equal(expectedReact)
    })
    it("When block is lastRewardBlock", async function () {
      await this.chief2.add(10, this.rlp.address, this.rewarder.address)
      await this.rlp.approve(this.chief2.address, getBigNumber(10))
      let log = await this.chief2.deposit(0, getBigNumber(1), this.alice.address)
      await advanceBlockTo(3)
      let log2 = await this.chief2.updatePool(0)
      let expectedReact = getBigNumber(100).mul(log2.blockNumber - log.blockNumber).div(2)
      let pendingReact = await this.chief2.pendingReact(0, this.alice.address)
      expect(pendingReact).to.be.equal(expectedReact)
    })
  })

  describe("MassUpdatePools", function () {
    it("Should call updatePool", async function () {
      await this.chief2.add(10, this.rlp.address, this.rewarder.address)
      await advanceBlockTo(1)
      await this.chief2.massUpdatePools([0])
      //expect('updatePool').to.be.calledOnContract(); //not suported by heardhat
      //expect('updatePool').to.be.calledOnContractWith(0); //not suported by heardhat

    })

    it("Updating invalid pools should fail", async function () {
      let err;
      try {
        await this.chief2.massUpdatePools([0, 10000, 100000])
      } catch (e) {
        err = e;
      }

      assert.equal(err.toString(), "Error: VM Exception while processing transaction: invalid opcode")
    })
})

  describe("Add", function () {
    it("Should add pool with reward token multiplier", async function () {
      await expect(this.chief2.add(10, this.rlp.address, this.rewarder.address))
            .to.emit(this.chief2, "LogPoolAddition")
            .withArgs(0, 10, this.rlp.address, this.rewarder.address)
      })
  })

  describe("UpdatePool", function () {
    it("Should emit event LogUpdatePool", async function () {
      await this.chief2.add(10, this.rlp.address, this.rewarder.address)
      await advanceBlockTo(1)
      await expect(this.chief2.updatePool(0))
            .to.emit(this.chief2, "LogUpdatePool")
            .withArgs(0, (await this.chief2.poolInfo(0)).lastRewardBlock,
              (await this.rlp.balanceOf(this.chief2.address)),
              (await this.chief2.poolInfo(0)).accReactPerShare)
    })

    it("Should take else path", async function () {
      await this.chief2.add(10, this.rlp.address, this.rewarder.address)
      await advanceBlockTo(1)
      await this.chief2.batch(
          [
              this.chief2.interface.encodeFunctionData("updatePool", [0]),
              this.chief2.interface.encodeFunctionData("updatePool", [0]),
          ],
          true
      )
    })
  })

  describe("Deposit", function () {
    it("Depositing 0 amount", async function () {
      await this.chief2.add(10, this.rlp.address, this.rewarder.address)
      await this.rlp.approve(this.chief2.address, getBigNumber(10))
      await expect(this.chief2.deposit(0, getBigNumber(0), this.alice.address))
            .to.emit(this.chief2, "Deposit")
            .withArgs(this.alice.address, 0, 0, this.alice.address)
    })

    it("Depositing into non-existent pool should fail", async function () {
      let err;
      try {
        await this.chief2.deposit(1001, getBigNumber(0), this.alice.address)
      } catch (e) {
        err = e;
      }

      assert.equal(err.toString(), "Error: VM Exception while processing transaction: invalid opcode")
    })
  })

  describe("Withdraw", function () {
    it("Withdraw 0 amount", async function () {
      await this.chief2.add(10, this.rlp.address, this.rewarder.address)
      await expect(this.chief2.withdraw(0, getBigNumber(0), this.alice.address))
            .to.emit(this.chief2, "Withdraw")
            .withArgs(this.alice.address, 0, 0, this.alice.address)
    })
  })

  describe("Harvest", function () {
    it("Should give back the correct amount of REACT and reward", async function () {
        await this.r.transfer(this.rewarder.address, getBigNumber(100000))
        await this.chief2.add(10, this.rlp.address, this.rewarder.address)
        await this.rlp.approve(this.chief2.address, getBigNumber(10))
        expect(await this.chief2.lpToken(0)).to.be.equal(this.rlp.address)
        let log = await this.chief2.deposit(0, getBigNumber(1), this.alice.address)
        await advanceBlockTo(20)
        await this.chief2.harvestFromReactMaster()
        let log2 = await this.chief2.withdraw(0, getBigNumber(1), this.alice.address)
        let expectedReact = getBigNumber(100).mul(log2.blockNumber - log.blockNumber).div(2)
        expect((await this.chief2.userInfo(0, this.alice.address)).rewardDebt).to.be.equal("-"+expectedReact)
        await this.chief2.harvest(0, this.alice.address)
        expect(await this.react.balanceOf(this.alice.address)).to.be.equal(await this.r.balanceOf(this.alice.address)).to.be.equal(expectedReact)
    })
    it("Harvest with empty user balance", async function () {
      await this.chief2.add(10, this.rlp.address, this.rewarder.address)
      await this.chief2.harvest(0, this.alice.address)
    })

    it("Harvest for REACT-only pool", async function () {
      await this.chief2.add(10, this.rlp.address, ADDRESS_ZERO)
      await this.rlp.approve(this.chief2.address, getBigNumber(10))
      expect(await this.chief2.lpToken(0)).to.be.equal(this.rlp.address)
      let log = await this.chief2.deposit(0, getBigNumber(1), this.alice.address)
      await advanceBlock()
      await this.chief2.harvestFromReactMaster()
      let log2 = await this.chief2.withdraw(0, getBigNumber(1), this.alice.address)
      let expectedReact = getBigNumber(100).mul(log2.blockNumber - log.blockNumber).div(2)
      expect((await this.chief2.userInfo(0, this.alice.address)).rewardDebt).to.be.equal("-"+expectedReact)
      await this.chief2.harvest(0, this.alice.address)
      expect(await this.react.balanceOf(this.alice.address)).to.be.equal(expectedReact)
    })
  })

  describe("EmergencyWithdraw", function() {
    it("Should emit event EmergencyWithdraw", async function () {
      await this.r.transfer(this.rewarder.address, getBigNumber(100000))
      await this.chief2.add(10, this.rlp.address, this.rewarder.address)
      await this.rlp.approve(this.chief2.address, getBigNumber(10))
      await this.chief2.deposit(0, getBigNumber(1), this.bob.address)
      //await this.chief2.emergencyWithdraw(0, this.alice.address)
      await expect(this.chief2.connect(this.bob).emergencyWithdraw(0, this.bob.address))
      .to.emit(this.chief2, "EmergencyWithdraw")
      .withArgs(this.bob.address, 0, getBigNumber(1), this.bob.address)
    })
  })
})
