/**
 * Generate Warhammer 40K themed favicon from skull SVG
 */

import { Resvg } from '@resvg/resvg-js'
import sharp from 'sharp'
import * as fs from 'fs'
import * as path from 'path'

async function generateFavicon() {
  const svgPath = path.join(process.cwd(), 'public/icons/warhammer/skull.svg')
  let svgContent = fs.readFileSync(svgPath, 'utf8')

  // Add white fill to path for visibility
  svgContent = svgContent.replace('<path d=', '<path fill="#FFFFFF" d=')

  // Render SVG to PNG at 256x256
  const resvg = new Resvg(svgContent, {
    fitTo: {
      mode: 'width',
      value: 256
    }
  })

  const pngData = resvg.render()
  const pngBuffer = pngData.asPng()

  // Create different sizes for favicon
  const sizes = [16, 32, 48]
  const images: Buffer[] = []

  for (const size of sizes) {
    const resized = await sharp(pngBuffer)
      .resize(size, size)
      .png()
      .toBuffer()
    images.push(resized)
  }

  // Use png-to-ico to create ICO file
  // Since ico-endec might not work, let's just copy the 32x32 PNG as favicon
  const favicon32 = await sharp(pngBuffer)
    .resize(32, 32)
    .png()
    .toBuffer()

  // For now, save as PNG and we'll convert manually
  const outputPath = path.join(process.cwd(), 'src/app/favicon.png')
  fs.writeFileSync(outputPath, favicon32)

  // Also create ICO using sharp's built-in support
  const icoPath = path.join(process.cwd(), 'src/app/favicon.ico')

  // Create a multi-resolution ICO file manually
  // ICO header: 6 bytes
  // ICO directory entry: 16 bytes per image
  // Image data: PNG data for each size

  const numImages = sizes.length
  const headerSize = 6 + (16 * numImages)

  const pngBuffers: Buffer[] = []
  for (const size of sizes) {
    const png = await sharp(pngBuffer)
      .resize(size, size)
      .png()
      .toBuffer()
    pngBuffers.push(png)
  }

  // Calculate total size
  let totalSize = headerSize
  for (const buf of pngBuffers) {
    totalSize += buf.length
  }

  // Create ICO buffer
  const icoBuffer = Buffer.alloc(totalSize)
  let offset = 0

  // ICO header
  icoBuffer.writeUInt16LE(0, offset) // Reserved
  offset += 2
  icoBuffer.writeUInt16LE(1, offset) // Type (1 = ICO)
  offset += 2
  icoBuffer.writeUInt16LE(numImages, offset) // Number of images
  offset += 2

  // Calculate data offsets
  let dataOffset = headerSize

  // ICO directory entries
  for (let i = 0; i < numImages; i++) {
    const size = sizes[i]
    const pngBuf = pngBuffers[i]

    icoBuffer.writeUInt8(size < 256 ? size : 0, offset) // Width
    offset += 1
    icoBuffer.writeUInt8(size < 256 ? size : 0, offset) // Height
    offset += 1
    icoBuffer.writeUInt8(0, offset) // Color palette
    offset += 1
    icoBuffer.writeUInt8(0, offset) // Reserved
    offset += 1
    icoBuffer.writeUInt16LE(1, offset) // Color planes
    offset += 2
    icoBuffer.writeUInt16LE(32, offset) // Bits per pixel
    offset += 2
    icoBuffer.writeUInt32LE(pngBuf.length, offset) // Size of image data
    offset += 4
    icoBuffer.writeUInt32LE(dataOffset, offset) // Offset to image data
    offset += 4

    dataOffset += pngBuf.length
  }

  // Write image data
  for (const pngBuf of pngBuffers) {
    pngBuf.copy(icoBuffer, offset)
    offset += pngBuf.length
  }

  fs.writeFileSync(icoPath, icoBuffer)

  console.log('✅ Favicon generated successfully!')
  console.log(`   - ${icoPath}`)
  console.log(`   - Sizes: ${sizes.join('x, ')}px`)
}

generateFavicon().catch(console.error)
