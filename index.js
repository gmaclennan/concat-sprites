var runParallel = require('run-parallel')

function concatSprites (sprites, callback) {
  if (!Array.isArray(sprites)) {
    throw new Error('must be called with an array of sprites to concatenate')
  }
  if (sprites.filter(function (s) { return s.url && s.json }).length === 0) {
    throw new Error('Each sprite must be an object with `url` and `json` props')
  }

  loadSprites(sprites, function (err, sprites) {
    if (err) return callback(err)
    var images = sprites.map(function (s) { return s.img })
    concatImages(images, function (imageBlob) {
      var spriteJson = concatSpriteJson(sprites)
      callback(null, {blob: imageBlob, json: spriteJson})
    })
  })
}

function loadSprite (s, callback) {
  var img = s.img = document.createElement('img')
  img.onload = callback.bind(null, null, s)
  img.onerror = callback
  img.crossOrigin = 'anonymous'
  img.src = s.url
}

function loadSprites (sprites, callback) {
  runParallel(sprites.map(function (s) {
    return loadSprite.bind(null, s.url)
  }), callback)
}

function concatImages (images, callback) {
  var totalWidth = images.reduce(function (p, i) { return p + i.width }, 0)
  var maxHeight = images.reduce(function (p, i) { return p > i.height ? p : i.height }, 0)

  var canvas = document.createElement('canvas')
  canvas.width = totalWidth
  canvas.height = maxHeight
  var ctx = canvas.getContext('2d')
  var x = 0

  for (var i = 0; i < images.length; i++) {
    ctx.drawImage(images[i], x, 0)
    x += images[i].width
  }

  canvas.toBlob(callback)
}

function concatSpriteJson (sprites) {
  var json
  var newSpriteJson = Object.assign({}, sprites[0].json)
  var x = sprites[0].width
  for (var i = 1; i < sprites.length; i++) {
    json = sprites[i].json
    for (var j in json) {
      if (!json.hasOwnProperty(j)) continue
      newSpriteJson[j] = Object.assign({}, json[j], {x})
    }
  }
  return newSpriteJson
}

module.exports = concatSprites
