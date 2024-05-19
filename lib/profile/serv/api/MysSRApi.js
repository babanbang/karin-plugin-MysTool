import MysSRData from './MysSRData.js'

export default {
  id: 'mysSR',
  name: 'MysSR-Api',
  /** 处理服务返回 */
  async response (data, req) {
    let details = data.data.avatar_list
    if (!details || details.length === 0) {
      return req.err('empty', 5 * 60)
    }
    return data.data
  },
  /**
   * @param {import('#Mys.profile').Player} player
   * @param {{avatar_list:object[]}} data
   */
  updatePlayer (player, data) {
    data.avatar_list.forEach(ds => {
      const id = MysSRData.setAvatar(player, ds)
      if (id) player._updateAvatar.push(id)
    })
  }
}
