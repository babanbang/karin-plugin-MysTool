import { Data } from '#MysTool/utils'
import axios from 'axios'
import lodash from 'lodash'
import EnkaData from './EnkaData.js'

export default {
  id: 'hutao',
  name: 'Hutao-Enka',
  /** 请求数据 */
  async request (uid, param) {
    return await axios({
      url: `http://enka-api.hut.ao/${uid}`,
      ...param
    })
  },

  /** 处理服务返回 */
  async response (data, req) {
    if (!data.playerInfo) {
      if (data.error) {
        logger.error(`Hutao-Enka ReqErr: ${data.error}`)
      }
      return req.err('error', 60)
    }
    let details = data.avatarInfoList
    if (!details || !details[0]?.propMap) {
      return req.err('empty', 5 * 60)
    }
    return data
  },
  /** @param {import('#MysTool/profile').Player} player */
  updatePlayer (player, data) {
    player.setBasicData(Data.getData(data.playerInfo, 'name:nickname,face:profilePicture.avatarID,card:nameCardID,level,sign:signature'))
    lodash.forEach(data.avatarInfoList, (ds) => {
      let ret = EnkaData.setAvatar(player, ds, this.id)
      if (ret) player._updateAvatar.push(ret)
    })
  },

  /** 获取冷却时间 */
  cdTime (data) {
    return data.ttl || 60
  }
}
