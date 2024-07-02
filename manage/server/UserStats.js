import { BaseModel, MysUser } from "#MysTool/user"
import { Data, PluginName } from "#MysTool/utils"
import lodash from 'lodash'
import { Update } from 'node-karin'

let updatePlugins = {}
const _path = process.cwd().replace(/\\/g, '/')
const reg = new RegExp(`^(${PluginName}\/lib\/components\/|karin\-plugin\-)`)

const MysTools = [
  PluginName,
  ...Data.readdir('lib/components')
    .filter(p => Data.exists(`lib/components/${p}/index.js`))
    .map(p => `${PluginName}/lib/components/${p}`)
]

export default async function (fastify, options) {
  fastify.get('/MysTools', async (request, reply) => {
    return reply.send({
      status: 'success',
      data: MysTools.map(p => p.replace(reg, ''))
    })
  })

  fastify.get('/UserStats', async (request, reply) => {
    const Stats = {
      ck_sk: {
        ck: { mys: 0, hoyolab: 0, all: 0, type: 'cookie', color: 'secondary', text: 'text-primary' },
        sk: { mys: 0, hoyolab: 0, all: 0, type: 'stoken', color: 'teal', text: 'text-warning' }
      },
      dialect: BaseModel.DIALECT,
      MysTools: MysTools.map(p => p.replace(reg, ''))
    }

    /**@param {MysUser} mys */
    const dealData = (mys) => {
      for (let i in Stats.ck_sk) {
        if (mys[i]) {
          Stats.ck_sk[i][mys.type]++
          Stats.ck_sk[i].all++
        }
      }
    }

    await MysUser.forEach(dealData)

    return reply.send({
      status: 'success',
      data: Stats
    })
  })

  let updateTimeout = false
  fastify.post('/checkUpdate', async (request, reply) => {
    const { force } = request.body

    if (!force && !lodash.isEmpty(updatePlugins)) {
      return reply.send({
        status: 'success',
        data: updatePlugins
      })
    }

    if (updateTimeout) {
      clearTimeout(updateTimeout)
      updateTimeout = false
    }

    const promises = MysTools.map(async plugin => {
      const path = `${_path}/plugins/${plugin}`
      try {
        const time = await Update.getTime(path)
        const { data } = await Update.checkUpdate(path, 10)

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

    /** 缓存十分钟 */
    updateTimeout = setTimeout(() => {
      updatePlugins = {}
    }, 600000)

    return reply.send({
      status: 'success',
      data: updatePlugins
    })
  })

  fastify.post('/update', async (request, reply) => {
    if (updateTimeout) {
      clearTimeout(updateTimeout)
      updateTimeout = false
    }
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

    return reply.send({
      status: 'success',
      data: msg
    })
  })
}