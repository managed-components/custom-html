import { Manager, MCEvent } from '@managed-components/types'

export const handler = (event: MCEvent) => {
  event.client.execute(`zaraz.i(\`${escape(event.payload.htmlCode)}\`);`)
}

export default async function (manager: Manager) {
  manager.addEventListener('pageview', handler)
}
