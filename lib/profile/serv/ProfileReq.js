import lodash from 'lodash'
import { redis } from 'node-karin'
import Base from '../Base.js'

export default class ProfileReq extends Base {
  constructor (uid, game, e) {
    super(game)
    this.e = e
    this.uid = uid
    this.cdKey = `${this.redisPrefix}profile-cd:${this.uid}`
  }

  static create (player, e) {
    const { uid, game } = player

    if (!uid || uid * 1 < 100000006) {
      return false
    }

    return new ProfileReq(uid, game, e)
  }

  async setCd (seconds = 60) {
    let ext = new Date() * 1 + seconds * 1000
    await redis.set(this.cdKey, ext + '', { EX: seconds })
  }

  async inCd () {
    let ext = await redis.get(this.cdKey)
    if (!ext || isNaN(ext)) {
      return false
    }
    let cd = (new Date() * 1) - ext
    if (cd < 0 && Math.abs(cd) < 100 * 60 * 1000) {
      return Math.ceil(0 - cd / 1000)
    }
    return false
  }

  err (msg = '', cd = 0) {
    let extra = this.serv.name ? `当前面板服务${this.serv.name}，` : ''
    const msgs = {
      error: `UID${this.uid}更新面板失败，${extra}\n可能是面板服务维护中，请稍后重试...`,
      empty: '请将角色放置在【游戏内】角色展柜，并打开【显示详情】，等待5分钟重新获取面板'
    }
    msg = msgs[msg] || msg
    this.msg(msg)
    // 设置CD
    if (cd) {
      this.setCd(cd)
    }
    return false
  }

  msg (msg) {
    if (this.e?.reply && msg && !this.e?._isReplyed) {
      this.e.reply(msg)
      this.e._isReplyed = true
    }
  }

  log (msg) {
    logger.mark(`【面板】${this.uid} ：${msg}`)
  }

  /**
   * @param {import('#MysTool/profile').Player} player
   * @param {import('./ProfileServ.js').default} serv
   */
  async requestProfile (player, serv) {
    const self = this
    this.serv = serv
    let cdTime = await this.inCd()

    await this.setCd(20)
    // 若3秒后还未响应则返回提示
    setTimeout(() => {
      if (self._isReq) {
        this.e.reply(`开始获取uid:${this.uid}的数据，可能会需要一定时间~`)
      }
    }, 2000)

    this.log(`${logger.yellow('开始请求数据')}，面板服务：${serv.name}...`)
    const startTime = new Date() * 1

    let data = {}
    try {
      self._isReq = true
      const res = await serv.request(this.uid)
      self._isReq = false

      this.log(`${logger.green(`请求结束，请求用时${new Date() * 1 - startTime}ms`)}，面板服务：${serv.name}...`)
      if (lodash.isObject(res.data)) {
        data = res.data
      } else {
        if (res?.data?.[0] === '<') {
          let titleRet = /<title>(.+)<\/title>/.exec(res.data)
          if (titleRet?.[1]) {
            data = { error: titleRet[1] }
          } else {
            return this.err('error', 60)
          }
        } else {
          return false
        }
      }
    } catch (err) {
      logger.error(err)
      self._isReq = false
    }

    data = await serv.response(data, this)

    // 设置CD
    cdTime = serv.getCdTime(data)
    if (cdTime) {
      await this.setCd(cdTime)
    }
    if (data === false) {
      return false
    }
    serv.updatePlayer(player, data)
    cdTime = serv.getCdTime(data)
    if (cdTime) {
      await this.setCd(cdTime)
    }
    return true
  }
}
