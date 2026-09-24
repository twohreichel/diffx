import { useEffect } from 'react'
import { X } from 'lucide-react'
import type { Definition } from '../../definitions'

interface DefinitionPopupProps {
  name: string
  loading: boolean
  definitions: Definition[]
  onClose: () => void
  onJump: (definition: Definition) => void
}

export function DefinitionPopup({ name, loading, definitions, onClose, onJump }: DefinitionPopupProps) {
  useEffect(() => {
    const close = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', close)
    return () => document.removeEventListener('keydown', close)
  }, [onClose])

  return (
    <div className="dp" role="dialog" aria-label={`Declarations of ${name}`}>
      <div className="dp-header">
        <span className="dp-name">{name}</span>
        <button className="dp-close" aria-label="Close the definition popup" onClick={onClose}>
          <X size={14} />
        </button>
      </div>
      {loading && <p className="dp-notice">Searching the repository…</p>}
      {!loading && definitions.length === 0 && <p className="dp-notice">{`No declaration of “${name}” found.`}</p>}
      <ul className="dp-list">
        {definitions.map((definition) => (
          <li key={`${definition.path}:${definition.line}`}>
            <button className="dp-entry" onClick={() => onJump(definition)}>
              <span className="dp-where">{`${definition.path}:${definition.line}`}</span>
              <span className="dp-kind">{definition.kind}</span>
            </button>
            <pre className="dp-code">{definition.lines.join('\n')}</pre>
          </li>
        ))}
      </ul>
    </div>
  )
}
