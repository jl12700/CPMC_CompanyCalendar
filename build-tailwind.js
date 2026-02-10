// build-tailwind.js
import fs from 'fs';
import postcss from 'postcss';
import tailwindcss from 'tailwindcss';

const input = fs.readFileSync('./src/index.css', 'utf8');

const result = await postcss([tailwindcss]).process(input, { from: './src/index.css', to: './dist/output.css' });
fs.writeFileSync('./dist/output.css', result.css);

console.log('Tailwind CSS built successfully!');
