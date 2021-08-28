const fs = require('fs');
const path = require('path');
const exec = require('child_process').exec;

const utils = {
  generateUuid(len = 32, radix = 10) {
    const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'.split('');
    const uuid = []; let i;
    radix = radix || chars.length;

    if (len) {
      // Compact form
      for (i = 0; i < len; i++) uuid[i] = chars[0 | Math.random() * radix];
    } else {
      // rfc4122, version 4 form
      let r;

      // rfc4122 requires these characters
      uuid[8] = uuid[13] = uuid[18] = uuid[23] = '-';
      uuid[14] = '4';

      // Fill in random data.  At i==19 set the high bits of clock sequence as
      // per rfc4122, sec. 4.1.5
      for (i = 0; i < 36; i++) {
        if (!uuid[i]) {
          r = 0 | Math.random() * 16;
          uuid[i] = chars[(i == 19) ? (r & 0x3) | 0x8 : r];
        }
      }
    }

    return uuid.join('');
  },

  *sleep(time) {
    yield new Promise((resolve, reject) => {
      setTimeout(() => {
        resolve()
      }, time)
    })
  },

  formatJSON2String(jsonObj) {
    let str = JSON.stringify(jsonObj, "", "\t")
    // let str = JSON.stringify(jsonObj,null,"\t")
    return str
  },
  //同步删除文件夹
  delDir(path) {
    let files = [];
    if (fs.existsSync(path)) {
      files = fs.readdirSync(path);
      files.forEach((file, index) => {
        let curPath = path + "/" + file;
        if (fs.statSync(curPath).isDirectory()) {
          utils.delDir(curPath); //递归删除文件夹
        } else {
          fs.unlinkSync(curPath); //删除文件
        }
      });
      fs.rmdirSync(path);
    }
  },

  //文件替换内容
  fileReplace(path, regexp, content) {
    fs.readFile(path, 'utf8', (err, files) => {
      var result = files.replace(regexp, content);
      fs.writeFile(path, result, 'utf8', (err) => {
        if (err) return console.log(err);
      });
    })
  },

  //文件夹替换内容
  dirReplace(dirpath, regexp, content) {
    let fileList = fs.readdirSync(dirpath);
    fileList.forEach(x => {
      let p = path.resolve(dirpath, x);
      let pinfo = fs.statSync(p);
      if (pinfo.isFile()) {
        utils.fileReplace(p, regexp, content);
      } else if (pinfo.isDirectory()) {
        utils.dirReplace(p, regexp, content);
      }
    });
    // fs.rmdirSync(dirpath);
  },

  //递归创建目录 同步方法  
  mkdirsSync(dirname) {
    if (fs.existsSync(dirname)) {
      return true;
    } else {
      if (utils.mkdirsSync(path.dirname(dirname))) {
        fs.mkdirSync(dirname);
        return true;
      }
    }
  },

  //同步复制
  _copy(src, dist) {
    var paths = fs.readdirSync(src)
    paths.forEach((p) => {
      var _src = src + '/' + p;
      var _dist = dist + '/' + p;
      var stat = fs.statSync(_src)
      if (stat.isFile()) {// 判断是文件还是目录
        fs.writeFileSync(_dist, fs.readFileSync(_src));
      } else if (stat.isDirectory()) {
        utils.copyDir(_src, _dist)// 当是目录是，递归复制
      }
    })
  },

  //同步复制文件夹
  copyDir(src, dist) {
    var b = fs.existsSync(dist)
    if (!b) {
      utils.mkdirsSync(dist);//创建目录
    }
    utils._copy(src, dist);
  },

  //执行命令
  execCmd(shell, successCb = () => { }, errorCb = () => { }) {
    return new Promise((resolve, reject) => {
      exec(shell, {
        encoding: 'utf8'
      }, (error, statusbar) => {
        if (error) {
          errorCb(error)
          resolve(false);
        }
        successCb()
        resolve(true);
      });
    });
  }
}

module.exports = utils



































// yield coFs.mkdir(distDir + pageName);
// yield coFs.writeFile(distDir + pageName + '/index.js', '');
// yield copyDir('templates/smartpage', distDir + pageName);


//co基本用法
// co(function* () {
//   var result = yield Promise.resolve(true);
//   return result;
// }).then((value) {
//   console.log(value);
// }, (err) {
//   console.error(err.stack);
// });

//用户命令行
// var userName = readlineSync.question('May I have your name? ');
// var favFood = readlineSync.question('What is your favorite food? ', {
//   hideEchoBack: true
// });
