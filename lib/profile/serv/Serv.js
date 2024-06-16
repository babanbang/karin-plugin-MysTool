import { Cfg } from '#MysTool/utils'
import ProfileReq from './ProfileReq.js'
import ProfileServ from './ProfileServ.js'
import AvocadoApi from './api/AvocadoApi.js'
import EnkaApi from './api/EnkaApi.js'
import EnkaHsrApi from './api/EnkaHSRApi.js'
import MihomoApi from './api/HomoApi.js'
import HutaoApi from './api/HutaoApi.js'
import MggApi from './api/MggApi.js'
import MysSRApi from './api/MysSRApi.js'

const apis = {
  mgg: MggApi,
  hutao: HutaoApi,
  homo: MihomoApi,
  avocado: AvocadoApi,
  mysSR: MysSRApi,
  enka: EnkaApi,
  enkaHSR: EnkaHsrApi
}
const servs = {}

const servKey = {
  gs: {
    1: 'mgg',
    2: 'hutao',
    3: 'enka'
  },
  sr: {
    1: 'homo',
    2: 'avocado',
    3: 'enkaHSR'
  }
}
const defServKey = {
  gs: ['mgg', 'mgg', 'enka'],
  sr: ['homo', 'homo', 'homo']
}

const Serv = {
  /** 根据UID获取 ProfileServ */
  getServ (uid, game = 'gs') {
    const set = Cfg.getConfig('profile', game)

    // 根据uid判断当前服务器类型。官服0 B服1 国际2
    const servType = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 1, 6: 2, 7: 2, 8: 2, 18: 2, 9: 2 }[String(uid).slice(0, -8)]

    // 获取原神、星铁对应服务选择的配置
    let servCfg = (set?.serv || '0').toString()
    let servIdx = servCfg[servType] || servCfg[0] || '0'

    // 如果指定了序号，则返回对应服务。
    // 原神：0自动，1Mgg, 2Hutao，3Enka
    // 星铁：0自动，1Mihomo，2Avocado, 3EnkaHSR
    const serv = []
    if (set?.MysApi && game === 'sr') serv.unshift(Serv.serv('mysSR'))

    if (servKey[game]?.[servIdx]) {
      serv.push(Serv.serv(servKey[game][servIdx]))
      return serv
    }

    // 设置为0，使用返回默认的serv。官服0 B服1 国际2
    serv.push(Serv.serv(defServKey[game]?.[servType]))

    return serv
  },
  /**
   * 根据key获取ProfileServ
   * @returns {ProfileServ}
   */
  serv (key, game) {
    if (!servs[key]) {
      servs[key] = new ProfileServ(apis[key], game)
    }
    return servs[key]
  },

  /**
   * 发起请求
   * @param {import('#MysTool/profile').Player} player
   */
  async req (player, e) {
    const req = ProfileReq.create(player, e)
    if (!req) return false

    const { uid } = player

    const servs = Serv.getServ(uid, player.game)
    for (const serv of servs) {
      try {
        const res = await req.requestProfile(player, serv)
        if (res) return true
      } catch (err) {
        logger.error(err)
        if (e.reply && !e._isReplyed) {
          e._isReplyed = true
          e.reply(`UID:${uid}更新面板失败，更新服务：${serv.name}`)
        }
        return false
      }
    }
    if (e.reply && !e._isReplyed) {
      e.reply(`UID:${uid}更新面板失败，更新服务：${servs.map(s => s.name).join(', ')}`)
    }
    return false
  }
}

export default Serv
