import { MysApi, MysUtil } from '#MysTool/mys'
import { Player } from '#MysTool/profile'
import { Data } from '#MysTool/utils'
import base from './base.js'
import MysUserDB from './db/MysUserDB.js'
import { DailyCache } from './DailyCache.js'

export class MysUser extends base {
  constructor (ltuid) {
    super()
    this.ltuid = ltuid
  }

  static async create (ltuid, db = false) {
    ltuid = MysUtil.getLtuid(ltuid)

    const mys = new MysUser(ltuid)
    await mys.initDB(db)
    return mys
  }

  /** 查询全部数据 */
  static async forEach (fn) {
    const dbs = await MysUserDB.findAll()
    await Data.forEach(dbs, async (db) => {
      const mys = await MysUser.create(db.ltuid, db)
      return await fn(mys)
    })
  }

  static async getMysUserByUid (uid, game) {
    const mys = await MysUserDB.findByUid(uid, game)
    if (!mys) return false

    return await MysUser.create(mys.ltuid)
  }

  /** 分配查询MysUser */
  static async getByQueryUid (uid, game = 'gs') {
    const Cache = DailyCache.create(uid, game)

    // 根据ltuid获取mysUser 封装
    const create = async function (ltuid) {
      if (!ltuid) return false

      const ckUser = await MysUser.create(ltuid)
      if (!ckUser) {
        await Cache.Del(ltuid)
        return false
      }

      return ckUser
    }

    // 使用CK池内容，分配次数最少的一个ltuid
    const mysUser = await create(await Cache.MinLtuid())
    if (mysUser) {
      logger.mark(`[米游社查询][uid：${uid}]${logger.green(`[分配查询ck：${mysUser.ltuid}]`)}`)
      return mysUser
    }

    return false
  }

  /** 初始化数据 */
  async initDB (db = false) {
    if (this.db && !db) return

    if (db && db !== true) {
      this.db = db
    } else {
      this.db = await MysUserDB.find(this.ltuid)
    }
    await this.setCkData(this.db)
    await this.save()
  }

  async setCkData (data) {
    this.type = data.type || this.type || 'mys'
    this.ck = data._cookie ? MysUtil.splicToken(data._cookie) : (data.cookie || this.ck || '')

    if (data.stoken) {
      this.stoken = data.stoken
      if (data._stoken) {
        data = await this.RefineStoken(data)
        this.sk = data._cookie
      } else {
        this.sk = MysUtil.splicToken({
          ltuid: data.ltuid,
          stoken: data.stoken,
          mid: data.mid || '',
          ltoken: data.ltoken || ''
        })
      }
    } else {
      this.stoken = this.stoken || ''
      this.sk = this.sk || ''
    }

    this.mid = data.mid || this.mid || ''
    this.ltoken = data.ltoken || this.ltoken || ''
    this.login_ticket = data.login_ticket || this.login_ticket || ''
    this.device = data.device || this.device || MysUtil.getDeviceGuid()

    const self = this
    MysUtil.eachGame((game) => {
      const g = self.gameKey(game).u
      self[g] = data[g] || self[g] || []
    })
  }

  getUidInfo () {
    const ret = []
    const self = this
    MysUtil.eachGame((game, Ds) => {
      const uids = self.getUids(game)
      if (uids && uids.length > 0) {
        ret.push(`【${Ds.name}】:${uids.join(', ')}`)
      }
    })
    return ret.join('\n')
  }
  /**@returns {{ltuid, type:'mys'|'hoyolab', game: string, ck: string, sk: string, device: string}} */
  getCkData () {
    return Data.getData(this, 'ltuid,type,game,ck,sk,device')
  }

  /**
 * 刷新mysUser的UID列表
 * @returns {Promise<{msg: string, status: number}>}
 */
  async reqMysUid () {
    const err = (msg = '', status = 1) => {
      return { status, msg }
    }

    let res = null
    let msg = ''
    for (const serv of MysUtil.servs) {
      const mysApi = new MysApi({ cookie: this.ck, server: serv }, { log: false })
      const roleRes = await mysApi.getData('getUserGameRolesByCookie')
      if (roleRes?.retcode === 0) {
        res = roleRes
        this.type = serv
        break
      }
      if (roleRes.retcode * 1 === -100) {
        msg = 'cookie失效，请重新登录获取'
      }
      msg = roleRes.message || ''
    }

    if (!res) return err(msg)
    const playerList = (res?.data?.list || []).filter(v =>
      (MysUtil.getGamebiz()).includes(v.game_biz)
    )
    if (!playerList || playerList.length <= 0) {
      return err('该账号尚未绑定角色')
    }

    /** 米游社默认展示的角色 */
    for (let val of playerList) {
      const game = MysUtil.getGameByGamebiz(val.game_biz)
      this.addUid(val.game_uid, game)
      const player = new Player(val.game_uid, game)
      player.setBasicData(val, true)
    }
    return { status: 0, msg: '' }
  }

  /** 获取米游社通行证id 
   * @param {'mys'|'hoyolab'} serv 
  */
  async getUserFullInfo (serv = 'mys') {
    const mysApi = new MysApi({ cookie: this.ck, server: serv }, { log: false })
    return await mysApi.getData('getUserFullInfo')
  }

  async updataCookie () {
    let cookie = ''
    for (const serv of MysUtil.servs) {
      const mysApi = new MysApi({ server: serv }, { log: false })
      const res = await mysApi.getData('getCookieBySToken', {
        cookies: this.sk.replace(/;/g, '&').replace(/stuid/, 'uid'),
        method: serv === 'mys' ? 'GET' : 'POST'
      })
      if (res?.data) {
        cookie = MysUtil.splicToken({
          ltoken: this.ltoken,
          ltuid: this.ltuid,
          cookie_token: res.data.cookie_token,
          account_id: this.ltuid
        })
        break
      }
    }
    return cookie
  }

  async RefineStoken (data) {
    const param = data._stoken
    const sk = MysUtil.splicToken(param)
    const mysApi = new MysApi({ cookie: sk, server: 'mys' }, { log: false })

    if (param.stoken.includes('v2_')) {
      const res = await mysApi.getData('getLtoken', {
        cookies: sk.replace(/;/g, '&')
      })
      param.ltoken = res?.data?.ltoken || ''
    } else {
      // todo: 没找到API、现在基本上全是v2的stoken
      // const res = await mysApi.getData('getByStokenV2')
    }

    return {
      ...data,
      ...param,
      _cookie: MysUtil.splicToken(param)
    }
  }

  /** 为当前MysUser绑定UID */
  addUid (uid, game = '') {
    if (Array.isArray(uid)) {
      for (let u of uid) {
        this.addUid(u, game)
      }
      return true
    }
    uid = String(uid)
    const g = this.gameKey(game).u
    if (/\d{9,10}/.test(uid)) {
      if (!this[g].includes(uid)) {
        this[g].push(uid)
      }
    }
    return true
  }

  hasGame (game = '') {
    return this[this.gameKey(game).u].length > 0
  }
}
