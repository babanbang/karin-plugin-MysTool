import _ from 'lodash'
import md5 from 'md5'
import axios from 'axios'
import ApiTool from './ApiTool.js'
import { app_version, salt } from './MysTool.js'
import MysUtil from './MysUtil.js'
import { redis } from '#Karin'
import { PluginName, Cfg } from '#Mys.tool'

const nofp = ['FullInfo', 'noHeader', 'passport']
export default class MysApi {
  /**
   * @param {{uid?, user_id?, cookie?, ck?, game?, server?, device?}} mys
   * @param {{cached?, cacheCd?, log?}} option
   */
  constructor (mys = {}, option = {}) {
    this.uid = mys.uid
    this.user_id = mys.user_id || ''
    this.cookie = mys.cookie || mys.ck
    this.game = mys.game || 'gs'
    this.server = mys.server || MysUtil.getServer(this.uid, this.game)
    this.device_id = mys.device || MysUtil.getDeviceGuid()

    this.hoyolab = /os_|official/.test(this.server)
    this.ApiTool = new ApiTool(this.uid, this.server, this.game)
    /** 5分钟缓存 */

    this.set = Cfg.getConfig('set')
    this.option = {
      cacheCd: 300,
      log: true,
      ...option
    }
  }

  get device () {
    if (!this._device) this._device = `Karin-${md5(this.game + this.uid).substring(0, 5)}`
    return this._device
  }

  getUrl (type, data = {}) {
    const urlMap = (data.ApiTool || this.ApiTool).getUrlMap({ ...data, deviceId: this.device_id })
    if (!urlMap[type]) return false

    let { url, query = '', body = '', HeaderType = '' } = urlMap[type]
    if (query) url += `?${query}`

    const headers = this.getHeaders(query, body, HeaderType)

    return { url, headers, body, HeaderType }
  }

  async getData (type, data = {}, cached = false) {
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

    // logger.error(`[米游社接口][${type}][${this.game}][${this.user_id || this.uid}] ${JSON.stringify(param)}`)
    let response = {}
    const start = Date.now()
    try {
      response = await axios(param)
    } catch (err) {
      this.checkstatus(err, type)
      return false
    }

    if (this.option.log) {
      logger.mark(`[米游社接口][${type}][${this.game}][${this.user_id || this.uid}] ${Date.now() - start}ms`)
    }
    const res = response.data

    if (!res) {
      logger.mark(`[米游社接口][${type}][${this.game}][${this.user_id || this.uid}]没有返回`)
      return false
    }

    res.api = type
    res.reqData = data
    if (res.reqData?.ApiTool) {
      delete res.reqData.ApiTool
    }

    if (cached || this.option.cached) this.cache(res, cacheKey)
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
    if (this.hoyolab) {
      header = {
        'x-rpc-app_version': app_version.os,
        'x-rpc-client_type': '4',
        'x-rpc-language': 'zh-cn'
      }
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
          DS: this.getDS1('', _body, salt.PROD),
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
      case 'noHeader':
        return {}
    }
    return {
      ...header,
      Cookie: this.cookie,
      DS: this.hoyolab ? this.getDS1('', '', salt.os, false) : this.getDS2(query, _body, salt['4X'])
    }
  }

  getDS1 (q = '', b = '', salt, bq = true) {
    const r = MysUtil.randomString(6)
    const t = Math.floor(Date.now() / 1000)
    let DS = `salt=${salt}&t=${t}&r=${r}`
    if (bq || q || b) DS += `&b=${b}&q=${q}`

    return `${t},${r},${md5(DS)}`
  }

  getDS2 (q = '', b = '', salt) {
    const r = _.random(100001, 200000)
    const t = Math.floor(Date.now() / 1000)
    let DS = `salt=${salt}&t=${t}&r=${r}&b=${b}&q=${q}`

    return `${t},${r},${md5(DS)}`
  }

  cacheKey (type, data) {
    return `${PluginName}:${this.game}:mys:cache:` + md5(this.uid + type + this.game + JSON.stringify(data))
  }

  async cache (res, cacheKey) {
    if (!res || res.retcode !== 0) return
    redis.setEx(cacheKey, this.option.cacheCd, JSON.stringify(res))
  }

  checkstatus (err, type) {
    if (err.response) {
      logger.error(`[米游社接口][${type}][${this.game}][${this.uid}] ${err.response.status} ${err.response.statusText}`)
    } else if (err.request) {
      logger.error(`[米游社接口][${type}][${this.game}][${this.uid}] 请求无返回或超时`)
    } else {
      logger.error(err)
    }
  }
}
