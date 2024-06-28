import { plugin, redis } from '#Karin'
import { common, PluginName } from '#MysTool/utils'
import { MysApi, MysUtil } from '#MysTool/mys'

const games = [
  { key: 'gs', name: '原神', uid: '75276550' },
  { key: 'sr', name: '崩坏：星穹铁道', uid: '80823548' },
  { key: 'zzz', name: '绝区零', uid: '152039149' }
]

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

  getGameByMsg (msg = '') {
    for (const i in MysUtil.reg) {
      if (new RegExp('^' + MysUtil.reg[i]).test(msg)) {
        return games.find((g) => g.key === i)
      }
    }

    return false
  }

  async getCode () {
    const game = this.getGameByMsg(this.e.msg)
    if (game?.key == 'zzz' && Date.now() < 1720713599000) {
      this.replyForward(common.makeForward([
        '《绝区零》公测前瞻特别节目-直播兑换码',
        '兑换码过期时间: \n2024-7-11 23:59',
        'ZZZFREE100'
      ]))
      return true
    }
    if (!game) return false

    let msg = []
    this.redisKey = `${PluginName}:${game.key}:exchange:`
    this.mysApi = new MysApi({ uid: game.uid, server: 'mys', game: game.key })

    const catchData = await redis.get(this.redisKey + 'codes')
    if (catchData) {
      msg = JSON.parse(catchData)
    } else {
      const { actid = '', deadline = '', timeout = false, EXTime = { EX: 0 } } = await this.getActId()
      if (timeout) {
        this.reply(`当前暂无${game.name}直播兑换码`)
        return true
      }
      if (!actid) {
        logger.info(game.name + '[兑换码] 未获取到actId')
        return true
      }

      const index = await this.mysApi.getData('miyolive_index', { actid })
      if (!index?.data?.live?.title) return true

      const index_data = index.data.live
      const { title, code_ver, remain } = index_data
      if (remain > 0) {
        this.reply(`暂无${title || game.name}-直播兑换码`)
        return true
      }

      const code = await this.mysApi.getData('miyolive_code', { actid, code_ver })
      if (!code?.data?.code_list) {
        logger.info(game.name + '[兑换码] 未获取到兑换码')
        this.reply(`当前暂无${title || game.name}-直播兑换码`)
        return true
      }

      if (!EXTime.EX && code.data.code_list[0].to_get_time) {
        const date = new Date(code.data.code_list[0].to_get_time * 1000)
        date.setDate(date.getDate() + 1)
        if (date.setHours(23, 59, 59) < Date.now()) {
          this.reply(`当前暂无${title || game.name}-直播兑换码`)
          return true
        }
        EXTime.EX = Math.floor((date.setHours(23, 59, 59) - Date.now()) / 1000)

        redis.set(this.redisKey + 'actid', JSON.stringify({
          actid, EXTime,
          deadline: `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()} 12:00:00`
        }), EXTime)
      }

      if (!code?.data?.code_list?.length || !code?.data?.code_list?.[0]?.code) {
        this.reply(`当前暂无${title || game.name}-直播兑换码`)
        return true
      }

      const codes = code.data.code_list.map(val => val.code)
      msg = [`${title || game.name}-直播兑换码`, `兑换码过期时间: \n${deadline}`, ...codes]
      if (codes.length === 3) {
        redis.set(this.redisKey + 'codes', JSON.stringify(msg), EXTime)
      }
    }

    this.replyForward(common.makeForward(msg))
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
      if (result?.[1]) {
        return {
          actid: result[1],
        }
      }
    }

    return { timeout: true }
  }
}
