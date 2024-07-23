import path from 'path'

export const getDir = (PATH: string, r: number = 0) => {
  const _path = path.dirname(
    path.resolve('/', decodeURI(PATH.replace(/^file:\/\/(?:\/)?/, '../'.repeat(r))))
  ).replace(/\\/g, '/')

  return {
    path: _path,
    name: path.basename(_path)
  }
}

export const { path: dirPath, name: PluginName } = getDir(import.meta.url, 2)