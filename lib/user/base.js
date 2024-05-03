export default class base {
  constructor (game = 'gs') {
    this.game = game
  }

  gameKey (game = '') {
    game = game || this.game
    return {
      m: `${game}_main`,
      u: `${game}_uids`
    }
  }

  getUids (game = 'gs') {
    return this[this.gameKey(game).u] || []
  }

  async save () {
    await this.db.saveDB(this)
  }
}
