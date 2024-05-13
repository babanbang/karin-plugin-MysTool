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
  fs.copyFileSync(dirPath + '/components/index_default.js', jsPath)
}
logger.info(`${PluginName} 插件初始化~`)
