# PhotoEdit Studio

## Current State
Full-featured photo/video editing React app with filters, text overlays, stickers, face effects, collage maker, reel maker, and AI background removal. All major editing features are functional via bottom tab bar panels.

## Requested Changes (Diff)

### Add
- **Voice Command AI Editor**: Microphone button in the header that listens for spoken commands (Hindi + English) and automatically applies edits
- Voice commands should control: filters, brightness/contrast/saturation adjustments, text overlay, stickers, auto viral edit, background removal, before/after toggle, undo, reset
- Visual feedback: animated mic button (pulsing when listening), toast notifications showing what command was recognized and applied
- Command examples:
  - "brightness badhao" / "increase brightness" → brightness +20
  - "filter lagao" / "cinematic filter" → apply cinematic filter
  - "neon text add karo" / "add neon text" → add neon text overlay
  - "sticker add karo" / "add sticker" → add random sticker
  - "viral edit karo" / "auto viral" → trigger auto viral edit
  - "undo karo" / "undo" → undo
  - "reset karo" / "reset" → reset all edits
  - "before after" / "compare" → toggle before/after
  - "contrast badhao" → contrast +20
  - "saturation kam karo" → saturation -20
  - "black and white" / "grayscale" → apply B&W filter
  - "vintage" → apply vintage filter
  - "blur" → apply blur effect

### Modify
- EditorHeader: add mic/voice button next to existing header buttons

### Remove
- Nothing removed

## Implementation Plan
1. Create `useVoiceCommands` hook using Web Speech API (SpeechRecognition)
2. Parse recognized transcript for Hindi/English command keywords
3. Dispatch appropriate EditorContext actions based on command
4. Add pulsing mic button in EditorHeader with active/inactive states
5. Show toast for each recognized command with what was applied
6. Handle browser support gracefully (hide button if SpeechRecognition not supported)
