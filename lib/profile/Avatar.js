import { Data } from '#Mys.tool'
import _ from 'lodash'
import Base from './Base.js'
import Artis from './artis/Artis.js'
import Attr from './attr/Attr.js'
import ArtisMark from './artis/ArtisMark.js'
import { Character, ProfileDmg, Weapon, Format } from './index.js'
import moment from 'moment'

export default class Avatar extends Base {
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

  get name () {
    return this.char?.name || ''
  }
  get costume () {
    let costume = this._costume
    if (_.isArray(costume)) {
      costume = costume[0]
    }
    return costume
  }

  get updateTime () {
    let time = this._time
    if (!time) {
      return ''
    }
    if (_.isString(time)) {
      return moment(time).format('MM-DD HH:mm')
    }
    if (_.isNumber(time)) {
      return moment(new Date(time)).format('MM-DD HH:mm')
    }
    return ''
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

  get isProfile () {
    // 检查数据源
    if (!this._source || !['mysSR', 'homo', 'avocado', 'enkahsr', 'enka', 'mgg', 'hutao'].includes(this._source)) {
      return false
    }
    // 检查旅行者
    if (['空', '荧'].includes(this.name)) {
      return !!this.elem
    }
    return true
  }

  get originalTalent () {
    return _.mapValues(this.talent, (ds) => ds.original)
  }

  get dataSource () {
    return {
      enka: 'Enka.Network',
      miao: '喵喵Api',
      mgg: 'MiniGG-Api',
      hutao: 'Hutao-Enka',
      mys: '米游社',
      mysSR: '米游社',
      homo: 'Mihomo'
    }[this._source] || this._source
  }

  static create (ds, game = 'gs') {
    const profile = new Avatar(ds, game)
    if (!profile) return false

    return profile
  }

  /** 设置角色基础数据 */
  setBasic (ds = {}, source = '') {
    const now = this._now || (new Date()) * 1
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

  /** 获取武器详情信息 */
  getWeaponDetail () {
    let ret = {
      ...this.weapon
    }
    if (!ret.id) return {}

    let wData = Weapon.get(ret.id, this.game)
    if (!wData) return {}

    ret.sName = wData.sName
    ret.splash = this.isSr ? wData.imgs.splash : wData.imgs.gacha
    let wAttr = wData.calcAttr(ret.level, ret.promote)
    let attrs = {}
    if (this.isSr) {
      _.forEach(wAttr, (val, key) => {
        attrs[key] = Format.comma(val, 1)
      })
    } else if (this.isGs) {
      attrs.atkBase = Format.comma(wAttr.atkBase, 1)
      if (wAttr?.attr?.key) {
        let keyType = { mastery: 'comma' }
        attrs[wAttr.attr.key] = Format[keyType[wAttr.attr.key] || 'pct'](wAttr.attr.value, 1)
      }
    }
    ret.attrs = attrs
    ret.desc = wData.getAffixDesc(ret.affix)
    return ret
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

    /** @type {Attr} */
    let attr = this._attr = this._attr || Attr.create(this)
    this.attr = attr.calc()
    this.base = attr.getBase()
  }

  /** 获取数据详情 */
  getDetail (keys = '') {
    const data = (this.getData(keys || 'id,name,level,cons,elem,weapon,talent,artifact,fetter,trees') || {})
    if (data.trees) {
      this.setTreesAct(data)
    }

    return {
      ...data,
      star: this.char.detail.star,
      weaponType: this.char.weaponType,
      imgs: this.char.getImgs(this.costume),
      artisDetail: this.getArtisMark(false)
    }
  }

  setTreesAct (data) {
    data.talent_trees = []
    _.forEach(this.char.detail.tree, (v, id) => {
      data.talent_trees.push({
        ...v,
        id: id.slice(-3),
        active: data.trees.includes(id)
      })
    })
    data.act_tree = {}
    _.forEach([101, 102, 103], i => {
      data.act_tree[i] = !!data.trees.find(t => Number(t.slice(-3)) === i)
    })
  }

  /** 获取当前profileData的圣遗物评分，withDetail=false仅返回简略信息 */
  getArtisMark (withDetail = true) {
    return ArtisMark.getMarkDetail(this, withDetail)
  }

  /** 计算当前profileData的伤害信息 */
  async calcDmg ({ enemyLv = 91, mode = 'dmg', dmgIdx = 0 }) {
    if (!this.dmg || this.dmg._update !== this._update) {
      let ds = this.getData('id,level,elem,attr,cons,artis:Artis.sets,trees')
      ds.talent = _.mapValues(this.talent, 'level')
      ds.weapon = Data.getData(this.weapon, 'name,affix')
      ds._update = this._update
      this.dmg = new ProfileDmg(ds, this.game)
    }
    return await this.dmg.calcData({ enemyLv, mode, dmgIdx })
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
    return {
      ...ret,
      ...this.getData('_source,_time,_update,_talent')
    }
  }
}
