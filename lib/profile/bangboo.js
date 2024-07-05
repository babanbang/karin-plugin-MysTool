import Base from './Base.js'
import { Meta } from './index.js'

export default class Bangboo extends Base {
  constructor (meta, game) {
    if (!meta || !meta.name) return false

    super(game)
    const cache = this._getCache(`bangboo:${game}:${meta.name}`)
    if (cache) return cache

    this.id = meta.id
    this.name = meta.name
    this.meta = meta
    this.star = meta.star
    return this._cache()
  }

  get icon () {
    return `meta/bangboo/imgs/${this.name}/icon.png`
  }

  static get (name, game = 'zzz') {
    const data = Meta.getData(game, 'bangboo', name)
    if (data) return new Bangboo(data, game)
    return false
  }
}