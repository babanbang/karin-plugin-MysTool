import { MysUtil } from '@/mys'
import { GameList, MysType, MysUserDBCOLUMNS } from '@/types'
import { DbBaseModel } from './BaseModel'
const { Types, Column, ArrayColumn, Op, DIALECT } = DbBaseModel

const COLUMNS = {
  [MysUserDBCOLUMNS['ltuid']]: {
    type: Types.INTEGER,
    primaryKey: true
  },
  [MysUserDBCOLUMNS['type']]: Column('STRING', 'mys'),
  [MysUserDBCOLUMNS['cookie']]: Column('TEXT'),
  [MysUserDBCOLUMNS['stoken']]: Column('STRING'),
  [MysUserDBCOLUMNS['ltoken']]: Column('STRING'),
  [MysUserDBCOLUMNS['mid']]: Column('STRING'),
  [MysUserDBCOLUMNS['login_ticket']]: Column('STRING'),
  [MysUserDBCOLUMNS['device']]: Column('STRING'),
  [MysUserDBCOLUMNS['gs']]: ArrayColumn('gs_uids', {
    fn: (data) => data.sort((a, b) => Number(a) - Number(b))
  }),
  [MysUserDBCOLUMNS['sr']]: ArrayColumn('sr_uids', {
    fn: (data) => data.sort((a, b) => Number(a) - Number(b))
  }),
  [MysUserDBCOLUMNS['zzz']]: ArrayColumn('zzz_uids', {
    fn: (data) => data.sort((a, b) => Number(a) - Number(b))
  })
}

export class MysUserDB extends DbBaseModel {
  /** 米游社ID */
  [MysUserDBCOLUMNS.ltuid]!: string
  /** 米游社类型 */
  [MysUserDBCOLUMNS.type]!: MysType
  /** 米游社cookie */
  [MysUserDBCOLUMNS.cookie]!: string
  /** 米游社stoken */
  [MysUserDBCOLUMNS.stoken]!: string
  /** 米游社ltoken */
  [MysUserDBCOLUMNS.ltoken]!: string
  /** 米游社mid */
  [MysUserDBCOLUMNS.mid]!: string
  /** 米游社login_ticket */
  [MysUserDBCOLUMNS.login_ticket]!: string
  /** 随机设备device */
  [MysUserDBCOLUMNS.device]!: string
  /** 原神UID */
  [MysUserDBCOLUMNS.gs]!: string[]
  /** 崩铁UID */
  [MysUserDBCOLUMNS.sr]!: string[]
  /** 绝区零UID */
  [MysUserDBCOLUMNS.zzz]!: string[]

  static COLUMNS = COLUMNS

  /** 根据ltuid查找MysUser */
  static async find(ltuid: string) {
    return await MysUserDB.findByPk(ltuid) || MysUserDB.build({ ltuid })
  }

  /** 根据uid查找MysUser */
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

DbBaseModel.initDB(MysUserDB, COLUMNS)
await MysUserDB.sync()