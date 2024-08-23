import { DeviceInfoDBCOLUMNS } from '@/types/user'
import lodash from 'node-karin/lodash'
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
	declare [DeviceInfoDBCOLUMNS.user_id]: string
	declare [DeviceInfoDBCOLUMNS.deviceName]: string
	declare [DeviceInfoDBCOLUMNS.deviceModel]: string
	declare [DeviceInfoDBCOLUMNS.deviceBoard]: string
	declare [DeviceInfoDBCOLUMNS.deviceProduct]: string
	declare [DeviceInfoDBCOLUMNS.deviceFingerprint]: string
	declare [DeviceInfoDBCOLUMNS.androidVersion]: string
	declare [DeviceInfoDBCOLUMNS.oaid]: string

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
