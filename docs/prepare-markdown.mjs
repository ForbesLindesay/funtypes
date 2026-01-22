import { readdirSync, readFileSync, statSync, writeFileSync } from 'fs'
import { format } from 'prettier/standalone'
import * as prettierTypeScript from 'prettier/plugins/typescript'
import prettierEstree from 'prettier/plugins/estree'

function wrapComments(code, printWidth) {
  const lines = code.split('\n')
  const formattedLines = []
  for (const line of lines) {
    if (line.length <= printWidth) {
      formattedLines.push(line)
    } else if (line.startsWith('// ✅ ') || line.startsWith('// 🚨 ')) {
      const words = line.split(' ')
      let currentLine = ''
      for (const word of words) {
        if (!currentLine) {
          currentLine = word
        } else if ((currentLine + ' ' + word).length > printWidth) {
          formattedLines.push(currentLine)
          currentLine = `//    ${word}`
        } else {
          currentLine += ' ' + word
        }
      }
      formattedLines.push(currentLine)
    } else {
      formattedLines.push(line)
    }
  }
  return formattedLines.join('\n').trim()
}
async function formatCode(code, language) {
  if (language === 'ts' || language === 'typescript') {
    const formatted = await format(code, {
      parser: 'typescript',
      plugins: [prettierEstree, prettierTypeScript],
      printWidth: 50,
    })
    return wrapComments(formatted, 50).trim()
  }
  return code.trim()
}
async function formatMarkdown(src) {
  const blocks = src.split('```')
  let output = ''
  output += blocks[0]
  for (let i = 1; i < blocks.length; i += 2) {
    const [language, ...code] = blocks[i].split('\n')
    output +=
      '```' +
      language +
      '\n' +
      (await formatCode(code.join('\n'), language)) +
      '\n```' +
      (blocks[i + 1] ?? '')
  }
  return output
}
async function formatDirectory(path) {
  for (const name of readdirSync(path)) {
    const fullPath = `${path}/${name}`
    if (name.endsWith('.md')) {
      const src = readFileSync(fullPath, 'utf8')
      try {
        writeFileSync(fullPath, await formatMarkdown(src))
      } catch (error) {
        console.error(`Error formatting ${fullPath}:`, error.message)
        process.exit(1)
      }
    } else if (statSync(fullPath).isDirectory()) {
      await formatDirectory(fullPath)
    }
  }
}

await formatDirectory('src/app')
