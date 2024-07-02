import { MysUtil } from '#MysTool/mys'
import { Character, Weapon } from '#MysTool/profile'
import { handler, karin } from 'node-karin'
import lodash from 'lodash'

const reg = `(${Object.values(MysUtil.reg).join('|')}?)`
/** 养成计算前置处理 */
export const calculator = karin.command(
  new RegExp(`^${reg}(.*)(养成|计算)+\\s*([0-9a-c,， .\\-|]*)$`, 'i'),
  async (e) => {
    const match = e.msg?.match(new RegExp(`^${reg.replace(/\(/g, '(?:')}([^${reg}]+?)\\s*(养成|计算)+\\s*([0-9a-z,， .\\-|]*)$`, 'i'))

    let game = MysUtil.getGameByMsg(e.msg).key
    const name = match?.[1]?.replace?.(/养成|计算/g, ' ')?.trim?.()
    if (!name) {
      const key = `mys.${game}.calculator.help`
      if (handler.has(key)) {
        return await handler.call(key, { e })
      }
      return false
    }

    const names = name.replace(/,|，| |\./g, ',').split(',')
    const sets = lodash.compact(match[3]?.replace?.(/,|，| |\./g, ',')?.split?.('|') ?? [])
    const calculator = {
      roles: [],
      weapons: [],
      set: sets.map(i => lodash.compact(i.split(',') ?? []).map(v => v.split('-')))
    }

    const roles = []
    const weapons = []
    let next = false
    for (const idx in names) {
      if (next) {
        next = false
        continue
      }
      const role = Character.get(names[idx])
      if (!role) {
        roles.push('')
        MysUtil.eachGame((game) => {
          const w = Weapon.get(names[idx], game)
          weapons.push(w || '')
        })
      } else {
        if (!game) game = role.game
        roles.push(role)
        const w = Weapon.get(names[Number(idx) + 1], game)
        if (w) next = true
        weapons.push(w || '')
      }
    }

    const useNames = []
    if (roles.length > 0) {
      weapons.forEach((w, i) => {
        if (w?.game !== game) weapons[i] = ''
      })
      const useWeapon = []
      roles.forEach((role, idx) => {
        if (role?.game === game) {
          useWeapon.push(weapons[idx])
          calculator.roles.push([role, weapons[idx]])
        }
      })
      lodash.pull(weapons, ...useWeapon)
      lodash.compact(weapons)

      calculator.roles = calculator.roles.slice(0, 8)
      for (const i in calculator.roles) {
        let [role, weapon] = calculator.roles[i]
        if (!weapon && weapons.length > 0) {
          weapon = weapons[0]
          delete weapons[0]
        }
        useNames.push((role?.name || '') + '-' + (weapon?.name || ''))
      }
    } else if (weapons.length > 0) {
      game = weapons[0]?.game
      calculator.weapons = (weapons.filter(w => w.game === game).map(w => ['', w])).slice(0, 8)
      calculator.weapons.forEach(([role, weapon]) => {
        useNames.push(weapon.name)
      })
    } else {
      e.reply(`养成计算暂不支持【${names.join('、')}】，请确保输入的角色或武器名正确。`)
      return true
    }

    const key = `mys.${game}.calculator`
    if (handler.has(key)) {
      logger.info('养成计算' + `(${useNames.join('、')})`)
      return await handler.call(key, { e, calculator })
    }
    return false
  },
  { log: false, priority: 0 }
)