import MysSRApi from './api/MysSRApi.js'
import ProfileServ from './ProfileServ.js'

const servs = {}
const apis = {
  mysSR: MysSRApi
}

const Serv = {
  /**
   * 根据key获取ProfileServ
   * @returns {ProfileServ}
   */
  serv (key, game) {
    if (!servs[key]) {
      servs[key] = new ProfileServ(apis[key], game)
    }
    return servs[key]
  }
}

export default Serv
