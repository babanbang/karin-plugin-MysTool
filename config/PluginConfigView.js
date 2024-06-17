import { Data } from "#MysTool/utils"
const plugins = (Data.readdir('components')).map(p => { return { name: p, value: p } })

export default [{
  name: 'MysTool通用配置',
  file: 'set.yaml',
  priority: 0,
  view: [
    {
      key: '米游社公共CK',
      comment: '查询米游社数据时是否只使用自己绑定的CK',
      path: 'onlySelfCk',
      type: 'boolean',
    }, {
      key: '国际服代理',
      comment: '米游社国际服、Enka面板代理',
      path: 'proxy',
      type: 'group',
      part: [
        {
          key: '代理地址',
          comment: '代理服务器链接地址，例：http://127.0.0.1',
          path: 'proxy.host',
          type: 'url'
        },
        {
          key: '代理地址端口',
          comment: '代理地址端口(1 - 65535)',
          path: 'proxy.port',
          type: 'number'
        }
      ]
    }, {
      key: '额外功能',
      comment: '填写components中的文件夹名',
      path: 'plugins',
      type: 'select',
      multiple: true,
      item: plugins
    }, {
      key: 'wkhtmltoimage渲染',
      comment: '使用wkhtmltoimage渲染图片(建议优先使用puppeteer渲染)',
      path: 'wkhtmltoimage',
      type: 'boolean'
    }, {
      key: 'wkhtmltoimage渲染图片的资源端口',
      comment: '使用wkhtmltoimage渲染图片的端口(填写端口时资源使用http路径、重启后生效)',
      path: 'wkhtmltoimagePort',
    }, {
      key: '图片渲染精度(0 - 100)',
      comment: '大部分图片渲染时的精度',
      path: 'quality',
      type: 'number'
    }
  ]
}]