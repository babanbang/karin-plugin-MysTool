import Base from '../Base.js'

export default class ProfileServ extends Base {
  constructor (cfg, game) {
    super(game)
    /**
     * @type {{
     *  request: Function,
     *  response: Function,
     *  updatePlayer: Function
     * }}
     */
    this._cfg = cfg
    this.name = cfg.name
    this.cfgKey = cfg.id
  }

  execFn (fn, args = [], def = false) {
    const { _cfg } = this
    if (_cfg[fn]) {
      return _cfg[fn].apply(this, args)
    }
    return def
  }

  async request (uid) {
    return await this._cfg.request?.call(this, uid, {
      method: 'get',
      headers: {
        'User-Agent': 'Karin-MysTool/1.0.0'
      },
      timeout: 10000
    })
  }

  async response (data, req) {
    return await this._cfg.response.call(this, data, req)
  }

  getCdTime (data) {
    let cdTime = 5 * 60
    return Math.max(cdTime, this.execFn('cdTime', [data], 60))
  }

  updatePlayer (player, data) {
    return this.execFn('updatePlayer', [player, data], {})
  }
}
