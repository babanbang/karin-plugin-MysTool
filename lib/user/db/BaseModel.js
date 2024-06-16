import { Sequelize, DataTypes, Model, Op } from 'sequelize'
import { Data } from '#MysTool/utils'

const dbPath = Data.createDir('db/data.db', { root: true })

// todo 数据库自定义
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: dbPath,
  logging: false
})

export default class BaseModel extends Model {
  static Types = DataTypes
  static Op = Op

  static createColumn = (Name, def = '') => ({
    type: DataTypes.STRING,
    defaultValue: def,
    get () {
      return this.getDataValue(Name).split(',').filter(Boolean)
    }
  })

  static createJsonColumn = (Name, def = {}) => ({
    type: DataTypes.STRING,
    defaultValue: JSON.stringify(def),
    get () {
      let data = this.getDataValue(Name)
      try {
        data = JSON.parse(data) || def
      } catch (e) {
        data = def
      }
      return data
    },
    set (data) {
      this.setDataValue(Name, JSON.stringify(data))
    }
  })

  static async addColumn (model, column) {
    const name = model.name.replace(/DB$/, 's')

    const queryInterface = sequelize.getQueryInterface()
    const tableDescription = await queryInterface.describeTable(name)
    for (let key of column) {
      if (!tableDescription[key]) {
        await queryInterface.addColumn(name, key, model.COLUMNS[key])
        if (model.COLUMNS[key].defaultValue !== undefined) {
          await model.update({
            [key]: model.COLUMNS[key].defaultValue
          }, { where: {} })
        }
      }
    }
  }

  static initDB (model, columns) {
    model.init(columns, {
      sequelize,
      tableName: model.name.replace(/DB$/, 's')
    })
    model.COLUMNS = columns
  }
}
export { sequelize }
