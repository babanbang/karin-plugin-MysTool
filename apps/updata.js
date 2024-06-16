import { Update, plugin } from '#Karin'
import { PluginName, common, dirPath } from '#MysTool/utils'
import fs from 'fs'
import _ from 'lodash'

let uping = false
const compath = dirPath + '/components/'
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
    let cm = ''
    if (this.e.msg.includes('强制')) {
      this.isUp = true
      cm = 'git reset --hard master&& git pull --rebase'
    }

    let msgs = []
    const pname = PluginName.replace(/^karin-plugin-/, '')
    const paths = [pname, ...folders.map(f => pname + '/components/' + f)]

    const updata = new Update()
    for (const name of paths) {
      logger.info(`开始更新${name}`)

      const msg = [`更新${name}...`]
      const { data } = await updata.update(name, cm)
      if (_.isObject(data)) {
        msg.push(data.message + data.stderr)
      } else {
        msg.push(data)
        if (data === '更新成功！') {
          this.isUp = true
        }
      }
      msgs.push([msg])
    }

    if (msgs.length > 1) {
      msgs = common.makeForward(msgs)
    }

    await this.reply(msgs)
    if (this.isUp) {
      this.reply('MysTool更新成功，请重启应用更新！')
    }

    uping = false
    return true
  }
}
