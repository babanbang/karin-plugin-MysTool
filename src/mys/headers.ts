import { app_version } from "./MysTool"
import { MysReq } from "./MysReq"

export const BaseHeaders = (mysReq: MysReq) => {
    return {
        'x-rpc-app_version': app_version.cn,
        'x-rpc-client_type': '5',
        'x-rpc-device_id': mysReq.device_id,
        'User-Agent': `Mozilla/5.0 (Linux; Android 12; ${mysReq.deviceName}) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/99.0.4844.73 Mobile Safari/537.36 miHoYoBBS/${app_version.cn}`,
        Referer: 'https://webstatic.mihoyo.com'
    }
}

export const BaseOsHeaders = {
    'x-rpc-app_version': app_version.os,
    'x-rpc-client_type': '4',
    'x-rpc-language': 'zh-cn'
}

export const NoHeader = (mysReq: MysReq, options: { q?: string, b?: unknown } = {}) => { return {} }

export const CookieHeader = (mysReq: MysReq, options: { q?: string, b?: unknown } = {}) => {
    return {
        Cookie: mysReq.mysUserInfo!.cookie,
        ...(mysReq.hoyolab ? BaseOsHeaders : BaseHeaders(mysReq))
    }
}

export const StokenHeader = (mysReq: MysReq) => {
    return {
        ...(mysReq.hoyolab ? BaseOsHeaders : BaseHeaders(mysReq)),
        'x-rpc-client_type': '2',
        'User-Agent': 'okhttp/4.8.0',
        Cookie: mysReq.mysUserInfo!.stoken
    }
}

export const PassportHeader = (mysReq: MysReq, options: { q?: string, b?: unknown } = {}) => {
    const { q = '', b = '' } = options
    return {
        'x-rpc-app_version': app_version.cn,
        'x-rpc-game_biz': 'bbs_cn',
        'x-rpc-client_type': '2',
        'User-Agent': 'okhttp/4.8.0',
        DS: mysReq.getDS1({ q, b: JSON.stringify(b), saltKey: 'PROD' })
    }
}

export const ActionHeader = (mysReq: MysReq, options: { q?: string, b?: unknown } = {}) => {
    const { q = '', b = '' } = options
    return {
        ...StokenHeader(mysReq),
        DS: mysReq.getDS1({ q, b: JSON.stringify(b), saltKey: '6X' })
    }
}