import { defineMysApi, BaseMysResData } from './define'
import { ActionHeader, CookieHeader, NoHeader, PassportHeader, StokenHeader } from './headers'
import { MysTool } from './MysTool'
import { MysUtil } from './MysUtil'
import lodash from 'node-karin/lodash'

export const getDeviceFp = defineMysApi<
    { data: { device_fp: string } } & BaseMysResData
>(
    {
        urlKey: 'get-device-fp',
        url: (mysReq, data) => `${MysTool[mysReq.hoyolab ? 'os_public_data_api' : 'public_data_api']}device-fp/api/getFp`,
        body: (mysReq, data) => {
            return {
                seed_id: lodash.sampleSize('0123456789abcdef', 16),
                device_id: mysReq.device_id,
                seed_time: new Date().getTime() + '',
                ...(mysReq.hoyolab ? {
                    platform: '5',
                    ext_fields: `{"userAgent":"Mozilla/5.0 (Linux; Android 11; J9110 Build/55.2.A.4.332; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/124.0.6367.179 Mobile Safari/537.36 miHoYoBBSOversea/2.55.0","browserScreenSize":"387904","maxTouchPoints":"5","isTouchSupported":"1","browserLanguage":"zh-CN","browserPlat":"Linux aarch64","browserTimeZone":"Asia/Shanghai","webGlRender":"Adreno (TM) 640","webGlVendor":"Qualcomm","numOfPlugins":"0","listOfPlugins":"unknown","screenRatio":"2.625","deviceMemory":"4","hardwareConcurrency":"8","cpuClass":"unknown","ifNotTrack":"unknown","ifAdBlock":"0","hasLiedLanguage":"0","hasLiedResolution":"1","hasLiedOs":"0","hasLiedBrowser":"0","canvas":"${MysUtil.getSeedId(64)}","webDriver":"0","colorDepth":"24","pixelRatio":"2.625","packageName":"unknown","packageVersion":"2.27.0","webgl":"${MysUtil.getSeedId(64)}"}`,
                    app_name: mysReq.game_biz,
                    device_fp: '38d7f2364db95'
                } : {
                    platform: '1',
                    ext_fields: `{"proxyStatus":"0","accelerometer":"-0.159515x-0.830887x-0.682495","ramCapacity":"3746","IDFV":"${mysReq.device_id}","gyroscope":"-0.191951x-0.112927x0.632637","isJailBreak":"0","model":"iPhone12,5","ramRemain":"115","chargeStatus":"1","networkType":"WIFI","vendor":"--","osVersion":"17.0.2","batteryStatus":"50","screenSize":"414×896","cpuCores":"6","appMemory":"55","romCapacity":"488153","romRemain":"157348","cpuType":"CPU_TYPE_ARM64","magnetometer":"-84.426331x-89.708435x-37.117889"}`,
                    app_name: 'bbs_cn',
                    device_fp: '38d7ee834d1e9'
                })
            }
        },
        header: CookieHeader,
        noFp: true
    }
)

export const getLTokenBySToken = defineMysApi<
    { data: { ltoken: string } } & BaseMysResData,
    { cookie: string }
>({
    urlKey: 'getLTokenBySToken',
    url: (mysReq, data) => `${MysTool.pass_api}account/auth/api/getLTokenBySToken?${data.cookie}`,
    query: (mysReq, data) => data.cookie,
    header: NoHeader,
    noFp: true
})

export const getTokenByGameToken = defineMysApi<
    {
        data: {
            token: { token: string },
            user_info: { aid: string, mid: string }
        }
    } & BaseMysResData,
    { account_id: number, game_token: string }
>(
    {
        urlKey: 'getTokenByGameToken',
        url: (mysReq, data) => `${MysTool.pass_api}account/ma-cn-session/app/getTokenByGameToken`,
        body: (mysReq, data) => {
            return {
                account_id: data.account_id,
                game_token: data.game_token
            }
        },
        header: PassportHeader,
        noFp: true
    }
)

export const getCookieBySToken = defineMysApi<
    { data: { cookie_token: string } } & BaseMysResData,
    { method: 'GET' | 'POST' }
>(
    {
        urlKey: 'getCookieBySToken',
        url: (mysReq, data) => `${MysTool[mysReq.hoyolab ? 'os_web_api' : 'web_api']}auth/api/getCookieAccountInfoBySToken?game_biz=${mysReq.game_biz}&${mysReq.mys.stoken}`,
        query: (mysReq, data) => `game_biz=${mysReq.game_biz}&${mysReq.mys.stoken}`,
        header: NoHeader,
        noFp: true
    }
)

interface UserGameRole {
    game_biz: string
    region: string
    game_uid: string
    nickname: string
    is_chosen: boolean
}

export const getUserGameRolesByCookie = defineMysApi<
    {
        data: {
            list: UserGameRole[]
        }
    } & BaseMysResData
>(
    {
        urlKey: 'getUserGameRolesByCookie',
        url: (mysReq, data) => `${MysTool[mysReq.hoyolab ? 'os_web_api' : 'web_api']}binding/api/getUserGameRolesByCookie`,
        header: CookieHeader,
        noFp: true
    }
)

export const getUserGameRolesByStoken = defineMysApi<
    {
        data: {
            list: UserGameRole[]
        }
    } & BaseMysResData
>(
    {
        urlKey: 'getUserGameRolesByStoken',
        url: (mysReq, data) => `${MysTool.new_web_api}binding/api/getUserGameRolesByStoken`,
        header: ActionHeader,
        noFp: true
    }
)

export const getActionTicketBySToken = defineMysApi<
    { data: { ticket: string } } & BaseMysResData
>(
    {
        urlKey: 'getActionTicketBySToken',
        url: (mysReq, data) => `${MysTool.new_web_api}auth/api/getActionTicketBySToken`,
        query: (mysReq, data) => `uid=${mysReq.mys.ltuid}&action_type=game_role`,
        header: ActionHeader,
        noFp: true
    }
)

export const changeGameRoleByDefault = defineMysApi<
    { data: { game_biz: string, game_uid: string } } & BaseMysResData,
    { action_ticket: string, game_biz: string, game_uid: string }
>(
    {
        urlKey: 'changeGameRoleByDefault',
        url: (mysReq, data) => `${MysTool.new_web_api}binding/api/changeGameRoleByDefault`,
        body: (mysReq, data) => {
            return {
                action_ticket: data.action_ticket,
                game_biz: data.game_biz,
                game_uid: data.game_uid
            }
        },
        header: ActionHeader,
        noFp: true
    }
)

export const getUserFullInfo = defineMysApi<
    { data: { user_info: { uid: string } } } & BaseMysResData
>(
    {
        urlKey: 'getUserFullInfo',
        url: (mysReq, data) => `${MysTool.new_web_api}user/wapi/getUserFullInfo?gids=2`,
        header: CookieHeader,
        noFp: true
    }
)

export const fetchQRcode = defineMysApi<
    { data: { url: string } },
    { device: string }
>(
    {
        urlKey: 'fetchQRcode',
        url: (mysReq, data) => `${MysTool.hk4e_sdk_api}hk4e_cn/combo/panda/qrcode/fetch`,
        body: (mysReq, data) => {
            return { app_id: MysTool.app_id, device: data.device }
        },
        header: NoHeader,
        noFp: true
    }
)

export const queryQRcode = defineMysApi<
    {
        data: {
            stat: 'Scanned' | 'Confirmed',
            payload: {
                raw: {
                    uid: string, token: string
                }
            }
        }
    } & BaseMysResData,
    { device: string, ticket: string }
>(
    {
        urlKey: 'queryQRcode',
        url: (mysReq, data) => `${MysTool.hk4e_sdk_api}hk4e_cn/combo/panda/qrcode/query`,
        body: (mysReq, data) => {
            return { app_id: MysTool.app_id, device: data.device, ticket: data.ticket }
        },
        dealRes: (res) => {
            res.data.payload.raw = JSON.parse(res.data.payload.raw)
            return res
        },
        header: NoHeader,
        noFp: true
    }
)

export const miyolive_index = defineMysApi<
    {},
    { actid: string }
>(
    {
        urlKey: 'miyolive_index',
        url: (mysReq, data) => `${MysTool.web_api}event/miyolive/index`,
        header: (mysReq, options) => {
            return { 'x-rpc-act_id': options!.reqData!.actid }
        },
        noFp: true
    }
)

export const miyolive_code = defineMysApi<
    {},
    { actid: string, code_ver: string }
>(
    {
        urlKey: 'miyolive_code',
        url: (mysReq, data) => `${MysTool.web_api}event/miyolive/refreshCode?version=${data.code_ver}&time=${Math.floor(Date.now() / 1000)}`,
        header: (mysReq, options) => {
            return { 'x-rpc-act_id': options!.reqData!.actid }
        },
        noFp: true
    }
)

export const miyolive_actId = defineMysApi<
    {}
>(
    {
        urlKey: 'miyolive_actId',
        url: (mysReq, data) => `${MysTool.web_api}painter/api/user_instant/list?offset=0&size=20&uid=${mysReq.uid}`,
        header: NoHeader,
        noFp: true
    }
)

export const genAuthKey = defineMysApi<
    {},
    { auth_appid: 'webview_gacha' }
>(
    {
        urlKey: 'genAuthKey',
        url: (mysReq, data) => `${MysTool.web_api}binding/api/genAuthKey`,
        body: (mysReq, data) => {
            return {
                auth_appid: data.auth_appid,
                game_biz: mysReq.game_biz,
                game_uid: mysReq.uid,
                region: mysReq.server,
            }
        },
        header: (mysReq, options) => {
            return {
                ...StokenHeader(mysReq),
                'x-rpc-client_type': '5',
                DS: mysReq.getDS1({ saltKey: 'LK2', bq: false }),
            }
        },
        noFp: true
    }
)
