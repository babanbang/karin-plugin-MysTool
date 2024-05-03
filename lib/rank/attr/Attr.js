import base from '../base.js'

export default class Attr extends base {
  constructor (profile) {
    super(profile.game)
  }

  /** 只有原神才需要 */
  static calcPromote (lv) {
    if (lv === 20) return 1
    if (lv === 90) return 6

    const lvs = [1, 20, 40, 50, 60, 70, 80, 90]
    let promote = 0
    for (let idx = 0; idx < lvs.length - 1; idx++) {
      if (lv >= lvs[idx] && lv <= lvs[idx + 1]) {
        return promote
      }
      promote++
    }
    return promote
  }
}
