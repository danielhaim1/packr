// src/js/utils/string.js

export function capitalize(str) {
	return str.charAt(0).toUpperCase() + str.slice(1);
     }
     
     export function reverseString(str) {
	return str.split('').reverse().join('');
     }
     