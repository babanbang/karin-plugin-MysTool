import fs from 'fs'
import path from 'path'

export const KarinPath = process.cwd()

export const getNpmPath = (PATH: string, r = 0) => {
	const _path = path.dirname(
		path.resolve(
			decodeURI(PATH.replace(/^file:\/\/(?:\/)?/, '../'.repeat(r))),
			...Array(r).fill('..')
		)
	).replace(/\\/g, '/')
	const name = path.basename(_path)

	let npmPath = path.join(KarinPath, 'node_modules', name.toLowerCase())
	if (!fs.existsSync(npmPath)) {
		return { npmPath: _path, name, isNpm: false }
	}

	return { npmPath, name: name.toLowerCase(), isNpm: true }
}

export const { npmPath: NpmPath, isNpm } = getNpmPath(import.meta.url, 2)

export const PluginName = 'Karin-Plugin-MysTool'