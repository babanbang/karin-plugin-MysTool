import fs from 'fs'
import path from 'path'
import YAML from 'yaml'

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

const compath = dirPath + '/components/'
if (!fs.existsSync(compath)) {
  fs.mkdirSync(compath)
}

/** 创建 appss/index.js */
const txt = []
let plugins = []
const filesAndFolders = fs.readdirSync(compath)
const folders = filesAndFolders.filter(item => {
  return fs.statSync(compath + item).isDirectory()
})
if (fs.existsSync(dirPath + '/config/config/set.yaml')) {
  plugins = (YAML.parse(fs.readFileSync(dirPath + '/config/config/set.yaml', 'utf8'))).plugins || {}
}
for (const folder of folders) {
  if (plugins.length > 0 && !plugins.includes(folder)) continue
  txt.unshift(`export * from '../components/${folder}/index.js'`)
}
fs.writeFileSync(dirPath + '/apps/index.js', (txt.join('\n') || 'export const a = 1') + '\n', 'utf8')


/** 迁移旧数据 */
const old_dataPath = dirPath + '/data/'
const new_dataPath = './data/' + PluginName + '/'
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
if (fs.existsSync(old_dataPath)) {
  logger.info(`${PluginName} 转移数据至 ${new_dataPath}`)
  copyFolderContents(old_dataPath, new_dataPath)
  fs.rmSync(old_dataPath, { recursive: true, force: true })
}

logger.info(`${PluginName} 插件初始化~`)
