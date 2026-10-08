import { describe, expect, it } from 'vitest'
import {
  ERROR_TEXT_LIMIT,
  FRAME_PROTOCOL,
  FRAME_VERSION,
  frameReducer,
  hostMessage,
  INITIAL_FRAME_STATE,
  originAllowed,
  readViewerMessage,
  targetOrigin,
  zoomStep,
  type FrameState,
} from './document-frame-protocol'

const envelope = { protocol: FRAME_PROTOCOL, version: FRAME_VERSION }

describe('readViewerMessage', () => {
  it('reads every message of the protocol', () => {
    expect(readViewerMessage({ ...envelope, type: 'loading' })).toEqual({ type: 'loading' })
    expect(
      readViewerMessage({ ...envelope, type: 'ready', page: 1, pageCount: 3, zoom: 100 }),
    ).toEqual({ type: 'ready', page: 1, pageCount: 3, zoom: 100 })
    expect(readViewerMessage({ ...envelope, type: 'page', page: 2, pageCount: 3 })).toEqual({
      type: 'page',
      page: 2,
      pageCount: 3,
    })
    expect(readViewerMessage({ ...envelope, type: 'zoom', zoom: 125 })).toEqual({
      type: 'zoom',
      zoom: 125,
    })
    expect(readViewerMessage({ ...envelope, type: 'error' })).toEqual({ type: 'error' })
    expect(readViewerMessage({ ...envelope, type: 'error', message: 'Not found' })).toEqual({
      type: 'error',
      message: 'Not found',
    })
  })

  it('ignores anything else: other protocols, versions, types and shapes', () => {
    expect(readViewerMessage('ready')).toBeNull()
    expect(readViewerMessage(null)).toBeNull()
    expect(readViewerMessage([envelope])).toBeNull()
    expect(readViewerMessage({ type: 'loading' })).toBeNull()
    expect(readViewerMessage({ ...envelope, version: 2, type: 'loading' })).toBeNull()
    expect(readViewerMessage({ ...envelope, type: 'navigate', url: 'https://x' })).toBeNull()
    expect(readViewerMessage({ ...envelope, type: 'page', page: 4, pageCount: 3 })).toBeNull()
    expect(readViewerMessage({ ...envelope, type: 'page', page: 0, pageCount: 3 })).toBeNull()
    expect(readViewerMessage({ ...envelope, type: 'page', page: 1.5, pageCount: 3 })).toBeNull()
    expect(readViewerMessage({ ...envelope, type: 'page', page: '2', pageCount: 3 })).toBeNull()
    expect(readViewerMessage({ ...envelope, type: 'zoom', zoom: Number.NaN })).toBeNull()
    expect(readViewerMessage({ ...envelope, type: 'zoom', zoom: 5000 })).toBeNull()
    expect(
      readViewerMessage({ ...envelope, type: 'ready', page: 1, pageCount: 1, zoom: '100' }),
    ).toBeNull()
    expect(readViewerMessage({ ...envelope, type: 'error', message: 42 })).toBeNull()
  })

  it('cuts a long error text', () => {
    const message = readViewerMessage({ ...envelope, type: 'error', message: 'x'.repeat(5000) })
    expect(message).toEqual({ type: 'error', message: 'x'.repeat(ERROR_TEXT_LIMIT) })
  })
})

describe('origins', () => {
  it('compares origins exactly', () => {
    expect(originAllowed('https://viewer.liro.rs', 'https://viewer.liro.rs')).toBe(true)
    expect(originAllowed('https://viewer.liro.rs.evil.example', 'https://viewer.liro.rs')).toBe(
      false,
    )
    expect(originAllowed('http://viewer.liro.rs', 'https://viewer.liro.rs')).toBe(false)
    expect(originAllowed('null', 'https://viewer.liro.rs')).toBe(false)
    expect(originAllowed('null', 'null')).toBe(true)
  })

  it('sends to the viewer’s origin, "*" only for an opaque one', () => {
    expect(targetOrigin('https://viewer.liro.rs')).toBe('https://viewer.liro.rs')
    expect(targetOrigin('null')).toBe('*')
  })

  it('wraps commands in the envelope', () => {
    expect(hostMessage({ type: 'goToPage', page: 2 })).toEqual({
      ...envelope,
      type: 'goToPage',
      page: 2,
    })
  })
})

describe('zoomStep', () => {
  it('steps through the levels and stops at the ends', () => {
    expect(zoomStep(100, 'in')).toBe(125)
    expect(zoomStep(100, 'out')).toBe(75)
    expect(zoomStep(110, 'in')).toBe(125)
    expect(zoomStep(110, 'out')).toBe(100)
    expect(zoomStep(300, 'in')).toBeNull()
    expect(zoomStep(50, 'out')).toBeNull()
    expect(zoomStep(20, 'in')).toBe(50)
  })
})

describe('frameReducer', () => {
  it('becomes ready with what the viewer reports, and follows it', () => {
    let state: FrameState = INITIAL_FRAME_STATE
    state = frameReducer(state, { type: 'page', page: 1, pageCount: 4 })
    expect(state.status).toBe('loading')
    state = frameReducer(state, { type: 'ready', page: 1, pageCount: 4, zoom: 100 })
    expect(state).toEqual({ status: 'ready', page: 1, pageCount: 4, zoom: 100 })
    state = frameReducer(state, { type: 'page', page: 3, pageCount: 4 })
    state = frameReducer(state, { type: 'zoom', zoom: 150 })
    expect(state).toEqual({ status: 'ready', page: 3, pageCount: 4, zoom: 150 })
  })

  it('stays in error until loaded again', () => {
    let state = frameReducer(INITIAL_FRAME_STATE, { type: 'error', message: 'Not found' })
    expect(state).toMatchObject({ status: 'error', error: 'Not found' })
    state = frameReducer(state, { type: 'ready', page: 1, pageCount: 1, zoom: 100 })
    expect(state.status).toBe('error')
    state = frameReducer(state, { type: 'loading' })
    expect(state).toEqual(INITIAL_FRAME_STATE)
  })
})
