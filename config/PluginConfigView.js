import { Data } from "#MysTool/utils"
const plugins = []
Data.readdir('lib/components').forEach(p => {
  if (Data.exists(`lib/components/${p}/index.js`)) {
    plugins.push({ name: p, value: p })
  }
})

const config = [{
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
      key: '额外组件',
      comment: '自行选择需要启用的插件组件',
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
      key: '图片渲染精度(0 - 100)',
      comment: '大部分图片渲染时的精度',
      path: 'quality',
      type: 'number'
    }, {
      key: '数据库',
      comment: '存储数据的数据库（默认使用sqlite，一般使用sqlite就足够满足需求）',
      path: 'dialect',
      type: 'select',
      multiple: false,
      item: [
        { name: 'sqlite', value: 'sqlite' },
        { name: 'PostgreSQL', value: 'postgres' }
      ]
    }, {
      key: 'PostgreSQL数据库配置',
      comment: '数据库选择PostgreSQL(postgres)时才需要配置',
      path: 'postgres',
      type: 'group',
      part: [
        {
          key: '数据库地址',
          comment: '默认 localhost',
          path: 'postgres.host',
          type: 'text',
        }, {
          key: '数据库端口',
          comment: '默认 5432',
          path: 'postgres.prot',
          type: 'text',
        }, {
          key: '创建的数据库名',
          comment: '默认 mystool',
          path: 'postgres.database',
          type: 'text',
        }, {
          key: '用户名',
          comment: '默认 postgres',
          path: 'postgres.username',
          type: 'text',
        }, {
          key: '密码',
          comment: '如使用此数据库请修改',
          path: 'postgres.password',
          type: 'text',
        }
      ]
    }
  ]
}]

export default config