import { Manager, MCEvent } from '@managed-components/types'
import * as cheerio from 'cheerio'

type TElement = {
  attributes: { [name: string]: string }
  content?: string | null
}

// see https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/MIME_types#textjavascript
const JS_MIME_TYPES = [
  '',
  'text/javascript',
  'application/javascript',
  'application/ecmascript',
  'application/x-ecmascript',
  'application/x-javascript',
  'text/ecmascript',
  'text/javascript1.0',
  'text/javascript1.1',
  'text/javascript1.2',
  'text/javascript1.3',
  'text/javascript1.4',
  'text/javascript1.5',
  'text/jscript',
  'text/livescript',
  'text/x-ecmascript',
  'text/x-javascript',
]

const headTagAppender = (tag: string, attributes: TElement['attributes']) =>
  `const el = document.createElement('${tag}');Object.entries(JSON.parse(decodeURIComponent(\`${encodeURIComponent(
    JSON.stringify(attributes)
  )}\`))).forEach(([k, v]) => {el.setAttribute(k, v);});document.head.appendChild(el);`

export const handler = ({ payload, client }: MCEvent) => {
  try {
    const $ = cheerio.load(payload.htmlCode, null, false)
    const scripts: TElement[] = []
    $('script').each((_, el) => {
      if (!el.attribs.type || JS_MIME_TYPES.includes(el.attribs.type)) {
        scripts.push({ attributes: el.attribs, content: $(el).html() })
        $(el).remove()
      }
    })

    const links: TElement[] = []
    $('link').map((_, el) => {
      links.push({ attributes: el.attribs })
      $(el).remove()
    })

    client.execute(
      `const d = document.createElement('div');d.innerHTML = \`${$.html()
        .trim()
        .replaceAll('$', '\\$')}\`;document.body.appendChild(d);`
    )

    links.forEach(({ attributes }) => {
      client.execute(headTagAppender('link', attributes))
    })

    const wait_for: string[] = []
    scripts.forEach(({ content, attributes }) => {
      if (attributes?.src) {
        if (!attributes?.onload) {
          attributes.onload = ''
        }
        if (!attributes.async || attributes.defer) {
          const order_id = crypto.randomUUID()
          attributes['order-id'] = order_id
          wait_for.push(order_id)
          attributes.onload += `{document.dispatchEvent(new Event("loaded-${order_id}"))}`
        }
        client.execute(headTagAppender('script', attributes))
      } else if (content) {
        if (wait_for.length) {
          content = `{const loaded = ${JSON.stringify(
            Object.fromEntries(wait_for.map(id => [id, false]))
          )};
let called = false;
const call_if_ready = ()=>{if(!called && Object.values(loaded).every(e=>e)){{${content}}; called = true}};
${wait_for.map(
  id =>
    `document.addEventListener("loaded-${id}", ()=>{loaded["${id}"] = true; call_if_ready()})`
)}}`
        }
        client.execute(content)
      }
    })
  } catch (e) {
    console.log(`Custom HTML error: ${e}`)
  }
}

export default async function (manager: Manager) {
  manager.addEventListener('event', handler)
}
