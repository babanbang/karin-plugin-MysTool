import { Meta, Character, Format } from '#MysTool/profile'
import { MysInfo } from '#MysTool/mys'

const mainIdx = {
  3: { 32: 1, 33: 2, 34: 3, 52: 4, 53: 5, 55: 6, 56: 7 },
  4: { 32: 1, 33: 2, 34: 3, 51: 4 },
  5: { 32: 1, 33: 2, 34: 3, 12: 4, 14: 5, 16: 6, 18: 7, 20: 8, 22: 9, 24: 10 },
  6: { 59: 1, 54: 2, 32: 3, 33: 4, 34: 5 }
}
const sups = {
  27: 1, // hpPlus
  29: 2, // atkPlus
  31: 3, // defPlus
  32: 4, // hp
  33: 5, // atk
  34: 6, // def
  51: 7, // speed
  52: 8, // cpct
  53: 9, // cdmg
  56: 10, // effPct
  57: 11, // effDef
  59: 12 // stance
}

export default {
  id: 'mysSR',
  name: '米游社-API',
  /** 请求数据 */
  async request (uid) {
    const mys = await MysInfo.getMysUserByUid(uid, 'sr')
    if (!mys) return false

    /** @type {MysInfo} */
    const mysinfo = new MysInfo('', 'sr')
    mysinfo.setMysApi({ ...mys, uid, game: 'sr', self: true })
    const data = await mysinfo.getData('character')

    if (data?.retcode !== 0) {
      return false
    }

    return data
  },
  /** 处理服务返回 */
  async response (data, req) {
    let details = data.avatar_list
    if (!details || details.length === 0) {
      return req.err('empty', 5 * 60)
    }
    return data
  },
  /**
   * @param {import('#MysTool/profile').Player} player
   * @param {{avatar_list:object[]}} data
   */
  updatePlayer (player, data) {
    data.avatar_list.forEach(ds => {
      const id = MysSRData.setAvatar(player, ds)
      if (id) player._updateAvatar.push(id)
    })
  }
}

const MysSRData = {
  /**
   * @param {import('#MysTool/profile').Player} player
   */
  setAvatar (player, data) {
    const char = Character.get(data.id, 'sr')
    if (!char) return false

    const avatar = player.getAvatar(char.id, true)
    avatar.setAvatar({
      elem: data.element,
      level: data.level,
      promote: data.rarity + 1,
      cons: data.rank,
      ...MysSRData.getTalent(data.skills),
      weapon: MysSRData.getWeapon(data.equip),
      artis: MysSRData.getArtifact(data)
    }, 'mysSR')

    const profile = player.getProfile(char.id)
    const Dataspeed = (data.properties.find(i => i.property_type == 4))?.add || 0
    const fix = Number(Dataspeed) - Number(Format.comma(profile.attr.speed - profile.base.speed, 1))

    if (fix > 0.1) {
      avatar.setAvatar({
        artis: MysSRData.getArtifact(data, fix)
      }, 'mysSR')
    }

    return avatar?.id
  },
  getWeapon (equip) {
    if (!equip) return false
    return {
      id: equip.id,
      level: equip.level,
      promote: equip.rarity + 1,
      affix: equip.rank
    }
  },
  getTalent (skills = []) {
    const talents = {
      普攻: 'a', 战技: 'e', 终结技: 'q', 天赋: 't'
    }
    const talent = {}
    const trees = []

    skills.forEach(i => {
      if (talents[i.remake]) {
        talent[talents[i.remake]] = i.level
      } else if (i.is_activated && i.remake !== '秘技') {
        trees.push(i.point_id)
      }
    })
    return { talent, trees }
  },
  getArtifact (data, fix = 0) {
    const artis = {}

    const keys = ['relics', 'ornaments']
    const { metaData } = Meta.getMeta('sr', 'arti')
    keys.forEach(key => {
      data[key]?.forEach((i) => {
        if (!i.pos) return
        if (!Array.isArray(i.properties)) {
          artis[i.pos] = {}
          return
        }
        const attrIds = []
        try {
          i.properties.forEach(e => {
            const att = metaData.starData[i.rarity].sub[sups[e.property_type]]
            let step = Math.round((Number(e.value.replace('%', '')) - att.base * e.times) / att.step)
            if (fix > 0.1 && e.property_type == 51) {
              let v = Number(((att.base * e.times + att.step * step) % 1).toFixed(1))
              if (v < 0.6) {
                for (let i = 0; i < 3; i++) {
                  if (v >= 0.6) break

                  v += att.step
                  step += 1
                }
              }
            }

            attrIds.push(`${sups[e.property_type]},${e.times},${step}`)
          })
          artis[i.pos] = {
            id: i.id,
            name: i.name,
            level: i.level,
            star: i.rarity,
            mainId: mainIdx[i.pos]?.[i.main_property?.property_type],
            attrIds
          }
          if ([1, 2].includes(i.pos)) artis[i.pos].mainId = 1
        } catch (err) {
          logger.error(JSON.stringify(i, null, 2))
          logger.error(err)
          artis[i.pos] = {}
        }
      })
    })
    return artis
  }
}
