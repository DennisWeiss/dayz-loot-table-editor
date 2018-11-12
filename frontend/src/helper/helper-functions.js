const hashOfString = str => {
  let hashValue = 0
  for (let i = 0; i < str.length; i++) {
    hashValue += str.charCodeAt(i) * Math.pow(256, i)
  }
  return hashValue
}

export {hashOfString}