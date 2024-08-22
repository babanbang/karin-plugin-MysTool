import { DailyCache } from "@/user"
import { KarinMessage, handler, logger } from "node-karin"
import { MysReq } from "./MysReq"
import { GameList } from "@/types"

type MysApi<ReturnType, ReqData> = (mysReq: MysReq<GameList>, reqData?: ReqData) => Promise<ReturnType | undefined>

export interface BaseMysResData {
    retcode: number
    message: string
}

export type defineApi<ReqData> = {
    urlKey: string,
    url: (mysReq: MysReq<GameList>, reqData: ReqData) => string,
    query?: (mysReq: MysReq<GameList>, reqData: ReqData) => string,
    body?: (mysReq: MysReq<GameList>, reqData: ReqData) => any,
    header: (mysReq: MysReq<GameList>, options?: { q?: string, b?: any, reqData?: ReqData }) => Record<string, any>,
    noFp?: boolean
}

export function defineMysApi<
    ReturnType extends Record<string, any> | undefined,
    ReqData extends Partial<Record<string, any>> = {}
>(
    Api: defineApi<ReqData>,
    CheckCode = false,
    stoken = false
): MysApi<ReturnType, ReqData> {
    return async (mysReq: MysReq<GameList>, reqData: ReqData = {} as ReqData, e?: KarinMessage & { isTask: boolean }) => {
        let result = await mysReq.getData<ReturnType, ReqData>(Api, reqData)

        if (result && CheckCode) {
            result = await checkRetCode(result, reqData, Api, mysReq, stoken, e)
        }

        return result
    }
}

export async function checkRetCode<
    ReqData extends Partial<Record<string, any>> = {}
>(res: any, req: ReqData, ApiInfo: defineApi<ReqData>, mysReq: MysReq<GameList>, stoken: boolean, e?: KarinMessage & { isTask: boolean }) {
    const { uid, game, mysUserInfo } = mysReq

    const err = (msg: string) => {
        if (!e?.isTask && e?.reply) {
            e.reply(msg, { at: true })
        }
    }

    switch (res.retcode) {
        case 0:
            break
        case -1:
        case -100:
        case 1001:
        case 10001:
        case 10103:
            if (/(登录|login)/i.test(res.message)) {
                if (mysUserInfo?.owner) {
                    logger.mark(`[${stoken ? 'Stoken' : 'Cookie'}失效][uid:${uid}][qq:${mysUserInfo!.user_id}]`)
                    err(`UID:${uid}，米游社${stoken ? 'Stoken' : 'Cookie'}已失效`)
                } else {
                    logger.mark(`[公共ck失效][ltuid:${mysUserInfo?.ltuid}]`)
                    await DailyCache.Disable(mysUserInfo!.ltuid!, game)
                    err(`UID:${uid}，米游社查询失败，请稍后再试或绑定Cookie`)
                }
            } else {
                err(`UID:${uid}，米游社接口报错，暂时无法查询：${res.message}`)
            }
            break
        case 1008:
            err(`UID:${uid}，请先去米游社绑定角色`)
            break
        case 10101:
            await DailyCache.Disable(mysUserInfo!.ltuid!, game)
            err(`UID:${uid}，查询已达今日上限`)
            break
        case 10102:
            if (res.message === 'Data is not public for the user') {
                err(`UID:${uid}，米游社数据未公开`)
            } else {
                err(`UID:${uid}，请先去米游社绑定角色`)
            }
            break
        // 伙伴不存在~
        case -1002:
            if (ApiInfo.urlKey === 'detail') res.retcode = 0
            break
        case 1034:
        case 5003:
        case 10035:
        case 10041:
            if (handler.has('mys.req.validate')) {
                logger.mark(`[米游社查询][uid:${uid}][user_id:${e?.user_id}] 遇到验证码，尝试调用 Handler mys.req.validate`)
                res = await handler.call('mys.req.validate', { e, ApiInfo, res, req }) || res
            }

            if (res?.retcode !== 0 && res?.retcode !== 10103) {
                logger.mark(`[米游社查询失败][uid:${uid}][user_id:${e?.user_id}] 遇到验证码`)
                if ([5003, 10041].includes(res.retcode)) {
                    err(`UID:${uid}，米游社账号异常，暂时无法查询`)
                    break
                }
                err(`UID:${uid}，米游社查询遇到验证码，请稍后再试`)
            }
            break
        case 10307:
            err(`UID:${uid}，版本更新期间，数据维护中`)
            break
        default:
            err(`UID:${uid}，米游社接口报错，暂时无法查询：${res.message || 'error'}`)
            break
    }

    if (res.retcode !== 0) {
        logger.error(`[mys接口报错]${JSON.stringify(res)}，uid：${uid}`)
    }

    // 添加请求记录
    if (res.retcode === 0 && !mysUserInfo?.owner) {
        await DailyCache.addCache(mysUserInfo!.ltuid!, game)
    }

    return res
}