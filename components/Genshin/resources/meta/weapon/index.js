import { Meta } from '#Mys.rank'
import { Data } from '#Mys.tool'
import _ from 'lodash'
import { abbr, alias } from './alias.js'
import { descFix } from './desc.js'
import { weaponSet, weaponType } from './extra.js'

const Path = import.meta.url
const weaponBuffs = {}
const data = {}

const step = function (start, step = 0) {
  if (!step) step = start / 4

  const ret = []
  for (let idx = 0; idx <= 5; idx++) {
    ret.push(start + step * idx)
  }
  return ret
}

const attr = function (key, start, _step) {
  return {
    title: `${key}提高[key]`,
    isStatic: true,
    refine: {
      [key]: step(start, _step)
    }
  }
}

for (const type in weaponType) {
  // calc
  const typeCalc = await Data.importDefault(`${type}/calc.js`, Path)
  _.assign(weaponBuffs, typeCalc(step, attr))

  // data
  _.forEach(Data.readJSON(`${type}/data.json`, Path), (ds) => {
    data[ds.id] = {
      id: ds.id,
      name: ds.name,
      type,
      star: ds.star
    }
  })
}

const meta = Meta.create('gs', 'weapon')
meta.addData(data)
meta.addAlias(alias)
meta.addAbbr(abbr)
meta.addMeta({
  weaponType, weaponSet, weaponBuffs, descFix
})
