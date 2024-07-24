import { lodash } from 'node-karin/modules.js'
import { BaseModel } from './BaseModel'
const { Types, Column, Op } = BaseModel

const COLUMNS = {
  user_id: {
    type: Types.STRING,
    primaryKey: true
  },
  deviceModel: Column('STRING'),
  androidVersion: Column('STRING'),
  deviceFingerprint: Column('STRING'),
  deviceName: Column('STRING'),
  deviceBoard: Column('STRING'),
  deviceProduct: Column('STRING'),
  oaid: Column('STRING'),
}

class DeviceInfoDB extends BaseModel {
  static COLUMNS = COLUMNS

  static async find(user_id: string) {
    return await DeviceInfoDB.findByPk(user_id) || DeviceInfoDB.build({ user_id })
  }

  static async findPublicDevice(all = false) {
    const Devices = await DeviceInfoDB.findAll({
      where: {
        user_id: {
          [Op.like]: `%PublicDevice-%`
        }
      }
    })
    return all ? Devices : lodash.sample(Devices)
  }
}

BaseModel.initDB(DeviceInfoDB, COLUMNS)
await DeviceInfoDB.sync()

export default DeviceInfoDB