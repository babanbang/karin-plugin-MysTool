import { Character } from '#MysTool/profile'
import { Data } from '#MysTool/utils'
import axios from 'axios'
import _ from 'lodash'

export default {
  id: 'homo',
  name: 'Mihomo',
  /** 请求数据 */
  async request (uid, param) {
    return await axios({
      url: `https://api.mihomo.me/sr_info/${uid}`,
      ...param
    })
  },

  /** 处理服务返回 */
  async response (data, req) {
    if (!data.detailInfo) {
      return req.err('error', 60)
    }
    let ds = data.detailInfo
    let avatars = {}
    _.forEach(ds.assistAvatarList, (ds) => {
      avatars[ds.avatarId] = ds
    })
    _.forEach(ds.avatarDetailList, (ds) => {
      avatars[ds.avatarId] = ds
    })

    if (_.isEmpty(avatars)) {
      return req.err('empty', 5 * 60)
    }
    ds.avatars = avatars
    return ds
  },
  /** @param {import('#MysTool/profile').Player} player */
  updatePlayer (player, data) {
    try {
      player.setBasicData(Data.getData(data, 'name:nickname,face:headIcon,level,sign:signature'))
      _.forEach(data.avatars, (ds) => {
        let ret = HomoData.setAvatar(player, ds)
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
    const char = Character.get(data.avatarId)
    if (!char) return false

    const avatar = player.getAvatar(char.id, true)
    avatar.setAvatar({
      level: data.level,
      promote: data.promotion,
      cons: data.rank || 0,
      weapon: Data.getData(data.equipment, 'id:tid,promote:promotion,level,affix:rank'),
      ...HomoData.getTalent(data.skillTreeList, char),
      artis: HomoData.getArtis(data.relicList)
    }, 'homo')

    return avatar?.id
  },
  /** @param {Character} char  */
  getTalent (ds, char) {
    let talent = {}
    let trees = []
    _.forEach(ds, (d) => {
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
    _.forEach(artis, (ds) => {
      let tmp = {
        id: ds.tid,
        level: ds.level || 1,
        mainId: ds.mainAffixId,
        attrIds: []
      }
      _.forEach(ds.subAffixList, (s) => {
        if (!s.affixId) return true

        tmp.attrIds.push([s.affixId, s.cnt, s.step || 0].join(','))
      })
      ret[ds.type] = tmp
    })
    return ret
  }
}
