import { Meta } from '#Mys.rank'
import { Data } from '#Mys.tool'
import _ from 'lodash'
import { alias } from './alias.js'
import { extraChars, wifeCfg } from './extra.js'

const meta = Meta.create('gs', 'char')

meta.addData(Data.readJSON('data.json', import.meta.url))
meta.addAlias(alias)

// 添加自定义角色
_.forEach(extraChars, (alias, char) => {
  meta.addDataItem(char, {
    id: char,
    name: char
  })
})
// 添加自定义角色别名
meta.addAlias(extraChars)

// 添加老婆设置
const wifeData = {}
_.forEach(wifeCfg, (txt, type) => {
  wifeData[type] = wifeData[type] || {}
  Data.eachStr(txt, (name) => {
    let id = meta.getId(name)
    if (id) wifeData[type][id] = true
  })
})
meta.addMeta({ wifeData })
