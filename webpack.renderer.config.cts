const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');

const rendererConfig = {
  // Add these two properties
  entry: './src/renderer.tsx',
  output: {
    filename: 'renderer.js',
    path: __dirname + '/.webpack/renderer',
  },
  module: {
    rules: [
      {
        test: /\.node$/,
        use: 'node-loader',
      },
      {
        test: /\.tsx?$/,
        exclude: /(node_modules|\.webpack)/,
        use: {
          loader: 'ts-loader',
          options: {
            transpileOnly: true,
          },
        },
      },
      {
        test: /\.css$/,
        use: [{ loader: 'style-loader' }, { loader: 'css-loader' }],
      },
      // Add a rule for handling image files
      {
        test: /\.(png|jpg|jpeg|gif|svg)$/i,
        type: 'asset/resource',
      },
    ],
  },
  plugins: [
    new ForkTsCheckerWebpackPlugin({
      logger: 'webpack-infrastructure',
    }),
  ],
  resolve: {
    extensions: ['.js', '.ts', '.jsx', '.tsx', '.css'],
  },
  target: 'web',
  devServer: {
    port: 3000,
  },
}

export = { rendererConfig };