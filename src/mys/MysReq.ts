import { ConfigName, ConfigsType, GameList, MysType, gameServer, mysUserInfo } from "@/types"
import { Cfg, GamePathType, PluginName } from "@/utils"
import md5 from 'md5'
import { logger, redis } from 'node-karin'
import { AxiosHeaders, AxiosRequestConfig } from "node-karin/axios"
import { axios, lodash } from 'node-karin/modules.js'
import { game_biz, salt } from './MysTool'
import { MysUtil } from './MysUtil'
import { defineApi } from "./define"

export class MysReq<g extends GameList>{
	/** 查询的id可为uid、ltuid、user_id */
	uid: string
	game: g
	mysUserInfo?: mysUserInfo<g>

	option: { cacheCd?: number }
	config: ConfigsType<ConfigName.config, GamePathType.Core>

	#deviceName?: string
	#server?: gameServer
	#device_id?: string

	constructor(uid: string, game: g, mys: mysUserInfo<g> = {}, options: {
		cacheCd?: number
	} = {}) {
		this.uid = uid
		this.game = game

		this.mysUserInfo = mys

		this.config = Cfg.getConfig(ConfigName.config, GamePathType.Core)
		this.option = options
	}

	get deviceName() {
		if (!this.#deviceName) this.#deviceName = `Karin-${md5(this.game + this.uid).substring(0, 5)}`
		return this.#deviceName
	}

	/** 获取游戏区服 */
	get server() {
		if (!this.#server) {
			if (this.mysUserInfo?.region) {
				this.#server = MysUtil.getServerByRegion(this.mysUserInfo.region, this.game)
			} else {
				this.#server = MysUtil.getServerByUid(this.uid, this.game)
			}
		}
		return this.#server
	}
	/** 是否为国际服 */
	get hoyolab() {
		return this.mysUserInfo?.type === MysType.os || this.server.os
	}

	get game_biz() {
		return game_biz[this.game][this.hoyolab ? 0 : 1]
	}

	get device_id() {
		if (!this.#device_id) this.#device_id = (this.mysUserInfo?.device || MysUtil.getDeviceGuid()).toUpperCase()
		return this.#device_id
	}

	async get_device_fp() {


		return {
			'x-rpc-device_id': '',
			'x-rpc-device_fp': ''
		}
	}

	async getData<
		ReturnType = undefined,
		ReqData extends Partial<Record<string, any>> = {}
	>(
		Api: defineApi<ReqData>,
		reqData: ReqData
	): Promise<ReturnType> {
		const { urlKey, Method, url, query, body, header, noFp } = Api

		const cacheKey = this.cacheKey(urlKey, reqData)
		const cahce = await redis.get(cacheKey)
		if (cahce) return JSON.parse(cahce)

		const q = query?.(this, reqData)
		const b = body?.(this, reqData)
		const headers = new AxiosHeaders(header(this, { q, b, reqData }))

		if (!noFp) {
			headers.set(await this.get_device_fp())
		}

		let _url = url(this, reqData)
		if (q) _url += `?${q}`

		const param: AxiosRequestConfig = {
			url: _url, data: b, headers, method: typeof Method === 'function' ? Method(this) : Method
		}

		if (this.hoyolab && this.config.proxy?.host && this.config.proxy?.port) {
			param.proxy = this.config.proxy
		}

		logger.debug(`requst: [${urlKey}][${this.game}][${this.uid}] ${JSON.stringify(param)}`)

		const start = Date.now()
		let response: any = undefined
		try {
			if (param.method === 'GET') {
				response = await axios.get(_url, { headers, proxy: param.proxy, timeout: 10000 })
			} else if (param.method === 'POST') {
				response = await axios.post(_url, b, { headers, proxy: param.proxy, timeout: 10000 })
			} else {
				logger.error(`[${urlKey}][${this.game}][${this.uid}] 不支持的请求方法！`)
				return response
			}
		} catch (err) {
			this.checkstatus(err, urlKey)
			return response
		}

		const res = response.data

		if (!res) {
			logger.error(`[${urlKey}][${this.game}][${this.uid}] 接口没有返回数据！`)
			return response
		}

		logger.debug(`response: [${urlKey}][${this.game}][${this.uid}] ${Date.now() - start}ms ${JSON.stringify(res)}`)

		if ('retcode' in res) {
			res.retcode = Number(res.retcode)
		}

		if (this.option.cacheCd || reqData.cacheCd) {
			this.cache(res, cacheKey, this.option.cacheCd || reqData.cacheCd)
		}

		return res
	}

	getDS1(q: string, b: string, saltKey: keyof typeof salt) {
		const r = MysUtil.randomString(6)
		const t = Math.floor(Date.now() / 1000)
		let DS = `salt=${salt[saltKey]}&t=${t}&r=${r}`
		if (q || b) DS += `&b=${b}&q=${q}`

		return `${t},${r},${md5(DS)}`
	}

	getDS2(q: string, b: string, saltKey: keyof typeof salt) {
		const r = lodash.random(100001, 200000)
		const t = Math.floor(Date.now() / 1000)

		return `${t},${r},${md5(`salt=${salt[saltKey]}&t=${t}&r=${r}&b=${b}&q=${q}`)}`
	}

	cacheKey(type: string, data: any) {
		return `${PluginName}:${this.game}:mys:cache:` + md5(this.uid + type + this.game + JSON.stringify(data))
	}

	async cache(res: any, cacheKey: string, cd: number) {
		if (!res || res.retcode !== 0) return
		redis.setEx(cacheKey, cd, JSON.stringify({ ...res, isCache: true }))
	}

	checkstatus(err: any, type: string) {
		if (err.response) {
			let error = `[${type}][${this.game}][${this.uid}] ${err.response.status} ${err.response.statusText}`
			if (err.response.status === 403 && this.hoyolab) {
				error += `未配置代理或代理不可用！`
			}
			logger.error(error)
		} else if (err.request) {
			logger.error(`[${type}][${this.game}][${this.uid}] 请求无返回或超时！`)
		} else {
			logger.error(err)
		}
	}
}
