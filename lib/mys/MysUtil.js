import { Data } from '#MysTool/utils'
import _ from 'lodash'
import moment from 'moment'
import { game_biz, game_region } from './MysTool.js'

const all_game_biz = Object.values(game_biz).flat()
const MysUtil = {
  reg: {
    sr: '(\\*|#?(sr|星铁|星轨|穹轨|星穹|崩铁|星穹铁道|崩坏星穹铁道|铁道))',
    zzz: '(%|#?(zzz|绝区零))',
    gs: '#?(gs|原神)'
  },
  games: [],
  addGames (key, name) {
    this.games.push({ key, name })
    this.games = _.sortBy(this.games)
  },
  servs: ['mys', 'hoyolab'],
  getServ (uid) {
    return /^(18|[6-9])[0-9]{8}/i.test(uid) ? this.servs[1] : this.servs[0]
  },
  /** 获取标准ltuid */
  getLtuid (data) {
    if (!data) return false

    if (/^\d{4,10}$/.test(data)) {
      return data
    }
    let testRet = /ltuid=(\d{4,10})/g.exec(data.ck || data)
    if (testRet && testRet[1]) {
      return testRet[1]
    }
    return false
  },
  /** 循环game */
  async eachGame (fn) {
    await Data.forEach([...this.games], (ds) => {
      return fn(ds.key, ds)
    })
  },
  /** 生成设备guid */
  getDeviceGuid () {
    function S4 () {
      return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1)
    }

    return (S4() + S4() + '-' + S4() + '-' + S4() + '-' + S4() + '-' + S4() + S4() + S4())
  },
  getSeed_id (length = 16) {
    const characters = '0123456789abcdef'
    let result = ''
    for (let i = 0; i < length; i++) {
      result += characters[Math.floor(Math.random() * characters.length)]
    }
    return result
  },
  /**
   * @param {'gs'|'sr'|'zzz'} game
   */
  getGame (game) {
    return this.games.find((g) => g.key === game)
  },
  getGameByMsg (msg = '') {
    for (const i in this.reg) {
      if (new RegExp('^' + this.reg[i]).test(msg)) {
        return this.games.find((g) => g.key === i)
      }
    }

    return this.games.find((g) => g.key === 'gs')
  },
  matchUid (msg) {
    const uid = msg.match(/(18|[1-9])[0-9]{8}/g)
    if (!uid?.[0] || uid.length > 1) return false
    return uid[0]
  },
  /**
   * @param {'gs'|'sr'|'zzz'} game
   */
  getGamebiz (game = '', os = false) {
    if (!game) return all_game_biz
    return game_biz[game][os ? 1 : 0]
  },
  getGameByGamebiz (biz) {
    for (const game in game_biz) {
      if (game_biz[game].includes(biz)) return game
    }
  },
  getRegion (uid, game) {
    switch (String(uid).slice(0, -8)) {
      case '5':
        return game_region[game][1].region // B服
      case '6':
        return game_region[game][2].region// 美服
      case '7':
        return game_region[game][3].region// 欧服
      case '8':
      case '18':
        return game_region[game][4].region// 亚服
      case '9':
        return game_region[game][5].region// 港澳台服
    }
    return game_region[game][0].region // 官服
  },
  getCookieMap (cookie) {
    const cookieArray = cookie.replace(/#|'|"/g, '').replace(/\s*/g, '').split(';')
    const cookieMap = {}
    for (let item of cookieArray) {
      const entry = item.replace('=', '~').split('~')
      if (!entry[0]) continue
      cookieMap[entry[0]] = entry[1]
    }
    return cookieMap
  },
  splicToken (token) {
    // eslint-disable-next-line no-unused-vars
    return Object.entries(token).filter(([k, v]) => v).map(([k, v]) => `${k}=${v}`).join(';') + ';'
  },
  randomString (n) {
    return _.sampleSize('0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ', n).join('')
  },
  isCk (msg) {
    if (/c(oo)?k(ie)?/i.test(msg)) return true
    return false
  },
  getEndOfDay () {
    return Number(moment().endOf('day').format('X')) - Number(moment().format('X'))
  },
  RegionName (region, game) {
    if (Number(region)) region = this.getRegion(uid, game)

    return game_region[game].find((r) => r.region === region).name
  },
  checkMonth (year, month, num = 2) {
    month -= 1

    const nowDate = new Date()
    let nowYear = nowDate.getFullYear()
    let nowMonth = nowDate.getMonth()

    nowDate.setMonth(nowDate.getMonth() - num)
    let twoMonthsAgoYear = nowDate.getFullYear()
    let twoMonthsAgoMonth = nowDate.getMonth()

    if (year > twoMonthsAgoYear || (year === twoMonthsAgoYear && month >= twoMonthsAgoMonth)) {
      if (year < nowYear || (year === nowYear && month <= nowMonth)) {
        return true
      }
    }
    return false
  }
}

export default MysUtil
