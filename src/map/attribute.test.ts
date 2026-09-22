import { describe, it, expect } from 'vitest'
import { parsePatchFiles, type FileDiffMetadata } from '@pierre/diffs'
import { attributeChanges } from './attribute.js'

const PYTHON = `diff --git a/app.py b/app.py
index a111b29..4154b18 100644
--- a/app.py
+++ b/app.py
@@ -1,10 +1,15 @@
 import os
+import sys
 
 
 def first(value):
-    total = value + 1
+    total = value + 2
     return total
 
 
 def second(value):
     return value * 2
+
+
+def third(value):
+    return value - 1
`

const RUST = `diff --git a/lib.rs b/lib.rs
index c11eb37..483e898 100644
--- a/lib.rs
+++ b/lib.rs
@@ -6,7 +6,7 @@ pub struct Config {
 
 impl Config {
     pub fn load(path: &str) -> Config {
-        let name = path.to_string();
+        let name = path.trim().to_string();
         Config { name }
     }
 }
`

const PHP = `diff --git a/Service.php b/Service.php
index d50ef56..4b947cf 100644
--- a/Service.php
+++ b/Service.php
@@ -4,7 +4,7 @@ class Service
 {
     public function handle(int $value): int
     {
-        $total = $value + 1;
+        $total = $value + 2;
         return $total;
     }
 }
`

const JAVA = `diff --git a/Service.java b/Service.java
index d68fcf9..17017b8 100644
--- a/Service.java
+++ b/Service.java
@@ -2,7 +2,7 @@ package app;
 
 public class Service {
     public int handle(int value) {
-        int total = value + 1;
+        int total = value + 2;
         return total;
     }
 }
`

const TYPESCRIPT = `diff --git a/tool.ts b/tool.ts
index bdf647f..a38664e 100644
--- a/tool.ts
+++ b/tool.ts
@@ -2,8 +2,4 @@ export function keep(value: number): number {
   return value + 1
 }
 
-export function drop(value: number): number {
-  return value - 1
-}
-
 export const last = 1
`

async function parse(patch: string): Promise<FileDiffMetadata> {
  const groups = await parsePatchFiles(patch)
  return groups[0].files[0]
}

describe('attributeChanges', () => {
  it('splits a Python file into the functions the lines belong to', async () => {
    expect(attributeChanges(await parse(PYTHON))).toEqual([
      { name: 'top level', kind: 'toplevel', firstChangedLine: 2, added: 1, removed: 0 },
      { name: 'first', kind: 'function', firstChangedLine: 6, added: 1, removed: 1 },
      { name: 'third', kind: 'function', firstChangedLine: 12, added: 4, removed: 0 },
    ])
  })

  it('names the Rust method the change sits in', async () => {
    expect(attributeChanges(await parse(RUST))).toEqual([
      { name: 'load', kind: 'method', firstChangedLine: 9, added: 1, removed: 1 },
    ])
  })

  it('names the PHP method the change sits in', async () => {
    expect(attributeChanges(await parse(PHP))).toEqual([
      { name: 'handle', kind: 'method', firstChangedLine: 7, added: 1, removed: 1 },
    ])
  })

  it('names the Java method the change sits in', async () => {
    expect(attributeChanges(await parse(JAVA))).toEqual([
      { name: 'handle', kind: 'method', firstChangedLine: 5, added: 1, removed: 1 },
    ])
  })

  it('keeps a removed function as its own entry', async () => {
    expect(attributeChanges(await parse(TYPESCRIPT))).toEqual([
      { name: 'drop', kind: 'function', firstChangedLine: 5, added: 0, removed: 4 },
    ])
  })
})
