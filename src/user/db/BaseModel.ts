import { Sequelize, DataTypes, Model, Op } from 'sequelize'
import { Data, Cfg } from '@/utils'

const dbset = Cfg.getConfig('set')

const SequelizeSet = {
  sqlite: {
    storage: Data.createDir('db/data.db', { k: 'data' }),
    dialect: 'sqlite',
  },
  postgres: {
    host: 'localhost',
    prot: 5432,
    database: 'postgres',
    username: 'postgres',
    password: 123456,
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
  ...SequelizeSet[dbset.dialect as 'postgres' | 'sqlite'] || SequelizeSet.sqlite,
  logging: false
})

export class BaseModel extends Model {
  static DIALECT = SequelizeSet[dbset.dialect as 'postgres' | 'sqlite']?.dialect || 'sqlite'
  static Types = DataTypes
  static Op: typeof Op = Op

  declare static getDataValue: Model['getDataValue']
  declare static setDataValue: Model['setDataValue']

  static Column(type: keyof typeof DataTypes, def: any = '') {
    return {
      type: DataTypes[type],
      defaultValue: def
    }
  }

  static ArrayColumn(key: string, def: string[] = []) {
    if (dbset.dialect === 'postgres') {
      return {
        type: DataTypes.JSONB,
        defaultValue: def,
        get: (): string[] => {
          return this.getDataValue(key).filter(Boolean)
        }
      }
    } else {
      return {
        type: DataTypes.STRING,
        defaultValue: def.join(','),
        get: (): string[] => {
          return this.getDataValue(key).split(',').filter(Boolean)
        },
        set: (data: string[] = def) => {
          this.setDataValue(key, data.join(','))
        }
      }
    }
  }

  static JsonColumn(key: string, def: { [key: string]: any } = {}) {
    if (dbset.dialect === 'postgres') {
      return {
        type: DataTypes.JSONB,
        defaultValue: def
      }
    } else {
      return {
        type: DataTypes.STRING,
        defaultValue: JSON.stringify(def),
        get: (): { [key: string]: any } => {
          let data = this.getDataValue(key)
          try {
            data = JSON.parse(data) || def
          } catch (e) {
            data = def
          }
          return data
        },
        set: (data: { [key: string]: any }) => {
          this.setDataValue(key, JSON.stringify(data))
        }
      }
    }
  }

  static async addColumn(model: any, column: string[]) {
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

  static async changeColumn(model: any, column: string[]) {
    const name = model.name.replace(/DB$/, 's')
    const queryInterface = sequelize.getQueryInterface()
    for (let key of column) {
      await queryInterface.changeColumn(name, key, model.COLUMNS[key])
    }
  }

  static initDB(model: any, columns: { [key: string]: any }) {
    model.init(columns, {
      sequelize,
      tableName: model.name.replace(/DB$/, 's')
    })
    model.COLUMNS = columns
  }
}

export { sequelize }