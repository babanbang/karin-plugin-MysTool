import { Meta } from '#Mys.rank'
import { Data } from '#Mys.tool'
import _ from 'lodash'
import { alias, abbr } from './alias.js'
import { wifeCfg } from './extra.js'

const data = Data.readJSON('data.json', import.meta.url)
const meta = Meta.create('sr', 'char')
meta.addData(data)
meta.addAlias(alias)
_.forEach(data, (ds) => {
  abbr[ds.name] = abbr[ds.name] || ds.name
})
meta.addAbbr(abbr)

// 老婆设置同样设置到gs下，通用数据
const gsMeta = Meta.create('gs', 'char')
const { wifeData = {} } = gsMeta.getMeta()
_.forEach(wifeCfg, (txt, type) => {
  wifeData[type] = wifeData[type] || {}
  Data.eachStr(txt, (name) => {
    let id = meta.getId(name)
    if (id) {
      wifeData[type][id] = true
    }
  })
})
gsMeta.addMeta({ wifeData })
