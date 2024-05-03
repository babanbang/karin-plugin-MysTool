import BaseModel from './BaseModel.js'
const { Types, createColumn } = BaseModel

const COLUMNS = {
  // 米游社ID
  ltuid: {
    type: Types.INTEGER,
    primaryKey: true
  },
  // MysUser类型，mys / hoyolab
  type: {
    type: Types.STRING,
    defaultValue: 'mys',
    notNull: true
  },
  cookie: {
    type: Types.STRING,
    defaultValue: ''
  },
  stoken: {
    type: Types.STRING,
    defaultValue: ''
  },
  ltoken: {
    type: Types.STRING,
    defaultValue: ''
  },
  mid: {
    type: Types.STRING,
    defaultValue: ''
  },
  login_ticket: {
    type: Types.STRING,
    defaultValue: ''
  },
  gs_uids: createColumn('gs_uids'),
  sr_uids: createColumn('sr_uids'),
  zzz_uids: createColumn('zzz_uids')
}

class MysUserDB extends BaseModel {
  static async find (ltuid) {
    if (!ltuid) return false
    // DB查询
    ltuid = String(ltuid)
    let mys = await MysUserDB.findByPk(ltuid)
    if (!mys) {
      mys = await MysUserDB.build({ ltuid })
    }
    return mys || false
  }

  async saveDB (mys) {
    if (!mys.ck) return false

    this.cookie = mys.ck
    for (const k of ['type', 'stoken', 'ltoken', 'mid', 'login_ticket', 'device']) { this[k] = mys[k] }

    for (const k of ['gs_uids', 'sr_uids', 'zzz_uids']) {
      if (!mys[k]) continue
      this[k] = mys[k].sort((a, b) => a - b).join(',')
    }

    await this.save()
  }
}

BaseModel.initDB(MysUserDB, COLUMNS)
await MysUserDB.sync()

export default MysUserDB
