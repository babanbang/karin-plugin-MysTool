import { MysUtil } from '@/mys'
import { BaseModel } from './BaseModel'
import { GameList } from '@/types/mys'
const { Types, Column, ArrayColumn, Op, DIALECT } = BaseModel

const COLUMNS = {
  ltuid: {
    type: Types.INTEGER,
    primaryKey: true
  },
  type: {
    ...Column('STRING', 'mys'),
    notNull: true
  },
  cookie: Column('TEXT'),
  stoken: Column('STRING'),
  ltoken: Column('STRING'),
  mid: Column('STRING'),
  login_ticket: Column('STRING'),
  device: Column('STRING'),
  gs_uids: ArrayColumn('gs_uids', {
    fn: (data) => data.sort((a, b) => Number(a) - Number(b))
  }),
  sr_uids: ArrayColumn('sr_uids', {
    fn: (data) => data.sort((a, b) => Number(a) - Number(b))
  }),
  zzz_uids: ArrayColumn('zzz_uids', {
    fn: (data) => data.sort((a, b) => Number(a) - Number(b))
  })
}

export default class MysUserDB extends BaseModel {
  static COLUMNS = COLUMNS

  /** 米游社ID */
  ltuid!: string
  /** 米游社类型 */
  type!: 'mys' | 'hoyolab'
  /** 米游社cookie */
  cookie!: string
  /** 米游社stoken */
  stoken!: string
  /** 米游社ltoken */
  ltoken!: string
  /** 米游社mid */
  mid!: string
  /** 米游社login_ticket */
  login_ticket!: string
  /** 随机设备device */
  device!: string
  /** 原神UID */
  gs_uids!: string[]
  /** 崩铁UID */
  sr_uids!: string[]
  /** 绝区零UID */
  zzz_uids!: string[]

  /** 根据ltuid查找MysUser */
  static async find(ltuid: string) {
    return await MysUserDB.findByPk(ltuid) || MysUserDB.build({ ltuid })
  }

  static async findByUid(uid: string, game: GameList) {
    if (!uid || !game) return false

    const users = await MysUserDB.findAll({
      where: {
        type: MysUtil.getServ(uid, game),
        [game + '_uids']: DIALECT === 'postgres' ? {
          [Op.contains]: [uid]
        } : {
          [Op.like]: `%${uid}%`
        }
      }
    })
    return users?.[0]
  }
}

BaseModel.initDB(MysUserDB, COLUMNS)
await MysUserDB.sync()