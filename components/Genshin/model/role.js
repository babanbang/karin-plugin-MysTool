import { Base, Cfg } from '#Mys.tool'
import { MysInfo } from '#Mys.api'
import { Player } from '#Mys.rank'
import { common } from '#Karin'
import _ from 'lodash'

export default class Role extends Base {
  constructor (e) {
    super(e, 'gs')
    this.model = 'role/rolelist'
    this.lable = Cfg.getdefSet('lable', 'gs')
  }

  async roleList (refreshTalent = false) {
    const res = await MysInfo.get(this.e, 'character')
    if (res?.retcode !== 0) return false

    const player = new Player(this.e.MysUid, 'gs')
    player.setBasicData(res.data.role, true)

    const list = {
      avatars: res.data.avatars
    }

    if (this.e.HasMysCk && refreshTalent) {
      this.e.reply('正在刷新天赋数据，请稍等...')
      await this.skillData(list.avatars, player)
    } else if (!this.e.HasMysCk && refreshTalent) {
      this.e.reply('未绑定Cookie，无法刷新天赋数据')
      return false
    }

    // todo 圣遗物使用面板数据
    list.avatars.forEach((v, idx) => {
      delete list.avatars[idx].constellations

      const avatar = player.getAvatar(v.id, true)
      if (!avatar) return

      list.avatars[idx].cons = v.actived_constellation_num
      list.avatars[idx].imgs = avatar.char.getImgs(v.costumes?.[0]?.id)
      list.avatars[idx].weaponType = avatar.char.weaponType
      list.avatars[idx].elem = avatar.char.elem
      list.avatars[idx].talent = avatar.talent
    })

    return await this.renderImg({
      ...list,
      role: {
        ...res.data.role,
        face: player.face
      },
      uid: this.e.MysUid,
      version: this.lable.version
    }, { Scale: true })
  }

  /** @param {Player} player */
  async skillData (avatars, player = '') {
    logger.mark(`[${this.game}][${this.e.MysUid}]刷新天赋数据`)
    if (!player) player = new Player(this.e.MysUid, 'gs')

    const ids = _.chunk(avatars.map(v => {
      return ['detail', { avatar_id: v.id }]
    }), 10)

    const skillList = []
    for (const id of ids) {
      skillList.push(...await MysInfo.get(this.e, id, { log: false, cached: true, cacheCd: 1800 }))
      await common.sleep(50 + Math.random() * 150)
    }

    _.remove(skillList, function (v) {
      return v?.retcode !== 0
    })

    avatars.forEach((v, idx) => {
      delete avatars[idx].constellations

      const talent = {}
      const avatar = player.getAvatar(v.id, true)
      if (!avatar) return

      const skill = skillList.find(i => i.reqData.avatar_id === v.id)
      const talents = _.orderBy(skill.data.skill_list, ['id'], ['desc'])

      /** 这样并不是最合适的 */
      for (const { max_level, level_current, name } of talents) {
        if (max_level < 10) continue
        if (name.includes('普通攻击')) {
          talent.a = level_current
          continue
        }
        if (!talent.q) {
          talent.q = level_current
          continue
        }
        if (!talent.e) {
          talent.e = level_current
        }
        if (talent.a && talent.e && talent.q) break
      }
      avatars[idx].talent = talent
      avatars[idx].cons = v.actived_constellation_num
      avatar.setAvatar(avatars[idx], 'mys')
    })
    player.save()
  }
}
