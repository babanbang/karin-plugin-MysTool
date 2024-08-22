import fs from "fs"
import { logger } from "node-karin"
import lodash from "node-karin/lodash"
import { PluginName } from "./dir"

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

const KarinPath = process.cwd().replace(/\\/g, '/')

export const Data = new (class Data {
	#GamePath: Record<GamePathType, string> = {
		[GamePathType.gs]: PluginName + '-Genshin/',
		[GamePathType.sr]: PluginName + '-StarRail/',
		[GamePathType.zzz]: PluginName + '-ZZZero/',
		[GamePathType.Sign]: PluginName + '-MysSign/',
		[GamePathType.Core]: PluginName + '/'
	}
	#LowGamePath: Record<GamePathType, string> = {
		[GamePathType.gs]: this.#GamePath[GamePathType.gs].toLowerCase(),
		[GamePathType.sr]: this.#GamePath[GamePathType.sr].toLowerCase(),
		[GamePathType.zzz]: this.#GamePath[GamePathType.zzz].toLowerCase(),
		[GamePathType.Sign]: this.#GamePath[GamePathType.Sign].toLowerCase(),
		[GamePathType.Core]: this.#GamePath[GamePathType.Core].toLowerCase()
	}
	/** 
	 * 获取文件或文件夹路径
	 */
	getFilePath(file: string, game: GamePathType, k_path: karinPath, ckeck: true): string | false
	getFilePath(file: string, game: GamePathType, k_path: karinPath, ckeck?: false): string
	getFilePath(file: string, game: GamePathType, k_path: karinPath, ckeck = false) {
		const filePath = KarinPath + `/${k_path}/${this.getGamePath(game, true)}` + file
		if (ckeck) return fs.existsSync(filePath) ? filePath : false
		return filePath
	}
	/** 
	 * 根据指定的path依次检查与创建目录
	 */
	createDir(path: string, game: GamePathType, k_path: karinPath) {
		let file = '/'
		const createDirPath = KarinPath + `/${k_path}/${this.getGamePath(game, true)}`

		if (/\.(yaml|json|js|html|db)$/.test(path)) {
			const idx = path.lastIndexOf('/') + 1
			file += path.substring(idx)
			path = path.substring(0, idx)
		}

		path = path.replace(/^\/+|\/+$/g, '')
		if (fs.existsSync(createDirPath + '/' + path)) {
			return createDirPath + '/' + path + file
		}

		let nowPath = createDirPath + '/'
		path.split('/').forEach(name => {
			nowPath += name + '/'
			if (!fs.existsSync(nowPath)) {
				fs.mkdirSync(nowPath)
			}
		})

		return nowPath + file
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

	getGamePath(game: GamePathType, LowerCase = false) {
		if (LowerCase) return this.#LowGamePath[game]
		return this.#GamePath[game]
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