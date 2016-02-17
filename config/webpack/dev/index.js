import webpack from 'webpack';

export default {
  target: 'web',
  module: {
    loaders: [
      {
        test: /\.json$/,
        exclude: /node_modules/,
        loader: 'json-loader',
      },
      {
        test: /\.js$/,
        loader: 'source-map-loader',
      },
    ],
    plugins: [
      new webpack.DefinePlugin({
        'process.env': {
          NODE_ENV: JSON.stringify('development'),
        },
      }),
      new webpack.ProvidePlugin({
        'Promise': 'bluebird',
      }),
      new webpack.optimize.DedupePlugin(),
    ],
    node: {
      console: true,
      fs: 'empty',
      net: 'empty',
      tls: 'empty',
    },
  },
  debug: 'true',
  devtool: 'eval',
};
