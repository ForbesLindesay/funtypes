'use client'

import { Fragment } from 'react'
import { Highlight } from 'prism-react-renderer'

export function Fence({
  children,
  language,
}: {
  children: string
  language: string
}) {
  return (
    <Highlight
      code={
        children.includes(`// --header end--\n`)
          ? children.split(`// --header end--\n`)[1].trim()
          : children.trim()
      }
      language={language}
      theme={{ plain: {}, styles: [] }}
    >
      {({ className, style, tokens, getTokenProps }) => (
        <pre className={className + ' relative'} style={style}>
          {children.trimStart().startsWith('import ') ? (
            <button
              type="button"
              className="absolute top-0 right-0 p-2"
              onClick={() => {
                localStorage.setItem(
                  'funtypes-playground-code',
                  `import * as assert from "assert";\n` +
                    children
                      .replace(/\/\/ --header end--\n/g, '')
                      .replace(/\n\n+/g, '\n\n')
                      .trim() +
                    '\n',
                )
                location.assign('/playground')
              }}
            >
              Open in playground
            </button>
          ) : null}
          <code className="text-xs md:text-sm">
            {tokens.map((line, lineIndex) => (
              <Fragment key={lineIndex}>
                {line
                  .filter((token) => !token.empty)
                  .map((token, tokenIndex) => (
                    <span key={tokenIndex} {...getTokenProps({ token })} />
                  ))}
                {'\n'}
              </Fragment>
            ))}
          </code>
        </pre>
      )}
    </Highlight>
  )
}
