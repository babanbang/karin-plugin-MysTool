import { plugin } from '#Karin'
import { MysInfo, MysUtil } from '#Mys.api'
import { Character } from '#Mys.profile'

const reg = `(${Object.values(MysUtil.reg).join('|')}?)`
export class profileReplace extends plugin {
  constructor () {
    super({
      name: '角色面板',
      dsc: '',
      event: 'message',
      priority: 0,
      rule: [
        {
          reg: /^#*([^#]+)\s*(详细|详情|面板|面版|圣遗物|伤害([1-9]+\d*)?)\s*((18|[1-9])[0-9]{8})*(.*[换变改].*)?$/i,
          fnc: 'Replace',
          log: false
        }
      ]
    })
  }

  async Replace () {
    const name = (this.e.msg?.match(new RegExp(`^${reg.replace(/\(/g, '(?:')}([^${reg}]+)\\s*(详细|详情|面板|面版|圣遗物|伤害([1-9]+\\d*)?)\\s*(\\d{9,10})*(.*[换变改].*)?$`))?.[1])?.trim()
    if (!name || /更新/g.test(this.e.msg)) return false

    const char = Character.get(name)
    if (!char) {
      this.reply(`暂不支持查询${name}的角色面板`)
      return true
    }

    this.e.msg = this.e.msg?.replace(new RegExp('^' + reg, 'i'), '#' + char.game)
    this.e.MysUid = await new MysInfo(this.e).getUid()
    if (!this.e.MysUid) return true

    this.e._profile = {
      name: char.name,
      dmgIdx: ((/伤害(\d*)$/.exec(this.e.msg))?.[1] || 0) * 1
    }
    return false
  }
}
