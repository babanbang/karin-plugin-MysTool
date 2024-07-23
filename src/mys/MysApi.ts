import { MysTool } from './MysTool'
import { MysUtil } from './MysUtil'
import {
    GameList, HeaderTypes, ApiMapType
} from '@/types/mys'

type ApiInfo = {
    [key: string]: {
        url: string
        query?: string
        body?: any
        header?: {
            [key: string]: string
        }
        HeaderType?: HeaderTypes
    }
}

type ApiMapFn = (data: any) => ApiInfo

type UrlMap = {
    [key in GameList]?: ApiMapFn[]
}

const MiYouSheUrlMap: UrlMap = {}
const HoYoLabUrlMap: UrlMap = {}
const OtherUrlMap: UrlMap = {}

export class MysApi {
    uid?: string
    ltuid?: string
    server?: string
    game: GameList
    hoyolab: boolean
    game_biz?: string

    constructor(params: {
        uid: string,
        ltuid?: string,
        server: string,
        game: GameList
    }) {
        this.uid = params.uid
        this.ltuid = params.ltuid
        this.game = params.game
        this.server = params.server
        this.hoyolab = /os_|official/.test(this.server)
    }

    MiYouSheUrlMap(data: any) {
        if (!MiYouSheUrlMap[this.game]) return {}
        return MiYouSheUrlMap[this.game]!.reduce((result, item) => {
            return { ...result, ...item.call(this, data) }
        }, {})
    }
    HoYoLabUrlMap(data: any) {
        if (!MiYouSheUrlMap[this.game]) return {}
        return HoYoLabUrlMap[this.game]!.reduce((result, item) => {
            return { ...result, ...item.call(this, data) }
        }, {})
    }
    OtherUrlMap(data: any) {
        if (!OtherUrlMap[this.game]) return {}
        return OtherUrlMap[this.game]!.reduce((result, item) => {
            return { ...result, ...item.call(this, data) }
        }, {})
    }

    static setApiMap(game: GameList, apiMap: ApiMapFn, type: ApiMapType) {
        if (type === 'mys') {
            if (!MiYouSheUrlMap[game]) MiYouSheUrlMap[game] = []
            MiYouSheUrlMap[game].push(apiMap)
        } else if (type === 'hoyolab') {
            if (!HoYoLabUrlMap[game]) HoYoLabUrlMap[game] = []
            HoYoLabUrlMap[game].push(apiMap)
        } else if (type === 'other') {
            if (!OtherUrlMap[game]) OtherUrlMap[game] = []
            OtherUrlMap[game].push(apiMap)
        }
    }

    getUrlMap(data = {}) {
        if (!this.hoyolab) {
            this.game_biz = MysTool.game_biz[this.game][0]
            return this.getMiYouSheUrlMap(data)
        } else {
            this.game_biz = MysTool.game_biz[this.game][1]
            return this.getHoYoLabUrlMap(data)
        }
    }

    getMiYouSheUrlMap(data: any): ApiInfo {
        const otherUrlMap: ApiInfo = {
            getLtoken: {
                url: `${MysTool.pass_api}account/auth/api/getLTokenBySToken`,
                query: `${data.cookies}`,
                HeaderType: 'noHeader'
            },
            getTokenByGameToken: {
                url: `${MysTool.pass_api}account/ma-cn-session/app/getTokenByGameToken`,
                body: { account_id: parseInt(data.uid), game_token: data.token },
                HeaderType: 'passport'
            },
            getCookieBySToken: {
                url: `${MysTool.web_api}auth/api/getCookieAccountInfoBySToken`,
                query: `game_biz=hk4e_cn&${data.cookies}`,
                HeaderType: 'noHeader'
            },
            getUserGameRolesByCookie: {
                url: `${MysTool.web_api}binding/api/getUserGameRolesByCookie`
            },
            getUserGameRolesByStoken: {
                url: `${MysTool.new_web_api}binding/api/getUserGameRolesByStoken`,
                HeaderType: 'Action'
            },
            getActionTicket: {
                url: `${MysTool.new_web_api}auth/api/getActionTicketBySToken`,
                query: `uid=${this.ltuid}&action_type=game_role`,
                HeaderType: 'Action'
            },
            changeGameRole: {
                url: `${MysTool.new_web_api}binding/api/changeGameRoleByDefault`,
                body: {
                    action_ticket: data.action_ticket,
                    game_biz: data.game_biz,
                    game_uid: data.game_uid,
                    region: data.region,
                    t: Math.round(new Date().getTime() / 1000)
                },
                HeaderType: 'GameRole'
            },
            getUserFullInfo: {
                url: `${MysTool.web_api}user/wapi/getUserFullInfo`,
                query: 'gids=2',
                HeaderType: 'FullInfo'
            },
            getFp: {
                url: `${MysTool.public_data_api}device-fp/api/getFp`,
                body: {
                    seed_id: data.seed_id,
                    device_id: data.deviceId?.toUpperCase(),
                    platform: '1',
                    seed_time: new Date().getTime() + '',
                    ext_fields: `{"proxyStatus":"0","accelerometer":"-0.159515x-0.830887x-0.682495","ramCapacity":"3746","IDFV":"${data.deviceId?.toUpperCase()}","gyroscope":"-0.191951x-0.112927x0.632637","isJailBreak":"0","model":"iPhone12,5","ramRemain":"115","chargeStatus":"1","networkType":"WIFI","vendor":"--","osVersion":"17.0.2","batteryStatus":"50","screenSize":"414×896","cpuCores":"6","appMemory":"55","romCapacity":"488153","romRemain":"157348","cpuType":"CPU_TYPE_ARM64","magnetometer":"-84.426331x-89.708435x-37.117889"}`,
                    app_name: 'bbs_cn',
                    device_fp: '38d7ee834d1e9'
                }
            },
            fetchQRcode: {
                url: `${MysTool.hk4e_sdk_api}hk4e_cn/combo/panda/qrcode/fetch`,
                body: { app_id: MysTool.app_id, device: data.device },
                HeaderType: 'noHeader'
            },
            queryQRcode: {
                url: `${MysTool.hk4e_sdk_api}hk4e_cn/combo/panda/qrcode/query`,
                body: { app_id: MysTool.app_id, device: data.device, ticket: data.ticket },
                HeaderType: 'noHeader'
            },
            miyolive_index: {
                url: `${MysTool.web_api}event/miyolive/index`,
                HeaderType: 'noHeader',
                header: { 'x-rpc-act_id': data.actid }
            },
            miyolive_code: {
                url: `${MysTool.static_api}event/miyolive/refreshCode`,
                query: `version=${data.code_ver}&time=${Math.floor(Date.now() / 1000)}`,
                HeaderType: 'noHeader',
                header: { 'x-rpc-act_id': data.actid }
            },
            miyolive_actId: {
                url: `${MysTool.web_api}painter/api/user_instant/list`,
                query: `offset=0&size=20&uid=${this.uid}`,
                HeaderType: 'noHeader',
            },
            authKey: {
                url: `${MysTool.web_api}binding/api/genAuthKey`,
                body: {
                    auth_appid: data.auth_appid ?? 'webview_gacha',
                    game_biz: this.game_biz,
                    game_uid: Number(this.uid),
                    region: this.server,
                },
                HeaderType: 'authKey'
            }
        }
        return { ...this.MiYouSheUrlMap(data), ...otherUrlMap, ...this.OtherUrlMap(data) }
    }

    getHoYoLabUrlMap(data: any): ApiInfo {
        const otherUrlMap: ApiInfo = {
            getCookieBySToken: {
                url: `${MysTool.os_web_api}auth/api/getCookieAccountInfoBySToken`,
                query: `game_biz=hk4e_global&${data.cookies}`,
                HeaderType: 'noHeader'
            },
            getUserGameRolesByCookie: {
                url: `${MysTool.os_web_api}binding/api/getUserGameRolesByCookie`
            },
            getFp: {
                url: `${MysTool.os_public_data_api}device-fp/api/getFp`,
                body: {
                    seed_id: data.seed_id,
                    device_id: data.deviceId?.toUpperCase(),
                    platform: '5',
                    seed_time: new Date().getTime() + '',
                    ext_fields: `{"userAgent":"Mozilla/5.0 (Linux; Android 11; J9110 Build/55.2.A.4.332; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/124.0.6367.179 Mobile Safari/537.36 miHoYoBBSOversea/2.55.0","browserScreenSize":"387904","maxTouchPoints":"5","isTouchSupported":"1","browserLanguage":"zh-CN","browserPlat":"Linux aarch64","browserTimeZone":"Asia/Shanghai","webGlRender":"Adreno (TM) 640","webGlVendor":"Qualcomm","numOfPlugins":"0","listOfPlugins":"unknown","screenRatio":"2.625","deviceMemory":"4","hardwareConcurrency":"8","cpuClass":"unknown","ifNotTrack":"unknown","ifAdBlock":"0","hasLiedLanguage":"0","hasLiedResolution":"1","hasLiedOs":"0","hasLiedBrowser":"0","canvas":"${MysUtil.getSeedId(64)}","webDriver":"0","colorDepth":"24","pixelRatio":"2.625","packageName":"unknown","packageVersion":"2.27.0","webgl":"${MysUtil.getSeedId(64)}"}`,
                    app_name: this.game_biz,
                    device_fp: '38d7f2364db95'
                }
            },
            authKey: {
                url: `${MysTool.os_web_api}binding/api/genAuthKey`,
                body: {
                    auth_appid: data.auth_appid ?? 'webview_gacha',
                    game_biz: this.game_biz,
                    game_uid: Number(this.uid),
                    region: this.server,
                },
                HeaderType: 'authKey'
            }
        }

        return { ...this.HoYoLabUrlMap(data), ...otherUrlMap, ...this.OtherUrlMap(data) }
    }
}
