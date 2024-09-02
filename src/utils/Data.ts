import { logger } from "node-karin"
import { fs, lodash, path as PATH } from 'node-karin/modules.js'
import { KarinPath, NpmPath, PluginName } from "./dir"

export const enum karinPath {
	config = 'config/plugin',
	node = 'node_modules',
	data = 'data',
	temp = 'temp'
}

interface Options {
	/** 读取数据失败时的默认值 */
	defData?: {} | []
	/** 读取模块时的指定模块名 */
	module?: string
}

export enum GamePathType {
	gs = 'gs', sr = 'sr', zzz = 'zzz', Sign = 'sign', Core = 'core'
}

export const Data = new (class Data {
	#GamePluginName: Record<GamePathType, string> = {
		[GamePathType.gs]: PluginName + '-Genshin',
		[GamePathType.sr]: PluginName + '-StarRail',
		[GamePathType.zzz]: PluginName + '-ZZZero',
		[GamePathType.Sign]: PluginName + '-MysSign',
		[GamePathType.Core]: PluginName
	}
	#GameNpmPath: Record<GamePathType, string> = {
		[GamePathType.gs]: PATH.join(KarinPath, karinPath.node, 'karin-plugin-mystool-genshin'),
		[GamePathType.sr]: PATH.join(KarinPath, karinPath.node, 'karin-plugin-mystool-starrail'),
		[GamePathType.zzz]: PATH.join(KarinPath, karinPath.node, 'karin-plugin-mystool-zzzero'),
		[GamePathType.Sign]: PATH.join(KarinPath, karinPath.node, 'karin-plugin-mystool-myssign'),
		[GamePathType.Core]: NpmPath
	}
	/** 
	 * 获取文件或文件夹路径
	 */
	getFilePath(file: string, game: GamePathType, k_path: karinPath, ckeck: true): string | false
	getFilePath(file: string, game: GamePathType, k_path: karinPath, ckeck?: false): string
	getFilePath(file: string, game: GamePathType, k_path: karinPath, ckeck = false) {
		if (k_path === karinPath.node) {
			return PATH.join(this.getNpmPath(game), file).replace(/\\/g, '/')
		}
		const filePath = PATH.join(KarinPath, `${k_path}/${this.getPluginName(game, true)}`, file)
		if (ckeck) {
			return fs.existsSync(filePath) ? filePath.replace(/\\/g, '/') : false
		}
		return filePath.replace(/\\/g, '/')
	}
	/** 
	 * 根据指定的path依次检查与创建目录
	 */
	createDir(path: string, game: GamePathType, k_path: karinPath) {
		let file = '/'
		const createDirPath = PATH.join(KarinPath, `/${k_path}/${this.getPluginName(game, true)}`)

		if (/\.(yaml|json|js|html|db)$/.test(path)) {
			const idx = path.lastIndexOf('/') + 1
			file += path.substring(idx)
			path = path.substring(0, idx)
		}

		path = path.replace(/^\/+|\/+$/g, '')
		if (fs.existsSync(PATH.join(createDirPath, path))) {
			return PATH.join(createDirPath, path, file).replace(/\\/g, '/')
		}

		let nowPath = createDirPath
		if (!fs.existsSync(nowPath)) {
			fs.mkdirSync(nowPath);
		}
		path.split('/').forEach(name => {
			nowPath = PATH.join(nowPath, name)
			if (!fs.existsSync(nowPath)) {
				fs.mkdirSync(nowPath)
			}
		})

		return PATH.join(nowPath, file).replace(/\\/g, '/')
	}

	copyFile(copyFile: string, target: string, game: GamePathType, k_path: karinPath) {
		const targetFile = this.createDir(target, game, k_path)
		fs.copyFileSync(copyFile, targetFile)
	}

	readJSON(file: string, game: GamePathType, k_path: karinPath, defData: Options['defData'] = {}) {
		const path = this.getFilePath(file, game, k_path)
		if (fs.existsSync(path)) {
			try {
				return JSON.parse(fs.readFileSync(path, 'utf8'))
			} catch (e) {
				logger.error(`JSON数据错误: ${path}`)
				logger.error(e)
			}
		}
		return defData
	}

	writeJSON(file: string, data: any, game: GamePathType, k_path: karinPath) {
		const path = this.createDir(file, game, k_path)
		fs.writeFileSync(path, JSON.stringify(data, null, 2))
		return path
	}

	setNpmPath(game: GamePathType, path: string, isNpm: boolean) {
		this.#GameNpmPath[game] = path
		if (isNpm) {
			this.#GamePluginName[game] = PATH.basename(path).replace(/(^|-)\w/g, (m) => m.toUpperCase())
		} else {
			this.#GamePluginName[game] = PATH.basename(path)
		}
	}

	getNpmPath(game: GamePathType) {
		return this.#GameNpmPath[game]
	}

	getPluginName(game: GamePathType, LowerCase = false) {
		if (LowerCase) return this.#GamePluginName[game].toLowerCase()
		return this.#GamePluginName[game]
	}

	async importModule(file: string, game: GamePathType, options: Options = {}) {
		const path = this.getFilePath(file, game, karinPath.node)
		if (fs.existsSync(path)) {
			try {
				const module = await import(`file://${path}?t=${Date.now()}`) || {}
				return { module: module?.[options.module || 'default'], path }
			} catch (e) {
				logger.error(e)
			}
		}
		logger.error(`不存在: ${path}`)
		return { module: options.defData, path }
	}

	getData<T extends string>(target: any, keysArr: T[]) {
		const ret: Partial<Record<T, any>> = {}

		lodash.forEach(keysArr, (key) => {
			const _key = key.split(':').map(k => k.trim())
			const key1 = _key[0] as T
			ret[key1] = lodash.get(target, _key[1] || key1)
		})
		return ret
	}
})