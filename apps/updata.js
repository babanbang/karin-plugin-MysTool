import { Data, PluginName } from '#MysTool/utils'
import lodash from 'lodash'
import { Update, common, karin } from 'node-karin'

let uping = false

export const MysToolUpdata = karin.command(
  new RegExp('^#?(强制)?更新MysTool', 'i'),
  async (e) => {
    if (uping) {
      e.reply('正在更新MysTool，请稍后...')
      return true
    }

    let isUp = false
    uping = true
    setTimeout(() => { uping = false }, 300 * 1000)

    const folders = Data.readdir('/lib/components/').filter(item => {
      return Data.exists(`lib/components/${item}/index.js`)
    })

    let cm = 'git pull'
    if (e.msg.includes('强制')) {
      isUp = true
      cm = 'git reset --hard && git pull --allow-unrelated-histories'
    }

    const msgs = []
    const paths = [PluginName, ...folders.map(f => PluginName + '/lib/components/' + f)]

    for (const name of paths) {
      logger.info(`开始更新${name}`)

      const msg = [`更新${name}...`]
      const { data } = await Update.update(process.cwd().replace(/\\/g, '/') + `/plugins/${name}`, cm, 60)
      if (lodash.isObject(data)) {
        msg.push(`${data.message}  ${data.stderr}`)
      } else {
        msg.push(data)
        if (data === '更新成功！') isUp = true
      }
      msgs.push(msg)
    }

    await e.bot.sendForwardMessage(e.contact, common.makeForward(msgs))
    if (isUp) e.reply('MysTool更新成功，请重启应用更新！')

    uping = false
    return true
  },
  { name: 'MysTool更新', permission: 'master', priority: 0 }
)
