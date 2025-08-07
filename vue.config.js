const { defineConfig } = require('@vue/cli-service')
module.exports = defineConfig({
  transpileDependencies: true,
devServer: {
          proxy: {
              '/instances': {
                  target: 'http://127.0.0.1:8042/',
                  changeOrigin: true,
                  pathRewrite: { '^/instances': '/instances' },
              },
          },
      },
})
