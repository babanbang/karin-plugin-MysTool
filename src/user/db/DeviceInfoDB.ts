import { DeviceInfoDBCOLUMNS } from '@/types/user'
import { lodash } from 'node-karin/modules.js'
import { DbBaseModel } from './BaseModel'

const { Types, Column, Op } = DbBaseModel

const COLUMNS = {
  [DeviceInfoDBCOLUMNS['user_id']]: {
    type: Types.STRING,
    primaryKey: true
  },
  [DeviceInfoDBCOLUMNS['deviceName']]: Column('STRING'),
  [DeviceInfoDBCOLUMNS['deviceModel']]: Column('STRING'),
  [DeviceInfoDBCOLUMNS['deviceBoard']]: Column('STRING'),
  [DeviceInfoDBCOLUMNS['deviceProduct']]: Column('STRING'),
  [DeviceInfoDBCOLUMNS['deviceFingerprint']]: Column('STRING'),
  [DeviceInfoDBCOLUMNS['androidVersion']]: Column('STRING'),
  [DeviceInfoDBCOLUMNS['oaid']]: Column('STRING')
}

export class DeviceInfoDB extends DbBaseModel {
  /** 用户ID */
  [DeviceInfoDBCOLUMNS.user_id]!: string
  [DeviceInfoDBCOLUMNS.deviceName]!: string
  [DeviceInfoDBCOLUMNS.deviceModel]!: string
  [DeviceInfoDBCOLUMNS.deviceBoard]!: string
  [DeviceInfoDBCOLUMNS.deviceProduct]!: string
  [DeviceInfoDBCOLUMNS.deviceFingerprint]!: string
  [DeviceInfoDBCOLUMNS.androidVersion]!: string
  [DeviceInfoDBCOLUMNS.oaid]!: string

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

DbBaseModel.initDB(DeviceInfoDB, COLUMNS)
await DeviceInfoDB.sync()
