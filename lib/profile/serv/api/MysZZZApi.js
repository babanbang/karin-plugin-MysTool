import { Meta, Character, Format } from '#MysTool/profile'
import { MysInfo } from '#MysTool/mys'

function Rarity (r) {
  return /s/i.test(r) ? 5 : /a/i.test(r) ? 4 : /b/i.test(r) ? 3 : /c/i.test(r) ? 2 : 1
}

export default {
  id: 'mysZZZ',
  game: 'zzz',
  name: '米游社-API',
  /** 请求数据 */
  async request (uid) {
    const mys = await MysInfo.getMysUserByUid(uid, this.game)
    if (!mys) return false

    /** @type {MysInfo} */
    const mysinfo = new MysInfo('', this.game)
    mysinfo.setMysApi({ ...mys, uid, game: this.game, self: true })

    const allIds = Meta.getData(this.game, 'char', 'allcharsids')
    const data = await mysinfo.getData('avatar_info', { id_list: allIds.data })

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
      const id = MysZZZData.setAvatar(player, ds)
      if (id) player._updateAvatar.push(id)
    })
  }
}

const MysZZZData = {
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
      promote: Rarity(data.rarity) + 1,
      cons: data.rank,
      ...MysSRData.getTalent(data.skills),
      weapon: MysZZZData.getWeapon(data.equip),
      artis: MysZZZData.getArtifact(data)
    }, 'mysZZZ')

    return avatar?.id
  },
  getWeapon (equip) {
    if (!equip) return false
    return {
      id: equip.id,
      level: equip.level,
      promote: Rarity(equip.rarity) + 1,
      affix: equip.star
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

    const { metaData } = Meta.getMeta('zzz', 'arti')
    data.equip.forEach((i) => {
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
    return artis
  }
}