import { Cfg, PluginName } from '#MysTool/utils'
import axios from 'axios'
import lodash from 'lodash'
import md5 from 'md5'
import moment from 'moment'
import { handler, logger, redis } from 'node-karin'
import ApiTool from './ApiTool.js'
import { app_version, salt } from './MysTool.js'
import MysUtil from './MysUtil.js'

const nofp = ['FullInfo', 'noHeader', 'passport', 'authKey', 'MysSign', 'os_MysSign', 'Bbs', 'BbsSign', 'GameRole']
export default class MysApi {
  /**
   * @param {{uid, ltuid, user_id, cookie, ck, sk, game, server, device}} mys
   * @param {{cacheCd?, log?}} option
   */
  constructor (mys = {}, option = {}) {
    this.uid = mys.uid || ''
    this.ltuid = mys.ltuid
    this.user_id = mys.user_id
    this.cookie = mys.ck || mys.cookie
    this.stoken = mys.sk
    this.game = mys.game || 'gs'
    this.server = mys.server || MysUtil.getRegion(this.uid, this.game)
    this.device_id = mys.device || MysUtil.getDeviceGuid()

    this.hoyolab = MysUtil.isHoyolab(this.server, this.game)
    this.ApiTool = new ApiTool({ uid: this.uid, ltuid: this.ltuid, server: this.server, game: this.game })

    this.set = Cfg.getConfig('set')
    this.option = {
      log: true,
      ...option
    }
  }
  get UIDTYPE () {
    return this.hoyolab ? 'HoYoLab' : '米游社'
  }

  get device () {
    if (!this._device) this._device = `Karin-${md5(this.game + this.uid).substring(0, 5)}`
    return this._device
  }

  getUrl (type, data = {}) {
    const urlMap = (data.ApiTool || this.ApiTool).getUrlMap({ ...data, deviceId: this.device_id })
    if (!urlMap[type]) return false

    let { url, query = '', body = '', HeaderType = '', header = {} } = urlMap[type]
    if (query) url += `?${query}`

    const headers = { ...this.getHeaders(query, body, HeaderType), ...header }

    return { url, headers, body, HeaderType }
  }

  async getData (type, data = {}) {
    if (!this.hoyolab && data.UseProxy && handler.has('mys.req.proxy.getData')) {
      return await handler.call('mys.req.proxy.getData', { mysApi: this, type, data })
    }

    let { url, headers, body, HeaderType } = this.getUrl(type, data)
    if (!url) return false

    const cacheKey = this.cacheKey(type, data)
    const cahce = await redis.get(cacheKey)
    if (cahce) return JSON.parse(cahce)

    if (!nofp.includes(HeaderType) && !this._device_fp && !data?.Getfp && !data?.headers?.['x-rpc-device_fp']) {
      this._device_fp = await this.getData('getFp', {
        seed_id: MysUtil.getSeed_id(),
        Getfp: true
      })
    }
    if (type === 'getFp' && !data?.Getfp) return this._device_fp

    if (data.headers) {
      headers = { ...headers, ...data.headers }
    }

    if (!nofp.includes(HeaderType) && !headers['x-rpc-device_fp'] && this._device_fp?.data?.device_fp) {
      headers['x-rpc-device_fp'] = this._device_fp.data.device_fp
    }

    const param = {
      url,
      method: data.method ? data.method : 'get',
      headers,
      timeout: data.timeout ? data.timeout : 10000
    }
    if (body) {
      param.method = 'post'
      param.data = body
    }
    if (this.hoyolab && this.set.proxy?.host && this.set.proxy?.port) {
      param.proxy = this.set.proxy
    }

    logger.debug(`[${this.UIDTYPE}接口][${type}][${this.game}][${this.user_id || this.uid}] ${JSON.stringify(param)}`)
    let response = {}
    const start = Date.now()
    try {
      response = await axios(param)
    } catch (err) {
      this.checkstatus(err, type)
      return false
    }

    if (this.option.log && type !== 'getFp' && !data?.option?.nolog) {
      logger.mark(`[${this.UIDTYPE}接口][${type}][${this.game}][${this.user_id || this.uid}] ${Date.now() - start}ms`)
    }
    const res = response.data

    if (!res) {
      logger.mark(`[${this.UIDTYPE}接口][${type}][${this.game}][${this.user_id || this.uid}]没有返回`)
      return false
    }

    logger.debug(`[${this.UIDTYPE}接口][${type}][${this.game}][${this.user_id || this.uid}] ${JSON.stringify(res)}`)

    res.api = type
    res.reqData = data
    if (data.needTime) {
      res.resDataTime = moment().format('YYYY-MM-DD HH:mm:ss')
    }
    if (res.reqData?.ApiTool) {
      delete res.reqData.ApiTool
    }

    if (this.option.cacheCd || data.cacheCd) this.cache(res, cacheKey, this.option.cacheCd || data.cacheCd)
    return res
  }

  getHeaders (query = '', body = '', HeaderType = '') {
    const _body = body ? JSON.stringify(body) : ''
    let header = {
      'x-rpc-app_version': app_version.cn,
      'x-rpc-client_type': '5',
      'x-rpc-device_id': this.device_id.toUpperCase(),
      'User-Agent': `Mozilla/5.0 (Linux; Android 12; ${this.device}) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/99.0.4844.73 Mobile Safari/537.36 miHoYoBBS/${app_version.cn}`,
      Referer: 'https://webstatic.mihoyo.com'
    }

    switch (HeaderType) {
      case 'FullInfo':
        return {
          Cookie: this.cookie,
          Accept: 'application/json, text/plain, */*',
          Connection: 'keep-alive',
          Host: 'bbs-api.mihoyo.com',
          Origin: 'https://m.bbs.mihoyo.com',
          Referer: ' https://m.bbs.mihoyo.com/'
        }
      case 'passport':
        return {
          'x-rpc-app_version': app_version.cn,
          DS: this.getDS1({ b: _body, salt: salt.PROD }),
          'x-rpc-aigis': '',
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'x-rpc-game_biz': 'bbs_cn',
          'x-rpc-sys_version': '12',
          'x-rpc-device_id': MysUtil.getDeviceGuid(),
          'x-rpc-device_fp': '38d7ee0e96649',
          'x-rpc-device_name': MysUtil.randomString(16),
          'x-rpc-device_model': MysUtil.randomString(16),
          'x-rpc-app_id': 'bll8iq97cem8',
          'x-rpc-client_type': '2',
          'User-Agent': 'okhttp/4.8.0'
        }
      case 'authKey':
        return {
          'x-rpc-app_version': app_version.cn,
          'User-Agent': 'okhttp/4.8.0',
          'x-rpc-client_type': '5',
          Referer: 'https://app.mihoyo.com',
          Origin: 'https://webstatic.mihoyo.com',
          Cookie: this.stoken,
          DS: this.getDS1({ salt: salt.LK2, bq: false }),
          'x-rpc-sys_version': '12',
          'x-rpc-channel': 'mihoyo',
          'x-rpc-device_name': MysUtil.randomString(16),
          'x-rpc-device_model': MysUtil.randomString(16),
          'x-rpc-device_model': 'Mi 10',
          Host: 'api-takumi.mihoyo.com',
        }
      case 'MysSign':
        return {
          ...header,
          'X-Requested-With': 'com.mihoyo.hyperion',
          'x-rpc-platform': 'android',
          'x-rpc-device_model': 'Mi 10',
          'x-rpc-device_name': this.device,
          'x-rpc-channel': 'miyousheluodi',
          'x-rpc-sys_version': '6.0.1',
          Cookie: this.cookie,
          DS: this.getDS1({ salt: salt.LK2 })
        }
      case 'os_MysSign':
        return {
          'x-rpc-app_version': '2.9.0',
          'x-rpc-client_type': '2',
          'x-rpc-device_id': this.device_id.toUpperCase(),
          'User-Agent': `Mozilla/5.0 (Linux; Android 12; ${this.device}) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/99.0.4844.73 Mobile Safari/537.36 miHoYoBBSOversea/2.9.0`,
          'X-Requested-With': 'com.mihoyo.hoyolab',
          'x-rpc-platform': 'android',
          'x-rpc-device_model': 'Mi 10',
          'x-rpc-device_name': this.device,
          'x-rpc-channel': 'miyousheluodi',
          'x-rpc-sys_version': '6.0.1',
          Referer: 'https://webstatic-sea.hoyolab.com',
          Cookie: this.cookie,
          DS: this.getDS1({ salt: salt.LK2 })
        }
      case 'Bbs':
        return {
          ...header,
          'x-rpc-device_model': 'Mi 10',
          'x-rpc-device_name': this.device,
          'x-rpc-channel': 'miyousheluodi',
          'x-rpc-client_type': '2',
          Referer: 'https://app.mihoyo.com',
          'x-rpc-sys_version': '12',
          'User-Agent': 'okhttp/4.8.0',
          Cookie: this.cookie,
          DS: this.getDS1({ salt: salt.K2 })
        }
      case 'BbsSign':
        return {
          ...header,
          'x-rpc-device_model': 'Mi 10',
          'x-rpc-device_name': this.device,
          'x-rpc-channel': 'miyousheluodi',
          'x-rpc-client_type': '2',
          Referer: 'https://app.mihoyo.com',
          'x-rpc-sys_version': '12',
          'User-Agent': 'okhttp/4.8.0',
          Cookie: this.cookie,
          DS: this.getDS2({ q: query, b: _body, bq: true, salt: salt['6X'] })
        }
      case 'GameRole':
        return {
          ...header,
          'X-Requested-With': 'com.mihoyo.hyperion',
          'Sec-Fetch-Site': 'same-site',
          'Sec-Fetch-Mode': 'cors',
          'Sec-Fetch-Dest': 'empty',
          Cookie: this.cookie,
          Referer: 'https://user.mihoyo.com/'
        }
      case 'Action':
        return {
          ...header,
          'x-rpc-device_model': 'Mi 10',
          'x-rpc-device_name': this.device,
          'x-rpc-channel': 'miyousheluodi',
          'x-rpc-client_type': '2',
          Referer: 'https://app.mihoyo.com',
          'x-rpc-sys_version': '12',
          'User-Agent': 'okhttp/4.8.0',
          Cookie: this.stoken,
          DS: this.getDS1(this.game == 'sr' ? { q: query, b: _body, salt: salt['6X'] } : { salt: salt.K2, bq: false })
        }
      case 'noHeader':
        return {}
    }

    if (this.hoyolab) {
      header = {
        'x-rpc-app_version': app_version.os,
        'x-rpc-client_type': '4',
        'x-rpc-language': 'zh-cn'
      }
    }

    return {
      ...header,
      Cookie: this.cookie,
      DS: this.hoyolab ? this.getDS1({ salt: salt.os, bq: false }) : this.getDS2({ q: query, b: _body, salt: salt['4X'] })
    }
  }

  getDS1 ({ q = '', b = '', salt, bq = true } = {}) {
    const r = MysUtil.randomString(6)
    const t = Math.floor(Date.now() / 1000)
    let DS = `salt=${salt}&t=${t}&r=${r}`
    if (bq || q || b) DS += `&b=${b}&q=${q}`

    return `${t},${r},${md5(DS)}`
  }

  getDS2 ({ q = '', b = '', salt } = {}) {
    const r = lodash.random(100001, 200000)
    const t = Math.floor(Date.now() / 1000)
    let DS = `salt=${salt}&t=${t}&r=${r}&b=${b}&q=${q}`

    return `${t},${r},${md5(DS)}`
  }

  cacheKey (type, data) {
    return `${PluginName}:${this.game}:mys:cache:` + md5(this.uid + type + this.game + JSON.stringify(data))
  }

  async cache (res, cacheKey, cd) {
    if (!res || res.retcode !== 0) return
    redis.setEx(cacheKey, cd, JSON.stringify(res))
  }

  checkstatus (err, type) {
    if (err.response) {
      let error = `[${this.UIDTYPE}接口][${type}][${this.game}][${this.uid}] ${err.response.status} ${err.response.statusText}`
      if (err.response.status == 403 && this.hoyolab) {
        error += `未配置代理或代理不可用！`
      }
      logger.error(error)
    } else if (err.request) {
      logger.error(`[${this.UIDTYPE}接口][${type}][${this.game}][${this.uid}] 请求无返回或超时`)
    } else {
      logger.error(err)
    }
  }
}
