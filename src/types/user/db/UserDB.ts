export enum BingUIDType {
	ban = 'ban', reg = 'reg', ck = 'ck', sk = 'sk', all = 'all'
}

export const enum UserDBCOLUMNS {
	/** 用户ID */
	user_id = 'user_id',
	/** 绑定的cookie ltuids */
	ltuids = 'ltuids',
	/** 绑定的stoken stuids */
	stuids = 'stuids',
	/** 当前使用的原神UID */
	gs_main = 'gs_main',
	/** 当前使用的崩坏；星穹铁道UID */
	sr_main = 'sr_main',
	/** 当前使用绝区零UID */
	zzz_main = 'zzz_main',
	/** 绑定的原神UID列表 */
	gs_uids = 'gs_uids',
	/** 绑定的崩坏；星穹铁道UID列表 */
	sr_uids = 'sr_uids',
	/** 绑定的绝区零UID列表 */
	zzz_uids = 'zzz_uids'
}

export interface UserDBSaveData {
	[UserDBCOLUMNS.user_id]?: string
	[UserDBCOLUMNS.ltuids]?: string[]
	[UserDBCOLUMNS.stuids]?: string[]
	[UserDBCOLUMNS.gs_main]?: string
	[UserDBCOLUMNS.sr_main]?: string
	[UserDBCOLUMNS.zzz_main]?: string
	[UserDBCOLUMNS.gs_uids]?: Record<string, BingUIDType>
	[UserDBCOLUMNS.sr_uids]?: Record<string, BingUIDType>
	[UserDBCOLUMNS.zzz_uids]?: Record<string, BingUIDType>
}