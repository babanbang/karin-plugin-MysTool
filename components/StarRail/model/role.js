import { Base, Cfg } from '#Mys.tool'
import { MysInfo } from '#Mys.api'
import { Player } from '#Mys.rank'
import _ from 'lodash'

export default class Role extends Base {
  constructor (e) {
    super(e, 'sr')
    this.model = 'role/rolelist'
    this.lable = Cfg.getdefSet('lable', 'sr')
  }

  async roleList () {
    const res = await MysInfo.get(this.e, 'character')
    if (res?.retcode !== 0) return false

    const player = new Player(this.e.MysUid, 'sr')
    if (!player.name || !player.level) {
      const ret = await MysInfo.get(this.e, [['index'], ['rogue', { detail: false }]])
      if (!_.every(ret, v => v?.retcode !== 0)) {
        const [index, rogue] = ret
        player.setBasicData({ ...rogue.data.role, face: index.data.cur_head_icon_url }, true)
      }
    }
    player.updateMysSRPlayer(res.data)
    player.save()

    return await this.renderImg({
      avatars: _.sortBy(player.getAvatarData(), ['level', 'star', 'cons', 'weapon.star', 'id']).reverse(),
      role: {
        name: player.name,
        level: player.level,
        face: player.face
      },
      uid: this.e.MysUid,
      version: this.lable.version
    })
  }
}
