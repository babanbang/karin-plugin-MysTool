import { Update, plugin, common } from '#Karin'
import { PluginName, dirPath } from '#MysTool/utils'
import fs from 'fs'
import _ from 'lodash'

let uping = false
const compath = dirPath + '/lib/components/'
export class MysToolUpdata extends plugin {
  constructor () {
    super({
      name: 'MysTool更新',
      dsc: '',
      event: 'message',
      priority: 0,
      rule: [
        {
          reg: '^#?(强制)?更新MysTool',
          permission: 'master',
          fnc: 'Updata'
        }
      ]
    })
  }

  async Updata () {
    if (uping) {
      this.reply('正在更新MysTool，请稍后...')
      return false
    }
    uping = true
    setTimeout(() => { uping = false }, 300 * 1000)

    const filesAndFolders = fs.readdirSync(compath)
    const folders = filesAndFolders.filter(item => {
      return fs.statSync(compath + item).isDirectory()
    })
    let cm = 'git pull'
    if (this.e.msg.includes('强制')) {
      this.isUp = true
      cm = 'git reset --hard && git pull --allow-unrelated-histories'
    }

    let msgs = []
    const paths = [PluginName, ...folders.map(f => PluginName + '/lib/components/' + f)]

    for (const name of paths) {
      logger.info(`开始更新${name}`)

      const msg = [`更新${name}...`]
      const { data } = await Update.update(process.cwd().replace(/\\/g, '/') + `/plugins/${name}`, cm)

      if (_.isObject(data)) {
        msg.push((data.message || '') + (data.stderr || ''))
      } else {
        msg.push(data)
        if (data === '更新成功！') {
          this.isUp = true
        }
      }
      msgs.push(msg)
    }

    if (msgs.length > 1) {
      msgs = common.makeForward(msgs)
    }

    await this.replyForward(msgs)
    if (this.isUp) {
      this.reply('MysTool更新成功，请重启应用更新！')
    }

    uping = false
    return true
  }
}
