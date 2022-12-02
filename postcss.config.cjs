module.exports = (config) => {
  const postcssPresetEnv = require('postcss-preset-env');

  const isProduction = config.env === 'production';
  const plugins = [postcssPresetEnv()];

  if (isProduction) {
    plugins.push(require('cssnano'));
  }

  return {
    plugins,
    map: {
      inline: false,
    },
  };
};