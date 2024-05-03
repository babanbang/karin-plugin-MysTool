import base from './base.js'
import CharId from './character/CharId.js'
import CharImg from './character/CharImg.js'
import { Format, Meta } from './index.js'
import _ from 'lodash'

export default class Character extends base {
  static _dataKey = 'id,name,abbr,title,star,elem,allegiance,weapon,birthday,astro,cncv,jpcv,desc,talentCons'

  constructor ({ id, data = {}, name = '', elem = '', game = 'gs' }) {
    super(game)
    const cache = this._getCache(CharId.isTraveler(id) ? `character:${id}:${elem || 'anemo'}` : `character:${id}`)
    if (cache) return cache

    this._id = id
    this.name = name

    if (!this.isCustom) {
      this.meta = Meta.getData(game, 'char', name) || {}
      if (this.isGs) {
        this.elem = Format.elem(elem || this.meta.elem, 'anemo')
      }
    } else {
      this.meta = {}
    }
    this.data = data
    return this._cache()
  }

  /** 是否为官方角色 */
  get isOfficial () {
    return this.game === 'sr' || /[12]0\d{6}/.test(this._id)
  }

  /** 是否为实装官方角色 */
  get isRelease () {
    if (this.isCustom) return false

    if (this.eta) {
      return this.eta * 1 < new Date() * 1
    }
    return true
  }

  /** 是否为自定义角色 */
  get isCustom () {
    return !this.isOfficial
  }

  get id () {
    return this.isCustom ? this._id : this._id * 1
  }

  /** 是否是旅行者 */
  get isTraveler () {
    return this.isGs && CharId.isTraveler(this.id)
  }

  /** 获取命座天赋等级 */
  get talentCons () {
    if (this.isTraveler) {
      return this.elem === 'dendro' ? { e: 3, q: 5 } : { e: 5, q: 3 }
    }
    return this.meta?.talentCons || {}
  }

  /** 武器类型 */
  get weaponType () {
    return this.data.weapon
  }

  /** 检查时装 */
  checkCostume (id) {
    return (this?.costume || []).includes(id * 1)
  }

  /** 获取所有图片 */
  getImgs (costume = '') {
    if (Array.isArray(costume)) {
      costume = costume[0]
    }
    if (!this._imgs) {
      this._imgs = {}
    }
    const costumeIdx = this.checkCostume(costume) ? '2' : ''
    const cacheId = `costume${costumeIdx}`
    if (!this._imgs[cacheId]) {
      this._imgs[cacheId] = CharImg.getImgs(this.name, this.game, this.talentCons, this.elem, this.weaponType, costumeIdx)
    }
    return this._imgs[cacheId]
  }

  static get (val, game = 'gs') {
    const id = CharId.getId(val, game)
    if (!id) return false

    return new Character(id)
  }

  /** 设置天赋数据 */
  getAvatarTalent (talent = {}, cons = 0, mode = 'original') {
    const ret = {}
    const Talent = {
      gs: { a: 3, e: 3, q: 3 },
      sr: { a: 1, e: 2, q: 2, t: 2 }
    }
    _.forEach(Talent[this.game], (addNum, k) => {
      const ds = talent[k]
      if (!ds) return false

      const value = _.isNumber(ds) ? ds : (ds.original || ds.level_original || ds.level || ds.level_current)
      if (value > 10 && this.isGs) {
        mode = 'level'
      }

      let Cons = this.talentCons[k]
      if (Array.isArray(Cons)) {
        Cons = Cons[0]
        addNum = Cons[1]
      }
      const r = mode === 'level' ? -1 : 1
      const _mode = mode === 'level' ? 'original' : 'level'
      ret[k] = { level: 0, original: 0 }
      ret[k][mode] = value
      ret[k][_mode] = (cons >= Cons) ? (value + addNum * r) : value
    })
    if (_.isEmpty(ret)) return false

    return ret
  }
}
