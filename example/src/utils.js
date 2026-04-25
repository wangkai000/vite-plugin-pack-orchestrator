export function format(text) {
  return `[${new Date().toISOString()}] ${text}`;
}

export function log(message) {
  console.log(format(message));
}
