import { MysReq } from "./MysReq"

type MysApi<ReturnType, ReqData> = (mysReq: MysReq, reqData: ReqData) => Promise<ReturnType>

export interface BaseMysResData {
    retcode: number
    data: unknown
    message?: string
}

export type defineApi<ReqData> = {
    urlKey: string,
    url: (mysReq: MysReq, reqData: ReqData) => string,
    query?: (mysReq: MysReq, reqData: ReqData) => string,
    body?: (mysReq: MysReq, reqData: ReqData) => unknown,
    header: (mysReq: MysReq, options?: { q?: string, b?: unknown, reqData?: ReqData }) => Record<string, unknown>,
    dealRes?: <ReturnType = undefined>(res: any) => Promise<ReturnType>,
    noFp?: boolean
}

export function defineMysApi<
    ReturnType = undefined,
    ReqData extends Partial<Record<string, unknown>> = {}
>(
    Api: defineApi<ReqData>,
    CheckCode: boolean = false
): MysApi<ReturnType, ReqData> {
    return async (mysReq: MysReq, reqData: ReqData) => {
        let result = await mysReq.getData<ReturnType, ReqData>(Api, reqData)

        if (CheckCode) {

        }

        return await Api.dealRes?.(result) || result
    }
}