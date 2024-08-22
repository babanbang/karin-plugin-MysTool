import { ConfigName } from '@/types'
import { Cfg, Data, GamePathType, karinPath } from '@/utils'
import { DataTypes, Model, Op, Sequelize, Dialect } from 'sequelize'
const dbset = Cfg.getConfig(ConfigName.config, GamePathType.Core)

const SequelizeSet: Partial<Record<Dialect, any>> = {
	sqlite: {
		storage: Data.createDir('db/data.db', GamePathType.Core, karinPath.data),
		dialect: 'sqlite',
	},
	postgres: {
		host: 'localhost',
		port: 5432,
		database: 'postgres',
		username: 'postgres',
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

export class DbBaseModel extends Model {
	static DIALECT = SequelizeSet[dbset.dialect]?.dialect || 'sqlite'
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

	static ArrayColumn(key: string, options: {
		def?: string[],
		fn?: (data: string[]) => string[]
	} = {}) {
		const { def = [], fn = false } = options
		if (dbset.dialect === 'postgres') {
			return {
				type: DataTypes.JSONB,
				defaultValue: def,
				get: (): string[] => {
					return this.getDataValue(key).filter(Boolean)
				},
				set: (data: string[] = def) => {
					this.setDataValue(key, fn ? fn(data) : data)
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
					this.setDataValue(key, (fn ? fn(data) : data).join(','))
				}
			}
		}
	}

	static JsonColumn(key: string, def: Record<string, any> = {}) {
		if (dbset.dialect === 'postgres') {
			return {
				type: DataTypes.JSONB,
				defaultValue: def
			}
		} else {
			return {
				type: DataTypes.STRING,
				defaultValue: JSON.stringify(def),
				get: (): Record<string, any> => {
					let data = this.getDataValue(key)
					try {
						data = JSON.parse(data) || def
					} catch (e) {
						data = def
					}
					return data
				},
				set: (data: Record<string, any>) => {
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

	static initDB(model: any, columns: Record<string, any>) {
		model.init(columns, {
			sequelize,
			tableName: model.name.replace(/DB$/, 's')
		})
		model.COLUMNS = columns
	}
}

export { sequelize }
