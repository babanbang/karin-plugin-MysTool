import { plugin, handler } from '#Karin'
import { MysApi } from '#MysTool/mys'

export class dealGachaUrl extends plugin {
  constructor () {
    super({
      name: '抽卡链接更新抽卡记录',
      dsc: '',
      event: 'message',
      priority: 0,
      rule: [
        {
          reg: "(.*)authkey=(.*)",
          fnc: 'dealUrl'
        }
      ],
      handler: [
        {
          key: 'mys.checkGachaUrl',
          fnc: 'checkUrl'
        }
      ]
    })
  }

  get (game, params) {
    return {
      data: ['gacha', { authkey: params.authkey, page: 1, gacha_type: game === 'sr' ? 11 : 301, end_id: 0 }],
      cfg: { game, server: params.region || (game === 'sr' ? "prod_gf_cn" : "cn_gf01") }
    }
  }

  async dealUrl () {
    let game = /\/(common|hkrpg)\//.test(this.e.msg) ? 'sr' : 'gs'

    let url = this.e.msg.replace(/〈=/g, "&")
    if (url.includes("getGachaLog?")) url = url.split("getGachaLog?")[1]
    if (url.includes("index.html?")) url = url.split("index.html?")[1]

    const params = {}
    const arr = new URLSearchParams(url).entries()
    for (let val of arr) {
      params[val[0]] = val[1]
    }

    if (!params.authkey) {
      this.reply("抽卡链接复制错误，缺少authkey")
      return true
    }

    // 去除#/,#/log
    params.authkey = encodeURIComponent(params.authkey.replace(/#\/|#\/log/g, ""))

    let p = this.get(game, params)
    const option = { log: false }
    let res = await new MysApi(p.cfg, option).getData(...p.data)
    if (res.retcode == -111) {
      game = game === 'sr' ? 'gs' : 'sr'
      p = this.get(game, params)
      res = await new MysApi(p.cfg, option).getData(...p.data)
    }
    if (!res?.data?.region) {
      p.cfg.server = game === 'sr' ? "prod_official_usa" : "os_usa"
      res = await new MysApi(p.cfg, option).getData(...p.data)
    }

    if (res?.data?.region) {
      params.region = res?.data?.region
    } else {
      this.reply("抽卡链接复制错误或已失效")
      return true
    }

    if (!this.checkUrl({ res, game, authkey: params.authkey })) return true

    const key = `mys.${game}.gachaLog`
    if (handler.has(key)) {
      this.reply("链接发送成功，数据获取中……")
      return await handler.call(key, { e: this.e, params })
    }
    return false
  }

  checkUrl ({ res }) {
    if (res.retcode == -101) {
      this.reply("该链接已失效，请重新获取链接")
    } else if (res.retcode == 400) {
      this.reply("获取数据错误")
    } else if (res.retcode == -100) {
      if (this.e.msg.length == 1000) {
        this.reply("输入法限制，链接复制不完整，请更换输入法复制完整链接")
        return false
      }
      this.reply("链接不完整，请长按全选复制全部内容（可能输入法复制限制），或者复制的不是历史记录页面链接")
    } else if (res.retcode != 0) {
      this.reply("链接复制错误")
    } else {
      return true
    }
    return false
  }
}