export const enum GameList {
    Gs = 'gs',
    Sr = 'sr',
    Zzz = 'zzz'
}

export enum GameNames {
    gs = '原神',
    sr = '崩坏：星穹铁道',
    zzz = '绝区零'
}

export const enum MysType {
    cn = 'mys', os = 'hoyolab'
}

export type GameKeyAndName = {
    key: GameList
    name: GameNames
}

export type ApiMapType = 'mys' | 'hoyolab' | 'other'

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