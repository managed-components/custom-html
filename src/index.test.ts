import { handler } from './index'
import { MCEvent } from '@managed-components/types'

describe('custom-html', () => {
  it('executes html injection', () => {
    const executedJS: string[] = []
    const fakeEvent = new Event('pageview', {}) as MCEvent
    fakeEvent.payload = {
      htmlCode: `<p>some text</p>
      <script>console.log('Log from MC')</script>
      <script src="./src"></script>
      <script type="application/json">{}</script>
`,
    }
    fakeEvent.client = {
      emitter: 'browser',
      userAgent:
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/107.0.0.0 Safari/537.36',
      language: 'en-US',
      referer: '',
      ip: '127.0.0.1',
      url: new URL('http://127.0.0.1:1337'),
      execute: jsString => {
        executedJS.push(jsString)
        return true
      },
    }
    handler(fakeEvent)
    expect(executedJS).toHaveLength(3)
    expect(executedJS[0]).toEqual(
      "const d = document.createElement('div');d.innerHTML = `<p>some text</p>\n" +
        '      \n' +
        '      \n' +
        '      <script type="application/json">{}</script>`;document.body.appendChild(d);'
    )
    expect(executedJS[1]).toEqual(`console.log('Log from MC')`)
    expect(executedJS[2]).toEqual(
      `const el = document.createElement('script');Object.entries(JSON.parse(\`{"src":"./src"}\`)).forEach(([k, v]) => {el.setAttribute(k, v);});document.head.appendChild(el);`
    )
  })

  it('properly escapes the html to prevent script injection', () => {
    const executedJS: string[] = []
    const fakeEvent = new Event('pageview', {}) as MCEvent
    fakeEvent.payload = {
      htmlCode: `\${alert(🦔)}`,
    }
    fakeEvent.client = {
      emitter: 'browser',
      userAgent:
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/107.0.0.0 Safari/537.36',
      language: 'en-US',
      referer: '',
      ip: '127.0.0.1',
      url: new URL('http://127.0.0.1:1337'),
      execute: jsString => {
        executedJS.push(jsString)
        return true
      },
    }
    handler(fakeEvent)
    expect(executedJS[0]).toEqual(
      "const d = document.createElement('div');d.innerHTML = `\\${alert(🦔)}`;document.body.appendChild(d);"
    )
  })
})
