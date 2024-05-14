import { Data } from '#Mys.tool'
import _ from 'lodash'
import base from './base.js'
import { Avatar, Serv, Character } from './index.js'

export default class Player extends base {
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
    const data = Data.readJSON(this.PlayerDataPath)
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

    Data.writeJSON(this.PlayerDataPath, ret)
    this._delCache()
  }

  /** 设置玩家基础数据 */
  setBasicData (ds, save = false) {
    this.name = ds.nickname || ds.name || this.name || ''
    this.level = ds.level || this.level || ''
    this.face = ds.game_head_icon || ds.face || this.face || ''
    // this.face = this.face.match(/\/([^/?]+)\?/)?.[1] || this.face
    this.card = ds.card || this.card || ''
    this._avatars = this._avatars || {}
    this._profile = ds._profile || this._profile

    if (save) this.save()
  }

  /** 设置角色列表 */
  setAvatars (ds, lazy = false) {
    _.forEach(ds, (avatar) => {
      if (!avatar.id) {
        return true
      }
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

  updateMysSRPlayer (data) {
    const serv = Serv.serv('mysSR', 'sr')
    return serv.updatePlayer(this, data)
  }
}
