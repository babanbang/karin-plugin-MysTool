import { ConfigName } from '@/types'
import { exec } from 'child_process'
import fs from 'fs'
import { logger } from 'node-karin'
import art_template from 'node-karin/art-template'
import lodash from 'node-karin/lodash'
import { Cfg } from './config'
import { Data, GamePathType, karinPath } from './Data'
import { PluginName, dirPath } from './dir'

let wk = true
const config = Cfg.getConfig(ConfigName.config, GamePathType.Core)
if (config.wkhtmltoimage) {
  exec('wkhtmltoimage -h', (error, stdout) => {
    if (error) {
      logger.error(error)
      return
    }
    if (!/If\s+you\s+experience\s+bugs\s+or\s+want\s+to\s+request\s+new\s+features\s+please\s+visit/g.test(String(stdout))) {
      logger.error(PluginName + '未安装wkhtmltoimage，请安装后重启再使用！')
      wk = false
    }
  })
}
/**
 * wkhtmltoimage截图
 * @returns {Promise<string>} base64编码的图片字符串
 */
export async function wkhtmltoimage(data: any): Promise<string | false> {
  if (!wk) {
    logger.error(PluginName + '未安装wkhtmltoimage，请安装后重启再使用')
    return false
  }

  const start = Date.now()

  const savePath = dealTpl(data)
  if (!savePath) return false

  let command = 'wkhtmltoimage --enable-local-file-access --load-error-handling ignore --zoom 2.0 --enable-javascript --no-stop-slow-scripts'
  let options = `--quality ${data.quality > 88 ? 85 : data.quality}`

  let fullCommand = `${command} ${options} ${savePath} -`

  return new Promise((resolve, reject) => {
    // eslint-disable-next-line no-unused-vars
    exec(fullCommand, { encoding: 'buffer', maxBuffer: 1024 * 1024 * 100 }, (error, stdout, stderr) => {
      if (error) {
        if (/Maximum\s+supported\s+image\s+dimension/g.test(error.message)) {
          logger.error(`[图片过大，请缩小图片大小]${savePath}`)
        } else {
          logger.error(error.message)
        }
        reject(error.message)
      } else {
        const kb = (stdout.length / 1024).toFixed(2) + 'KB'
        logger.mark(`[wkhtmltoimage][图片生成][${data.name}] ${kb} ${logger.green(`${Date.now() - start}ms`)}`)
        resolve('base64://' + stdout.toString('base64'))
      }
    })
  })
}

/** 模板 */
function dealTpl(options: any) {
  const { name, file, fileID = name, data } = options
  data.useBrowser = '-wk'
  const path = `wk-html/${name.replace(new RegExp(`${PluginName}/`, 'g'), '')}/${fileID}.html`
  const savePath = Data.createDir(path, GamePathType.Core, karinPath.temp)

  const paths = ('../../../../' + lodash.repeat('../', path.split('/').length - 3)) + `plugins/${PluginName}/`

  try {
    /** 读取html模板 */
    const html = fs.readFileSync(file, 'utf8')
    /** 替换模板 */
    let tmpHtml = (art_template.render(html, data))?.replace?.(new RegExp(dirPath + '/', 'g'), paths)

    /** 保存模板 */
    fs.writeFileSync(savePath, tmpHtml)
  } catch (error) {
    logger.error(`加载html错误：${file}`)
    logger.error(error)
    return false
  }

  logger.debug(`[图片生成][使用模板] ${file}`)

  return savePath
}
