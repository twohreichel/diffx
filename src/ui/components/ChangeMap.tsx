import { Map as MapIcon, X } from 'lucide-react'
import type { SymbolKind } from '../../map/attribute'
import { TAG_FILTERS, type FileGroup, type MapFilter, type SymbolEntry, type TagFilter } from '../../map/buildChangeMap'

interface ChangeMapProps {
  groups: FileGroup[]
  filter: MapFilter
  onFilterChange: (patch: Partial<MapFilter>) => void
  onSelect: (entry: SymbolEntry) => void
  onClose: () => void
}

const KIND_LABELS: Record<SymbolKind, string> = {
  function: 'fn',
  method: 'method',
  class: 'class',
  type: 'type',
  toplevel: 'file',
  other: 'other',
}

const TAG_LABELS: Record<TagFilter, string> = {
  all: 'All kinds',
  added: 'Added',
  removed: 'Removed',
  modified: 'Modified',
  moved: 'Moved',
  'structurally-unchanged': 'Only reformatted',
}

const UNNAMED = 'No symbol patterns for this language — the file counts as one entry.'

function EntryRow({ entry, onSelect }: { entry: SymbolEntry; onSelect: (entry: SymbolEntry) => void }) {
  return (
    <li className="cm-entry">
      <button
        className="cm-entry-button"
        title={`${entry.file}:${entry.firstChangedLine}`}
        onClick={() => onSelect(entry)}
      >
        <span className="cm-kind">{KIND_LABELS[entry.kind]}</span>
        <span className="cm-name">{entry.name}</span>
        {entry.added > 0 && <span className="cm-added">+{entry.added}</span>}
        {entry.removed > 0 && <span className="cm-removed">-{entry.removed}</span>}
        <span className="cm-bar">
          <span className="cm-bar-fill" style={{ width: `${Math.round(entry.magnitude * 100)}%` }} />
        </span>
        <span className="cm-tags">
          {entry.tags.map((tag) => (
            <span key={tag} className={`cm-tag cm-tag-${tag}`}>
              {tag}
            </span>
          ))}
        </span>
      </button>
    </li>
  )
}

/** The changed symbols of the whole diff, grouped by file and sized against each other. */
export function ChangeMap({ groups, filter, onFilterChange, onSelect, onClose }: ChangeMapProps) {
  return (
    <aside className="cm">
      <div className="cm-header">
        <MapIcon size={14} />
        <span className="cm-title">Change map</span>
        <button className="cm-close" onClick={onClose} title="Close the change map" aria-label="Close the change map">
          <X size={14} />
        </button>
      </div>
      <div className="cm-filters">
        <input
          className="cm-filter-path"
          type="text"
          placeholder="Filter path..."
          value={filter.path}
          onChange={(e) => onFilterChange({ path: e.target.value })}
        />
        <select
          className="cm-filter-tag"
          aria-label="Change kind"
          value={filter.tag}
          onChange={(e) => onFilterChange({ tag: e.target.value as TagFilter })}
        >
          {TAG_FILTERS.map((tag) => (
            <option key={tag} value={tag}>
              {TAG_LABELS[tag]}
            </option>
          ))}
        </select>
      </div>
      {groups.length === 0 ? (
        <p className="cm-empty">No symbol matches the filter.</p>
      ) : (
        <ul className="cm-list">
          {groups.map((group) => (
            <li key={group.path} className="cm-group">
              <div className="cm-file">
                <span className="cm-file-path" title={group.path}>
                  {group.path}
                </span>
                <span className="cm-file-counts">
                  +{group.added} -{group.removed}
                </span>
              </div>
              {!group.named && <p className="cm-notice">{UNNAMED}</p>}
              <ul className="cm-entries">
                {group.entries.map((entry) => (
                  <EntryRow key={`${entry.kind}:${entry.name}`} entry={entry} onSelect={onSelect} />
                ))}
              </ul>
            </li>
          ))}
        </ul>
      )}
    </aside>
  )
}
