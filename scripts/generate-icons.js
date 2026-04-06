import sharp from 'sharp'
import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const svgBuffer = readFileSync(join(__dirname, '../public/icons/icon.svg'))
const out = p => join(__dirname, '../public/icons', p)

await Promise.all([
  sharp(svgBuffer).resize(192, 192).png().toFile(out('icon-192.png')),
  sharp(svgBuffer).resize(512, 512).png().toFile(out('icon-512.png')),
  sharp(svgBuffer).resize(180, 180).png().toFile(out('apple-touch-icon.png')),
])

console.log('Icons generated: icon-192.png, icon-512.png, apple-touch-icon.png')
