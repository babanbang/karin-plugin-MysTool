import _ from 'lodash'
import md5 from 'md5'
import fetch from 'node-fetch'
import ApiTool from './ApiTool.js'
import { app_version, salt } from './MysTool.js'
import MysUtil from './MysUtil.js'
import { redis } from '#Karin'
import { PluginName } from '#Mys.tool'

let HttpsProxyAgent = ''
const nofp = ['FullInfo', 'noHeader', 'passport']

export default class MysApi {
  /**
   * @param {{uid?, user_id?, cookie?, ck?, game?, server?, device?}} mys
   */
  constructor (mys = { }, option = {}) {
    this.uid = mys.uid
    this.user_id = mys.user_id || ''
    this.cookie = mys.cookie || mys.ck
    this.game = mys.game || 'gs'
    this.server = mys.server || MysUtil.getServer(this.uid, this.game)
    this.device_id = mys.device || MysUtil.getDeviceGuid()

    this.hoyolab = /os_|official/.test(this.server)
    this.ApiTool = new ApiTool(this.uid, this.server, this.game)
    /** 5分钟缓存 */

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
    const urlMap = this.ApiTool.getUrlMap({ ...data, deviceId: this.device_id })
    if (!urlMap[type]) return false

    let { url, query = '', body = '', HeaderType = '' } = urlMap[type]

    if (query) url += `?${query}`
    if (body) body = JSON.stringify(body)

    let headers = this.getHeaders(query, body, HeaderType)

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
      method: 'get',
      headers,
      agent: await this.getAgent(),
      timeout: 10000
    }
    if (body) {
      param.method = 'post'
      param.body = body
    }
    if (data.method) {
      param.method = data.method
    }

    // logger.error(`[米游社接口][${type}][${this.game}][${this.user_id || this.uid}] ${url} ${JSON.stringify(param)}`)
    let response = {}
    const start = Date.now()
    try {
      response = await fetch(url, param)
    } catch (err) {
      logger.error(err)
      return false
    }

    if (!response.ok) {
      logger.error(`[米游社接口][${type}][${this.game}][${this.user_id || this.uid}] ${response.status} ${response.statusText}`)
      return false
    }
    if (this.option.log) {
      logger.mark(`[米游社接口][${type}][${this.game}][${this.user_id || this.uid}] ${Date.now() - start}ms`)
    }
    const res = await response.json()

    if (!res) {
      logger.mark(`[米游社接口][${type}][${this.game}][${this.user_id || this.uid}]没有返回`)
      return false
    }

    res.api = type
    res.reqData = data

    if (cached || this.option.cached) this.cache(res, cacheKey)

    return res
  }

  getHeaders (query = '', body = '', HeaderType = '') {
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
          DS: this.getDS1('', body, salt.PROD),
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
      DS: this.hoyolab ? this.getDS1('', '', salt.os, false) : this.getDS2(query, body, salt['4X'])
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

  async getAgent () {
    let proxyAddress = ''
    if (!proxyAddress) return null
    if (proxyAddress === 'http://0.0.0.0:0') return null

    if (!this.hoyolab) return null

    if (HttpsProxyAgent === '') {
      HttpsProxyAgent = await import('https-proxy-agent').catch((err) => {
        logger.error(err)
      })

      HttpsProxyAgent = HttpsProxyAgent ? HttpsProxyAgent.HttpsProxyAgent : undefined
    }

    if (HttpsProxyAgent) {
      return new HttpsProxyAgent(proxyAddress)
    }

    return null
  }
}
