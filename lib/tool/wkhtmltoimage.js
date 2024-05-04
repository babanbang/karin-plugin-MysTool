import { common } from '#Karin'
import { Cfg, Data, PluginName, dirPath } from '#Mys.tool'
import template from 'art-template'
import { exec } from 'child_process'
import express from 'express'
import fs from 'fs'
import http from 'http'
import _ from 'lodash'

const set = Cfg.getConfig('set')
const port = set.wkhtmltoimagePort
if (set.wkhtmltoimage) {
  const txt = await exec('wkhtmltoimage')
  if (!/You\s+need\s+to\s+specify\s+at\s+least\s+one\s+input\s+file/g.test(txt)) {
    logger.error(PluginName + '未安装wkhtmltoimage，请先安装')
  }
}
if (set.wkhtmltoimage && port) {
  const app = express()
  app.use('/', express.static('./'))
  app.use('/exit', req => {
    if (['::1', '::ffff:127.0.0.1'].includes(req.ip) || req.hostname == 'localhost') {
      process.exit(1)
    }
  })
  const server = http.createServer(app)
  server.on('error', err => {
    if (err.code === 'EADDRINUSE') {
      return serverEADDRINUSE()
    }
  })
  server.listen(port)

  async function serverEADDRINUSE () {
    try {
      await fetch(`http://localhost:${port}/exit`)
    } catch (err) {}
    await common.sleep(1000)
    server.listen(port)
    logger.info(`[wkhtmltoimage] http://localhost:${port} 被占用，尝试重启...`)
  }
}

// 导出异步函数
export async function wkhtmltoimage ({ name, data }) {
  const start = Date.now()

  const savePath = dealTpl(name, data)
  if (!savePath) return false

  let command = 'wkhtmltoimage --enable-local-file-access --load-error-handling ignore --zoom 2.0 --enable-javascript'
  let options = `--quality ${data.quality > 88 ? 85 : data.quality}`

  let fullCommand = `${command} ${options} ${port ? savePath.http : savePath.dir} -`

  return new Promise((resolve, reject) => {
    // eslint-disable-next-line no-unused-vars
    exec(fullCommand, { encoding: 'buffer', maxBuffer: 1024 * 1024 * 100 }, (error, stdout, stderr) => {
      if (error) {
        if (/Maximum\s+supported\s+image\s+dimension/g.test(error.message)) {
          logger.error(`[图片过大，请缩小图片大小]${savePath.dir}`)
        } else {
          logger.error(error.message)
        }
        reject(error.message)
      } else {
        const kb = (stdout.length / 1024).toFixed(2) + 'KB'
        logger.mark(`[wkhtmltoimage][图片生成][${name}] ${kb} ${logger.green(`${Date.now() - start}ms`)}`)
        fs.writeFileSync('./output_image.png', stdout)
        resolve('base64://' + stdout.toString('base64'))
      }
    })
  })
}

/** 模板 */
function dealTpl (name, data) {
  const { tplFile, saveId = name } = data
  const path = `temp/html/${name.replace(new RegExp(`${PluginName}/`, 'g'), '')}/${saveId}.html`
  const savePath = Data.createDir(path)

  const paths = port
    ? (`http://127.0.0.1:${port}/plugins/` + PluginName + '/')
    : ('../../' + _.repeat('../', path.split('/').length - 3))

  try {
    /** 读取html模板 */
    const html = fs.readFileSync(tplFile, 'utf8')
    /** 替换模板 */
    let tmpHtml = (template.render(html, data))?.replace(new RegExp(dirPath + '/', 'g'), paths)

    /** 保存模板 */
    fs.writeFileSync(savePath, tmpHtml)
  } catch (error) {
    logger.error(error)
    logger.error(`加载html错误：${tplFile}`)
    return false
  }

  logger.debug(`[图片生成][使用模板] ${savePath}`)

  return {
    http: `http://127.0.0.1:${port}${_.trim('./plugins/' + PluginName + '/' + path, '.')}`,
    dir: savePath
  }
}
