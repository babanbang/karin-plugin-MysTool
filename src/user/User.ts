import { MysUtil } from '@/mys'
import { BingUIDType, GameList, MysUserDBCOLUMNS, UidListWithType, UserDBCOLUMNS } from '@/types'
import Base from './Base'
import { MysUser } from './MysUser'
import { UserDB } from './db'

export class User extends Base {
	/** 用户数据 */
	db!: UserDB
	game: GameList
	/** 用户ID */
	[UserDBCOLUMNS.user_id]: string
	/** 绑定的cookie ltuids */
	[UserDBCOLUMNS.ltuids]!: string[]
	/** 绑定的stoken stuids */
	[UserDBCOLUMNS.stuids]!: string[]
	/** 当前使用的原神UID */
	[UserDBCOLUMNS.gs_main]!: string
	/** 当前使用的崩坏；星穹铁道UID */
	[UserDBCOLUMNS.sr_main]!: string
	/** 当前使用绝区零UID */
	[UserDBCOLUMNS.zzz_main]!: string
	/** 绑定的原神UID列表 */
	[UserDBCOLUMNS.gs_uids]!: Record<string, BingUIDType>
	/** 绑定的崩坏；星穹铁道UID列表 */
	[UserDBCOLUMNS.sr_uids]!: Record<string, BingUIDType>
	/** 绑定的绝区零UID列表 */
	[UserDBCOLUMNS.zzz_uids]!: Record<string, BingUIDType>
	/** 绑定的米游社账号 */
	#mysUsers: Record<string, MysUser> = {}

	static COLUMNS_KEY = Object.keys(UserDB.COLUMNS).filter(k => k !== UserDBCOLUMNS['user_id']) as UserDBCOLUMNS[]

	constructor(user_id: string, game: GameList = GameList.Gs) {
		super(User.COLUMNS_KEY)
		this.game = game
		this.user_id = user_id
	}
	_get(key: UserDBCOLUMNS) { return this.db[key] }
	_set(key: UserDBCOLUMNS, value: any) {
		this.db[key] = value
	}

	get uid() {
		return this[this.Key.m]
	}

	mainUid(game: GameList) {
		return this[this.gameKey(game).m]
	}

	get Key() {
		return this.gameKey(this.game)
	}

	hasCk(uid?: string) {
		return [BingUIDType.ck, BingUIDType.all].includes(this[this.Key.u][uid || this.uid])
	}

	hasSk(uid?: string) {
		return [BingUIDType.sk, BingUIDType.all].includes(this[this.Key.u][uid || this.uid])
	}

	gameKey(game: GameList): {
		m: UserDBCOLUMNS.gs_main | UserDBCOLUMNS.sr_main | UserDBCOLUMNS.zzz_main,
		u: UserDBCOLUMNS.gs_uids | UserDBCOLUMNS.sr_uids | UserDBCOLUMNS.zzz_uids,
	} {
		return {
			m: `${game}_main` as any,
			u: `${game}_uids` as any,
		}
	}

	static async create(user_id: string, game: GameList, db?: UserDB) {
		const user = new User(user_id, game)
		await user.initDB(db)

		return user
	}

	/** 初始化数据 */
	async initDB(db?: UserDB) {
		if (this.db && !db) return

		this.db = db || await UserDB.find(this.user_id)
	}

	/** 保存数据 */
	async save() {
		if (!this.db) return false
		await this.db.save()
	}

	/** 初始化MysUser对象 */
	async initMysUser() {
		for (const ltuid of this.ltuids) {
			const mys = await MysUser.create(ltuid)
			if (mys) this.#mysUsers[ltuid] = mys
		}

		for (const stuid of this.stuids) {
			if (this.ltuids.includes(stuid)) continue

			const mys = await MysUser.create(stuid)
			if (mys) this.#mysUsers[stuid] = mys
		}
	}

	/** 获取全部MysUser对象 */
	getAllMysUser() {
		return Object.values(this.#mysUsers)
	}

	/** 查询全部数据 */
	static async forEach<T>(fn: (user: User) => Promise<T> | T, game: GameList) {
		const dbs = await UserDB.findAll()
		const result: T[] = []
		for (const db of dbs) {
			const user = await User.create(db.user_id, game, db)
			result.push(await fn(user))
		}
		return result
	}

	/** 添加MysUser */
	async addMysUser(mysUser: MysUser, type: BingUIDType) {
		this.#mysUsers[mysUser.ltuid] = mysUser
		const self = this
		await MysUtil.eachGame(async (game) => {
			const g = self.gameKey(game)
			const uids = mysUser[g.u].filter(v => self[g.u][v] !== BingUIDType.ban)
			await self.addRegUid({ uid: uids, game, type, save: false })
			if (uids[0] && !self[g.m]) {
				self.setMainUid({ uid: uids[0], game, save: false })
			}
		}, true)
		await this.save()
	}

	getMysUserByUid(params: { game?: GameList, uid?: string } = {}) {
		const { game = this.game, uid = this.mainUid(game) } = params

		return Object.values(this.#mysUsers).find(v => v[MysUserDBCOLUMNS[game]].some(u => u === uid))!
	}

	getMysUserByLtuid(ltuid: string) {
		return this.#mysUsers[ltuid]
	}

	getCkInfoByUid(params: { game?: GameList, uid?: string } = {}) {

	}

	/** 添加绑定UID */
	async addRegUid(options: {
		uid: string | string[],
		game?: GameList,
		type?: BingUIDType,
		/** 是否立即保存 */
		save?: boolean,
	}) {
		const { uid, game = this.game, type = BingUIDType.reg, save = true } = options
		if (Array.isArray(uid)) {
			for (const u of uid) {
				await this.addRegUid({ uid: u, game, save: false })
			}

			if (save) await this.save()
			return true
		}
		this.db[this.gameKey(game).u][uid] = type

		await this.setMainUid({ uid, game, save: false })
		if (save) await this.save()
		return true
	}

	/** 删除绑定UID */
	async delRegUid(uid: string, game?: GameList) {
		const g = this.gameKey(game || this.game)
		if (!(uid in this[g.u])) return undefined

		delete this.db[g.u][uid]
		if (this[g.m] === uid || !this[g.m]) {
			await this.setMainUid({ uid: Object.keys(this[g.u])[0], game, save: false })
		}

		await this.save()
	}

	/** 切换UID */
	async setMainUid(options: {
		uid?: string,
		game?: GameList,
		/** 是否立即保存 */
		save?: boolean,
	}) {
		const { uid = '', game = this.game, save = true } = options
		const uidList = this.getUidList({ game })
		if (!uidList.includes(uid) && uid !== '') {
			return false
		}

		this.db[this.gameKey(game).m] = uid

		if (save) await this.save()
	}

	async setUidType(options: {
		uid?: string,
		game?: GameList,
		type: BingUIDType
	}) {
		const game = options.game || this.game
		const g = this.gameKey(game)

		const uid = options.uid || this[g.m]
		if (options.type === BingUIDType.ban) {
			this.db[g.u][uid] = BingUIDType.ban
			const uidList = this.getUidList({ game })
			await this.setMainUid({ uid: uidList[0], game })
			return true
		}
		if (this.db[g.u][uid] === options.type) {
			this.db[g.u][uid] = BingUIDType.reg
		} else if (this[g.u][uid] === BingUIDType.all) {
			this.db[g.u][uid] = options.type
		} else {
			return false
		}

		await this.save()
		return true
	}

	/** 获取UID列表 */
	getUidList(options: { game?: GameList, returnType: true }): UidListWithType
	getUidList(options?: { game?: GameList, filterType?: BingUIDType | BingUIDType[] }): string[]
	getUidList(options: { game?: GameList, filterType?: BingUIDType | BingUIDType[], returnType?: boolean } = {}) {
		const { game = this.game, filterType, returnType } = options
		const g = this.gameKey(game)

		if (returnType) {
			const lists: UidListWithType = { list: [], ban: [] }

			Object.entries(this[g.u]).forEach(([uid, type]) => {
				const entry = { uid, type, main: this[g.m] === uid }
				if (type === BingUIDType.ban) {
					lists.ban.push(entry)
				} else {
					lists.list.push(entry)
				}
			})
			return lists
		}

		let type = filterType
		if (filterType === BingUIDType.all) {
			type = [BingUIDType.all, BingUIDType.ck, BingUIDType.sk]
		} else if (filterType && !Array.isArray(filterType)) {
			type = [filterType]
		}
		return Object.keys(this[g.u]).filter(v => {
			if (type) return type.includes(this[g.u][v])
			return this[g.u][v] !== BingUIDType.ban
		})
	}
}
