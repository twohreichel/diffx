---
"diffx-cli": minor
---

Add a change map panel listing the changed symbols of the whole diff

A side panel groups every changed line under the symbol it sits in — function,
method, class or type — and the symbols under their file. Files are ordered by
how much of the diff they carry, each entry shows its counts and a bar sized
against the largest change, and clicking one jumps to its first changed line.
Moved symbols and files that only got reformatted carry a tag when the move and
structural features supply the data.

The panel opens from the toolbar or with `m`, filters by change kind and by path
substring, and the file tree follows the same filters. Languages without a
symbol pattern fall back to one entry for the whole file and the panel says so.
The map is built after the diff is on screen, so it never delays the rows.
