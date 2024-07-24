import { GameList, UidGameKey_main, UidGameKey_uids, BingUIDType } from '@/types'
import UserDB from './db/UserDB'

export class User {
  /** 用户数据 */
  db!: UserDB
  game: GameList
  user_id: string
  [UidGameKey_main.gs]!: string
  [UidGameKey_uids.gs]!: Record<string, BingUIDType>
  [UidGameKey_main.sr]!: string
  [UidGameKey_uids.sr]!: Record<string, BingUIDType>
  [UidGameKey_main.zzz]!: string
  [UidGameKey_uids.zzz]!: Record<string, BingUIDType>

  constructor(user_id: string, game: GameList = GameList.Gs) {
    this.game = game
    this.user_id = user_id
  }
  get uid() {
    return this[this.Key.m]
  }

  get Key() {
    return this.gameKey(this.game)
  }

  hasCk(uid = '') {
    return [BingUIDType.ck, BingUIDType.all].includes(this[this.Key.u][uid || this.uid])
  }

  hasSk(uid = '') {
    return [BingUIDType.sk, BingUIDType.all].includes(this[this.Key.u][uid || this.uid])
  }

  gameKey(game: GameList) {
    return {
      m: `${game}_main` as UidGameKey_main,
      u: `${game}_uids` as UidGameKey_uids,
    }
  }

  static async create(user_id: string, game: GameList, db?: UserDB) {
    const user = new User(user_id, game)
    await user.initDB(db)

    return user
  }

  /** 初始化数据 */
  async initDB(db?: UserDB) {
    if (this.db && !db) return

    this.db = db || await UserDB.find(this.user_id)

    await this.save()
  }


  async save() {
    await this.db.save()
  }
}
