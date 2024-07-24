import { BaseModel } from './BaseModel'
import { BingUIDType } from '@/types'
const { Types, ArrayColumn, JsonColumn, Column } = BaseModel

const COLUMNS = {
  user_id: {
    type: Types.STRING,
    primaryKey: true
  },
  ltuids: ArrayColumn('ltuids'),
  stuids: ArrayColumn('stuids'),
  gs_main: Column('STRING'),
  sr_main: Column('STRING'),
  zzz_main: Column('STRING'),
  gs_uids: JsonColumn('gs_uids'),
  sr_uids: JsonColumn('sr_uids'),
  zzz_uids: JsonColumn('zzz_uids')
}

class UserDB extends BaseModel {
  static COLUMNS = COLUMNS

  /** 用户ID */
  user_id!: string
  /** 绑定的cookie ltuids */
  ltuids!: string[]
  /** 绑定的stoken stuids */
  stuids!: string[]
  /** 当前使用的原神UID */
  gs_main!: string
  /** 当前使用的崩坏；星穹铁道UID */
  sr_main!: string
  /** 当前使用绝区零UID */
  zzz_main!: string
  /** 绑定的原神UID列表 */
  gs_uids!: Record<string, BingUIDType>
  /** 绑定的崩坏；星穹铁道UID列表 */
  sr_uids!: Record<string, BingUIDType>
  /** 绑定的绝区零UID列表 */
  zzz_uids!: Record<string, BingUIDType>

  static async find(user_id: string) {
    return await UserDB.findByPk(user_id) || UserDB.build({ user_id })
  }
}

BaseModel.initDB(UserDB, COLUMNS)
await UserDB.sync()

export default UserDB
