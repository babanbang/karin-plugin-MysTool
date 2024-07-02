import { Data } from '#MysTool/utils'
import lodash from 'lodash'
import Base from './Base.js'
import { Format, Meta } from './index.js'

export default class Weapon extends Base {
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
      gacha: `meta/weapon/${this.type}/${this.name}/gacha.png`,
      splash: `meta/weapon/${this.type}/${this.name}/splash.png`
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
      lodash.forEach(metaAttr[promote].attrs, (v, k) => {
        ret[k] = v * 1
      })
      lodash.forEach(this.detail?.growAttr, (v, k) => {
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

  /**
   * 获取武器精炼描述
   * @param affix 精炼
   * @returns {{name, desc: *}|{}}
   */
  getAffixDesc (affix = 1) {
    if (this.isGs) {
      let { text, datas } = this.detail?.affixData || {}
      let { descFix } = Meta.getMeta('gs', 'weapon')
      let reg = /\$\[(\d)\]/g
      let ret
      let desc = descFix[this.name] || text || ''
      while ((ret = reg.exec(desc)) !== null) {
        let idx = ret[1]
        let value = datas?.[idx]?.[affix - 1]
        desc = desc.replaceAll(ret[0], `<nobr>${value}</nobr>`)
      }
      return {
        name: '',
        desc
      }
    }
    let skill = this.detail.skill
    let { desc, tables } = skill
    let reg = /\$(\d)\[(i|f1|f2)\](%?)/g
    let ret
    while ((ret = reg.exec(desc)) !== null) {
      let [txt, idx, format, pct] = ret
      let value = tables?.[idx]?.[affix - 1]
      if (pct === '%') {
        value = Format.pct(value, format === 'f2' ? 2 : 1)
      } else {
        value = Format.comma(value)
      }
      desc = desc.replaceAll(txt, value)
    }
    return {
      name: skill.name || '',
      desc
    }
  }

  /**
   * 获取当前武器Buff配置
   * @returns {*|boolean}
   */
  getWeaponBuffs () {
    let { weaponBuffs } = Meta.getMeta(this.game, 'weapon')
    let buffs = weaponBuffs[this.id] || weaponBuffs[this.name]
    if (!buffs) return false

    if (lodash.isPlainObject(buffs) || lodash.isFunction(buffs)) {
      buffs = [buffs]
    }
    return buffs
  }

  /**
   * 获取武器精炼 Buff
   * @param affix
   * @param isStatic
   * @returns {*[]}
   */
  getWeaponAffixBuffs (affix, isStatic = true) {
    let buffs = this.getWeaponBuffs()
    let ret = []
    let self = this
    let { detail } = this

    let tables = {}
    lodash.forEach(detail?.skill?.tables || {}, (ds, idx) => {
      tables[idx] = ds[affix - 1]
    })

    lodash.forEach(buffs, (ds) => {
      if (lodash.isFunction(ds)) {
        ds = ds(tables)
      }
      if (!!ds.isStatic !== !!isStatic) {
        return true
      }

      // 静态属性
      if (ds.isStatic) {
        let tmp = {}
        // 星铁武器格式
        if (ds.idx && ds.key) {
          if (!ds.idx || !ds.key) return true
          if (!tables[ds.idx]) return true
          tmp[ds.key] = tables[ds.idx]
        }
        if (ds.refine) {
          lodash.forEach(ds.refine, (r, key) => {
            tmp[key] = r[affix - 1] * (ds.buffCount || 1)
          })
        }
        if (!lodash.isEmpty(tmp)) {
          ret.push({
            isStatic: true,
            data: tmp
          })
        }
        return true
      }

      // 自动拼接标题
      if (!/：/.test(ds.title)) {
        ds.title = `${self.name}：${ds.title}`
      }
      ds.data = ds.data || {}
      // refine
      if (ds.idx && ds.key) {
        if (!ds.idx || !ds.key) return true
        if (!tables[ds.idx]) return true
        ds.data[ds.key] = tables[ds.idx]
      } else if (ds.refine) {
        lodash.forEach(ds.refine, (r, key) => {
          ds.data[key] = ({ refine }) => r[refine] * (ds.buffCount || 1)
        })
      }

      ret.push(ds)
    })

    return ret
  }
}
