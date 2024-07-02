/*
* 角色培养及天赋材料
* */
import { Meta } from '#MysTool/profile'
import { Data } from '#MysTool/utils'
import Base from './Base.js'

export default class Material extends Base {
  constructor (data, game = 'gs') {
    super(game)
    let cache = this._getCache(`material-${game}:${data.name}`)
    if (cache) return cache

    this.name = data.name
    this.meta = data
    this.type = data.type
    this.star = data.star
    return this._cache()
  }

  static get (name, game = 'gs') {
    const data = Meta.getData(game, 'material', name)
    if (data) return new Material(data, game)

    return false
  }

  get abbr () {
    let name = this.name
    if (this.type === 'talent') {
      return Data.regRet(/「(.+)」/, name, 1) || name
    }
    if (this.type === 'weapon') {
      return name.slice(0, 4)
    }
    return abbr[name] || name
  }

  get label () {
    let abbr = this.abbr
    if (this.city) {
      return `${this.city}·${this.abbr}`
    }
    return abbr
  }

  get icon () {
    return `meta/material/${this.type}/${this.name}.png`
  }

  get source () {
    return this.week ? ['周一/周四', '周二/周五', '周三/周六'][this.week - 1] : ''
  }
}
