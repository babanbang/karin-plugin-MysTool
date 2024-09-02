import { MysUtil } from '@/mys'
import { GameList, MysType, MysUserDBCOLUMNS, MysUserDBSaveData } from '@/types'
import { DbBaseModel } from './BaseModel'
const { Types, Column, ArrayColumn, Op, DIALECT } = DbBaseModel

const COLUMNS = {
	[MysUserDBCOLUMNS['ltuid']]: {
		type: Types.INTEGER,
		primaryKey: true
	},
	[MysUserDBCOLUMNS['type']]: Column('STRING', 'mys'),
	[MysUserDBCOLUMNS['cookie']]: Column('TEXT'),
	[MysUserDBCOLUMNS['stoken']]: Column('STRING'),
	[MysUserDBCOLUMNS['ltoken']]: Column('STRING'),
	[MysUserDBCOLUMNS['mid']]: Column('STRING'),
	[MysUserDBCOLUMNS['login_ticket']]: Column('STRING'),
	[MysUserDBCOLUMNS['device']]: Column('STRING'),
	[MysUserDBCOLUMNS['gs']]: ArrayColumn(MysUserDBCOLUMNS['gs'], {
		fn: (data) => data.sort((a, b) => Number(a) - Number(b))
	}),
	[MysUserDBCOLUMNS['sr']]: ArrayColumn(MysUserDBCOLUMNS['sr'], {
		fn: (data) => data.sort((a, b) => Number(a) - Number(b))
	}),
	[MysUserDBCOLUMNS['zzz']]: ArrayColumn(MysUserDBCOLUMNS['zzz'], {
		fn: (data) => data.sort((a, b) => Number(a) - Number(b))
	})
}

export class MysUserDB extends DbBaseModel {
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

	static COLUMNS_KEY = Object.keys(COLUMNS).filter(k => k !== MysUserDBCOLUMNS['ltuid']) as MysUserDBCOLUMNS[]

	/** 根据ltuid查找MysUser */
	static async find(ltuid: string) {
		return await MysUserDB.findByPk(ltuid) || MysUserDB.build({ ltuid })
	}

	/** 根据uid查找MysUser */
	static async findByUid(uid: string, game: GameList) {
		if (!uid || !game) return false

		const users = await MysUserDB.findAll({
			where: {
				type: MysUtil.getServ(uid, game),
				[game + '_uids']: DIALECT === 'postgres' ? {
					[Op.contains]: [uid]
				} : {
					[Op.like]: `%${uid}%`
				}
			}
		})
		return users?.[0]
	}

	async saveDB(param: MysUserDBSaveData) {
		for (const key of MysUserDB.COLUMNS_KEY) {
			if (param[key] !== undefined) {
				this[key] = param[key] as string & MysType & string[]
			}
		}

		await this.save()
	}
}

DbBaseModel.initDB(MysUserDB, COLUMNS)
await MysUserDB.sync()