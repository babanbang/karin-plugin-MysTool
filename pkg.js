import fs from 'fs'

const main = () => {
  /** 不符合规则的启动方式 */
  if (!process.argv?.[2] === '--type' || !process.argv?.[3]) {
    console.error('[pkg] 请使用正确的启动方式：npm run addpkg 或 npm run delpkg')
    process.exit(1)
  }

  /** 新增node-karin开发依赖 */
  if (process.argv[3] === 'add') {
    const pkg = JSON.parse(fs.readFileSync('./package.json', 'utf8'))
    pkg.devDependencies['node-karin'] = 'latest'
    fs.writeFileSync('./package.json', JSON.stringify(pkg, null, 2))
    console.log('[pkg] 已添加node-karin依赖')
  } else if (process.argv[3] === 'del') {
    /** 准备推送npm 删除所有开发依赖 */
    const pkg = JSON.parse(fs.readFileSync('./package.json', 'utf8'))
    delete pkg.devDependencies
    fs.writeFileSync('./package.json', JSON.stringify(pkg, null, 2))
    console.log('[pkg] 已删除所有开发依赖')
  }
}

main()
