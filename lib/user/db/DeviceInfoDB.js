import BaseModel from './BaseModel.js'
const { Types } = BaseModel

const COLUMNS = {
  user_id: {
    type: Types.STRING,
    primaryKey: true
  },
  deviceModel: {
    type: Types.STRING,
    defaultValue: ''
  },
  androidVersion: {
    type: Types.STRING,
    defaultValue: ''
  },
  deviceFingerprint: {
    type: Types.STRING,
    defaultValue: ''
  },
  deviceName: {
    type: Types.STRING,
    defaultValue: ''
  },
  deviceBoard: {
    type: Types.STRING,
    defaultValue: ''
  },
  deviceProduct: {
    type: Types.STRING,
    defaultValue: ''
  },
  oaid: {
    type: Types.STRING,
    defaultValue: ''
  }
}

class DeviceInfoDB extends BaseModel {
  static COLUMNS = COLUMNS

  static async find (user_id) {
    if (!user_id) return false

    user_id = String(user_id)
    let DeviceInfo = await DeviceInfoDB.findByPk(user_id)
    if (!DeviceInfo) {
      DeviceInfo = await DeviceInfoDB.build({ user_id })
    }
    return DeviceInfo
  }

  async saveDB (DeviceInfo) {
    for (let key in COLUMNS) {
      if (!DeviceInfo[key] || key === 'user_id') continue
      this[key] = DeviceInfo[key]
    }

    await this.save()
  }
}

BaseModel.initDB(DeviceInfoDB, COLUMNS)
await DeviceInfoDB.sync()

export default DeviceInfoDB