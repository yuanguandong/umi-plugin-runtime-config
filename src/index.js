import chokidar from 'chokidar';
import fs from 'fs';
import path from 'path';
const { NODE_ENV } = process.env;

//获取模块名
let subModules = fs
  .readdirSync(path.join(__dirname, '../src/pages'), { withFileTypes: true })
  .filter((item) => !item.name.includes('.') && (item.isSymbolicLink() || item.isDirectory())); // 过滤掉文件
  

// 生成运行时的config[config.js]
const generRunningConfigs = (api) => {
  let orders = [];
  let configStr = ``;
  if (!fs.existsSync(path.join(__dirname, `../src/.temp`))) {
    fs.mkdirSync(path.join(__dirname, `../src/.temp`));
  }
  // 子模块
  subModules.forEach((_module) => {
    // 子模块配置
    let moduleConfig;
    // 兼容找不到config.js的情况
    try {
      // 路径
      let realPath;
      if (_module.isSymbolicLink()) {
        let linkPath = fs.readlinkSync(path.join(__dirname, '../src/pages', _module.name));
        let isAbsolutePath = /^([A-Z]\:\\|\/)/.test(linkPath);
        realPath = isAbsolutePath
          ? path.join(fs.readlinkSync(path.join(__dirname, '../src/pages', _module.name)), 'config.js')
          : path.join(__dirname, '../src/pages', fs.readlinkSync(path.join(__dirname, '../src/pages', _module.name)), 'config.js');
      } else {
        realPath = path.join(__dirname, '../src/pages', _module.name, 'config.js');
      }
      let fileStr = fs.readFileSync(realPath, { encoding: 'utf-8' });
      let [_, order] = fileStr.match(/const\s+ORDER\s?=\s?(\d+)+/);
      fs.writeFileSync(path.join(__dirname, `../src/.temp/config${order}.js`), fileStr);
      orders.push(`config${order}`);
      configStr += `\nimport config${order} from './config${order}'`;
    } catch (e) {}
  });
  configStr += `\nexport default [${orders.join(',')}]`;
  fs.writeFileSync(path.join(__dirname, `../src/.temp/index.js`), configStr);
};

export default (api) => {
  generRunningConfigs(api);
  if (NODE_ENV === 'production') {
    return;
  }
  const watchFilesPath = subModules.reduce(
    (total, module) =>
      total.concat([
        path.join(__dirname, `../src/pages/${module.name}/config.js`),
      ]),
    [],
  );
  const watcher = chokidar.watch(watchFilesPath);
  watcher.on('change', (filePath) => {
    generRunningConfigs(api);
  });
  process.on('exit', function () {
    watcher.close();
  });
};
