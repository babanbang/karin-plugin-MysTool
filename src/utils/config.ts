import { CfgType, ConfigName, ConfigsType } from '@/types'
import { logger } from 'node-karin'
import { yaml as Yaml, chokidar, fs, lodash, path as PATH } from 'node-karin/modules.js'
import { Data, GamePathType, karinPath } from './Data'
import { NpmPath } from './dir'

export const Cfg = new (class Config {
	#config: Map<string, any> = new Map()
	#packages: Map<string, any> = new Map()
	#watcher: Map<string, chokidar.FSWatcher> = new Map()
	constructor() {
		this.initCfg(GamePathType.Core, NpmPath)
	}

	/** 初始化配置 */
	async initCfg(game: GamePathType, npmPath: string) {
		Data.setNpmPath(game, npmPath)

		const defSetPath = Data.getFilePath(`config`, game, karinPath.node)
		if (!fs.existsSync(defSetPath)) return false

		const configPath = Data.getFilePath('', game, karinPath.config)
		const files = fs.readdirSync(defSetPath).filter(file => file.endsWith('.yaml'))
		files.forEach((file) => {
			const fileName = file.replace('.yaml', '') as ConfigName

			if (![ConfigName.lables].includes(fileName)) {
				const cPath = PATH.join(configPath, file)
				if (!fs.existsSync(cPath)) {
					Data.copyFile(cPath, file, game, karinPath.config)
				} else {
					this.setConfig(fileName, game, this.getConfig(fileName, game))
				}
			} else {
				this.getdefSet(fileName, game, true)
			}
			this.getdefSet(fileName, game)
		})
	}

	package(game: GamePathType) {
		if (this.#packages.has(game)) return this.#packages.get(game)

		const pkg = Data.readJSON('package.json', game, karinPath.node)
		this.#packages.set(game, pkg)

		return pkg
	}

	/** 获取用户配置 */
	getConfig<N extends ConfigName, G extends GamePathType>(name: N, game: G): ConfigsType<N, G> {
		return { ...this.getdefSet(name, game), ...this.#getYaml(CfgType.config, name, game) }
	}

	/** 获取默认配置 */
	getdefSet<N extends ConfigName, G extends GamePathType>(name: N, game: G, Document: true): Yaml.Document<Yaml.ParsedNode, true>
	getdefSet<N extends ConfigName, G extends GamePathType>(name: N, game: G): ConfigsType<N, G>
	getdefSet<N extends ConfigName, G extends GamePathType>(name: N, game: G, Document = false) {
		if (Document) {
			const defSet = this.#getYaml(CfgType.defSet, name, game, true)
			return Yaml.parseDocument(defSet.toString())
		}
		return { ...this.#getYaml(CfgType.defSet, name, game) }
	}

	/** 修改用户配置 */
	setConfig(name: ConfigName, game: GamePathType, data: any) {
		const ConfigPath = this.getConfigPath(CfgType.config, game, name)
		const defSetPath = this.getConfigPath(CfgType.defSet, game, name)

		let config: string
		if (fs.existsSync(defSetPath)) {
			const defSet = this.getdefSet(name, game, true)
			lodash.forEach(data, (value, key) => {
				if (defSet.hasIn([key])) {
					defSet.setIn([key], value)
				} else {
					defSet.deleteIn([key])
				}
			})
			config = defSet.toString()
		} else {
			config = Yaml.stringify(data)
		}

		fs.writeFileSync(ConfigPath, config, 'utf8')
	}

	/** 获取配置yaml */
	#getYaml(type: CfgType, name: ConfigName, game: GamePathType, Document: true): Yaml.Document<Yaml.ParsedNode, true>
	#getYaml<N extends ConfigName, G extends GamePathType>(type: CfgType, name: N, game: G): ConfigsType<N, G>
	#getYaml(type: CfgType, name: ConfigName, game: GamePathType, Document = false) {
		const file = this.getConfigPath(type, game, name)
		const key = `${type}.${game}.${name}`

		if (this.#config.has(key)) {
			const cfg = this.#config.get(key)
			return Document ? cfg : cfg.toJSON()
		}

		try {
			const cfg = Yaml.parseDocument(fs.readFileSync(file, 'utf8'))
			this.#config.set(key, cfg)

			this.#watch(file, key)
			return Document ? cfg : cfg.toJSON()
		} catch (error) {
			const PluginName = Data.getPluginName(game)
			logger.error(`[${PluginName}][${key}] 格式错误 ${error}`)
			throw error
		}
	}

	/** 获取配置路径 */
	getConfigPath(type: CfgType, game: GamePathType, name: string) {
		if (type === CfgType.config) {
			return Data.getFilePath(`${name}.yaml`, game, karinPath.config)
		} else {
			return Data.getFilePath(`config/${name}.yaml`, game, karinPath.node)
		}
	}

	/** 监听配置文件 */
	#watch(file: string, key: string) {
		if (this.#watcher.has(key)) return

		const watcher = chokidar.watch(file)
		watcher.on('change', () => {
			if (key.includes('config')) {
				this.#config.delete(key)
				const [type, game, name] = key.split('.') as [CfgType, GamePathType, ConfigName]
				const PluginName = Data.getPluginName(game)
				logger.mark(`[${PluginName}修改配置文件][${key}]`)
			}
		})

		this.#watcher.set(key, watcher)
	}
})