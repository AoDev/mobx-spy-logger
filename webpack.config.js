const path = require('path')
const DIST_FOLDER = path.resolve(__dirname, 'dist')

module.exports = {
  mode: 'production',
  entry: './lib/mobx-spy-logger.js',
  optimization: {
    minimize: false
  },
  externals: {
    lodash: {
      commonjs: 'lodash',
      commonjs2: 'lodash',
      amd: 'lodash',
      root: '_',
    },
    mobx: {
      commonjs: 'mobx',
      commonjs2: 'mobx',
      amd: 'mobx',
      root: 'mobx',
    },
  },
  output: {
    path: DIST_FOLDER,
    filename: 'mobx-spy-logger.js',
    library: 'mobxSpyLogger',
    libraryTarget: 'umd',
  }
}
