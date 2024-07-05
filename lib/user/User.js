import { MysUtil } from '#MysTool/mys'
import { Data } from '#MysTool/utils'
import lodash from 'lodash'
import { MysUser } from './MysUser.js'
import base from './base.js'
import UserDB from './db/UserDB.js'

export class User extends base {
  constructor (user_id, game) {
    super(game)
    this.user_id = user_id
  }

  get uid () {
    return this[this.Key.m]
  }

  get Key () {
    return this.gameKey()
  }

  hasCk (uid = '') {
    return ['ck', 'all'].includes(this[this.Key.u][uid || this.uid])
  }

  hasSk (uid = '') {
    return ['sk', 'all'].includes(this[this.Key.u][uid || this.uid])
  }

  static async create (e, game, db = false) {
    const user = new User(e?.user_id || e, game)
    await user.initDB(db)

    return user
  }

  /** 查询全部数据 */
  static async forEach (fn, game) {
    const dbs = await UserDB.findAll()
    await Data.forEach(dbs, async (db) => {
      const user = await User.create(db.user_id, game, db)
      return await fn(user)
    })
  }

  /** 初始化数据 */
  async initDB (db = false) {
    if (this.db && !db) return

    if (db && db !== true) {
      this.db = db
    } else {
      this.db = await UserDB.find(this.user_id)
    }

    this.setUserData(this.db)
    await this.initMysUser()
    await this.save()
    this.setMysUserUidMap()
  }

  setUserData (data) {
    const self = this
    MysUtil.eachGame((game) => {
      const g = self.gameKey(game)
      self[g.u] = data[g.u] || self[g.u] || {}
      self[g.m] = data[g.m] || self[g.m] || Object.keys(self[g.u])[0] || ''
    }, true)
    for (const k of ['ltuids', 'stuids']) {
      this[k] = data[k] || this[k] || []
    }
  }

  setMysUserUidMap () {
    this.uidMap = this.uidMap || new Map()
    const self = this
    lodash.forEach(this.mysUsers, (mys, ltuid) => {
      MysUtil.eachGame((game) => {
        const g = self.gameKey(game).u
        mys[g].forEach(uid => {
          const v = self[g][uid]
          if (!['ban', 'reg'].includes(v)) {
            self.uidMap.set(game + uid, {
              ltuid,
              game,
              uid,
              ck: ['ck', 'all'].includes(v) ? mys.ck : '',
              sk: ['sk', 'all'].includes(v) ? mys.sk : '',
              device: mys.device
            })
          }
        })
      }, true)
    })
  }

  /**
   * 获取UID的CK、SK数据
   * @param {{game?,uid?}} cfg
   * @returns {{ltuid, game: string, uid, ck: string, sk: string, device: string}}
   */
  getUidData (cfg = {}) {
    const { game = '', uid = this[this.gameKey(game).m] } = cfg
    return this.uidMap.get((game || this.game) + uid)
  }

  /**
 * 获取对应game的全部UID的CK、SK数据
 * @returns {{ltuid, game: string, uid, ck: string, sk: string, device: string}[]}
 */
  getUidsData (game = '') {
    game = game || this.game
    return Array.from(this.uidMap.values()).filter(v => v.game == game)
  }

  getUidType ({ uid = '', game = '' } = {}) {
    const g = this.gameKey(game)
    return { uid: uid || this[g.m], type: this[g.u][uid || this[g.m]] }
  }

  /** 初始化MysUser对象 */
  async initMysUser () {
    const ltuids = this.db?.ltuids || []
    const stuids = this.db?.stuids || []
    this.mysUsers = {}

    for (let ltuid of ltuids) {
      const mys = await MysUser.create(ltuid)
      if (mys) this.mysUsers[ltuid] = mys
    }

    for (const stuid of stuids) {
      if (ltuids.includes(stuid)) continue

      const mys = await MysUser.create(stuid)
      if (mys) this.mysUsers[stuid] = mys
    }
  }

  /** 
   * 添加UID
   * @param {{type?:'all'|'ck'|'sk'|'reg'|'ban',up?:boolean}} cfg 
   *  */
  addRegUid (uid, game = '', save = true, { type = 'reg', up = false } = {}) {
    if (Array.isArray(uid)) {
      for (const u of uid) {
        this.addRegUid(u, game, save, { type, up })
      }
      if (!save) this.save()
      return true
    }
    uid = String(uid)

    this[this.gameKey(game).u][uid] = type

    this.setMainUid(uid, game, false)
    if (save) this.save()
  }

  /** 删除UID */
  delRegUid (uid, game = '') {
    const g = this.gameKey(game)
    uid = String(uid)
    if (!(uid in this[g.u])) return false

    delete this[g.u][uid]
    if (this[g.m] === uid || !this[g.m]) {
      this.setMainUid(Object.keys(this[g.u])[0], game, false)
    }

    this.save()
  }

  /** 切换UID */
  setMainUid (uid = '', game = '', save = true) {
    uid = String(uid)
    if (!(this.getUidList(game)).includes(uid) && uid !== '') {
      return false
    }

    this[this.gameKey(game).m] = uid
    if (save) this.save()
  }

  /**
   * @param {{type:'all'|'ck'|'sk'|'reg'|'ban',needType:boolean}} cfg 
   */
  getUidList (game = '', { type = '', needType = false } = {}) {
    const g = this.gameKey(game)
    if (needType) {
      const lists = { list: [], ban: [] }

      Object.entries(this[g.u]).forEach(([uid, type]) => {
        const entry = { uid, type, main: this[g.m] === uid }
        if (type === 'ban') {
          lists.ban.push(entry)
        } else {
          lists.list.push(entry)
        }
      })
      return lists
    }

    return Object.keys(this[g.u]).filter(v => {
      if (type === 'all') {
        type = ['all', 'ck', 'sk']
      } else if (type && !Array.isArray(type)) {
        type = [type]
      }
      if (type) return type.includes(this[g.u][v])
      return this[g.u][v] !== 'ban'
    })
  }

  /** 添加MysUser
   * @param {'all'|'ck'|'sk'} type
   */
  async addMysUser (mysUser, type = 'ck') {
    this.mysUsers[mysUser.ltuid] = mysUser
    const self = this
    MysUtil.eachGame((game) => {
      const g = self.gameKey(game)
      const uids = mysUser[g.u].filter(v => self[g.u][v] !== 'ban')
      self.addRegUid(uids, game, false, { type, up: true })
      if (uids[0] && !self[g.m]) {
        self.setMainUid(uids[0], game, false)
      }
    }, true)
    this.save()
  }

  /**@returns {MysUser} */
  async getMysUser (ltuid = '') {
    if (ltuid) return this.mysUsers[ltuid]

    ltuid = this.getUidData().ltuid
    return this.mysUsers[ltuid]
  }

  /** @param {{deluid?:string, game?:string, delck?:boolean}} cfg */
  setUidType (cfg = {}) {
    const { deluid = '', game = '', delck = true } = cfg
    const g = this.gameKey(game)

    const uid = deluid || this[g.m]
    if (delck === 'ban') {
      this[g.u][uid] = 'ban'
      this.setMainUid(this.getUidList(game)[0], game)
      return true
    }
    if (this[g.u][uid] === (delck ? 'ck' : 'sk')) {
      this[g.u][uid] = 'reg'
    } else if (this[g.u][uid] === 'all') {
      this[g.u][uid] = delck ? 'sk' : 'ck'
    } else {
      return false
    }

    this.save()
    return true
  }
}
