import { plugin } from '#Karin'
import { MysUtil } from '#Mys.api'
import Explore from '../model/explore.js'

const reg = MysUtil.reg.gs
export class gs_explore extends plugin {
  constructor () {
    super({
      name: '原神探索查询',
      dsc: '原神探索信息查询',
      event: 'message',
      priority: 200,
      rule: [
        {
          reg: new RegExp(`^${reg}?(宝箱|成就|尘歌壶|家园|声望|(探险|探索)(度)?)[ |0-9]*$`, 'i'),
          fnc: 'Explore'
        }
      ]
    })
  }

  /** 探险 */
  async Explore () {
    const img = await new Explore(this.e).get()
    if (!img) return

    this.reply(img)
  }
}
