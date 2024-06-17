import { redis } from '#Karin'
import moment from 'moment'
import base from './base.js'
import { MysUtil } from '#MysTool/mys'
import MysUserDB from './db/MysUserDB.js'

const CacheLtuid = []
export class DailyCache extends base {
  constructor (uid, game = '') {
    super(game)
    const storeKey = `${moment().format('MM-DD')}:${MysUtil.getServ(uid)}:${this.game}`
    this.keyPre = `${this.redisPrefix}ltuid-cache:${storeKey}`
    this.initCache()
  }

  static create (uid, game) {
    return new DailyCache(uid, game)
  }

  async initCache () {
    const exists = await redis.exists(this.keyPre)
    if (exists === 1) return true

    const all = []
    const dbs = await MysUserDB.findAll()
    dbs.forEach(async db => {
      if (db.cookie) {
        CacheLtuid.push(db.ltuid)
        all.push(redis.zAdd(this.keyPre, { score: 0, value: String(db.ltuid) }))
      }
    })
    await Promise.all(all)
    await this.expire(this.keyPre)
  }

  /** 设置过期时间 */
  async expire (key) {
    await redis.expire(key, MysUtil.getEndOfDay())
  }

  /** 该ltuid查询次数+1 */
  static async Add (ltuid, uid, game) {
    if (!ltuid) return false

    const Cache = new DailyCache(uid, game)
    await redis.zIncrBy(Cache.keyPre, 1, String(ltuid))
  }

  /** 删除记录 */
  async Del (ltuid) {
    await redis.zRem(this.keyPre, String(ltuid))
  }

  /** 获取使用次数最少的ltuid */
  async MinLtuid () {
    const result = await redis.zRangeByScore(this.keyPre, 0, 99)

    return result[0] || ''
  }

  /** 超出请求次数 */
  static async Disable (ltuid, uid, game) {
    const Cache = new DailyCache(uid, game)
    /** 看看每天能查多少次 */
    logger.error(await Cache.Count(ltuid))
    await redis.zAdd(Cache.keyPre, { score: 999, value: String(ltuid) })
  }

  async Count (ltuid) {
    return await redis.zScore(this.keyPre, String(ltuid))
  }
}
