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

export const enum DeviceInfoDBCOLUMNS {
    /** 用户ID */
    user_id = 'user_id',
    deviceName = 'deviceName',
    deviceModel = 'deviceModel',
    deviceBoard = 'deviceBoard',
    deviceProduct = 'deviceProduct',
    deviceFingerprint = 'deviceFingerprint',
    androidVersion = 'androidVersion',
    oaid = 'oaid'
}

export enum DailyCacheDBCOLUMNS {
    /** 米游社ID */
    ltuid = 'ltuid',
    /** 原神今日查询次数 */
    gs = 'gs_count',
    /**崩坏：星穹铁道今日查询次数 */
    sr = 'sr_count',
    /** 绝区零今日查询次数 */
    zzz = 'zzz_count',
    /** 过期时间 */
    expireTime = 'expireTime'
}

export interface UidWithType {
    uid: string
    type: BingUIDType
    main: boolean
}

export interface UidListWithType {
    list: UidWithType[],
    ban: UidWithType[]
}