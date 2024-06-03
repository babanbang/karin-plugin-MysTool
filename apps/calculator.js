import { plugin } from '#Karin'
import { common } from '#Mys.tool'
import { MysUtil } from '#Mys.api'
import { Character, Weapon } from '#Mys.profile'
import _ from 'lodash'

const reg = `(${Object.values(MysUtil.reg).join('|')}?)`
export class calculator extends plugin {
  constructor () {
    super({
      name: '养成计算前置处理',
      dsc: '',
      event: 'message',
      priority: 0,
      rule: [
        {
          reg: new RegExp(`^${reg}(.*)(养成|计算)+\\s*([0-9a-c,， .\\-|]*)$`, 'i'),
          fnc: 'Calculator',
          log: false
        }
      ]
    })
  }

  /** 养成计算前置处理 */
  async Calculator () {
    const match = this.e.msg?.match(new RegExp(`^${reg.replace(/\(/g, '(?:')}([^${reg}]+?)\\s*(养成|计算)+\\s*([0-9a-z,， .\\-|]*)$`,'i'))

    const name = match?.[1]?.replace?.(/养成|计算/g, ' ')?.trim?.()
    if (!name) {
      this.e.msg = '#' + MysUtil.getGameByMsg(this.e.msg).key + '养成计算'
      return false
    }

    const names = name.replace(/,|，| |\./g, ',').split(',')
    const sets = _.compact(match[3]?.replace?.(/,|，| |\./g, ',')?.split?.('|') ?? [])
    const calculator = {
      roles: [],
      weapons: [],
      set: sets.map(i => _.compact(i.split(',') ?? []).map(v => v.split('-')))
    }

    let game = ''
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
      const useWeapon = []
      roles.forEach((role, idx) => {
        if (role?.game === game) {
          useWeapon.push(weapons[idx])
          calculator.roles.push([role, weapons[idx]])
        }
      })
      _.pull(weapons, ...useWeapon)
      _.compact(weapons)

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
      this.reply(`养成计算暂不支持【${names.join('、')}】，请确保输入的角色或武器名正确。`)
      return true
    }

    this.e.msg = '#' + game + '养成计算' + `(${useNames.join('、')})`
    this.e.calculator = calculator
    return false
  }
}