import { plugin, redis } from '#Karin'
import { common, PluginName } from '#MysTool/utils'
import { MysApi, MysUtil } from '#MysTool/mys'

const uids = {
  gs: '75276550',
  sr: '80823548',
  zzz: ''
}
const reg = Object.values(MysUtil.reg).join('|')
export class exchange extends plugin {
  constructor () {
    super({
      name: '直播兑换码',
      dsc: '前瞻直播兑换码',
      event: 'message',
      priority: 0,
      rule: [
        {
          reg: new RegExp(`^(${reg})?(直播|前瞻)?兑换码$`, 'i'),
          fnc: 'getCode'
        }
      ]
    })
  }

  async getCode () {
    const game = MysUtil.getGameByMsg(this.e.msg)
    if (!uids[game]) return false

    let msg = []
    this.redisKey = `${PluginName}:${game}:exchange:`
    this.mysApi = new MysApi({ uid: uids[game], server: 'mys', game })

    const catchData = await redis.get(this.redisKey + 'codes')
    if (catchData) {
      msg = JSON.parse(catchData)
    } else {
      const { actid = '', deadline = '', timeout = false, EXTime = { EX: 0 } } = await this.getActId()
      if (timeout) {
        this.reply('当前暂无直播兑换码')
        return true
      }
      if (!actid) {
        logger.info('[兑换码] 未获取到actId')
        return true
      }

      const index = await this.getData('index', { actid })
      if (!index?.data?.live?.title) return true

      const index_data = index.data.live
      const { title, code_ver, remain } = index_data.title
      if (remain > 0) {
        this.reply(`暂无${title}直播兑换码`)
        return true
      }

      const code = await this.mysApi.getData('miyolive_code', { actid, code_ver })
      if (!code?.data?.code_list) {
        logger.info('[兑换码] 未获取到兑换码')
        return true
      }

      if (!EXTime.EX && code.data.code_list[0].to_get_time) {
        const date = new Date(code.data.code_list[0].to_get_time * 1000)
        date.setDate(date.getDate() + 1)
        EXTime.EX = Math.floor((date.setHours(23, 59, 59) - Date.now()) / 1000)

        redis.set(this.redisKey + 'actid', JSON.stringify({
          actid, EXTime,
          deadline: `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()} 12:00:00`
        }), EXTime)
      }

      const codes = code.data.code_list.map(val => val.code)
      msg = [`${title}-直播兑换码`, `兑换码过期时间: \n${deadline}`, ...codes]
      if (codes.length === 3) {
        redis.set(this.redisKey + 'codes', JSON.stringify(msg), EXTime)
      }
    }

    this.reply(common.makeForward(msg))
    return true
  }

  /** 获取act_id */
  async getActId () {
    const catchData = await redis.get(this.redisKey + 'actid')
    if (catchData) {
      return JSON.parse(catchData)
    }

    const ret = await this.mysApi.getData('miyolive_actId')
    if (ret?.retcode !== 0) {
      return {}
    }

    for (const p of ret.data.list) {
      const post = p?.post?.post
      if (!post) continue

      const structured_content = post.structured_content
      const result = structured_content.match(/{\"link\":\"https:\/\/webstatic.mihoyo.com\/bbs\/event\/live\/index.html\?act_id=(.*?)\\/)
      if (result) {
        const date = new Date(post.created_at * 1000)
        date.setDate(date.getDate() + 3)

        return {
          actid: result[1],
        }
      }
    }

    return { timeout: true }
  }
}
