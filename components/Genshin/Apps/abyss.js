import { plugin } from '#Karin'
import { MysUtil } from '#Mys.api'

const reg = MysUtil.reg.gs
export class gs_abyss extends plugin {
  constructor () {
    super({
      name: '角色查询',
      dsc: '原神角色信息查询',
      event: 'message',
      priority: 200,
      rule: [
        {
          reg: new RegExp(`^${reg}?[上期|往期|本期]*(深渊|深境|深境螺旋)[上期|往期|本期]*[ |0-9]*$`, 'i'),
          fnc: 'abyss'
        }
      ]
    })
  }

  /** 深境螺旋 */
  async abyss () {

  }
}
