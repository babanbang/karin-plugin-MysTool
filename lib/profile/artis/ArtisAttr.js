import lodash from 'lodash'
import { Format, Meta } from '../index.js'

const AttrGS = {
  getMain (id, level, star) {
    const { mainIdMap, attrMap } = Meta.getMeta('gs', 'arti')
    const key = mainIdMap[id]
    if (!key) return false

    const attrCfg = attrMap[Format.isElem(key) ? 'dmg' : key]
    const posEff = ['hpPlus', 'atkPlus', 'defPlus'].includes(key) ? 2 : 1
    const starEff = { 1: 0.21, 2: 0.36, 3: 0.6, 4: 0.9, 5: 1 }
    return {
      id,
      key,
      value: attrCfg.value * (1.2 + 0.34 * level) * posEff * (starEff[star || 5])
    }
  },

  getAttr (ids) {
    const ret = []
    const tmp = {}
    const { attrIdMap, attrMap } = Meta.getMeta('gs', 'arti')
    lodash.forEach(ids, (id) => {
      let cfg = attrIdMap[id]
      if (!cfg) return true

      const { key, value } = cfg
      if (!tmp[key]) {
        tmp[key] = {
          key,
          upNum: 0,
          eff: 0,
          value: 0
        }
        ret.push(tmp[key])
      }
      tmp[key].value += value * (attrMap[key].format === 'pct' ? 100 : 1)
      tmp[key].upNum++
      tmp[key].eff += value / attrMap[key].value * (attrMap[key].format === 'pct' ? 100 : 1)
    })
    return ret
  },

  getData (mainId, attrIds, level, star) {
    return {
      main: AttrGS.getMain(mainId, level, star),
      attrs: AttrGS.getAttr(attrIds, star)
    }
  }

}

const AttrSR = {
  getData (mainId, attrIds, level, star, idx = 1) {
    const { metaData } = Meta.getMeta('sr', 'arti')
    const mainKey = metaData.mainIdx[idx][mainId]
    const starCfg = metaData.starData[star]
    const mainCfg = starCfg.main[mainKey]
    if (!mainId || !mainCfg) return false

    const attrs = []
    lodash.forEach(attrIds, (ds) => {
      const _ds = ds
      if (lodash.isString(ds)) {
        const [id, count, step] = ds.split(',')
        ds = { id, count, step }
      }
      const attrCfg = starCfg.sub[ds.id]
      if (!attrCfg) {
        logger.error(`not found attr，ds:${JSON.stringify(ds)};_ds:${JSON.stringify(_ds)}`)
        return true
      }
      const value = attrCfg?.base * ds.count + attrCfg.step * ds.step
      attrs.push({
        ...ds,
        key: attrCfg?.key,
        upNum: ds.count,
        eff: value / (attrCfg.base + attrCfg.step * 2),
        value
      })
    })
    return {
      main: {
        id: mainId,
        key: mainKey,
        value: mainCfg.base + mainCfg.step * level
      },
      attrs
    }
  }
}

const AttrZZZ = {
  getData () {
    return {}
  }
}

export default {
  getData (arti, idx = 1, game = 'gs') {
    const tmp = game === 'gs' ? AttrGS : game === 'sr' ? AttrSR : AttrZZZ
    return tmp.getData(arti.mainId, arti.attrIds, arti.level, arti.star, idx)
  },

  hasAttr (arti) {
    if (arti.isSr) return true

    arti.forEach((ds) => {
      if (ds.name) {
        return !!(ds.mainId && ds.attrIds)
      }
    })
    return true
  }
}
