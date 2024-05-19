import fs from 'fs'
import path from 'path'

export const getDirPath = (PATH) => {
  return path.dirname(
    path.resolve('/', decodeURI(PATH.replace(/^file:\/\/(?:\/)?/, '')))
  ).replace(/\\/g, '/')
}

export const dirPath = getDirPath(import.meta.url)

export const PluginName = path.basename(dirPath)

const compath = dirPath + '/components/'
if (!fs.existsSync(compath)) {
  fs.mkdirSync(compath)
}

const jsPath = compath + 'index.js'
if (!fs.existsSync(jsPath)) {
  const txt = []
  const filesAndFolders = fs.readdirSync(compath)
  const folders = filesAndFolders.filter(item => {
    return fs.statSync(compath + item).isDirectory()
  })
  folders.forEach(f => {
    txt.unshift(`export * from './${f}/index.js'`)
  })
  fs.writeFileSync(jsPath, (txt.join('\n') || 'export const a = 1') + '\n', 'utf8')
}

logger.info(`${PluginName} 插件初始化~`)
