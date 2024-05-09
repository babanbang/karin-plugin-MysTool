import _ from 'lodash'
import Artis from './artis/Artis.js'
import Attr from './attr/Attr.js'
import base from './base.js'
import { Data } from '#Mys.tool'
import { Character, Weapon } from './index.js'

export default class Avatar extends base {
  constructor (ds = {}, game = 'gs') {
    super(game)
    let char = Character.get({ id: ds.id, elem: ds.elem })
    if (!char) return

    this.id = char.id
    this.char = char
    this.game = char.game || game
    this._mysArtis = new Artis(this.game)
    this._artis = new Artis(this.game, true)
    this.setAvatar(ds)
  }

  /** profile.hasData 别名 */
  get hasData () {
    return !!(this.level > 1 || this?.weapon?.name)
  }

  get Artis () {
    return this._artis
  }

  get artifact () {
    const artis = []
    _.forEach(this.Artis.artis, (v, k) => {
      if (!_.isEmpty(v) && v.name && v.set) {
        artis.push({
          artiskey: k,
          ...v
        })
      }
    })
    return artis
  }

  get mysArtis () {
    return this._mysArtis
  }

  get isAvatar () {
    return true
  }

  get originalTalent () {
    return _.mapValues(this.talent, (ds) => ds.original)
  }

  static create (ds, game = 'gs') {
    const profile = new Avatar(ds, game)
    if (!profile) return false

    return profile
  }

  /** 设置角色基础数据 */
  setBasic (ds = {}, source = '') {
    const now = this._now || (new Date()) * 1
    this.name = ds.name || this.name || this.char.name || ''
    this.level = ds.lv || ds.level || this.level || 1
    this.cons = ds.cons || this.cons || 0
    this.fetter = ds.fetter || this.fetter || 0
    this._costume = ds.costume || this._costume || 0
    this.elem = (ds.element || ds.elem || this.elem || this.char.elem || '').toLowerCase()
    this.promote = Math.max((ds.promote ? ds.promote : this.promote) * 1 || 0, Attr.calcPromote(this.level))
    this.trees = this.trees || []
    this._source = ds._source || this._source || '' // 数据源
    this._time = ds._time || this._time || now // 面板最后更新时间
    this._update = ds._update || this._update || ds._time || now // 最后更新时间，包括mys

    if (ds.trees) {
      this.setTrees(ds.trees)
    }

    // 存在数据源时更新时间
    if (source) {
      this._update = now
      this._source = source !== 'mys' ? source : (this._source || source)
    }
  }

  /** 星铁的行迹数据 */
  setTrees (ds) {
    this.trees = []
    let prefix = ''
    const map = {}
    // eslint-disable-next-line no-unused-vars
    _.forEach(this.char?.detail?.tree || {}, (ds, key) => {
      const ret = /(\d{4})(\d{3})/.exec(key)
      if (ret && ret[1] && ret[2]) {
        prefix = prefix || ret[1]
        map[ret[2]] = key
      }
    })
    if (prefix) {
      for (let i = 0; i <= 3; i++) {
        map[`10${i}`] = `${prefix}10${i}`
      }
    }
    _.forEach(ds, (id) => {
      this.trees.push(map[(/\d{4}(\d{3})/.exec(id))?.[1] || id] || id)
    })
  }

  setAvatar (ds, source = '') {
    this.setAvatarBase(ds, source)
    if (!_.isEmpty(ds.artis) && source !== 'mys') {
      this._artis.setArtisData(ds.artis, source || ds._source)
    }
    this.calcAttr()
  }

  setAvatarBase (ds, source = '') {
    this._now = new Date() * 1
    this.setBasic(ds, source)
    if (!_.isEmpty(ds.weapon)) this.setWeapon(ds.weapon)
    if (!_.isEmpty(ds.talent)) this.setTalent(ds.talent, 'original', source)
    // 只要具备圣遗物信息，就更新mysArtis
    this._mysArtis.setArtisData(ds.mysArtis || ds.artis, source || ds._source)
    delete this._now
  }

  /** 设置武器 */
  setWeapon (ds = {}) {
    const w = Weapon.get(ds.name || ds.id, this.game)
    if (!w) return false

    this.weapon = {
      id: ds.id || w.id,
      name: ds.name || w.name,
      level: ds.level || ds.lv || 1,
      promote: _.isUndefined(ds.promote || ds.promote_level) ? Attr.calcPromote(ds.level || ds.lv || 1) : (ds.promote || ds.promote_level || 0),
      affix: ds.affix || ds.affix_level,
      ...w.getData('star,abbr,type,icon,imgs')
    }
    if (this.weapon.level < 20) {
      this.weapon.promote = 0
    }

    this.weapon.attr = w.calcAttr(this.weapon.level, this.weapon.promote)
  }

  /** 设置天赋 */
  setTalent (ds = false, mode = 'original') {
    if (!this.char) return false

    if (ds) {
      const ret = this.char.getAvatarTalent(ds, this.cons, mode)
      if (ret) this.talent = ret
    }
  }

  calcAttr () {
    if (!this.isProfile) return false

    let attr = this._attr = this._attr || Attr.create(this)
    this.attr = attr.calc()
    this.base = attr.getBase()
  }

  /** 获取数据详情 */
  getDetail (keys = '') {
    const data = (this.getData(keys || 'id,name,level,cons,elem,weapon,talent,artifact,fetter,trees') || {})
    if (data.trees) {
      data.talent_trees = []
      _.forEach(this.char.detail.tree, (v, id) => {
        data.talent_trees.push({
          ...v,
          id: id.slice(-3),
          active: data.trees.includes(id)
        })
      })
    }
    data.act_tree = {}
    _.forEach([101, 102, 103], i => {
      data.act_tree[i] = !!data.trees.find(t => Number(t.slice(-3)) === i)
    })
    return {
      ...data,
      star: this.char.detail.star,
      weaponType: this.char.weaponType,
      imgs: this.char.getImgs(this.costume)
    }
  }

  /** toJSON 供保存使用 */
  toJSON () {
    let keys = this.isGs
      ? 'name,id,elem,level,promote,fetter,costume,cons,talent:originalTalent'
      : 'name,id,elem,level,promote,cons,talent:originalTalent,trees'
    const ret = {
      ...this.getData(keys),
      weapon: Data.getData(this.weapon, this.isGs ? 'name,level,promote,affix' : 'id,level,promote,affix')
    }
    const artis = this.Artis.toJSON()
    if (!_.isEmpty(artis)) {
      ret.artis = artis
    }
    if (!this.mysArtis.isSameArtis(this.Artis)) {
      ret.mysArtis = this.mysArtis.toJSON()
    }
    return {
      ...ret,
      ...this.getData('_source,_time,_update,_talent')
    }
  }
}
