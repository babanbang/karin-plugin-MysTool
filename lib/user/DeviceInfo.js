import base from './base.js'
import DeviceInfoDB from './db/DeviceInfoDB.js'


export class DeviceInfo extends base {
  constructor (user_id) {
    super()
    this.user_id = user_id
  }

  static async create (e, db = false) {
    const DeviceInfo = new DeviceInfo(e?.user_id || e)
    await DeviceInfo.initDB(db)

    return DeviceInfo
  }

  /** 初始化数据 */
  async initDB (db = false) {
    if (this.db && !db) return

    if (db && db !== true) {
      this.db = db
    } else {
      this.db = await DeviceInfoDB.find(this.user_id)
    }

    this.setDeviceInfoData(this.db)
    await this.save()
  }

  async setDeviceInfoData (data, save = false) {
    for (let key in DeviceInfoDB.COLUMNS) {
      this[key] = data[key] || this[key] || ''
    }

    if (save) await this.save()
  }
}