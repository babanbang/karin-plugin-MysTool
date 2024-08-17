import { ConfigName, ConfigsType, GameList, MysReqMys, MysReqOptions } from "@/types"
import { Cfg, GamePathType, PluginName } from "@/utils"
import md5 from 'md5'
import { logger, redis } from 'node-karin'
import { axios, lodash, moment } from 'node-karin/modules.js'
import { defineApi } from "./define"
import { game_biz, salt } from './MysTool'
import { MysUtil } from './MysUtil'

export class MysReq {
    mys: MysReqMys
    uid: string
    game: GameList
    server: string
    device_id: string
    hoyolab: boolean
    config: ConfigsType<ConfigName.config, GamePathType.Core>
    option: MysReqOptions
    _deviceName?: string
    _device_fp?: {
        data: {
            device_fp: string
        }
    }
    constructor(mys: MysReqMys = {}, options: MysReqOptions = {}) {
        this.mys = mys
        this.uid = mys.uid || ''
        this.game = mys.game || GameList.Gs
        this.server = mys.server || MysUtil.getRegion(this.uid, this.game)
        this.device_id = (mys.device || MysUtil.getDeviceGuid()).toUpperCase()

        this.hoyolab = MysUtil.isHoyolab(this.server, this.game)

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

    get game_biz() {
        return game_biz[this.game][this.hoyolab ? 0 : 1]
    }

    async getData<
        ReturnType = undefined,
        ReqData extends Partial<Record<string, unknown>> = {}
    >(
        Api: defineApi<ReqData>,
        reqData: ReqData
    ): Promise<ReturnType> {
        const { urlKey, url, query, body, header, noFp } = Api

        const cacheKey = this.cacheKey(urlKey, reqData)
        const cahce = await redis.get(cacheKey)
        if (cahce) return JSON.parse(cahce)

        const b = body?.(this, reqData)
        const headers = Object.assign(header(this, { q: query?.(this, reqData), b, reqData }))

        const param: any = {
            url: url(this, reqData),
            method: reqData.method ?? 'get',
            headers,
            timeout: reqData.timeout ?? 10000
        }
        if (b) {
            param.method = 'post'
            param.data = b
        }
        if (this.hoyolab && this.config.proxy?.host && this.config.proxy?.port) {
            param.proxy = this.config.proxy
        }

        logger.debug(`[${this.UIDTYPE}接口][${urlKey}][${this.game}][${this.mys.user_id || this.uid}] ${JSON.stringify(param)}`)
        let response
        const start = Date.now()
        try {
            response = await axios(param)
        } catch (err) {
            this.checkstatus(err, urlKey)
            return undefined
        }

        if (this.option.log && type !== 'getFp' && !data?.option?.nolog) {
            logger.mark(`[${this.UIDTYPE}接口][${type}][${this.game}][${this.mys.user_id || this.uid}] ${Date.now() - start}ms`)
        }
        const res = response.data

        if (!res) {
            logger.mark(`[${this.UIDTYPE}接口][${urlKey}][${this.game}][${this.mys.user_id || this.uid}]没有返回`)
            return undefined
        }

        logger.debug(`[${this.UIDTYPE}接口][${urlKey}][${this.game}][${this.mys.user_id || this.uid}] ${JSON.stringify(res)}`)

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

    getDS1(options: { q?: string, b?: string, saltKey: keyof typeof salt, bq?: boolean }) {
        const { q = '', b = '', saltKey, bq = true } = options

        const r = MysUtil.randomString(6)
        const t = Math.floor(Date.now() / 1000)
        let DS = `salt=${salt[saltKey]}&t=${t}&r=${r}`
        if (bq || q || b) DS += `&b=${b}&q=${q}`

        return `${t},${r},${md5(DS)}`
    }

    getDS2(options: { q?: string, b?: string, saltKey: keyof typeof salt }) {
        const { q = '', b = '', saltKey } = options

        const r = lodash.random(100001, 200000)
        const t = Math.floor(Date.now() / 1000)

        return `${t},${r},${md5(`salt=${salt[saltKey]}&t=${t}&r=${r}&b=${b}&q=${q}`)}`
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
