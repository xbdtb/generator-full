const yaml = require('js-yaml');
const fs = require('fs');

function getReplaceConfig(filePath) {
  const data = fs.readFileSync(filePath, 'utf8');
  const replaceConfig = yaml.safeLoad(data);
  return replaceConfig;
}

function removePlaceHolder(src, name) {
  const lines = src.split('\n');
  let lineNumber = -1;
  let lineCount = 1;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const matches = line.match(name);
    if (matches && matches.length > 0) {

      if (i - 1 >= 0 && lines[i - 1] === '') {
        lineNumber = i - 1;
        lineCount = 2;
      } else {
        lineNumber = i;
      }
      break;
    }
  }
  if (lineNumber >= 0) {
    lines.splice(lineNumber, lineCount);
  }
  src = lines.join('\n');
  return src;
}

function removePlaceHolders(src, placeHolders) {
  for (let name in placeHolders) {
    src = removePlaceHolder(src, name);
  }
  console.log(src);
  return src;
}

function replacePlaceHolder(src, name, value) {
  const lines = src.split('\n');
  let lineNumber = -1;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const matches = line.match(name);
    if (matches && matches.length > 0) {
      lineNumber = i;
      break;
    }
  }
  if (lineNumber >= 0) {
    lines[lineNumber] = value;
  }
  src = lines.join('\n');
  return src;
}

function replacePlaceHolders(src, placeHolders, remove = false) {
  if (remove) {
    return removePlaceHolders(src, placeHolders);
  } else {
    for (let name in placeHolders) {
      let value = placeHolders[name];
      valueLines = value.split('\n');
      if (valueLines.length > 0 && valueLines[0] === '##') {
        valueLines.splice(0, 1);
      }
      if (valueLines.length > 0 && valueLines[valueLines.length - 1] === '') {
        valueLines.splice(valueLines.length - 1, 1);
      }
      src = replacePlaceHolder(src, name, valueLines.join('\n'));
    }
    console.log(src);
    return src;
  }
}

function test() {
  const replaceConfig = getReplaceConfig('./templates/.replace.config.yaml');
  const src = fs.readFileSync('./templates/server/index.ts', 'utf8');
  console.log(replaceConfig.redisSessionIndex);

  // replacePlaceHolders(src, replaceConfig.redisSessionIndex);
  removePlaceHolders(src, replaceConfig.redisSessionIndex);
}

module.exports = {
  getReplaceConfig,
  replacePlaceHolders
};

// test();

