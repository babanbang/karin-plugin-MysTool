import { MysUser, BaseModel } from "#MysTool/user"
import { Cfg, Data } from "#MysTool/utils"

let cache = false
export default async function (fastify, options) {
  fastify.get('/UserStats', async (request, reply) => {
    if (cache) {
      return reply.send({
        status: 'success',
        data: cache
      });
    }

    cache = {
      ck_mys: 0,
      sk_mys: 0,
      ck_hoyolab: 0,
      sk_hoyolab: 0,
      dialect: BaseModel.DIALECT
    }
    /**@param {MysUser} mys */
    const dealData = (mys) => {
      if (mys.ck) {
        cache['ck_' + mys.type] += 1
      }
      if (mys.sk) {
        cache['sk_' + mys.type] += 1
      }
    }

    await MysUser.forEach(dealData)
    const set = Cfg.getConfig('set')
    const plugins = Data.readdir('components')
    if (!set.plugins?.length) {
      cache.plugins = plugins
    } else {
      cache.plugins = set.plugins.filter(p => plugins.includes(p))
    }
    cache.plugins = cache.plugins.join('、')

    /** 缓存一分钟 */
    setTimeout(() => {
      cache = false
    }, 60000)

    return reply.send({
      status: 'success',
      data: cache
    });
  });
}