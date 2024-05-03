import { Base, Cfg, Data } from '#Mys.tool'
import { MysInfo } from '#Mys.api'
import { Player } from '#Mys.rank'

export default class Role extends Base {
  constructor (e) {
    super(e, 'sr')
    this.model = 'role/rolelist'
    this.lable = Cfg.getdefSet('lable', 'sr')
  }

  async roleList () {
    // return await this.renderImg(Data.readJSON(`data/${this.model}/sr/data.json`))
    const res = await MysInfo.get(this.e, 'character')
    if (res?.retcode !== 0) return false

    const player = new Player(this.e.MysUid, 'sr')
    player.setBasicData(res.data.role, true)

    const list = {
      avatars: res.data.avatar_list
    }

    return await this.renderImg({
      ...list,
      role: {
        ...res.data.role,
        face: player.face
      },
      uid: this.e.MysUid,
      version: this.lable.version
    })
  }
}
