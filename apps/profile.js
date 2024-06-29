import { plugin, handler, logger } from '#Karin'
import { MysInfo, MysUtil } from '#MysTool/mys'
import { Character } from '#MysTool/profile'

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
          reg: /^#*(?!.*(访问|不支持|更新))([^#]+)\s*(详细|详情|面板|面版|圣遗物|伤害([1-9]+\d*)?)\s*((18|[1-9])[0-9]{8})*(.*[换变改].*)?$/i,
          fnc: 'profile_detal',
          log: false
        }
      ]
    })
  }

  async profile_detal () {
    const name = (this.e.msg?.match(new RegExp(`^${reg.replace(/\(/g, '(?:')}([^${reg}]+)\\s*(详细|详情|面板|面版|圣遗物|伤害([1-9]+\\d*)?)\\s*(\\d{9,10})*(.*[换变改].*)?$`))?.[1])?.trim()
    if (!name) return false

    const char = Character.get(name)
    if (!char) {
      logger.info(`MysTool: 暂不支持查询${name}的角色面板`)
      return false
    }

    this.e.msg = this.e.msg?.replace(new RegExp('^' + reg, 'i'), '#' + char.game)
    this.e.MysUid = await new MysInfo(this.e).getUid()
    if (!this.e.MysUid) return true

    const key = `mys.${char.game}.profile`
    if (handler.has(key)) {
      return await handler.call(key, {
        e: this.e, profile: {
          name: char.name,
          dmgIdx: ((/伤害(\d*)$/.exec(this.e.msg))?.[1] || 0) * 1
        }
      })
    }
    return false
  }
}
