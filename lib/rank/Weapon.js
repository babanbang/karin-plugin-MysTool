import base from './base.js'
import { Meta } from './index.js'
import { Data } from '#Mys.tool'
import _ from 'lodash'

export default class Weapon extends base {
  constructor (meta, game) {
    if (!meta || !meta.name) return false

    super(game)
    const cache = this._getCache(`weapon:${game}:${meta.name}`)
    if (cache) return cache

    this.id = meta.id
    this.name = meta.name
    this.meta = meta
    this.type = meta.type
    this.star = meta.star
    return this._cache()
  }

  get detail () {
    return this.getDetail()
  }

  get icon () {
    return `meta/weapon/${this.type}/${this.name}/icon.png`
  }

  get abbr () {
    const name = this.name
    return name.length <= 4 ? name : (this.meta?.abbr || name)
  }

  get sName () {
    const name = this.name.replaceAll(/[「」]/g, '')
    return name.length <= 8 ? name : (this.meta?.abbr || name)
  }

  get imgs () {
    return {
      icon: `meta/weapon/${this.type}/${this.name}/icon.png`,
      icon2: `meta/weapon/${this.type}/${this.name}/awaken.png`,
      gacha: `meta/weapon/${this.type}/${this.name}/gacha.png`
    }
  }

  get maxLv () {
    return this.star <= 2 ? 70 : 90
  }

  get maxPromote () {
    return this.star <= 2 ? 4 : 6
  }

  get maxAffix () {
    if (this.isSr) return 5
    const data = this.detail?.affixData?.datas || {}
    return (data['0'] && data['0'][4]) ? 5 : 1
  }

  static get (name, game = 'gs') {
    const data = Meta.getData(game, 'weapon', name)
    if (data) return new Weapon(data, game)
    return false
  }

  getDetail () {
    if (this._detail) {
      return this._detail
    }
    try {
      this._detail = Data.readJSON(`${this.metaPath}weapon/${this.type}/${this.name}/data.json`)
    } catch (e) {
      logger.error(e)
    }
    return this._detail
  }

  /**
   * 计算武器主属性
   * @param level 武器等级
   * @param promote 武器突破
   * @returns {{atkBase: number, attr: {value: *, key: *}}|{}|boolean}
   */
  calcAttr (level, promote = -1) {
    const metaAttr = this.detail?.attr
    if (!metaAttr) return false

    if (this.isSr) {
      const ret = {}
      _.forEach(metaAttr[promote].attrs, (v, k) => {
        ret[k] = v * 1
      })
      _.forEach(this.detail?.growAttr, (v, k) => {
        ret[k] = ret[k] * 1 + v * (level - 1)
      })
      return ret
    }

    let lvLeft = 1
    let lvRight = 20
    let lvStep = [1, 20, 40, 50, 60, 70, 80, 90]
    let currPromote = 0
    for (let idx = 0; idx < lvStep.length - 1; idx++) {
      if (promote === -1 || (currPromote === promote)) {
        if (level >= lvStep[idx] && level <= lvStep[idx + 1]) {
          lvLeft = lvStep[idx]
          lvRight = lvStep[idx + 1]
          break
        }
      }
      currPromote++
    }
    let wAttr = this?.detail?.attr || {}
    let wAtk = wAttr.atk || {}
    let valueLeft = wAtk[lvLeft + '+'] || wAtk[lvLeft] || {}
    let valueRight = wAtk[lvRight] || {}
    let atkBase = valueLeft * 1 + ((valueRight - valueLeft) * (level - lvLeft) / (lvRight - lvLeft))
    let wBonus = wAttr.bonusData || {}
    valueLeft = wBonus[lvLeft + '+'] || wBonus[lvLeft]
    valueRight = wBonus[lvRight]
    let stepCount = Math.ceil((lvRight - lvLeft) / 5)
    let valueStep = (valueRight - valueLeft) / stepCount
    let value = valueLeft + (stepCount - Math.ceil((lvRight - level) / 5)) * valueStep
    return {
      atkBase,
      attr: {
        key: wAttr.bonusKey,
        value
      }
    }
  }
}
