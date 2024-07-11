import { MysInfo, MysUtil } from '#MysTool/mys'
import { Character } from '#MysTool/profile'
import { handler, karin, logger } from 'node-karin'

const reg = `(${Object.values(MysUtil.reg).join('|')}?)`
export const profile_detal = karin.command(
  /^#*(?!.*(访问|不支持|更新))([^#]+)\s*(详细|详情|面板|面版|圣遗物|伤害([1-9]+\d*)?)\s*((18|[1-9])[0-9]{8})*(.*[换变改].*)?$/i,
  async (e) => {
    const name = (e.msg.match(new RegExp(`^${reg.replace(/\(/g, '(?:')}([^]+)\\s*(详细|详情|面板|面版|圣遗物|伤害([1-9]+\\d*)?)\\s*(\\d{9,10})*(.*[换变改].*)?$`))?.[1])?.trim()
    if (!name) return false

    const game = MysUtil.getGameByMsg(e.msg)

    const char = Character.get(name, game.key)
    if (!char) {
      logger.info(`MysTool: 暂不支持查询${name}的角色面板`)
      return false
    }

    const uid = await new MysInfo(e).getUid()
    if (!uid) return true

    const key = `mys.${char.game}.profile`
    if (handler.has(key)) {
      return await handler.call(key, {
        e, uid, profile: {
          id: char.id,
          name: char.name,
          elem: char.elem,
          dmgIdx: ((/伤害(\d*)$/.exec(e.msg))?.[1] || 0) * 1
        }
      })
    }
    return false
  },
  { name: '角色面板', log: false, priority: 0 }
)
