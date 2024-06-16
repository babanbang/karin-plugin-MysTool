import _ from 'lodash'
import BaseModel from './BaseModel.js'
const { Types, createColumn, createJsonColumn } = BaseModel

const COLUMNS = {
  user_id: {
    type: Types.STRING,
    primaryKey: true
  },
  /** 绑定的cookie */
  ltuids: createColumn('ltuids'),
  /** 绑定的stoken */
  stuids: createColumn('stuids'),
  gs_main: {
    type: Types.STRING,
    defaultValue: ''
  },
  sr_main: {
    type: Types.STRING,
    defaultValue: ''
  },
  zzz_main: {
    type: Types.STRING,
    defaultValue: ''
  },
  gs_uids: createJsonColumn('gs_uids'),
  sr_uids: createJsonColumn('sr_uids'),
  zzz_uids: createJsonColumn('zzz_uids')
}

class UserDB extends BaseModel {
  static COLUMNS = COLUMNS

  static async find (user_id) {
    if (!user_id) return false
    // DB查询
    user_id = String(user_id)
    let user = await UserDB.findByPk(user_id)
    if (!user) {
      user = await UserDB.build({ user_id })
    }
    return user
  }

  async saveDB (user) {
    const ltuids = []
    const stuids = []
    _.forEach(user.mysUsers, (mys, ltuid) => {
      ltuids.push(ltuid)
      if (mys.stoken) stuids.push(ltuid)
    })
    for (const k of ['gs_main', 'sr_main', 'zzz_main', 'gs_uids', 'sr_uids', 'zzz_uids']) {
      if (!user[k]) continue
      this[k] = user[k]
    }
    this.ltuids = ltuids.join(',')
    this.stuids = stuids.join(',')
    await this.save()
  }
}

BaseModel.initDB(UserDB, COLUMNS)
await UserDB.sync()

export default UserDB
