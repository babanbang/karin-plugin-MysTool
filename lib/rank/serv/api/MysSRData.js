import { Meta, Character } from '#Mys.rank'

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

const MysSRData = {
  /**
   * @param {import('#Mys.rank').Player} player
   */
  setAvatar (player, data) {
    const char = Character.get(data.id)
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
  getArtifact (data) {
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
            const step = Math.round((Number(e.value.replace('%', '')) - att.base * e.times) / att.step)
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

export default MysSRData
