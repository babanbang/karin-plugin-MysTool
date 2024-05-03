import base from './base.js'
import { Meta } from './index.js'

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

  get icon () {
    return `weapon/${this.type}/${this.name}/icon.png`
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
      icon: `weapon/${this.type}/${this.name}/icon.png`,
      icon2: `weapon/${this.type}/${this.name}/awaken.png`,
      gacha: `weapon/${this.type}/${this.name}/gacha.png`
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
}
