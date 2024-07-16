import { Sequelize, DataTypes, Model, Op } from 'sequelize'
import { Data, Cfg } from '#MysTool/utils'

const dbset = Cfg.getConfig('set')

const SequelizeSet = {
  sqlite: {
    storage: Data.createDir('db/data.db', { root: true }),
    dialect: 'sqlite',
  },
  postgres: {
    host: 'localhost',
    port: 5432,
    database: 'postgres',
    username: 'postgres',
    password: '123456',
    ...dbset.postgres,
    dialect: 'postgres',
  }
}
if (dbset.dialect === 'postgres') {
  if (!dbset.postgres?.password) {
    delete SequelizeSet.postgres.password
  } else {
    SequelizeSet.postgres.password = String(dbset.postgres.password)
  }
}

const sequelize = new Sequelize({
  ...SequelizeSet[dbset.dialect] || SequelizeSet.sqlite,
  logging: false
})

export class BaseModel extends Model {
  static DIALECT = SequelizeSet[dbset.dialect]?.dialect || 'sqlite'
  static Types = DataTypes
  static Op = Op

  static createColumn = (Name, def = []) => {
    if (dbset.dialect === 'postgres') {
      return {
        type: DataTypes.JSONB,
        defaultValue: def,
        get () {
          return this.getDataValue(Name).filter(Boolean)
        }
      }
    } else {
      return {
        type: DataTypes.STRING,
        defaultValue: def.join(','),
        get () {
          return this.getDataValue(Name).split(',').filter(Boolean)
        },
        set (data) {
          this.setDataValue(Name, data?.join?.(',') || '')
        }
      }
    }
  }

  static createJsonColumn = (Name, def = {}) => {
    if (dbset.dialect === 'postgres') {
      return {
        type: DataTypes.JSONB,
        defaultValue: def
      }
    } else {
      return {
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
      }
    }
  }

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

  static async changeColumn (model, column) {
    const name = model.name.replace(/DB$/, 's')
    const queryInterface = sequelize.getQueryInterface()
    for (let key of column) {
      await queryInterface.changeColumn(name, key, model.COLUMNS[key])
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
