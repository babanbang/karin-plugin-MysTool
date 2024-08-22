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

export interface gameServer {
    region: GameRegion<GameList>
    name: string
    os: boolean
}

export type GameKeyAndName = {
    key: GameList
    name: GameNames
}
export const enum GsRegin {
    gf = 'cn_gf01',
    bili = 'cn_qd01',
    usa = 'os_usa',
    euro = 'os_euro',
    asia = 'os_asia',
    cht = 'os_cht'
}

export const enum SrRegin {
    gf = 'prod_gf_cn',
    bili = 'prod_qd_cn',
    usa = 'prod_official_usa',
    euro = 'prod_official_euro',
    asia = 'prod_official_asia',
    cht = 'prod_official_cht'
}

export const enum ZzzRegin {
    gf = 'prod_gf_cn',
    usa = 'prod_gf_us',
    euro = 'prod_gf_eu',
    asia = 'prod_gf_jp',
    cht = 'prod_gf_sg'
}

type gameRegions = {
    [GameList.Gs]: GsRegin
    [GameList.Sr]: SrRegin
    [GameList.Zzz]: ZzzRegin
}

export type GameRegion<game extends GameList> = gameRegions[game]