const fs = require('fs');
const stylis = require('stylis');

process.argv.splice(0,2);

if(process.argv.length !== 2) {
  console.log('usage: node run generate-styles <input_css_file> <output_css_file>');
  process.exit(0);
}

const [inputFile, outputFile] = process.argv;

fs.readFile(inputFile, 'utf8', (err, text) => {
  const css = stylis()
})

