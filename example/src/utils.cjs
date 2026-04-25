// CJS 模块（会被插件转换为 ESM）
function format(text) {
  return `[${new Date().toISOString()}] ${text}`;
}

function log(message) {
  console.log(format(message));
}

module.exports = {
  format,
  log
};
