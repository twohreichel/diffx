import { useState, useMemo, useCallback, useEffect } from 'react'
import { Resizable } from 'react-resizable'
import { parsePatchFiles } from '@pierre/diffs'
import { Virtualizer } from '@pierre/diffs/react'
import type { FileDiffMetadata } from '@pierre/diffs'
import type { ReviewComment } from '../types'
import { FULL_CONTEXT_LINE_CAP, estimateTotalLines, stepContext, type ContextWidth } from '../context'
import { changeRegions, toggledFileMode, type ViewMode } from '../blink'
import type { MoveRun } from '../moves'
import { filterChangeMap, type MapFilter, type SymbolEntry } from '../map/buildChangeMap'
import { useDiff } from './hooks/useDiff'
import { useComments } from './hooks/useComments'
import { useSettings } from './hooks/useSettings'
import { useViewed } from './hooks/useViewed'
import { useFullDiffs, fileKey } from './hooks/useFullDiffs'
import { useShortcuts } from './hooks/useShortcuts'
import { useScrollAnchor } from './hooks/useScrollAnchor'
import { useBlink, usePrefersReducedMotion } from './hooks/useBlink'
import { useMoves } from './hooks/useMoves'
import { useChangeMap } from './hooks/useChangeMap'
import { entryTarget, jumpToMove } from './moveJump'
import { Toolbar } from './components/Toolbar'
import { DiffViewer } from './components/DiffViewer'
import { FileTree } from './components/FileTree'
import { ChangeMap } from './components/ChangeMap'
import { CommentTracker } from './components/CommentTracker'
import { DefinitionPopup } from './components/DefinitionPopup'
import { useDefinitions } from './hooks/useDefinitions'
import { symbolFromPath } from './symbolAt'
import type { Definition } from '../definitions'
import { SidebarStorage } from './sidebarStorage'

function useWindowSize({ factor }: { factor: number }) {
  const compute = () => Math.round(window.innerWidth * factor)

  const [size, setSize] = useState(compute)

  useEffect(() => {
    const handleResize = () => setSize(compute())
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [factor])

  return size
}

export function App() {
  const { settings, loaded, updateSettings } = useSettings()
  const blinkMode = settings.diffStyle === 'blink'
  const { patch, repoName, branch, customMode, binaryFiles, tabSizeMap, untrackedFiles, structural, loading, error } = useDiff({
    staged: settings.staged,
    untracked: settings.untracked,
    // Blink shows one complete state at a time, which only full context provides.
    context: blinkMode ? 'full' : settings.context,
  })
  const { comments, addComment, removeComment, editComment, setCommentStatus, copyAllComments } =
    useComments()
  const [activeFile, setActiveFile] = useState<string | null>(null)
  const [sidebar, setSidebar] = useState(() => SidebarStorage.load())
  const maxSidebarWidth = Math.max(SidebarStorage.minSize, useWindowSize({ factor: 0.5 }))

  const handleResize = useCallback((_e: React.SyntheticEvent, data: { size: { width: number } }) => {
    setSidebar((prev) => prev.withSize(data.size.width))
  }, [])

  const handleResizeStop = useCallback((_e: React.SyntheticEvent, data: { size: { width: number } }) => {
    setSidebar((prev) => prev.withSize(data.size.width).save())
  }, [])

  const handleToggleCollapse = useCallback(() => {
    setSidebar((prev) => prev.withCollapsed(!prev.collapsed).save())
  }, [])

  const untrackedSet = useMemo(() => new Set(untrackedFiles), [untrackedFiles])

  const files = useMemo(() => {
    if (!patch) return []
    try {
      const parsed = parsePatchFiles(patch)
      const parsedFiles = parsed.flatMap((p) => p.files)

      const existingNames = new Set(parsedFiles.map((f) => f.name))
      for (const bf of binaryFiles) {
        if (!existingNames.has(bf.path)) {
          const syntheticFile: FileDiffMetadata = {
            name: bf.path,
            type: bf.type === 'added' || bf.type === 'untracked' ? 'new' : bf.type === 'deleted' ? 'deleted' : 'change',
            hunks: [],
            splitLineCount: 0,
            unifiedLineCount: 0,
            isPartial: true,
            deletionLines: [],
            additionLines: [],
          }
          parsedFiles.push(syntheticFile)
        }
      }

      return parsedFiles
    } catch {
      return []
    }
  }, [patch, binaryFiles])

  const fullFiles = useFullDiffs(patch, files, { staged: settings.staged, untracked: settings.untracked })
  const displayFiles = useMemo(() => {
    if (fullFiles.size === 0) return files
    return files.map((f) => fullFiles.get(fileKey(f)) ?? f)
  }, [files, fullFiles])

  const { viewedFiles, setViewed } = useViewed(files)

  const diffStats = useMemo(() => {
    if (!patch) return { additions: 0, deletions: 0 }
    let additions = 0
    let deletions = 0
    for (const line of patch.split('\n')) {
      if (line.startsWith('+') && !line.startsWith('+++')) additions++
      else if (line.startsWith('-') && !line.startsWith('---')) deletions++
    }
    return { additions, deletions }
  }, [patch])

  const binaryFileMap = useMemo(() => {
    const map = new Map<string, (typeof binaryFiles)[number]>()
    for (const bf of binaryFiles) {
      map.set(bf.path, bf)
    }
    return map
  }, [binaryFiles])

  const commentCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const c of comments) {
      counts[c.filePath] = (counts[c.filePath] ?? 0) + 1
    }
    return counts
  }, [comments])

  const fileAnnotationsMap = useMemo(() => {
    const map = new Map<string, { side: ReviewComment['side']; lineNumber: number; metadata: ReviewComment }[]>()
    for (const c of comments) {
      let list = map.get(c.filePath)
      if (!list) {
        list = []
        map.set(c.filePath, list)
      }
      list.push({
        side: c.side,
        lineNumber: c.lineNumber,
        metadata: c,
      })
    }
    return map
  }, [comments])

  // A global control cannot be disabled per file, so it goes quiet only when no
  // file in the diff has lines for context to apply to.
  const contextDisabled = files.length > 0 && files.every((f) => binaryFileMap.has(f.name))

  const { capture } = useScrollAnchor(patch)

  const regions = useMemo(() => changeRegions(files), [files])
  const reducedMotion = usePrefersReducedMotion()
  const { blinkState } = useBlink({
    enabled: blinkMode,
    regions,
    autoBlink: settings.autoBlink,
    reducedMotion,
  })

  const structuralQuery = useMemo(
    () => ({ staged: settings.staged, untracked: settings.untracked, ignoreComments: settings.ignoreComments }),
    [settings.staged, settings.untracked, settings.ignoreComments],
  )

  const [structurallyUnchanged, setStructurallyUnchanged] = useState<Set<string>>(() => new Set())
  const handleStructuralResult = useCallback((filePath: string, unchanged: boolean) => {
    setStructurallyUnchanged((previous) => {
      if (previous.has(filePath) === unchanged) return previous
      const next = new Set(previous)
      if (unchanged) next.add(filePath)
      else next.delete(filePath)
      return next
    })
  }, [])

  const [fileModes, setFileModes] = useState<Map<string, ViewMode>>(() => new Map())
  const handleToggleStructural = useCallback(
    (filePath: string) => {
      setFileModes((previous) => {
        const next = new Map(previous)
        const mode = toggledFileMode(previous.get(filePath) ?? settings.diffStyle, settings.diffStyle)
        if (mode === null) next.delete(filePath)
        else next.set(filePath, mode)
        return next
      })
    },
    [settings.diffStyle],
  )

  const moves = useMoves(displayFiles, { minLines: settings.moveMinLines, similarity: settings.moveSimilarity })
  const handleJumpToMove = useCallback((run: MoveRun) => {
    setActiveFile(run.path)
    jumpToMove(run)
  }, [])

  const { lookup, find, close: closeLookup } = useDefinitions()

  // A ctrl- or cmd-click on a token asks where that name is declared, in the
  // whole repository rather than only in the diff.
  const handleDiffClick = useCallback(
    (event: React.MouseEvent) => {
      if (!event.ctrlKey && !event.metaKey) return
      const name = symbolFromPath(event.nativeEvent.composedPath())
      if (!name) return
      event.preventDefault()
      find(name)
    },
    [find],
  )

  const handleDefinitionJump = useCallback(
    (definition: Definition) => {
      setActiveFile(definition.path)
      jumpToMove({ path: definition.path, side: 'additions', startLine: definition.line })
      closeLookup()
    },
    [closeLookup],
  )

  const mapFilter = useMemo<MapFilter>(
    () => ({ tag: settings.mapTag, path: settings.mapPath }),
    [settings.mapTag, settings.mapPath],
  )
  const mapGroups = useChangeMap(files, { moves, structurallyUnchanged })
  const visibleGroups = useMemo(() => filterChangeMap(mapGroups, mapFilter), [mapGroups, mapFilter])

  // The tree follows the map's filters (FR-006), but only once the map exists.
  const treeFiles = useMemo(() => {
    if (!settings.mapOpen || mapGroups.length === 0) return files
    const kept = new Set(visibleGroups.map((group) => group.path))
    return files.filter((file) => kept.has(file.name))
  }, [files, mapGroups, settings.mapOpen, visibleGroups])

  const handleMapFilterChange = useCallback(
    (patch: Partial<MapFilter>) => {
      if (patch.tag !== undefined) updateSettings({ mapTag: patch.tag })
      if (patch.path !== undefined) updateSettings({ mapPath: patch.path })
    },
    [updateSettings],
  )

  const handleMapSelect = useCallback((entry: SymbolEntry) => {
    setActiveFile(entry.file)
    jumpToMove(entryTarget(entry))
  }, [])

  const toggleMap = useCallback(() => {
    updateSettings({ mapOpen: !settings.mapOpen })
  }, [settings.mapOpen, updateSettings])

  const confirmFullContext = useCallback(() => {
    const lines = estimateTotalLines(files)
    return lines <= FULL_CONTEXT_LINE_CAP || window.confirm(`Full context spans at least ${lines} lines. Render it?`)
  }, [files])

  const handleContextChange = useCallback(
    (next: ContextWidth) => {
      if (next === 'full' && !confirmFullContext()) return
      capture()
      updateSettings({ context: next })
    },
    [capture, confirmFullContext, updateSettings],
  )

  const handleDiffStyleChange = useCallback(
    (next: ViewMode) => {
      // Blink asks git for the whole file, so it meets the same size question.
      if (next === 'blink' && settings.context !== 'full' && !confirmFullContext()) return
      // The toolbar is the master control, so it takes the per-file switches back.
      setFileModes(new Map())
      updateSettings({ diffStyle: next })
    },
    [confirmFullContext, settings.context, updateSettings],
  )

  useShortcuts({
    '[': () => !contextDisabled && handleContextChange(stepContext(settings.context, -1)),
    ']': () => !contextDisabled && handleContextChange(stepContext(settings.context, 1)),
    m: toggleMap,
  })

  const handleFileClick = useCallback((filePath: string) => {
    setActiveFile(filePath)
    const el = document.getElementById(`file-${filePath}`)
    if (el) {
      el.scrollIntoView({ block: 'start' })
    }
  }, [])

  const handleViewedChange = useCallback((filePath: string, viewed: boolean) => {
    setViewed(filePath, viewed)
  }, [setViewed])

  const sidebarContent = (
    <div className="sidebar-content">
      <FileTree
        files={treeFiles}
        activeFile={activeFile}
        commentCounts={commentCounts}
        viewedFiles={viewedFiles}
        untrackedFiles={untrackedSet}
        structurallyUnchanged={structurallyUnchanged}
        onFileClick={handleFileClick}
        collapsed={sidebar.collapsed}
        onToggleCollapse={handleToggleCollapse}
      />
      {!sidebar.collapsed && (
        <CommentTracker comments={comments} onStatusChange={setCommentStatus} onDelete={removeComment} />
      )}
    </div>
  )

  if (!loaded || loading) {
    return (
      <div className="loading">
        <p>Loading diff...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="error">
        <p>Error: {error}</p>
      </div>
    )
  }

  return (
    <div className="app">
      <Toolbar
        repoName={repoName}
        branch={branch}
        fileCount={files.length}
        additions={diffStats.additions}
        deletions={diffStats.deletions}
        commentCount={comments.length}
        diffStyle={settings.diffStyle}
        diffOptions={{ staged: settings.staged, untracked: settings.untracked, context: settings.context }}
        context={settings.context}
        contextDisabled={contextDisabled}
        blinkState={blinkState}
        autoBlink={settings.autoBlink}
        reducedMotion={reducedMotion}
        lineDiff={settings.lineDiff}
        defaultTabSize={settings.defaultTabSize}
        softWrap={settings.softWrap}
        browser={settings.browser}
        customMode={customMode}
        onDiffStyleChange={handleDiffStyleChange}
        onContextChange={handleContextChange}
        onLineDiffChange={(lineDiff) => updateSettings({ lineDiff })}
        onAutoBlinkChange={(autoBlink) => updateSettings({ autoBlink })}
        moveMinLines={settings.moveMinLines}
        moveSimilarity={settings.moveSimilarity}
        structural={structural}
        ignoreComments={settings.ignoreComments}
        onIgnoreCommentsChange={(ignoreComments) => updateSettings({ ignoreComments })}
        onMoveSettingsChange={(moveSettings) => updateSettings(moveSettings)}
        onDiffOptionsChange={(options) => updateSettings(options)}
        onDefaultTabSizeChange={(size) => updateSettings({ defaultTabSize: size })}
        onSoftWrapChange={(softWrap) => updateSettings({ softWrap })}
        onBrowserChange={(browser) => updateSettings({ browser })}
        onCopyComments={copyAllComments}
        mapOpen={settings.mapOpen}
        onToggleMap={toggleMap}
      />
      <div className="app-body">
        {sidebar.collapsed ? (
          <aside className="sidebar sidebar-collapsed" style={{ width: sidebar.visibleSize() }}>
            {sidebarContent}
          </aside>
        ) : (
          <Resizable
            width={sidebar.visibleSize(maxSidebarWidth)}
            height={0}
            axis="x"
            resizeHandles={['e']}
            minConstraints={[SidebarStorage.minSize, 0]}
            maxConstraints={[maxSidebarWidth, 0]}
            onResize={handleResize}
            onResizeStop={handleResizeStop}
            handle={<div className="sidebar-resize-handle" />}
          >
            <aside className="sidebar" style={{ width: sidebar.visibleSize(maxSidebarWidth) }}>
              {sidebarContent}
            </aside>
          </Resizable>
        )}
        <main className={blinkMode ? `main blink-pane blink-pane-${blinkState}` : 'main'} onClick={handleDiffClick}>
          <Virtualizer className="main-scroll" contentClassName="main-content">
            <DiffViewer
              files={displayFiles}
              diffStyle={settings.diffStyle}
              blinkState={blinkState}
              lineDiff={settings.lineDiff}
              tabSizeMap={tabSizeMap}
              defaultTabSize={settings.defaultTabSize}
              softWrap={settings.softWrap}
              moves={moves}
              onJumpToMove={handleJumpToMove}
              structuralQuery={structuralQuery}
              structuralAvailable={structural.available}
              fileModes={fileModes}
              onStructuralResult={handleStructuralResult}
              onToggleStructural={handleToggleStructural}
              viewedFiles={viewedFiles}
              binaryFiles={binaryFileMap}
              onViewedChange={handleViewedChange}
              fileAnnotationsMap={fileAnnotationsMap}
              onAddComment={addComment}
              onDeleteComment={removeComment}
              onEditComment={editComment}
              onCommentStatusChange={setCommentStatus}
            />
          </Virtualizer>
        </main>
        {lookup && (
          <DefinitionPopup
            name={lookup.name}
            loading={lookup.loading}
            definitions={lookup.definitions}
            onClose={closeLookup}
            onJump={handleDefinitionJump}
          />
        )}
        {settings.mapOpen && (
          <ChangeMap
            groups={visibleGroups}
            filter={mapFilter}
            onFilterChange={handleMapFilterChange}
            onSelect={handleMapSelect}
            onClose={toggleMap}
          />
        )}
      </div>
    </div>
  )
}
