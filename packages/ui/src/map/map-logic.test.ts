import { describe, expect, it } from 'vitest'
import {
  areaAt,
  areaListKeyTarget,
  bubbleRadius,
  circleBounds,
  distanceMeters,
  geometryBounds,
  geometryPolygons,
  labelFits,
  labelPoint,
  pointInArea,
  pointsBounds,
  positionPoint,
  rampShade,
  regionKeyTarget,
  regionReadingOrder,
  regionStep,
  regionStepCount,
  regionStepRanges,
  unionBounds,
  withinRadius,
  type MapAreaGeometry,
} from './map-logic'

const OUTER_SQUARE: [number, number][] = [
  [19, 45],
  [20, 45],
  [20, 46],
  [19, 46],
  [19, 45],
]

const SQUARE: MapAreaGeometry = {
  type: 'Polygon',
  coordinates: [
    [
      [19, 45],
      [20, 45],
      [20, 46],
      [19, 46],
      [19, 45],
    ],
    // A hole in the middle.
    [
      [19.4, 45.4],
      [19.6, 45.4],
      [19.6, 45.6],
      [19.4, 45.6],
      [19.4, 45.4],
    ],
  ],
}

const TWO: MapAreaGeometry = {
  type: 'MultiPolygon',
  coordinates: [
    [
      [
        [0, 0],
        [1, 0],
        [1, 1],
        [0, 1],
        [0, 0],
      ],
    ],
    [
      [
        [10, 10],
        [14, 10],
        [14, 14],
        [10, 14],
        [10, 10],
      ],
    ],
  ],
}

describe('geometry', () => {
  it('reads GeoJSON positions as longitude, latitude', () => {
    expect(positionPoint([19.84, 45.25])).toEqual({ lat: 45.25, lng: 19.84 })
    expect(geometryPolygons(SQUARE)).toHaveLength(1)
    expect(geometryPolygons(SQUARE)[0]).toHaveLength(2)
    expect(geometryPolygons(TWO)).toHaveLength(2)
  })

  it('finds a point inside an outer ring and outside its holes', () => {
    expect(pointInArea({ lat: 45.2, lng: 19.2 }, SQUARE)).toBe(true)
    expect(pointInArea({ lat: 45.5, lng: 19.5 }, SQUARE)).toBe(false)
    expect(pointInArea({ lat: 44.9, lng: 19.5 }, SQUARE)).toBe(false)
    expect(pointInArea({ lat: 12, lng: 12 }, TWO)).toBe(true)
    expect(pointInArea({ lat: 5, lng: 5 }, TWO)).toBe(false)
  })

  it('never mirrors: east is east', () => {
    const east: MapAreaGeometry = {
      type: 'Polygon',
      coordinates: [
        [
          [20, 45],
          [21, 45],
          [21, 46],
          [20, 46],
          [20, 45],
        ],
      ],
    }
    expect(pointInArea({ lat: 45.5, lng: 20.5 }, east)).toBe(true)
    expect(pointInArea({ lat: 45.5, lng: 19.5 }, east)).toBe(false)
  })

  it('names the first area a point falls in', () => {
    const areas = [
      { id: 'square', geometry: SQUARE },
      { id: 'two', geometry: TWO },
    ]
    expect(areaAt({ lat: 0.5, lng: 0.5 }, areas)?.id).toBe('two')
    expect(areaAt({ lat: 45.1, lng: 19.1 }, areas)?.id).toBe('square')
    expect(areaAt({ lat: 50, lng: 50 }, areas)).toBeUndefined()
  })

  it('bounds shapes and points', () => {
    expect(geometryBounds(TWO)).toEqual({ south: 0, west: 0, north: 14, east: 14 })
    expect(pointsBounds([])).toBeNull()
    expect(
      unionBounds([null, { south: 1, west: 2, north: 3, east: 4 }, geometryBounds(SQUARE)]),
    ).toEqual({ south: 1, west: 2, north: 46, east: 20 })
    expect(unionBounds([null])).toBeNull()
    const circle = circleBounds({ lat: 45, lng: 19 }, 1000)
    expect(circle.north - circle.south).toBeCloseTo(0.018, 3)
    expect(circle.east - circle.west).toBeGreaterThan(circle.north - circle.south)
  })

  it('puts a label at the centre of the largest polygon', () => {
    expect(labelPoint(TWO)).toEqual({ lat: 12, lng: 12 })
    // The centroid falls in the hole: the name moves to the widest part around it.
    const around = labelPoint(SQUARE)
    expect(around).not.toBeNull()
    if (around !== null) expect(pointInArea(around, SQUARE)).toBe(true)
    const plain: MapAreaGeometry = {
      type: 'Polygon',
      coordinates: [OUTER_SQUARE],
    }
    expect(labelPoint(plain)?.lat).toBeCloseTo(45.5)
    expect(labelPoint(plain)?.lng).toBeCloseTo(19.5)
    expect(labelPoint({ type: 'MultiPolygon', coordinates: [] })).toBeNull()
  })
})

describe('labelFits', () => {
  const ring = [
    { x: 0, y: 0 },
    { x: 100, y: 0 },
    { x: 100, y: 40 },
    { x: 0, y: 40 },
  ]
  it('shows a label only wholly inside its area', () => {
    expect(labelFits({ x: 50, y: 20 }, 60, 16, [ring])).toBe(true)
    expect(labelFits({ x: 50, y: 20 }, 98, 16, [ring])).toBe(false)
    expect(labelFits({ x: 90, y: 20 }, 30, 16, [ring])).toBe(false)
    expect(labelFits({ x: 50, y: 20 }, 0, 16, [ring])).toBe(false)
    expect(labelFits({ x: 50, y: 20 }, 10, 10, [ring.slice(0, 2)])).toBe(false)
  })

  it('keeps a label off a hole', () => {
    const hole = [
      { x: 45, y: 15 },
      { x: 55, y: 15 },
      { x: 55, y: 25 },
      { x: 45, y: 25 },
    ]
    expect(labelFits({ x: 50, y: 20 }, 60, 16, [ring, hole])).toBe(false)
    expect(labelFits({ x: 20, y: 20 }, 20, 16, [ring, hole])).toBe(true)
  })

  it('leaves out a label a notch of its area would cut', () => {
    // A U shape: the corners of a wide label stand inside, its middle in the notch.
    const u = [
      { x: 0, y: 0 },
      { x: 40, y: 0 },
      { x: 40, y: 30 },
      { x: 60, y: 30 },
      { x: 60, y: 0 },
      { x: 100, y: 0 },
      { x: 100, y: 60 },
      { x: 0, y: 60 },
    ]
    expect(labelFits({ x: 50, y: 20 }, 90, 20, [u])).toBe(false)
    expect(labelFits({ x: 50, y: 45 }, 90, 16, [u])).toBe(true)
  })
})

describe('distance', () => {
  it('measures along the earth’s surface in metres', () => {
    const a = { lat: 45.247, lng: 19.848 }
    expect(distanceMeters(a, a)).toBe(0)
    // One degree of latitude is about 111.2 km.
    expect(distanceMeters({ lat: 45, lng: 19 }, { lat: 46, lng: 19 })).toBeCloseTo(111_195, -1)
    const outside = { lat: 45.2512, lng: 19.8395 }
    expect(distanceMeters(a, outside)).toBeGreaterThan(780)
    expect(distanceMeters(a, outside)).toBeLessThan(820)
    expect(withinRadius({ lat: 45.2473, lng: 19.8486 }, a, 150)).toBe(true)
    expect(withinRadius(outside, a, 150)).toBe(false)
  })
})

describe('areaListKeyTarget', () => {
  it('moves through the list with the arrows, Home and End', () => {
    expect(areaListKeyTarget(1, 'ArrowDown', 4)).toBe(2)
    expect(areaListKeyTarget(3, 'ArrowDown', 4)).toBe(3)
    expect(areaListKeyTarget(0, 'ArrowUp', 4)).toBe(0)
    expect(areaListKeyTarget(2, 'ArrowUp', 4)).toBe(1)
    expect(areaListKeyTarget(2, 'Home', 4)).toBe(0)
    expect(areaListKeyTarget(0, 'End', 4)).toBe(3)
    expect(areaListKeyTarget(0, 'Enter', 4)).toBeNull()
    expect(areaListKeyTarget(0, 'ArrowDown', 0)).toBeNull()
  })
})

describe('regionStep', () => {
  const breaks = ['100000', '500000.50', '1000000']
  it('finds the step by comparing decimal strings exactly', () => {
    expect(regionStep('99999.99', breaks)).toBe(0)
    expect(regionStep('100000', breaks)).toBe(1)
    expect(regionStep('100000.00', breaks)).toBe(1)
    expect(regionStep('500000.49', breaks)).toBe(1)
    expect(regionStep('500000.5', breaks)).toBe(2)
    // Beyond a JavaScript number's exact integers: still exact.
    expect(regionStep('999999999999999999999', breaks)).toBe(3)
    expect(regionStep('-5', breaks)).toBe(0)
    expect(regionStep(' 1000000 ', breaks)).toBe(3)
  })

  it('says "no data" for a missing or unreadable value, never step 0', () => {
    expect(regionStep(null, breaks)).toBeNull()
    expect(regionStep(undefined, breaks)).toBeNull()
    expect(regionStep('', breaks)).toBeNull()
    expect(regionStep('1.000.000', breaks)).toBeNull()
    expect(regionStep('n/a', breaks)).toBeNull()
    expect(regionStep('0', breaks)).toBe(0)
  })

  it('counts the steps and their ranges, at most five', () => {
    expect(regionStepCount([])).toBe(1)
    expect(regionStepCount(breaks)).toBe(4)
    expect(regionStepCount(['1', '2', '3', '4', '5', '6'])).toBe(5)
    expect(regionStepRanges(['10', '20'])).toEqual([
      { step: 0, from: null, to: '10' },
      { step: 1, from: '10', to: '20' },
      { step: 2, from: '20', to: null },
    ])
    expect(regionStepRanges(['1', '2', '3', '4', '5', '6'])).toHaveLength(5)
  })
})

describe('rampShade', () => {
  it('lays one meaning on the card from 25% to 100%', () => {
    expect(rampShade(0, 5, 'main')).toEqual({ colour: 'var(--liro-chart-main)', opacity: 0.25 })
    expect(rampShade(2, 5, 'main').opacity).toBeCloseTo(0.63)
    expect(rampShade(4, 5, 'main')).toEqual({ colour: 'var(--liro-chart-main)', opacity: 1 })
    expect(rampShade(1, 2, 'neutral')).toEqual({ colour: 'var(--liro-chart-other)', opacity: 1 })
    expect(rampShade(0, 1, 'main').opacity).toBe(1)
    expect(rampShade(9, 3, 'main').opacity).toBe(1)
  })
})

describe('regionReadingOrder', () => {
  const items = [
    { id: 'south', at: { lat: 42, lng: 21 } },
    { id: 'north-east', at: { lat: 47.1, lng: 21 } },
    { id: 'north-west', at: { lat: 46.9, lng: 15 } },
    { id: 'middle', at: { lat: 44.5, lng: 18 } },
  ]
  it('reads rows north to south, each from the page’s start; the map is not mirrored', () => {
    expect(regionReadingOrder(items, 'ltr', 0.5).map((each) => each.id)).toEqual([
      'north-west',
      'north-east',
      'middle',
      'south',
    ])
    expect(regionReadingOrder(items, 'rtl', 0.5).map((each) => each.id)).toEqual([
      'north-east',
      'north-west',
      'middle',
      'south',
    ])
    expect(regionReadingOrder(items, 'ltr', 0.1).map((each) => each.id)).toEqual([
      'north-east',
      'north-west',
      'middle',
      'south',
    ])
  })
})

describe('regionKeyTarget', () => {
  it('moves forward with ArrowDown and the arrow toward the line’s end', () => {
    expect(regionKeyTarget(-1, 'ArrowRight', 4, 'ltr')).toBe(0)
    expect(regionKeyTarget(0, 'ArrowRight', 4, 'ltr')).toBe(1)
    expect(regionKeyTarget(0, 'ArrowDown', 4, 'ltr')).toBe(1)
    expect(regionKeyTarget(3, 'ArrowRight', 4, 'ltr')).toBe(3)
    expect(regionKeyTarget(2, 'ArrowLeft', 4, 'ltr')).toBe(1)
    expect(regionKeyTarget(2, 'ArrowUp', 4, 'ltr')).toBe(1)
    expect(regionKeyTarget(0, 'ArrowLeft', 4, 'rtl')).toBe(1)
    expect(regionKeyTarget(2, 'ArrowRight', 4, 'rtl')).toBe(1)
    expect(regionKeyTarget(2, 'Home', 4, 'ltr')).toBe(0)
    expect(regionKeyTarget(0, 'End', 4, 'rtl')).toBe(3)
    expect(regionKeyTarget(0, 'Enter', 4, 'ltr')).toBeNull()
    expect(regionKeyTarget(-1, 'ArrowDown', 0, 'ltr')).toBeNull()
  })
})

describe('bubbleRadius', () => {
  it('grows a bubble’s area with its value, 4 to 22 pixels', () => {
    expect(bubbleRadius(null, 100)).toBe(4)
    expect(bubbleRadius(0, 100)).toBe(4)
    expect(bubbleRadius(100, 100)).toBe(22)
    expect(bubbleRadius(25, 100)).toBe(13)
    expect(bubbleRadius(400, 100)).toBe(22)
    expect(bubbleRadius(10, null)).toBe(4)
  })
})
