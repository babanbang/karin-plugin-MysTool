import { MysUtil } from '@/mys'
import { DailyCacheDBCOLUMNS, GameList } from '@/types'
import { DbBaseModel, sequelize } from './BaseModel'
const { Types, Column } = DbBaseModel

const COLUMNS = {
    [DailyCacheDBCOLUMNS['ltuid']]: {
        type: Types.STRING,
        primaryKey: true
    },
    [DailyCacheDBCOLUMNS['gs']]: Column('INTEGER', 0),
    [DailyCacheDBCOLUMNS['sr']]: Column('INTEGER', 0),
    [DailyCacheDBCOLUMNS['zzz']]: Column('INTEGER', 0),
    [DailyCacheDBCOLUMNS['expireTime']]: Column('INTEGER')
}

export class DailyCacheDB extends DbBaseModel {
    /** 米游社ID */
    [DailyCacheDBCOLUMNS.ltuid]!: string
    /** 原神今日查询次数 */
    [DailyCacheDBCOLUMNS.gs]!: number
    /**崩坏：星穹铁道今日查询次数 */
    [DailyCacheDBCOLUMNS.sr]!: number
    /** 绝区零今日查询次数 */
    [DailyCacheDBCOLUMNS.zzz]!: number
    /** 过期时间 */
    [DailyCacheDBCOLUMNS.expireTime]!: number

    static COLUMNS = COLUMNS

    static async zAdd(options: {
        ltuid: string,
        game?: GameList,
        count?: number,
        expireTime?: number
    }) {
        const { ltuid, game = GameList.Gs, count = 1, expireTime } = options
        const DailyCache = await DailyCacheDB.findByPk(ltuid)
        const key = DailyCacheDBCOLUMNS[game]
        const Catch = {
            [DailyCacheDBCOLUMNS.gs]: 0,
            [DailyCacheDBCOLUMNS.sr]: 0,
            [DailyCacheDBCOLUMNS.zzz]: 0,
            expireTime
        }

        if (DailyCache) {
            if (expireTime === DailyCache[DailyCacheDBCOLUMNS.expireTime]) return true

            DailyCache.update(expireTime ? Catch : {
                [key]: sequelize.literal(`${key} + ${count}`)
            })
        } else {
            DailyCacheDB.build({
                ltuid, ...Catch, ...expireTime ? {} : {
                    [key]: count, expireTime: MysUtil.getEndOfDay()
                }
            })
        }
        return true
    }

    static async zRem(ltuid: string) {
        const DailyCache = await DailyCacheDB.findByPk(ltuid)
        if (DailyCache) {
            DailyCache.destroy()
        }
        return true
    }

    static async zMin(game: GameList): Promise<DailyCacheDB | undefined> {
        const minCountRecord = await DailyCacheDB.findAll({
            order: [[DailyCacheDBCOLUMNS[game], 'ASC']],
            limit: 1
        })
        return minCountRecord[0]
    }
}

DbBaseModel.initDB(DailyCacheDB, COLUMNS)
await DailyCacheDB.sync()
