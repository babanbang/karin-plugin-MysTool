import fs from 'fs'
import path from 'path'

export const getDir = (PATH) => {
  const _path = path.dirname(
    path.resolve('/', decodeURI(PATH.replace(/^file:\/\/(?:\/)?/, '')))
  ).replace(/\\/g, '/')

  return {
    path: _path,
    name: path.basename(_path)
  }
}

export const getDirName = (PATH) => path.basename(PATH)

export const { path: dirPath, name: PluginName } = getDir(import.meta.url)

const copyFolderContents = (src, dest) => {
  const entries = fs.readdirSync(src, { withFileTypes: true })

  entries.forEach(entry => {
    const srcPath = path.join(src, entry.name)
    const destPath = path.join(dest, entry.name)

    if (entry.isDirectory()) {
      if (!fs.existsSync(destPath)) {
        fs.mkdirSync(destPath, { recursive: true })
      }
      copyFolderContents(srcPath, destPath)
    } else {
      fs.renameSync(srcPath, destPath)
    }
  })
}

const compath = dirPath + '/lib/components/'
if (!fs.existsSync(compath)) {
  fs.mkdirSync(compath)
}

// /** 迁移组件至lib目录 */
// const oldcompath = dirPath + '/components/'
// if (fs.existsSync(oldcompath)) {
//   logger.info(`${PluginName} 转移组件至 ${compath}`)
//   copyFolderContents(oldcompath, compath)
//   fs.rmSync(oldcompath, { recursive: true, force: true })
// }

if (fs.existsSync(dirPath + '/apps/index.js')) {
  fs.unlinkSync(dirPath + '/apps/index.js')
}

// /** 迁移旧数据 */
// const old_dataPath = dirPath + '/data/'
// const new_dataPath = './data/' + PluginName + '/'
// if (fs.existsSync(old_dataPath)) {
//   logger.info(`${PluginName} 转移数据至 ${new_dataPath}`)
//   copyFolderContents(old_dataPath, new_dataPath)
//   fs.rmSync(old_dataPath, { recursive: true, force: true })
// }

logger.info(`${PluginName} 插件初始化~`)
