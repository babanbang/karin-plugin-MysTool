import { Character } from '#MysTool/profile'
import { Cfg, Data } from '#MysTool/utils'
import axios from 'axios'
import lodash from 'lodash'

export default {
  id: 'enkaHSR',
  name: 'EnkaHSR',
  /** 请求数据 */
  async request (uid, param) {
    const params = {
      url: `https://enka.network/api/hsr/uid/${uid}`,
      ...param
    }
    const set = Cfg.getConfig('set')
    if (set.proxy?.host && set.proxy?.port) {
      params.proxy = set.proxy
    }
    return await axios(params)
  },

  /** 处理服务返回 */
  async response (data, req) {
    if (!data.detailInfo) {
      return req.err('error', 60)
    }
    let ds = data.detailInfo
    let ac = ds.assistAvatarDetail
    let avatars = {}
    if (ac && !lodash.isEmpty(ac)) {
      avatars[ac.AvatarID] = ac
    }
    lodash.forEach(ds.avatarDetailList, (ds) => {
      avatars[ds.avatarId] = ds
    })

    if (lodash.isEmpty(avatars)) {
      return req.err('empty', 5 * 60)
    }
    ds.avatars = avatars
    return ds
  },
  /** @param {import('#MysTool/profile').Player} player */
  updatePlayer (player, data) {
    try {
      player.setBasicData(Data.getData(data, 'name:nickname,face:headIcon,level,sign:signature'))
      lodash.forEach(data.avatars, (ds) => {
        let ret = HomoData.setAvatar(player, ds, this.id)
        if (ret) player._updateAvatar.push(ret)
      })
    } catch (e) {
      logger.error(e)
    }
  },

  /** 获取冷却时间 */
  cdTime (data) {
    return data.ttl || 60
  }
}

const HomoData = {
  /** @param {import('#MysTool/profile').Player} player */
  setAvatar (player, data) {
    const char = Character.get(data.avatarId, 'sr')
    if (!char) return false

    const avatar = player.getAvatar(char.id, true)
    avatar.setAvatar({
      level: data.level,
      promote: data.promotion,
      cons: data.rank || 0,
      weapon: Data.getData(data.equipment, 'id:tid,promote:promotion,level,affix:rank'),
      ...HomoData.getTalent(data.skillTreeList, char),
      artis: HomoData.getArtis(data.relicList)
    }, 'EnkaHSR')

    return avatar?.id
  },
  /** @param {Character} char  */
  getTalent (ds, char) {
    let talent = {}
    let trees = []
    lodash.forEach(ds, (d) => {
      let key = char.getTalentKey(d.pointId)
      if (key || d.Level > 1) {
        talent[key || d.pointId] = d.level
      } else {
        trees.push(d.pointId)
      }
    })
    return { talent, trees }
  },
  getArtis (artis) {
    let ret = {}
    lodash.forEach(artis, (ds) => {
      let tmp = {
        id: ds.tid,
        level: ds.level || 1,
        mainId: ds.mainAffixId,
        attrIds: []
      }
      lodash.forEach(ds.subAffixList, (s) => {
        if (!s.affixId) return true

        tmp.attrIds.push([s.affixId, s.cnt, s.step || 0].join(','))
      })
      ret[ds.type] = tmp
    })
    return ret
  }
}
