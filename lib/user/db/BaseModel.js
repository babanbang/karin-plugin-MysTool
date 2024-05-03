import { Sequelize, DataTypes, Model } from 'sequelize'
import { Data } from '#Mys.tool'

const dbPath = Data.createDir('/data/db/') + 'data.db'

// todo 数据库自定义
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: dbPath,
  logging: false
})

export default class BaseModel extends Model {
  static Types = DataTypes

  static createColumn = (Name) => ({
    type: DataTypes.STRING,
    defaultValue: '',
    get () {
      return this.getDataValue(Name).split(',').filter(Boolean)
    }
  })

  static createJsonColumn = (Name) => ({
    type: DataTypes.STRING,
    defaultValue: JSON.stringify({}),
    get () {
      let data = this.getDataValue(Name)
      try {
        data = JSON.parse(data) || {}
      } catch (e) {
        data = {}
      }
      return data
    },
    set (data) {
      this.setDataValue(Name, JSON.stringify(data))
    }
  })

  static initDB (model, columns) {
    model.init(columns, {
      sequelize,
      tableName: model.name.replace(/DB$/, 's')
    })
    model.COLUMNS = columns
  }
}
export { sequelize }
