import fs from 'fs'
import path from 'path'

export const getDirPath = (PATH) => {
  return path.dirname(
    path.resolve('/', decodeURI(PATH.replace(/^file:\/\/(?:\/)?/, '')))
  ).replace(/\\/g, '/')
}

export const dirPath = getDirPath(import.meta.url)

export const PluginName = path.basename(dirPath)

const jsPath = dirPath + '/components/index.js'
if (!fs.existsSync(jsPath)) {
  const txt = []
  const filesAndFolders = fs.readdirSync(dirPath + '/components')
  const folders = filesAndFolders.filter(item => {
    return fs.statSync(dirPath + '/components/' + item).isDirectory()
  })
  folders.forEach(f => {
    txt.unshift(`export * from './${f}/index.js'`)
  })
  fs.writeFileSync(jsPath, (txt.join('\n') || 'export {}') + '\n', 'utf8')
}
logger.info(`${PluginName} 插件初始化~`)
