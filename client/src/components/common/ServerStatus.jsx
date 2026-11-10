import { useCallback, useEffect, useState } from 'react'
import { RefreshCw } from 'lucide-react'
import { checkServer } from '../../services/api'

// Small connection indicator: tells at a glance whether the API (and its database) can be reached.
const ServerStatus = () => {
  const [state, setState] = useState({ s: 'checking' })

  const run = useCallback(async () => {
    setState({ s: 'checking' })
    try {
      const h = await checkServer()
      setState(h.db === 'disconnected' ? { s: 'db' } : { s: 'ok' })
    } catch (e) {
      setState({ s: 'down' })
    }
  }, [])

  useEffect(() => { run() }, [run])

  const view = {
    checking: ['bg-yellow-400 animate-pulse', 'Connecting to the server...', 'text-yellow-300'],
    ok: ['bg-green-400', 'Server connected', 'text-green-300'],
    db: ['bg-red-400', 'Server is up but the database is not connected', 'text-red-300'],
    down: ['bg-red-400', 'Server not reachable', 'text-red-300'],
  }[state.s]

  return (
    <div className="mt-5 text-center text-xs">
      <div className={`inline-flex items-center gap-2 ${view[2]}`}>
        <span className={`w-2 h-2 rounded-full ${view[0]}`} />
        {view[1]}
        {(state.s === 'down' || state.s === 'db') && (
          <button type="button" onClick={run} className="inline-flex items-center gap-1 text-gold-300 hover:text-gold-200 underline">
            <RefreshCw size={11} /> retry
          </button>
        )}
      </div>
    </div>
  )
}

export default ServerStatus