import path from 'path'

export const getDirPath = (PATH) => {
  return path.dirname(
    path.resolve('/', decodeURI(PATH.replace(/^file:\/\/(?:\/)?/, '')))
  ).replace(/\\/g, '/')
}

export const dirPath = getDirPath(import.meta.url)

export const PluginName = path.basename(dirPath)

logger.info(`${PluginName} 插件初始化~`)
