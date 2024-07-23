import { logger } from "node-karin";
import { fs } from "node-karin/modules.js";
import { PluginName, dirPath, getDir } from "./dir.js";
const KarinPath = getDir(import.meta.url, 4).path;
export const Data = new (class Data {
    #GamePath = {
        gs: PluginName + '-Genshin/',
        sr: PluginName + '-StarRail/',
        zzz: PluginName + '-ZZZero/',
        sign: PluginName + '-MysSign/',
        core: PluginName
    };
    /**
     * 获取文件路径，返回的路径不以/结尾
     */
    getFilePath(file, options = {}) {
        if (new RegExp(KarinPath).test(file))
            return file;
        file = file.replace(/(^\/|\/$)/g, '');
        if (file)
            file += '/';
        if (options.k)
            return KarinPath + `/${options.k}/${PluginName}` + file;
        if (options.m_path)
            return getDir(options.m_path).path + file;
        return dirPath + file;
    }
    /**
     * 根据指定的path依次检查与创建目录
     */
    createDir(path, options = {}) {
        let file = '/';
        const dirpath = options.k ? (KarinPath + `/${options.k}/${PluginName}`) : dirPath;
        if (/\.(yaml|json|js|html|db)$/.test(path)) {
            const idx = path.lastIndexOf('/') + 1;
            file += path.substring(idx);
            path = path.substring(0, idx);
        }
        path = path.replace(/^\/+|\/+$/g, '');
        if (fs.existsSync(dirpath + '/' + path)) {
            return dirpath + '/' + path + file;
        }
        let nowPath = dirpath + '/';
        path.split('/').forEach(name => {
            nowPath += name + '/';
            if (!fs.existsSync(nowPath)) {
                fs.mkdirSync(nowPath);
            }
        });
        return nowPath + file;
    }
    copyFile(copy, target, options = {}) {
        const copyFile = this.getFilePath(copy, options);
        const targetFile = this.createDir(target, options);
        fs.copyFileSync(copyFile, targetFile);
    }
    readJSON(file, options = {}) {
        const path = this.getFilePath(file, options);
        if (fs.existsSync(path)) {
            try {
                return JSON.parse(fs.readFileSync(path, 'utf8'));
            }
            catch (e) {
                logger.error(`JSON数据错误: ${path}`);
                logger.error(e);
            }
        }
        return options.defData;
    }
    addGamePath(file, game) {
        this.#GamePath[game] = file;
    }
    /** 获取组件目录，返回的路径以/结尾 */
    getGamePath(game, isData = false) {
        if (isData)
            return (this.#GamePath[game] || PluginName).replace(new RegExp(PluginName + '-?', 'gi'), '');
        return this.#GamePath[game] || PluginName;
    }
    async importModule(file, options = {}) {
        const path = this.getFilePath(file, options);
        if (fs.existsSync(path)) {
            try {
                const module = await import(`file://${path}?t=${Date.now()}`) || {};
                return { module: module?.[options.module || 'default'], path };
            }
            catch (e) {
                logger.error(e);
            }
        }
        logger.error(`不存在: ${path}`);
        return { module: options.defData, path };
    }
});
