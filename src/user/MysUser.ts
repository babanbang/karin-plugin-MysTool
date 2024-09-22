import { MysReq, MysUtil, getCookieBySToken, getUserGameRolesByCookie } from '@/mys'
import { BasePlayer } from '@/panel'
import { GameList, MysType, MysUserDBCOLUMNS, MysUserDBSaveData } from '@/types'
import { logger } from 'node-karin'
import { DailyCache } from './DailyCache'
import { MysUserDB } from './db'

export class MysUser {
	/** 米游社账号数据 */
	db!: MysUserDB
	/** 米游社ID */
	declare [MysUserDBCOLUMNS.ltuid]: string
	/** 米游社类型 */
	declare [MysUserDBCOLUMNS.type]: MysType
	/** 米游社cookie */
	declare [MysUserDBCOLUMNS.cookie]: string
	/** 米游社stoken */
	declare [MysUserDBCOLUMNS.stoken]: string
	/** 米游社ltoken */
	declare [MysUserDBCOLUMNS.ltoken]: string
	/** 米游社mid */
	declare [MysUserDBCOLUMNS.mid]: string
	/** 米游社login_ticket */
	declare [MysUserDBCOLUMNS.login_ticket]: string
	/** 随机设备device */
	declare [MysUserDBCOLUMNS.device]: string
	/** 原神UID */
	declare [MysUserDBCOLUMNS.gs]: string[]
	/** 崩铁UID */
	declare [MysUserDBCOLUMNS.sr]: string[]
	/** 绝区零UID */
	declare [MysUserDBCOLUMNS.zzz]: string[]

	constructor(ltuid: string) {
		this.ltuid = ltuid
	}

	static async create(ltuid: string, db?: MysUserDB) {
		const mys = new MysUser(ltuid)
		await mys.initDB(db)

		return mys
	}

	/** 初始化数据 */
	async initDB(db?: MysUserDB) {
		if (this.db && !db) return

		this.db = db || await MysUserDB.find(this.ltuid)
		for (const key of MysUserDB.COLUMNS_KEY) {
			this[key] = this.db[key] as string & MysType & string[]
		}
	}

	/** 保存数据 */
	async save() {
		if (!this.db) return false
		await this.db.saveDB(this)
	}

	getStoken() {
		return MysUtil.splicToken({
			ltuid: this.ltuid,
			stoken: this.stoken,
			mid: this.mid,
			ltoken: this.ltoken
		})
	}

	/** 根据UID查询对应米游社账号 */
	static async getMysUserByUid(uid: string, game: GameList) {
		const mys = await MysUserDB.findByUid(uid, game)
		if (!mys) return false

		return await MysUser.create(mys.ltuid)
	}

	getMysUserInfo() {
		return {
			type: this.type,
			ltuid: this.ltuid,
			cookie: this.cookie,
			stoken: this.getStoken(),
			device: this.device
		}
	}

	/** 分配查询MysUser */
	static async getByQueryUid(uid: string, game: GameList) {
		// 使用CK池内容，分配次数最少的一个ltuid
		const ltuid = await DailyCache.getLtuid(game)
		if (!ltuid) return false

		const ckUser = await MysUser.create(ltuid)
		if (!ckUser.cookie) {
			await DailyCache.delCache(ltuid)
			return false
		}

		logger.mark(`[米游社查询][uid：${uid}]${logger.green(`[分配查询ck：${ckUser.ltuid}]`)}`)
		return ckUser
	}

	/** 查询全部数据 */
	static async forEach<T>(fn: (user: MysUser) => Promise<T> | T) {
		const dbs = await MysUserDB.findAll()
		const result: T[] = []
		for (const db of dbs) {
			const user = await MysUser.create(db.ltuid, db)
			result.push(await fn(user))
		}
		return result
	}

	/** 修改数据 */
	async setData(data: MysUserDBSaveData) {
		if (MysUserDBCOLUMNS.ltuid in data) {
			delete data[MysUserDBCOLUMNS.ltuid]
		}

		for (const key of MysUserDB.COLUMNS_KEY) {
			if (data[key] !== undefined) {
				this[key] = data[key] as string & MysType & string[]
			}
		}
	}

	/** 刷新米游社cookie */
	async updataCookie(servs?: MysType[]) {
		if (!this.stoken) return false

		for (const serv of servs || MysUtil.servs) {
			const res = await getCookieBySToken(
				new MysReq(this.ltuid, GameList.Gs, {
					stoken: this.getStoken().replace(/;/g, '&').replace(/stuid/, 'uid'),
					type: serv
				}),
				{ method: serv === MysType.cn ? 'GET' : 'POST' }
			)
			if (res?.retcode == -100) {
				this.stoken = ''
				await this.save()
				return false
			} else if (res?.data?.cookie_token) {
				return MysUtil.splicToken({
					ltoken: this.ltoken,
					ltuid: this.ltuid,
					cookie_token: res.data.cookie_token,
					account_id: this.ltuid
				})
			}
		}
		return false
	}

	/** 刷新mysUser的UID列表 */
	async reqMysUid() {
		const err = (msg = '', status = 1) => {
			return { status, msg }
		}

		let res
		let msg = ''
		for (const serv of MysUtil.servs) {
			res = await getUserGameRolesByCookie(
				new MysReq(this.ltuid, GameList.Gs, { cookie: this.cookie, type: serv })
			)
			if (res?.retcode === 0) {
				this.type = serv
				break
			} else if (res?.retcode === -100) {
				msg = 'cookie失效，请重新登录获取'
			} else {
				msg = res?.message || '请求失败'
			}
		}
		if (!res || res?.retcode !== 0) return err(msg)

		const playerList = (res?.data?.list || []).filter((v: any) =>
			MysUtil.AllGameBiz.includes(v.game_biz)
		)
		if (!playerList || playerList.length <= 0) {
			return err('该账号尚未绑定角色')
		}

		/** 米游社默认展示的角色 */
		playerList.forEach(val => {
			const uid = String(val.game_uid)
			const game = MysUtil.getGameByGamebiz(val.game_biz)
			this.addUid(uid, game.key)

			const player = new BasePlayer(uid, game.key)
			player.setBasicData({ name: val.nickname }, true)
		})
		return { status: 0, msg: '' }
	}

	/** 为当前MysUser绑定UID */
	addUid(uid: string | string[], game: GameList) {
		if (Array.isArray(uid)) {
			uid.forEach(u => this.addUid(u, game))
			return true
		}

		const g = MysUserDBCOLUMNS[game]
		if ((game === GameList.Zzz ? /\d{8,10}/ : /\d{9,10}/).test(uid)) {
			if (!this[g].includes(uid)) {
				this[g].push(uid)
			}
		}
		return true
	}
}