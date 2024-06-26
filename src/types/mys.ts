import { ApiTool } from "#MysTool/mys"

export type mysType = 'mys' | 'hoyolab' | 'other'

export type games = 'gs' | 'sr' | 'zzz'

export type game_bizs = 'hk4e_cn' | 'hk4e_global' | 'hkrpg_cn' | 'hkrpg_global'

export type reqData = {
  body?: {
    [key: string]: any
  } | string
  headers?: {
    [key: string]: any
  }
  ApiTool?: ApiTool
  [key: string]: any
}

export type resData = {
  retcode?: number
  data?: any
  [key: string]: any
}

export type HeaderType = 'FullInfo' | 'noHeader' | 'passport' | 'authKey' | '' | undefined

export type mysApis = {
  [key: string]: {
    url: string
    query?: string
    body?: reqData['body']
    header?: reqData['headers']
    HeaderType?: HeaderType
  }
}

export type UrlMap = {
  [key in games]?: (data: any) => mysApis
}

export type MysApi