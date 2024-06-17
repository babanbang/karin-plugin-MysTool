import { Data } from '#MysTool/utils'
import _ from 'lodash'
import Base from './Base.js'
import { Avatar, Serv, Character, Format, Artifact } from './index.js'
import moment from 'moment'

export default class Player extends Base {
  constructor (uid, game) {
    super(game)
    this.uid = Number(uid)
    this._updateAvatar = []

    const cache = this._getCache(`player:${game}:${uid}`)
    if (cache) return cache

    this.reload()
    return this._cache(100)
  }

  static create (uid, game) {
    return new Player(uid, game)
  }

  /** 加载json文件 */
  reload () {
    const data = Data.readJSON(this.PlayerDataPath, { root: true }) || {}
    this.setBasicData(data)
    this.setAvatars(data.avatars || [], true)
  }

  /**
   * 保存json文件
   * @param flag false时暂时禁用保存，true时启用保存，并保存数据
   */
  save (flag = null) {
    if (flag === true) {
      this._save = true
    } else if (flag === false || this._save === false) {
      this._save = false
      return false
    }
    const ret = Data.getData(this, 'uid,name,level,face,card')
    ret.avatars = {}
    this.forEachAvatar(
      /** @param {Avatar} avatar */
      (avatar) => {
        ret.avatars[avatar.id] = avatar.toJSON()
      }
    )

    Data.writeJSON(this.PlayerDataPath, ret, { root: true })
    this._delCache()
  }

  /** 设置玩家基础数据 */
  setBasicData (ds, save = false) {
    if (this.game === 'sr' && ds.PhoneTheme) {
      const phone = new URL(ds.PhoneTheme).pathname
      ds.card = phone.substring(phone.lastIndexOf('/') + 1)
      save = true
    }
    if (!ds.face?.startsWith?.('http')) delete ds.face
    this.name = ds.nickname || ds.name || this.name || ''
    this.level = ds.level || this.level || ''
    this.face = ds.game_head_icon || ds.face || this.face || ''
    // this.face = this.face.match(/\/([^/?]+)\?/)?.[1] || this.face
    this.card = (ds.card || this.card || '').replace(/\.png$/, '')
    this._avatars = this._avatars || {}
    this._profile = ds._profile || this._profile
    if (this.game === 'sr' && this.card.startsWith('http')) {
      const phone = new URL(this.card).pathname
      this.card = phone.substring(phone.lastIndexOf('/') + 1)
      save = true
    }
    if (save) this.save()
  }

  /** 设置角色列表 */
  setAvatars (ds, lazy = false) {
    _.forEach(ds, (avatar) => {
      if (!avatar.id) return true
      if (lazy) {
        this._avatars[avatar.id] = avatar
      } else {
        this.setAvatar(avatar)
      }
    })
  }

  /** 设置角色数据 */
  setAvatar (ds, source = '') {
    const avatar = this.getAvatar(ds.id, true)
    avatar.setAvatar(ds, source)
  }

  /**
   * 获取Avatar角色
   * @returns {Avatar}
   */
  getAvatar (id, create = false) {
    const char = Character.get(id)
    if (!char) return false

    const avatars = this._avatars
    if (char.isTrailblazer && !create) {
      if (this.isGs) {
        id = avatars['10000005'] ? 10000005 : 10000007
      } else if (this.isSr) {
        id = avatars[id] ? id : id * 1 + 1
      }
    }

    if (!avatars[id]) {
      if (create) {
        avatars[id] = Avatar.create({ id }, this.game)
      } else {
        return false
      }
    }

    /** @type {Avatar} */
    const avatar = avatars[id]
    if (!avatar.isAvatar) {
      avatars[id] = Avatar.create(avatars[id], this.game)
      avatars[id].setAvatar(avatar)
      return avatars[id]
    }
    return avatar
  }

  /** 循环Avatar */
  async forEachAvatar (fn) {
    for (const id in this._avatars) {
      const avatar = this.getAvatar(id)
      if (avatar && avatar.hasData && avatar.game === this.game) {
        let ret = fn(avatar, id)
        ret = Data.isPromise(ret) ? await ret : ret
        if (ret === false) {
          return false
        }
      }
    }
  }

  /** 获取所有Avatar数据 */
  getAvatarData (ids = '') {
    const ret = []
    if (!ids) {
      this.forEachAvatar(
        /** @param {Avatar} avatar */
        (avatar) => {
          ret.push(avatar.getDetail())
        })
    } else {
      _.forEach(ids, (id) => {
        const avatar = this.getAvatar(id)
        if (avatar) {
          ret.push(avatar.getDetail())
        }
      })
    }
    return ret
  }

  /** 获取指定角色的面板数据 */
  getProfile (id) {
    const avatar = this.getAvatar(id)
    if (!avatar.isProfile) {
      return false
    }
    return avatar
  }

  /** 获取所有面板数据 */
  getProfiles () {
    const ret = {}
    this.forEachAvatar(
      /** @param {Avatar} avatar */
      (avatar) => {
        if (avatar.isProfile) {
          ret[avatar.id] = avatar
        }
      })
    return ret
  }

  async getProfileDetail ({ name, mode = 'dmg', dmgIdx = '' }) {
    const char = Character.get(name, this.game)
    if (!char) return false

    const profile = this.getProfile(char.id)
    if (!profile) return false

    const attr = {}
    const a = profile.attr
    const base = profile.base
    _.forEach((this.isGs ? 'hp,def,atk,mastery' : 'hp,def,atk,speed').split(','), (key) => {
      let fn = (n) => Format.comma(n, key === 'hp' ? 0 : 1)
      attr[key] = fn(a[key])
      attr[`${key}Base`] = fn(base[key])
      attr[`${key}Plus`] = fn(a[key] - base[key])
    })
    _.forEach((this.isGs ? 'cpct,cdmg,recharge,dmg,heal' : 'cpct,cdmg,recharge,dmg,effPct,effDef,heal,stance').split(','), (key) => {
      let fn = Format.pct
      let key2 = key
      if (key === 'dmg' && this.isGs && a.phy > a.dmg) {
        key2 = 'phy'
      }
      attr[key] = fn(a[key2])
      attr[`${key}Base`] = fn(base[key2])
      attr[`${key}Plus`] = fn(a[key2] - base[key2])
    })
    // todo 用户自定义敌人等级
    const enemyLv = this.isSr ? 80 : 90
    const dmgCalc = await this.getProfileDmgCalc({ profile, enemyLv, mode, dmgIdx })

    const artisDetail = profile.getArtisMark()
    // 处理一下allAttr，确保都有9个内容，以获得比较好展示效果
    let allAttr = profile.Artis.getAllAttr() || []
    allAttr = _.slice(allAttr, 0, 9)
    for (let idx = allAttr.length; idx < 9; idx++) {
      allAttr[idx] = {}
    }
    artisDetail.allAttr = allAttr

    const data = profile.getDetail('name,abbr,cons,level,elem,talent,fetter,trees,dataSource,updateTime,costumeSplash')
    data.weapon = profile.getWeaponDetail()

    return {
      uid: this.uid,
      avatar: data,
      elem: data.elem,
      attr,
      dmgCalc,
      artisDetail,
      artisKeyTitle: Artifact.getArtisKeyTitle(this.game)
    }
  }

  /**
   * @param {{ profile: Avatar }}
  */
  async getProfileDmgCalc ({ profile, enemyLv = 90, mode = 'dmg', dmgIdx }) {
    const dmgMsg = []
    const dmgData = []
    const dmgCalc = await profile.calcDmg({ enemyLv, dmgIdx })

    if (dmgCalc && dmgCalc.ret) {
      _.forEach(dmgCalc.ret, (ds) => {
        if (ds.type !== 'text') {
          ds.dmg = Format.comma(ds.dmg, 0)
          ds.avg = Format.comma(ds.avg, 0)
        }
        dmgData.push(ds)
      })
      _.forEach(dmgCalc.msg, (msg) => {
        msg.replace(':', '：')
        dmgMsg.push(msg.split('：'))
      })

      dmgCalc.dmgMsg = dmgMsg
      dmgCalc.dmgData = dmgData
    }

    if (mode === 'dmg' && dmgCalc.dmgRet) {
      let basic = dmgCalc?.dmgCfg?.basicRet
      _.forEach(dmgCalc.dmgRet, (row) => {
        _.forEach(row, (ds) => {
          ds.val = (ds.avg > basic.avg ? '+' : '') + Format.comma(ds.avg - basic.avg)
          ds.dmg = Format.comma(ds.dmg, 0)
          ds.avg = Format.comma(ds.avg, 0)
        })
      })
      basic.dmg = Format.comma(basic.dmg)
      basic.avg = Format.comma(basic.avg)
    }

    return dmgCalc
  }

  updateMysSRPlayer (data) {
    const serv = Serv.serv('mysSR', 'sr')
    return serv.updatePlayer(this, data)
  }

  async refreshProfile (e) {
    const ret = await Serv.req(this, e)
    if (ret) {
      this._profile = new Date() * 1
      this.save()
      return this._updateAvatar
    }
  }

  getUpdateTime () {
    if (!this._profile) return ''
    return moment(new Date(this._profile)).format('MM-DD HH:mm')
  }

  getProfileServName (uid = '', game = '') {
    const servs = Serv.getServ(uid || this.uid, game || this.game)
    return servs.map((s) => s.name).join('、')
  }
}
