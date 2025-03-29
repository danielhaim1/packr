// src/js/app.js

import { add, subtract } from './utils/math.js';
import { capitalize, reverseString } from './utils/string.js';
import { header } from './components/header.js';
import { footer } from './components/footer.js';

const num1 = 5;
const num2 = 3;
console.log(`Add: ${add(num1, num2)}`);
console.log(`Subtract: ${subtract(num1, num2)}`);

const text = "hello world!";
console.log(`Capitalized: ${capitalize(text)}`);
console.log(`Reversed: ${reverseString(text)}`);

header(); // Component usage
footer(); // Component usage