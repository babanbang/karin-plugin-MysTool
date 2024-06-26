import Base from './Base.js'
import Meta from './Meta.js'
import ArtisAttr from './artis/ArtisAttr.js'
import ArtisMark from './artis/ArtisMark.js'
/** 圣遗物 */
export default class Artifact extends Base {
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

  get setName () {
    return this.set
  }

  get img () {
    return `meta/artifact/imgs/${this.setName}/${this.isSr ? 'arti-' : ''}${this.idx}.png`
  }

  static get (name, game = 'gs') {
    if (name.id || name.name) {
      name = name.id || name.name
      game = name.game || game
    }
    if (!name) return false

    if (game === 'gs' && /^\d{5}$/.test(name)) {
      name = name.toString()
      const data = Meta.matchGame(game, 'artiSet', name.slice(0, 2))
      if (data) {
        name = data.data.idxs[[4, 2, 5, 1, 3][name[3] - 1]]
      }
    }
    // 根据名字或ID查询
    const data = Meta.getData(game, 'arti', name)
    if (data) {
      return new Artifact(data, game)
    }
    return false
  }

  static getArtisKeyTitle (game = 'gs') {
    return ArtisMark.getKeyTitleMap(game)
  }

  /** 获取圣遗物属性数据 */
  getAttrData (arti, idx = 1, game = 'gs') {
    return ArtisAttr.getData(arti, idx, game)
  }
}
