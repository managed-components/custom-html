import { handler } from './index'
import { MCEvent } from '@managed-components/types'

describe('custom-html works correctly', () => {
  const executedJS: string[] = []
  const fakeEvent = new Event('pageview', {}) as MCEvent
  fakeEvent.payload = {
    htmlCode: `<script>console.log("Success!")</script>`,
  }
  fakeEvent.client = {
    emitter: 'browser',
    userAgent:
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/107.0.0.0 Safari/537.36',
    language: 'en-US',
    referer: '',
    ip: '127.0.0.1',
    url: new URL('http://127.0.0.1:1337'),
    fetch: () => undefined,
    set: () => undefined,
    execute: jsString => {
      executedJS.push(jsString)
      return true
    },
    return: () => {},
    get: () => undefined,
    attachEvent: () => {},
    detachEvent: () => {},
  }
  handler(fakeEvent)
  it('executes html injection', () => {
    expect(executedJS).toHaveLength(1)
    expect(executedJS[0]).toEqual(
      `zaraz.i(\`${escape(fakeEvent.payload.htmlCode)}\`);`
    )
  })
})
