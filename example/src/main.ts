// ESM 导入示例
import { add, multiply } from './math.js';

// CJS 风格代码（会被插件自动转换）
const utils = require('./utils.cjs');

console.log('Add:', add(1, 2));
console.log('Multiply:', multiply(3, 4));
console.log('Utils:', utils.format('Hello'));
