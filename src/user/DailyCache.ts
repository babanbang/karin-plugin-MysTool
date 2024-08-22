import { MysUtil } from '@/mys'
import { DailyCacheDBCOLUMNS, GameList } from '@/types'
import { logger } from 'node-karin'
import { DailyCacheDB, MysUserDB } from './db'

let initCache = false
export class DailyCache {
    static async init(ltuid?: string) {
        if (initCache) return true
        initCache = true

        try {
            const expireTime = MysUtil.getEndOfDay()

            if (ltuid) {
                DailyCacheDB.zAdd({ ltuid, expireTime })
            } else {
                const Cache = await DailyCacheDB.zMin(GameList.Gs)
                if (Cache?.[DailyCacheDBCOLUMNS.expireTime] === expireTime) return true

                const dbs = await MysUserDB.findAll()
                dbs.forEach(db => {
                    if (db.cookie) {
                        DailyCacheDB.zAdd({
                            ltuid: db.ltuid, expireTime
                        })
                    } else {
                        DailyCacheDB.zRem(db.ltuid)
                    }
                })
            }
        } catch (error) {
            logger.error('加载公共cookie赤失败：' + error)
        }

        initCache = false
        return true
    }

    /** 获取查询次数最少的米游社ID */
    static async getLtuid(game: GameList) {
        return (await DailyCacheDB.zMin(game))?.ltuid
    }

    /** 增加对应ltuid查询次数 */
    static async addCache(ltuid: string, game: GameList) {
        return await DailyCacheDB.zAdd({ ltuid, game })
    }

    /** 删除对应ltuid查询次数 */
    static async delCache(ltuid: string) {
        return await DailyCacheDB.zRem(ltuid)
    }

    /** 超出请求次数 */
    static async Disable(ltuid: string, game: GameList) {
        return await DailyCacheDB.zAdd({ ltuid, game, count: 9999 })
    }
}

DailyCache.init()