import { Character } from '#MysTool/profile'
import { Data } from '#MysTool/utils'
import axios from 'axios'
import _ from 'lodash'
/**
 * 鳄梨
 */
export default {
  id: 'avocado',
  name: 'Avocado',
  /** 请求数据 */
  async request (uid, param) {
    return await axios({
      url: `https://avocado.wiki/v1/raw/info/${uid}`,
      ...param
    })
  },

  /** 处理服务返回 */
  async response (data, req) {
    if (!data.playerDetailInfo) {
      return req.err('error', 60)
    }
    let ds = data.playerDetailInfo
    let ac = ds.assistAvatar
    let avatars = {}
    if (ac && !_.isEmpty(ac)) {
      avatars[ac.avatarId] = ac
    }
    _.forEach(ds.displayAvatars, (ds) => {
      avatars[ds.avatarId] = ds
    })

    if (_.isEmpty(avatars)) {
      return req.err('empty', 5 * 60)
    }
    ds.avatars = avatars
    return ds
  },

  /** @param {import('#MysTool/profile').Player} player  */
  updatePlayer (player, data) {
    try {
      player.setBasicData(Data.getData(data, 'name:nickname,face:headIconID,level,sign:signature'))
      _.forEach(data.avatars, (ds) => {
        let ret = AvocadoData.setAvatar(player, ds)
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

const AvocadoData = {
  /** @param {import('#MysTool/profile').Player} player  */
  setAvatar (player, data) {
    const char = Character.get(data.avatarId)
    if (!char) return false

    const avatar = player.getAvatar(char.id, true)
    avatar.setAvatar({
      level: data.level,
      promote: data.promotion,
      cons: data.rank || 0,
      weapon: Data.getData(data.equipment, 'id:id,promote:promotion,level,affix:rank'),
      ...AvocadoData.getTalent(data.behaviorList, char),
      artis: AvocadoData.getArtis(data.relics)
    }, 'avocado')

    return avatar?.id
  },
  /** @param {Character} char  */
  getTalent (ds, char) {
    let talent = {}
    let trees = []
    _.forEach(ds, (d) => {
      let key = char.getTalentKey(d.id)
      if (key || d.level > 1) {
        talent[key || d.id] = d.level
      } else {
        trees.push(d.id)
      }
    })
    return { talent, trees }
  },
  getArtis (artis) {
    let ret = {}
    _.forEach(artis, (ds) => {
      let tmp = {
        id: ds.id,
        level: ds.level || 1,
        mainId: ds.main_affix_id,
        attrIds: []
      }
      _.forEach(ds.sub_affix_id, (s) => {
        if (!s.id) return true

        tmp.attrIds.push([s.id, s.cnt, s.step || 0].join(','))
      })
      ret[ds.type] = tmp
    })
    return ret
  }
}
