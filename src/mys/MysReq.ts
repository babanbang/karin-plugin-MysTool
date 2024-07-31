import { ConfigName, ConfigsType, GameList, HeaderTypes, MysReqMys, MysReqOptions } from "@/types"
import { Cfg, GamePathType, PluginName } from "@/utils"
import md5 from 'md5'
import { handler, logger, redis } from 'node-karin'
import axios from 'node-karin/axios'
import lodash from 'node-karin/lodash'
import moment from 'node-karin/moment'
import { MysApi } from './MysApi'
import { app_version, salt } from './MysTool'
import { MysUtil } from './MysUtil'

interface REQ {
    MysApi?: MysApi
    UseProxy?: boolean
    [key: string]: any
}

interface RES {
    [key: string]: any
    api?: string
    data?: { device_fp: string } | any
    retcode?: number
    reqData?: REQ
    resDataTime?: string
}

export class MysReq {
    mys: MysReqMys
    uid: string
    game: GameList
    server: string
    device_id: string
    hoyolab: boolean
    MysApi: MysApi
    config: ConfigsType<ConfigName.config, GamePathType.Core>
    option: MysReqOptions
    _deviceName?: string
    _device_fp?: {
        data: {
            device_fp: string
        }
    }
    #needfp: string[] = []
    #nofp: HeaderTypes[] = ['FullInfo', 'noHeader', 'passport', 'authKey', 'MysSign', 'os_MysSign', 'Bbs', 'BbsSign', 'GameRole']
    constructor(mys: MysReqMys = {}, options: MysReqOptions = {}) {
        this.mys = mys
        this.uid = mys.uid || ''
        this.game = mys.game || GameList.Gs
        this.server = mys.server || MysUtil.getRegion(this.uid, this.game)
        this.device_id = (mys.device || MysUtil.getDeviceGuid()).toUpperCase()

        this.hoyolab = MysUtil.isHoyolab(this.server, this.game)
        this.MysApi = new MysApi({
            uid: this.uid, ltuid: mys.ltuid, server: this.server, game: this.game, hoyolab: this.hoyolab,
        })

        this.config = Cfg.getConfig(ConfigName.config, GamePathType.Core)
        this.option = {
            log: true,
            ...options
        }
    }
    get UIDTYPE() {
        return this.hoyolab ? 'HoYoLab' : '米游社'
    }

    get deviceName() {
        if (!this._deviceName) this._deviceName = `Karin-${md5(this.game + this.uid).substring(0, 5)}`
        return this._deviceName
    }

    getUrl(type: string, data: {
        MysApi?: MysApi
        [key: string]: any
    } = {}) {
        const urlMap = (data.MysApi || this.MysApi).getUrlMap({ ...data, deviceId: this.device_id })
        if (!urlMap[type]) return {}

        let { url, query, body = '', HeaderType, header = {} } = urlMap[type]
        if (query) url += `?${query}`

        const headers = { ...this.getHeaders(query, body, HeaderType), ...header }

        return { url, headers, body, HeaderType }
    }

    async getData<R extends RES>(type: string, data: REQ = {}): Promise<R | undefined> {
        if (!this.hoyolab && data.UseProxy && handler.has('mys.req.proxy.getData')) {
            return await handler.call('mys.req.proxy.getData', { mysApi: this, type, data })
        }

        let { url, headers, body, HeaderType } = this.getUrl(type, data)
        if (!url) return undefined

        const cacheKey = this.cacheKey(type, data)
        const cahce = await redis.get(cacheKey)
        if (cahce) return JSON.parse(cahce)

        if (
            !HeaderType ||
            (!this.#nofp.includes(HeaderType) && !this._device_fp && !data?.Getfp && !data?.headers?.['x-rpc-device_fp'])
        ) {
            this._device_fp = await this.getData('getFp', {
                seed_id: lodash.sampleSize('0123456789abcdef', 16),
                Getfp: true
            })
        }
        if (type === 'getFp' && !data?.Getfp) return this._device_fp as R

        if (data.headers) {
            headers = { ...headers, ...data.headers }
        }

        if (
            !HeaderType || this.#needfp.includes(type) ||
            (!this.#nofp.includes(HeaderType) && !headers['x-rpc-device_fp'])
        ) {
            if (this._device_fp && this._device_fp.data?.device_fp) {
                headers['x-rpc-device_fp'] = this._device_fp.data.device_fp
            }
        }

        const param: any = {
            url,
            method: data.method ? data.method : 'get',
            headers,
            timeout: data.timeout ? data.timeout : 10000
        }
        if (body) {
            param.method = 'post'
            param.data = body
        }
        if (this.hoyolab && this.config.proxy?.host && this.config.proxy?.port) {
            param.proxy = this.config.proxy
        }

        logger.debug(`[${this.UIDTYPE}接口][${type}][${this.game}][${this.mys.user_id || this.uid}] ${JSON.stringify(param)}`)
        let response
        const start = Date.now()
        try {
            response = await axios(param)
        } catch (err) {
            this.checkstatus(err, type)
            return undefined
        }

        if (this.option.log && type !== 'getFp' && !data?.option?.nolog) {
            logger.mark(`[${this.UIDTYPE}接口][${type}][${this.game}][${this.mys.user_id || this.uid}] ${Date.now() - start}ms`)
        }
        const res = response.data

        if (!res) {
            logger.mark(`[${this.UIDTYPE}接口][${type}][${this.game}][${this.mys.user_id || this.uid}]没有返回`)
            return undefined
        }

        logger.debug(`[${this.UIDTYPE}接口][${type}][${this.game}][${this.mys.user_id || this.uid}] ${JSON.stringify(res)}`)

        res.api = type
        res.reqData = data
        if ('retcode' in res) {
            res.retcode = Number(res.retcode)
        }
        if (data.needTime) {
            res.resDataTime = moment().format('YYYY-MM-DD HH:mm:ss')
        }
        if (res.reqData?.MysApi) {
            delete res.reqData.MysApi
        }

        if (this.option.cacheCd || data.cacheCd) this.cache(res, cacheKey, this.option.cacheCd || data.cacheCd)
        return res
    }


    getHeaders(query = '', body = '', HeaderType?: HeaderTypes) {
        const _body = body ? JSON.stringify(body) : ''
        let header: any = {
            'x-rpc-app_version': app_version.cn,
            'x-rpc-client_type': '5',
            'x-rpc-device_id': this.device_id,
            'User-Agent': `Mozilla/5.0 (Linux; Android 12; ${this.deviceName}) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/99.0.4844.73 Mobile Safari/537.36 miHoYoBBS/${app_version.cn}`,
            Referer: 'https://webstatic.mihoyo.com'
        }

        switch (HeaderType) {
            case 'FullInfo':
                return {
                    Cookie: this.mys.cookie,
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
                    'x-rpc-device_id': this.device_id,
                    'x-rpc-device_fp': '38d7ee0e96649',
                    'x-rpc-device_name': this.deviceName,
                    'x-rpc-device_model': 'Mi 10',
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
                    Cookie: this.mys.stoken,
                    DS: this.getDS1({ salt: salt.LK2, bq: false }),
                    'x-rpc-sys_version': '12',
                    'x-rpc-channel': 'mihoyo',
                    'x-rpc-device_name': this.deviceName,
                    'x-rpc-device_model': 'Mi 10',
                    Host: 'api-takumi.mihoyo.com',
                }
            case 'MysSign':
                return {
                    ...header,
                    'X-Requested-With': 'com.mihoyo.hyperion',
                    'x-rpc-platform': 'android',
                    'x-rpc-device_model': 'Mi 10',
                    'x-rpc-device_name': this.deviceName,
                    'x-rpc-channel': 'miyousheluodi',
                    'x-rpc-sys_version': '6.0.1',
                    Cookie: this.mys.cookie,
                    DS: this.getDS1({ salt: salt.LK2 })
                }
            case 'os_MysSign':
                return {
                    'x-rpc-app_version': '2.9.0',
                    'x-rpc-client_type': '2',
                    'x-rpc-device_id': this.device_id.toUpperCase(),
                    'User-Agent': `Mozilla/5.0 (Linux; Android 12; ${this.deviceName}) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/99.0.4844.73 Mobile Safari/537.36 miHoYoBBSOversea/2.9.0`,
                    'X-Requested-With': 'com.mihoyo.hoyolab',
                    'x-rpc-platform': 'android',
                    'x-rpc-device_model': 'Mi 10',
                    'x-rpc-device_name': this.deviceName,
                    'x-rpc-channel': 'miyousheluodi',
                    'x-rpc-sys_version': '6.0.1',
                    Referer: 'https://webstatic-sea.hoyolab.com',
                    Cookie: this.mys.cookie,
                    DS: this.getDS1({ salt: salt.LK2 })
                }
            case 'Bbs':
                return {
                    ...header,
                    'x-rpc-device_model': 'Mi 10',
                    'x-rpc-device_name': this.deviceName,
                    'x-rpc-channel': 'miyousheluodi',
                    'x-rpc-client_type': '2',
                    Referer: 'https://app.mihoyo.com',
                    'x-rpc-sys_version': '12',
                    'User-Agent': 'okhttp/4.8.0',
                    Cookie: this.mys.cookie,
                    DS: this.getDS1({ salt: salt.K2 })
                }
            case 'BbsSign':
                return {
                    ...header,
                    'x-rpc-device_model': 'Mi 10',
                    'x-rpc-device_name': this.deviceName,
                    'x-rpc-channel': 'miyousheluodi',
                    'x-rpc-client_type': '2',
                    Referer: 'https://app.mihoyo.com',
                    'x-rpc-sys_version': '12',
                    'User-Agent': 'okhttp/4.8.0',
                    Cookie: this.mys.cookie,
                    DS: this.getDS2({ q: query, b: _body, salt: salt['6X'] })
                }
            case 'GameRole':
                return {
                    ...header,
                    'X-Requested-With': 'com.mihoyo.hyperion',
                    'Sec-Fetch-Site': 'same-site',
                    'Sec-Fetch-Mode': 'cors',
                    'Sec-Fetch-Dest': 'empty',
                    Cookie: this.mys.cookie,
                    Referer: 'https://user.mihoyo.com/'
                }
            case 'Action':
                return {
                    ...header,
                    'x-rpc-device_model': 'Mi 10',
                    'x-rpc-device_name': this.deviceName,
                    'x-rpc-channel': 'miyousheluodi',
                    'x-rpc-client_type': '2',
                    Referer: 'https://app.mihoyo.com',
                    'x-rpc-sys_version': '12',
                    'User-Agent': 'okhttp/4.8.0',
                    Cookie: this.mys.stoken,
                    DS: this.getDS1(
                        this.game === GameList.Sr ? { q: query, b: _body, salt: salt['6X'] }
                            : { salt: salt.K2, bq: false }
                    )
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
            Cookie: this.mys.cookie,
            DS: this.hoyolab ? this.getDS1({ salt: salt.os, bq: false }) : this.getDS2({ q: query, b: _body, salt: salt['4X'] })
        }
    }

    getDS1({ q = '', b = '', salt = '', bq = true } = {}) {
        const r = MysUtil.randomString(6)
        const t = Math.floor(Date.now() / 1000)
        let DS = `salt=${salt}&t=${t}&r=${r}`
        if (bq || q || b) DS += `&b=${b}&q=${q}`

        return `${t},${r},${md5(DS)}`
    }

    getDS2({ q = '', b = '', salt = '' } = {}) {
        const r = lodash.random(100001, 200000)
        const t = Math.floor(Date.now() / 1000)

        return `${t},${r},${md5(`salt=${salt}&t=${t}&r=${r}&b=${b}&q=${q}`)}`
    }

    cacheKey(type: string, data: any) {
        return `${PluginName}:${this.game}:mys:cache:` + md5(this.uid + type + this.game + JSON.stringify(data))
    }

    async cache(res: any, cacheKey: string, cd: number) {
        if (!res || res.retcode !== 0) return
        redis.setEx(cacheKey, cd, JSON.stringify(res))
    }

    checkstatus(err: any, type: string) {
        if (err.response) {
            let error = `[${this.UIDTYPE}接口][${type}][${this.game}][${this.mys.user_id || this.uid}] ${err.response.status} ${err.response.statusText}`
            if (err.response.status == 403 && this.hoyolab) {
                error += `未配置代理或代理不可用！`
            }
            logger.error(error)
        } else if (err.request) {
            logger.error(`[${this.UIDTYPE}接口][${type}][${this.game}][${this.mys.user_id || this.uid}] 请求无返回或超时`)
        } else {
            logger.error(err)
        }
    }
}
