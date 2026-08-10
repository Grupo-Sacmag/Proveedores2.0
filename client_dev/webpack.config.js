const path = require('path');

module.exports = {
  entry: './src/index.js',  // El punto de entrada de tu aplicación Angular
  output: {
    filename: 'bundle.js',  // Nombre del archivo de salida
    path: path.resolve(__dirname, 'dist'),  // Carpeta de salida
  },
  module: {
    rules: [
      {
        test: /\.js$/,  // Archivos JavaScript
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',  // Puedes necesitar instalar babel-loader y configurar Babel
        },
      },
      // Agrega reglas para otros tipos de archivos según tus necesidades (CSS, imágenes, etc.)
    ],
  },
};
