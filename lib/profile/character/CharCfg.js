import { Data } from '#MysTool/utils'
import _ from 'lodash'

const cfgMap = {
  char: {},
  async init (game) {
    cfgMap.char[game] = []
    const path = 'components/' + Data.gamePath(game) + 'resources/meta/character'

    const chars = Data.readdir(path)
    chars.forEach(async (char) => {
      cfgMap.char[game][char] = {}
      const curr = cfgMap.char[game][char]
      // 评分规则
      if (Data.exists(`${path}/${char}/artis_user.js`)) {
        curr.artis = (await Data.importDefault(`${path}/${char}/artis_user.js`)).module
      } else if (Data.exists(`${path}/${char}/artis.js`)) {
        curr.artis = (await Data.importDefault(`${path}/${char}/artis.js`, 'default')).module
      }
      // 伤害计算
      if (Data.exists(`${path}/${char}/calc_user.js`)) {
        curr.calc = (await Data.importModule(`${path}/${char}/calc_user.js`)).module
      } else if (Data.exists(`${path}/${char}/calc.js`)) {
        curr.calc = (await Data.importModule(`${path}/${char}/calc.js`)).module
      }
    })
  }
}

/**
 * 角色相关配置
 */
const CharCfg = {
  async initCfg (game) {
    await cfgMap.init(game)
  },
  /**
   * 获取角色伤害计算相关配置
   * @param {import('#MysTool/profile').Character} char
  */
  getCalcRule (char) {
    const cfg = cfgMap.char[char.isTraveler ? `旅行者/${char.elem}` : char.name]?.calc
    if (!cfg || _.isEmpty(cfg)) return false

    return {
      details: cfg.details || false, // 计算详情
      buffs: cfg.buffs || [], // 角色buff
      defParams: cfg.defParams || {}, // 默认参数，一般为空
      defDmgIdx: cfg.defDmgIdx || -1, // 默认详情index
      defDmgKey: cfg.defDmgKey || '',
      mainAttr: cfg.mainAttr || 'atk,cpct,cdmg', // 伤害属性
      enemyName: cfg.enemyName || '小宝' // 敌人名称
    }
  },
  getArtisCfg (char) {
    return cfgMap.char[char.isTraveler ? '旅行者' : char.name]?.artis || false
  }
}
export default CharCfg 
