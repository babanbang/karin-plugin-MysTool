import { Cfg } from '#Mys.tool'
import { DailyCache, MysUser, User } from '#Mys.user'
import _ from 'lodash'
import MysApi from './MysApi.js'
import MysUtil from './MysUtil.js'
import { handler } from '#Karin'

export default class MysInfo {
  constructor (e = {}, game = '') {
    this.e = e
    this.user_id = e.user_id
    this.game = game || MysUtil.getGameByMsg(e.msg).key

    this.uid = ''
    this.ckInfo = {}
    this.mysUser = null
    this.set = Cfg.getConfig('set')
    this.auth = []
  }

  static async init (e, apis) {
    const mysInfo = new MysInfo(e)

    if (mysInfo.checkAuth(apis) || mysInfo.set.onlySelfCk) {
      /** 获取ck绑定uid */
      mysInfo.uid = await mysInfo.getSelfUid()
    } else {
      /** 获取uid */
      mysInfo.uid = await mysInfo.getUid()
    }

    if (!mysInfo.uid) {
      e.noTips = true
      return false
    }

    if (!['1', '2', '3', '5', '6', '7', '8', '18', '9'].includes(String(mysInfo.uid).slice(0, -8))) {
      e.reply('查询UID错误，请检查UID是否正确')
      return false
    }
    if (!['6', '7', '8', '18', '9'].includes(String(mysInfo.uid).slice(0, -8)) && apis === 'useCdk') {
      e.reply('兑换码使用只支持国际服uid')
      return false
    }

    e.MysUid = mysInfo.uid
    e.HasMysCk = mysInfo.ckInfo?.uid
    /** 判断回复 */
    await mysInfo.checkReply()
    return mysInfo
  }

  static async get (e, apis, data = {}, option = {}) {
    const mysInfo = await MysInfo.init(e, apis)

    if (!mysInfo || !mysInfo.uid || !mysInfo.ckInfo?.ck) return false

    const mysApi = new MysApi({ ...mysInfo.ckInfo, uid: mysInfo.uid, game: mysInfo.game }, option)

    const res = []
    if (Array.isArray(apis)) {
      if (!_.isEmpty(data)) {
        mysApi.option = { ...mysApi.option, ...data }
      }

      /** 同步请求 */
      if (data.apiSync || option.apiSync) {
        for (const api of apis) {
          const ret = await mysInfo.getData(mysApi, ...api)

          if (ret?.retcode !== 0) break
          res.push(ret)
        }
      } else {
        const api = apis[0]
        const ret = await mysInfo.getData(mysApi, ...api)

        /** 如果第一个请求失败则直接不继续请求 */
        if (ret?.retcode === 0) {
          res.push(ret)

          const all = []
          const _apis = _.without(apis, api)
          _apis.forEach(v => all.push(mysInfo.getData(mysApi, ...v)))

          res.push(...await Promise.all(all))
        }
      }
    } else {
      return await mysInfo.getData(mysApi, apis, data)
    }

    return res
  }

  /**
   *
   * @param {MysApi} mysApi
   */
  async getData (mysApi, i, data) {
    const ret = await mysApi.getData(i, data)
    return await this.checkCode(ret, i, mysApi, data)
  }

  /** 判断是否需要绑定ck才能查询 */
  checkAuth (apis) {
    if (apis === 'cookie') {
      return true
    }
    if (Array.isArray(apis)) {
      for (const api of apis) {
        if (this.auth.includes(api[0])) {
          return true
        }
      }
    } else if (this.auth.includes(apis)) {
      return true
    }
    return false
  }

  /** 获取ck绑定的uid */
  async getSelfUid (game = '') {
    let { msg = '', at = '' } = this.e
    if (!game) game = MysUtil.getGameByMsg(msg).key

    if (Array.isArray(at))at = at[0]
    const user = await User.create(at || this.user_id, game)
    const uid = user.mainUid()
    if (!uid) {
      if (this.e.noTips !== true) {
        this.e.reply('尚未绑定UID', { at: user.user_id || true })
      }
      return false
    }
    if (!user.hasCk()) {
      if (this.e.noTips !== true) {
        this.e.reply('尚未绑定Cookie', { at: user.user_id || true })
      }
      return uid
    }

    this.ckInfo = user.getUidData()
    this.mysUser = user.getMysUser()
    return uid
  }

  /** 获取UID */
  async getUid () {
    let uid = MysUtil.matchUid(this.e.msg)
    if (!uid) {
      this.e.noTips = true
      uid = await this.getSelfUid()
      this.e.noTips = false
      if (!uid) return false

      if (this.ckInfo?.ck && this.mysUser) {
        return uid
      }
    }

    await this.getCookie(uid)
    return uid
  }

  async getCookie (uid) {
    if (this.ckUser?.ck) return

    const mysUser = await MysUser.getByQueryUid(uid, this.game)
    if (mysUser) {
      this.ckInfo = mysUser.getCkData()
      this.ckUser = mysUser
    }
    return false
  }

  async checkReply () {
    if (this.e.noTips === true) return

    if (!this.uid) {
      this.e.reply('请先绑定UID', { at: true })
      return
    }

    if (!this.ckInfo?.ck) {
      this.e.reply('暂无可用CK，请绑定cookie')
    }

    this.e.noTips = true
  }

  // eslint-disable-next-line no-unused-vars
  async checkCode (res, type, mysApi = {}, data = {}, isTask = false) {
    if (!res) {
      if (!isTask) this.e.reply(`UID:${this.uid}，米游社接口请求失败，暂时无法查询`)
      return false
    }

    res.retcode = Number(res.retcode)
    if (type === 'bbs_sign') {
      if ([-5003].includes(res.retcode)) {
        res.retcode = 0
      }
    }

    switch (res.retcode) {
      case 0:
        break
      case -1:
      case -100:
      case 1001:
      case 10001:
      case 10103:
        if (/(登录|login)/i.test(res.message)) {
          if (this.ckInfo.uid) {
            logger.mark(`[ck失效][uid:${this.uid}][qq:${this.userId}]`)
            if (!isTask) this.e.reply(`UID:${this.ckInfo.uid}，米游社Cookie已失效`)
          } else {
            logger.mark(`[公共ck失效][ltuid:${this.ckInfo.ltuid}]`)
            await DailyCache.Disable(this.ckInfo.ltuid, this.uid, this.game)
            if (!isTask) this.e.reply(`UID:${this.uid}，米游社查询失败，请稍后再试或绑定CK`)
          }
          // if (!isTask) await this.delCk()
        } else {
          if (!isTask) this.e.reply(`UID:${this.uid}，米游社接口报错，暂时无法查询：${res.message}`)
        }
        break
      case 1008:
        if (!isTask) this.e.reply(`UID:${this.uid}，请先去米游社绑定角色`, { at: true })
        break
      case 10101:
        await DailyCache.Disable(this.ckInfo.ltuid, this.uid, this.game)
        if (!isTask) {
          this.e.reply(`UID:${this.uid}，查询已达今日上限`)
        }
        break
      case 10102:
        if (res.message === 'Data is not public for the user') {
          if (!isTask) this.e.reply(`\nUID:${this.uid}，米游社数据未公开`, { at: true })
        } else {
          if (!isTask) this.e.reply(`UID:${this.uid}，请先去米游社绑定角色`)
        }
        break
      // 伙伴不存在~
      case -1002:
        if (res.api === 'detail') res.retcode = 0
        break
      case 1034:
      case 5003:
      case 10035:
      case 10041:
        if (handler.has('mys.req.validate')) {
          logger.mark(`[米游社查询][uid:${this.uid}][qq:${this.user_id}] 遇到验证码，尝试调用 Handler mys.req.validate`)
          res = await handler.call('mys.req.validate', { e: this.e, mysApi, type, res, data }) || res
        }

        if (res?.retcode !== 0 && res?.retcode !== 10103) {
          logger.mark(`[米游社查询失败][uid:${this.uid}][qq:${this.user_id}] 遇到验证码`)
          if (!isTask) {
            if ([5003, 10041].includes(res.retcode)) {
              this.e.reply(`UID:${this.uid}，米游社账号异常，暂时无法查询`)
              break
            }
            this.e.reply(`UID:${this.uid}，米游社查询遇到验证码，请稍后再试`)
          }
        }
        break
      case 10307:
        if (!isTask) this.e.reply(`UID:${this.uid}，版本更新期间，数据维护中`)
        break
      default:
        if (!isTask) this.e.reply(`UID:${this.uid}，米游社接口报错，暂时无法查询：${res.message || 'error'}`)
        break
    }
    if (res.retcode !== 0) {
      logger.mark(`[mys接口报错]${JSON.stringify(res)}，uid：${this.uid}`)
    }
    // 添加请求记录
    if (res.retcode === 0) {
      await DailyCache.Add(this.ckInfo.ltuid, this.uid, this.game)
    }
    return res
  }
}
