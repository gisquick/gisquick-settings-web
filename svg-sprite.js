const fs = require('fs')
const path = require('path')
const { optimize } = require('svgo')
const { parseSvg } = require('svgo/lib/parser')
const { stringifySvg } = require('svgo/lib/stringifier')
const JsAPI = require('svgo/lib/svgo/jsAPI')

const opts = {
  plugins: [
    'preset-default',
    { name: 'removeDoctype', active: true },
    { name: 'removeDesc', active: true },
    { name: 'mergePaths', active: true },
    { name: 'removeDimensions', active: true } // important
  ]
}

function allFiles (dirPath) {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true })
  return entries.reduce((list, dirent) => {
    if (dirent.isFile()) {
      list.push(path.join(dirPath, dirent.name))
    } else {
      list.push(...allFiles(path.join(dirPath, dirent.name)))
    }
    return list
  }, [])
}

function directFiles (dirPath) {
  return fs.readdirSync(dirPath, { withFileTypes: true })
    .filter(dirent => dirent.isFile())
    .map(dirent => path.join(dirPath, dirent.name))
}

async function buildSprite (dirPaths) {
  // const svgs = recursive ? allFiles(dirPath) : directFiles(dirPath)
  const svgs = dirPaths.reduce((list, dirPath) => list.concat(directFiles(dirPath)), [])
  const symbols = []
  const ids = new Set()
  for (const filename of svgs) {
    const id = path.basename(filename, '.svg')
    if (!ids.has(id)) {
      const data = fs.readFileSync(filename, 'utf8')
      const result = await optimize(data, opts)
      const el = parseSvg(result.data)
      const svg = el.children[0]
      svg.name = 'symbol'
      svg.attributes = {
        id,
        viewBox: svg.attributes.viewBox
      }
      symbols.push(svg)
      ids.add(id)
    } else {
      console.log('Skipping duplicate icon:', id)
    }
  }
  const svg = new JsAPI({
    type: 'root',
    children: [new JsAPI({
      type: 'element',
      name: 'svg',
      attributes: {
        'xmlns': 'http://www.w3.org/2000/svg',
        'xmlns:xlink': 'http://www.w3.org/1999/xlink',
        'width': 0,
        'height': 0,
        'style': 'position: absolute'
      },
      children: [new JsAPI({
        type: 'element',
        name: 'defs',
        children: symbols
      })]
    })]
  })
  return stringifySvg(svg).data
}

// export default (config) => {
module.exports = (config) => { // allows to run this script as node command
  return {
    name: 'html-transform',
    async transformIndexHtml (html, ctx) {
      const page = path.basename(path.dirname(ctx.filename))
      if (config[page]) {
        const sprite = await buildSprite(config[page])
        // const sprite = await buildSprite(directory)
        return html.replace('<!-- svg-sprite -->', sprite)
      }
    }
  }
}

// Create svg sprite from svg icons folder(s)
// Example: node svg-sprite.js icons/text-editor src/assets/text-editor.svg
async function main () {
  const paths = process.argv.slice(2)
  const dest = paths.pop()
  if (paths.length < 1) {
    console.error('Not enough argmunets')
  } else {
    const sprite = await buildSprite(paths)
    fs.writeFileSync(dest, sprite)
  }
}

if (require.main === module) {
  main()
}

/*
// Dynamic import of svg sprite icons
import icons from '@/assets/text-editor.svg?raw'

function injectIcons () {
  if (!document.getElementById('text-editor-sprite')) {
    const placeholder = document.createElement('div')
    placeholder.innerHTML = icons
    const node = placeholder.firstElementChild
    node.setAttribute('id', 'text-editor-sprite')
    document.body.insertAdjacentElement('afterbegin', node)
  }
  // document.body.insertAdjacentHTML('afterbegin', icons)
}
injectIcons()
*/
