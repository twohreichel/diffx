---
"diffx-cli": minor
---

Add a structural view mode that compares syntax trees

A fourth mode hands both states of the open file to difftastic and colours only
the rows it reports as structurally changed. A pure reformat keeps its `+`/`-`
rows but shows them all unhighlighted, and the file tree marks such files with a
`≡`. Each file header carries a switch that overrides the mode for that file
alone, and a setting lets the comparison skip comments.

The comparison is asked for per file and only once the file scrolls into view,
results are cached, and a request is aborted as soon as its file is left. Where
difftastic is missing, finds no grammar for the file or returns something this
fork cannot read, the mode falls back to the line-based rows and names the
reason above them.
