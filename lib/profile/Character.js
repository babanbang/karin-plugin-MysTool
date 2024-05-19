import { Data } from '#Mys.tool'
import _ from 'lodash'
import Base from './Base.js'
import CharCfg from './character/CharCfg.js'
import CharId from './character/CharId.js'
import CharImg from './character/CharImg.js'
import { Format, Meta } from './index.js'

const metaKey = 'abbr,star,elem,weapon,talentId,talentCons,eta'.split(',')
const detailKey = 'title,allegiance,birth,astro,desc,cncv,jpcv,costume,baseAttr,growAttr,materials,talent,talentData,cons,passive,attr,sp'.split(',')

export default class Character extends Base {
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
        this.elem = Format.elem(elem || this.meta.elem, game, 'anemo')
      }
    } else {
      this.meta = {}
    }
    this.data = data
    return this._cache()
  }

  _get (key) {
    if (metaKey.includes(key)) {
      return this.meta[key]
    }
    if (detailKey.includes(key)) {
      return this.getDetail()[key]
    }
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

  /** 是否是开拓者 */
  get isTrailblazer () {
    return this.isSr && CharId.isTrailblazer(this.id)
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

  // 获取元素名称
  get elemName () {
    if (this.isSr) {
      return this.elem
    }
    return Format.elemName(this.elem)
  }

  /** 获取详情数据 */
  get detail () {
    return this.getDetail()
  }

  /** 检查时装 */
  checkCostume (id) {
    return (this?.costume || []).includes(id * 1)
  }

  /** 判断是否为某种元素角色 */
  isElem (elem = '') {
    elem = elem.toLowerCase()
    return this.elem === elem || this.elemName === elem
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
      ret[k][mode] = ret[k][_mode] = value
      ret[k].max = (this.isSr && k === 'a') ? 6 : 10
      if (cons >= Cons) {
        ret[k].max += addNum
        ret[k][_mode] += addNum * r
      }
      ret[k].name = this.detail?.talent?.[k]?.name
    })
    if (_.isEmpty(ret)) return false

    return ret
  }

  /** 获取详情数据 */
  getDetail () {
    if (this.meta?._detail) {
      return this.meta._detail
    }
    if (this.isCustom) return {}
    try {
      let name = this.isTraveler ? `旅行者/${this.elem}` : this.name
      this.meta = this.meta || {}
      this.meta._detail = Data.readJSON(`components/${Data.gamePath(this.game)}/resources/meta/character/${name}/data.json`)
    } catch (e) {
      logger.error(e)
    }
    return this.meta._detail
  }

  /** 获取伤害计算配置 */
  getCalcRule () {
    if (!this._calcRule && this._calcRule !== false) {
      this._calcRule = CharCfg.getCalcRule(this)
    }
    return this._calcRule
  }

  getArtisCfg () {
    if (!this._artisRule && this._artisRule !== false) {
      this._artisRule = CharCfg.getArtisCfg(this)
    }
    return this._artisRule
  }

  /**
   * 获取等级属性
   * @param level
   * @param promote
   * @returns {{}|boolean}
   */
  getLvAttr (level, promote) {
    let metaAttr = this.detail?.attr
    if (!metaAttr) {
      return false
    }
    if (this.isSr) {
      let lvAttr = metaAttr[promote]
      let ret = {}
      _.forEach(lvAttr.attrs, (v, k) => {
        ret[k] = v * 1
      })
      _.forEach(lvAttr.grow, (v, k) => {
        ret[k] = ret[k] * 1 + v * (level - 1)
      })
      return ret
    }
  }
}
