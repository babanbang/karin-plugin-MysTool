import { plugin } from '#Karin'
import { MysUtil } from '#Mys.api'
import Role from '../model/role.js'

const reg = MysUtil.reg.gs
export class gs_role extends plugin {
  constructor () {
    super({
      name: '角色查询',
      dsc: '原神角色信息查询',
      event: 'message',
      priority: 200,
      rule: [
        {
          reg: new RegExp(`^${reg}?(角色|查询|查询角色|角色查询)[ |0-9]*$|^${reg}?uid(\\+|\\s)*(18|[1-9])[0-9]{8}$|^#(18|[1-9])[0-9]{8}`, 'i'),
          fnc: 'roleList'
        },
        {
          reg: new RegExp(`^${reg}?(刷新|更新)(角色)?天赋(数据)?[ |0-9]*$`, 'i'),
          fnc: 'refreshTalent'
        }
      ]
    })
  }

  /** 角色列表 */
  async roleList ({ refreshTalent = false }) {
    const img = await new Role(this.e).roleList(refreshTalent)
    if (!img) return

    this.reply(img)
  }

  async refreshTalent () {
    await this.roleList({ refreshTalent: true })
  }
}
