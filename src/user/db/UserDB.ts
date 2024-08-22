import { BingUIDType, UserDBCOLUMNS } from '@/types/user'
import { DbBaseModel } from './BaseModel'
const { Types, ArrayColumn, JsonColumn, Column } = DbBaseModel

const COLUMNS = {
	[UserDBCOLUMNS['user_id']]: {
		type: Types.STRING,
		primaryKey: true
	},
	[UserDBCOLUMNS['ltuids']]: ArrayColumn('ltuids'),
	[UserDBCOLUMNS['stuids']]: ArrayColumn('stuids'),
	[UserDBCOLUMNS['gs_main']]: Column('STRING'),
	[UserDBCOLUMNS['sr_main']]: Column('STRING'),
	[UserDBCOLUMNS['zzz_main']]: Column('STRING'),
	[UserDBCOLUMNS['gs_uids']]: JsonColumn('gs_uids'),
	[UserDBCOLUMNS['sr_uids']]: JsonColumn('sr_uids'),
	[UserDBCOLUMNS['zzz_uids']]: JsonColumn('zzz_uids')
}

export class UserDB extends DbBaseModel {
	/** 用户ID */
	[UserDBCOLUMNS.user_id]!: string
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

	static COLUMNS = COLUMNS

	static async find(user_id: string) {
		return await UserDB.findByPk(user_id) || UserDB.build({ user_id })
	}
}

DbBaseModel.initDB(UserDB, COLUMNS)
await UserDB.sync()
