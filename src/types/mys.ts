export const enum GameList {
    Gs = 'gs',
    Sr = 'sr',
    Zzz = 'zzz'
}

export const enum GameNames {
    Gs = '原神',
    Sr = '崩坏：星穹铁道',
    Zzz = '绝区零'
}

export const enum MysType {
    cn = 'mys', os = 'hoyolab'
}

export type GameKeyAndName = {
    key: GameList
    name: GameNames
}

export type ApiMapType = 'mys' | 'hoyolab' | 'other'

export type HeaderTypes = 'BbsSign' | 'Bbs' | 'MysSign' | 'os_MysSign' | 'noHeader' | 'passport' | 'Action' | 'GameRole' | 'FullInfo' | 'authKey'

export interface MysReqMys {
    uid?: string
    ltuid?: string
    user_id?: string
    cookie?: string
    stoken?: string
    game?: GameList
    server?: string
    device?: string
}

export interface MysReqOptions {
    cacheCd?: number
    log?: boolean
}



