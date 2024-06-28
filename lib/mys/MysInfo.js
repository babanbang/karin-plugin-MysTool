import { Cfg } from '#MysTool/utils'
import { DailyCache, MysUser, User } from '#MysTool/user'
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
    /** @type {{ltuid, game: string, uid, ck: string, sk: string, device: string}} */
    this.ckInfo = {}
    this.mysUser = null
    this.UidType = 'ck'
    this.set = Cfg.getConfig('set')

    this.auth = ['compute', 'ledger']
  }
  /** @type {MysApi} */
  mysApi

  /**
   * @param {{uid?, user_id?, cookie?, ck?, game?, server?, device?,self?}} mys
   * @param {{cacheCd?, log?}} option
   */
  setMysApi (mys = {}, option = {}) {
    if (mys.self && mys.uid) this.ckInfo.uid = mys.uid
    this.mysApi = new MysApi({ game: this.game, ...mys }, option)
  }

  get hoyolab () {
    return this.mysApi?.hoyolab
  }

  get game_biz () {
    return MysUtil.getGamebiz(this.game, this.hoyolab)
  }

  /**@param {{e,apis,game,option?:{cached?, cacheCd?, log?},UidType?:'ck'|'sk'}} params */
  static async init (params = {}) {
    const { e = '', apis = '', game = '', option = {}, UidType = 'ck' } = params

    const mysInfo = new MysInfo(e, game)
    if (!e && !apis) return mysInfo

    mysInfo.UidType = UidType
    if (mysInfo.checkAuth(apis) || mysInfo.set.onlySelfCk || UidType) {
      /** 获取绑定uid */
      mysInfo.uid = await mysInfo.getSelfUid(UidType)
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

    if (mysInfo.ckInfo?.ck) {
      mysInfo.setMysApi({ ...mysInfo.ckInfo, uid: mysInfo.uid, game: mysInfo.game }, option)
    }
    return mysInfo
  }

  /** @returns {Promise<MysUser[]>} */
  static async getMysUsers (e, game) {
    const user = await User.create(e, game)
    return Object.values(user.mysUsers)
  }

  static async getMysUserByUid (uid, game) {
    return await MysUser.getMysUserByUid(uid, game)
  }

  static async get (e, apis, data = {}, option = {}) {
    const mysInfo = await MysInfo.init({ e, apis, option })

    if (!mysInfo || !mysInfo.uid || !mysInfo.ckInfo?.ck) return false

    const res = []
    if (Array.isArray(apis)) {
      if (!_.isEmpty(data)) {
        mysInfo.mysApi.option = { ...mysInfo.mysApi.option, ...data }
      }

      /** 同步请求 */
      if (data.apiSync || option.apiSync) {
        for (const api of apis) {
          const ret = await mysInfo.getData(...api)

          if (ret?.retcode !== 0) break
          res.push(ret)
        }
      } else {
        const api = apis[0]
        const ret = await mysInfo.getData(...api)

        /** 如果第一个请求失败则直接不继续请求 */
        if (ret?.retcode === 0) {
          res.push(ret)

          const all = []
          const _apis = _.without(apis, api)
          _apis.forEach(v => all.push(mysInfo.getData(...v)))

          res.push(...await Promise.all(all))
        }
      }
    } else {
      return await mysInfo.getData(apis, data)
    }

    return res
  }

  async getData (api, data) {
    const ret = await this.mysApi.getData(api, data)
    return await this.checkCode(ret, api, data, data?.isTask)
  }

  /**查询所有绑定用户的ck、sk */
  static async getBingUser (game, type = 'ck') {
    const cks = {}

    await User.forEach(
      /** @param {User} user */
      (user) => {
        const uids = user.getUidList(game, { type })
        uids.forEach(uid => {
          cks[uid] = user.getUidData({ uid, game })
        })
      })

    return { cks, uids: Object.keys(cks) }
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

  static async getMainUid (e, game) {
    const user = await User.create(e, game)
    return user.getUidType()
  }

  /** 获取ck绑定的uid */
  async getSelfUid (type = 'ck') {
    let { at = '' } = this.e
    if (Array.isArray(at)) at = at[0]

    const user = await User.create(at || this.user_id, this.game)
    const { uid } = user.getUidType()
    if (!uid) {
      if (this.e.noTips !== true) {
        this.e.reply('尚未绑定UID', { at: user.user_id || true })
      }
      return false
    }
    if (type === 'ck' && !user.hasCk()) {
      if (this.e.noTips !== true) {
        this.e.reply('尚未绑定Cookie', { at: user.user_id || true })
      }
      return uid
    }
    if (type === 'sk' && !user.hasSk()) {
      if (this.e.noTips !== true) {
        this.e.reply('尚未绑定Stoken', { at: user.user_id || true })
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

    if (!this.ckInfo?.ck && this.UidType == 'ck') {
      this.e.reply('暂无可用CK，请绑定cookie')
    }

    this.e.noTips = true
  }

  async checkCode (res, type, data = {}, task = false) {
    const isTask = !this.e?.reply || task || this.isTask
    if (!res) {
      if (!isTask) this.e.reply(`UID:${this.uid}，米游社接口请求失败，暂时无法查询`)
      return false
    }

    res.retcode = Number(res.retcode)
    switch (res.retcode) {
      case 0:
        break
      case -110:
        if (type === 'gacha') return res
      case -1:
      case -100:
      case 1001:
      case 10001:
      case 10103:
        if (/(登录|login)/i.test(res.message)) {
          if (this.ckInfo.uid) {
            logger.mark(`[${this.UidType}失效][uid:${this.uid}][qq:${this.userId}]`)
            if (!isTask) this.e.reply(`UID:${this.ckInfo.uid}，米游社${this.UidType == 'sk' ? 'Stoken' : 'Cookie'}已失效`)
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
          res = await handler.call('mys.req.validate', { e: this.e, mysApi: this.mysApi, type, res, data }) || res
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
    if (res.retcode === 0 && !this.ckInfo.uid) {
      await DailyCache.Add(this.ckInfo.ltuid, this.uid, this.game)
    }
    return res
  }
}
