import { MysUser, BaseModel } from "#MysTool/user"
import { Cfg, Data, PluginName } from "#MysTool/utils"
import { Update } from '#Karin'
import _ from "lodash"

let cache = false
let updatePlugins = {}
const _path = process.cwd().replace(/\\/g, '/')

const set = Cfg.getConfig('set')
const folders = Data.readdir('lib/components').filter(p => Data.isDirectory(`lib/components/${p}`))
const plugins = set.plugins?.length > 0
  ? set.plugins.filter(p => folders.includes(p))
  : folders
const MysTools = [PluginName, ...plugins.map(p => `${PluginName}/lib/components/${p}`)]

export default async function (fastify, options) {
  fastify.get('/UserStats', async (request, reply) => {
    if (cache) {
      return reply.send({
        status: 'success',
        data: cache
      });
    }

    cache = {
      ck_sk: {
        ck: { mys: 0, hoyolab: 0, all: 0, type: 'cookie', color: 'secondary', text: 'text-primary' },
        sk: { mys: 0, hoyolab: 0, all: 0, type: 'stoken', color: 'teal', text: 'text-warning' }
      },
      dialect: BaseModel.DIALECT
    }

    /**@param {MysUser} mys */
    const dealData = (mys) => {
      for (let i in cache.ck_sk) {
        if (mys[i]) {
          cache.ck_sk[i][mys.type]++
          cache.ck_sk[i].all++
        }
      }
    }

    await MysUser.forEach(dealData)

    /** 缓存一分钟 */
    setTimeout(() => {
      cache = false
    }, 60000)

    return reply.send({
      status: 'success',
      data: cache
    });
  });

  fastify.get('/checkUpdate', async (request, reply) => {
    if (!_.isEmpty(updatePlugins)) {
      return reply.send({
        status: 'success',
        data: updatePlugins
      })
    }
    const reg = new RegExp(`^(${PluginName}\/lib\/components\/|karin\-plugin\-)`)

    const promises = MysTools.map(async plugin => {
      const path = `${_path}/plugins/${plugin}`
      try {
        const time = await Update.getTime(path)
        const { data } = await Update.checkUpdate(path)

        let up = false
        let err = /获取时间失败/g.test(time)
        if (data) {
          if (/(unable\s+to\s+access|执行超时|该路径不是一个git仓库|路径不存在)/g.test(data)) {
            err = true
          } else {
            up = true
          }
        }

        updatePlugins[plugin.replace(reg, '')] = { time, up, err }
      } catch (error) {
        updatePlugins[plugin.replace(reg, '')] = { time: '查询失败！', up: false, err: true }
      }
    })
    await Promise.all(promises)

    /** 缓存一分钟 */
    setTimeout(() => {
      updatePlugins = {}
    }, 600000)

    return reply.send({
      status: 'success',
      data: updatePlugins
    })
  })

  fastify.post('/update', async (request, reply) => {
    updatePlugins = {}

    const { force } = request.body
    const msg = []
    let cmd = force ? 'git reset --hard && git pull --allow-unrelated-histories' : 'git pull'
    try {
      const { data } = await Update.update(process.cwd(), cmd)
      msg.push(`Karin：${data}`)
    } catch (error) {
      msg.push(`Karin：${error.message}`)
    }
    const promises = MysTools.map(async name => {
      /** 拼接路径 */
      const item = _path + `/plugins/${name}`
      try {
        const { data } = await Update.update(item, cmd)
        msg.push(`${name}：${data}`)
      } catch (error) {
        msg.push(`${name}：${error.message}`)
      }
    })
    await Promise.all(promises)
    reply.send({
      status: 'success',
      data: msg
    })
  })
}