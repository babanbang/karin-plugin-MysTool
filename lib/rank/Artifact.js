import base from './base.js'
import Meta from './Meta.js'
import ArtisAttr from './artis/ArtisAttr.js'
/** 圣遗物 */
export default class Artifact extends base {
  constructor (data, game = 'gs') {
    if (!data) return false
    super(game)
    const cache = this._getCache(`arti:${game}:${data.id || data.name}`)
    if (cache) return cache
    this.id = data.id || ''
    this.name = data.name
    this.meta = data
    return this._cache()
  }

  static get (name, game = 'gs') {
    if (name.id || name.name) {
      name = name.id || name.name
      game = name.game || game
    }
    if (!name) return false

    // 根据名字查询
    const data = Meta.getData(game, 'arti', name)
    if (data) {
      return new Artifact(data, game)
    }
    return false
  }

  /** 获取圣遗物属性数据 */
  getAttrData (arti, idx = 1, game = 'gs') {
    return ArtisAttr.getData(arti, idx, game)
  }
}
