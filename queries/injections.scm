; Copyright 2026 Oxide Computer Company

; injections.scm
;
; Comments are handed to the `comment` grammar, which colors markers such as
; TODO, FIXME, and NOTE, in editors that have it.

((comment) @injection.content
  (#set! injection.language "comment"))
