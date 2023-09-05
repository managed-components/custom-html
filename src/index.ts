import { Manager, MCEvent } from '@managed-components/types'
import * as cheerio from 'cheerio'

type TElement = {
  attributes: { [name: string]: string }
  content?: string | null
}

const headTagAppender = (tag: string, attributes: TElement['attributes']) =>
  `const el = document.createElement('${tag}');Object.entries(JSON.parse(\`${JSON.stringify(
    attributes
  )}\`)).forEach(([k, v]) => {el.setAttribute(k, v);});document.head.appendChild(el);`

export const handler = ({ payload, client }: MCEvent) => {
  try {
    const $ = cheerio.load(payload.htmlCode, null, false)
    const scripts: TElement[] = []
    $('script').each((_, el) => {
      scripts.push({ attributes: el.attribs, content: $(el).html() })
      $(el).remove()
    })

    const links: TElement[] = []
    $('link').map((_, el) => {
      links.push({ attributes: el.attribs })
      $(el).remove()
    })

    client.execute(
      `const d = document.createElement('div');d.innerHTML = \`${$.html().trim()}\`;document.body.appendChild(d);`
    )

    links.forEach(({ attributes }) => {
      client.execute(headTagAppender('link', attributes))
    })

    scripts.forEach(({ content, attributes }) => {
      if (attributes?.src) {
        client.execute(headTagAppender('script', attributes))
      } else if (content) {
        client.execute(content)
      }
    })
  } catch (e) {
    console.log(`Custom HTML error: ${e}`)
  }
}

export default async function (manager: Manager) {
  manager.addEventListener('pageview', handler)
}
