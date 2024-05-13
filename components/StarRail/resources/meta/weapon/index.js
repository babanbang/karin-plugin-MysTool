import { Meta } from '#Mys.rank'
import { Data } from '#Mys.tool'
import _ from 'lodash'
import { abbr, aliasCfg } from './alias.js'
const Path = import.meta.url

const types = '存护,丰饶,毁灭,同谐,虚无,巡猎,智识'.split(',')

const meta = Meta.create('sr', 'weapon')
meta.addData(Data.readJSON('data.json', Path))
meta.addAlias(aliasCfg)
meta.addAbbr(abbr)

const weaponBuffs = {}
let loadBuffs = async function () {
  for (const type of types) {
    let calc = (await Data.importDefault(`${type}/calc.js`, Path)).module
    if (_.isFunction(calc)) {
      calc = calc((idx, key) => {
        return {
          isStatic: true,
          idx,
          key
        }
      }, (title, key, idx) => {
        if (_.isPlainObject(key)) {
          return (tables) => {
            const data = {}
            _.forEach(key, (idx, k) => {
              data[k] = tables[idx]
            })
            return {
              title,
              data
            }
          }
        } else {
          return {
            title,
            idx,
            key
          }
        }
      })
    }
    _.forEach(calc, (ds, key) => {
      let id = meta.getId(key)
      if (id) weaponBuffs[id] = ds
    })
  }
}
await loadBuffs()

meta.addMeta({ weaponBuffs })
