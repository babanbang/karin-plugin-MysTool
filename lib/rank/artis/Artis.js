import base from '../base.js'
import Artifact from '../Artifact.js'
import _ from 'lodash'

export default class Artis extends base {
  constructor (game, isProfile = false) {
    super(game)
    this.artis = {}
    this.isProfile = !!isProfile
  }

  eachIdx (fn) {
    for (let idx = 1; idx <= (this.isGs ? 5 : 6); idx++) {
      this.artis[idx] = this.artis[idx] || {}
      let ret = fn(this.artis[idx], idx)
      if (ret === false) break
    }
  }

  setArtisData (ds = {}, source = '') {
    this.source = source
    // eslint-disable-next-line no-unused-vars
    this.eachIdx((arti, idx) => {
      this.setArtis(idx, ds[idx] || ds[`arti${idx}`] || {})
    })
  }

  setArtis (idx = 1, ds = {}) {
    idx = idx.toString().replace('arti', '') * 1 || 1
    this.setArtisBase(idx, ds)
    if (!this.isProfile) return

    const arti = this.artis[idx]
    if ((!ds.attrIds || !ds.mainId) && this.source !== 'mysSR') {
      return false
    }
    arti.mainId = ds.mainId
    arti.attrIds = ds.attrIds
    const artiObj = Artifact.get(arti, this.game)
    if (!artiObj) return false

    const attr = artiObj.getAttrData(arti, idx, this.game)
    if (!attr && this.source !== 'mysSR') {
      logger.error('attr id error', ds.main, ds.mainId, idx, arti.level, arti.star)
      return false
    }
    arti.set = artiObj.meta.set
    arti.main = attr?.main
    arti.attrs = attr?.attrs
  }

  setArtisBase (idx = 1, ds = {}) {
    const arti = this.artis[idx]

    arti.id = ds.id || arti.id || ''
    arti.name = ds.name || arti.name || ''
    arti.level = ds.level || arti.level || 1
    arti.star = ds.star || arti.star || 5
  }

  /** 获取保存数据 */
  toJSON () {
    let ret = {}
    this.eachIdx((ds, idx) => {
      const key = this.isGs ? 'name' : 'id'
      const tmp = {
        level: ds.level || 1
      }
      if (!ds[key]) return true

      tmp[key] = ds[key]
      if (this.isGs) {
        tmp.star = ds.star || 5
      }
      // 如果不为面板数据，则不保存mainId和attrIds
      if (!this.isProfile) {
        ret[idx] = tmp
        return true
      }
      if (!ds.mainId || !ds.attrIds) {
        return true
      }
      ret[idx] = tmp
      tmp.mainId = ds.mainId || ds.main?.id
      if (this.isSr) {
        tmp.attrIds = []
        _.forEach(ds.attrs, (as) => {
          tmp.attrIds.push([as?.id || '', as?.count || 1, as?.step || 0].join(','))
        })
      } else {
        tmp.attrIds = ds.attrIds
      }
    })
    return ret
  }

  isSameArtis (target) {
    let k = (ds) => [ds?.name || '', ds?.level || '', ds?.star || ''].join('|')
    let ret = true
    this.eachIdx((ds, idx) => {
      if (k(ds) !== k(target[idx])) {
        ret = false
      }
    })
    return ret
  }
}
