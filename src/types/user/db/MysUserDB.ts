import { MysType } from "@/types"

export enum MysUserDBCOLUMNS {
	/** 米游社ID */
	ltuid = 'ltuid',
	/** 米游社类型 */
	type = 'type',
	/** 米游社cookie */
	cookie = 'cookie',
	/** 米游社stoken */
	stoken = 'stoken',
	/** 米游社ltoken */
	ltoken = 'ltoken',
	/** 米游社mid */
	mid = 'mid',
	/** 米游社login_ticket */
	login_ticket = 'login_ticket',
	/** 随机设备device */
	device = 'device',
	/** 原神UID */
	gs = 'gs_uids',
	/** 崩铁UID */
	sr = 'sr_uids',
	/** 绝区零UID */
	zzz = 'zzz_uids'
}

export interface MysUserDBSaveData {
	[MysUserDBCOLUMNS.ltuid]?: string
	[MysUserDBCOLUMNS.type]?: MysType
	[MysUserDBCOLUMNS.cookie]?: string
	[MysUserDBCOLUMNS.stoken]?: string
	[MysUserDBCOLUMNS.ltoken]?: string
	[MysUserDBCOLUMNS.mid]?: string
	[MysUserDBCOLUMNS.login_ticket]?: string
	[MysUserDBCOLUMNS.device]?: string
	[MysUserDBCOLUMNS.gs]?: string[]
	[MysUserDBCOLUMNS.sr]?: string[]
	[MysUserDBCOLUMNS.zzz]?: string[]
}