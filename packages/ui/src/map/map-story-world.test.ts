import { describe, expect, it } from 'vitest'
import { pointInArea } from './map-logic'
import { COUNTRY_SHAPES } from './map-story-world'

/*
 * The maps of the stories and examples follow the law of the Republic of Serbia (P5.31a): Kosovo
 * and Metohija is part of Serbia, drawn within Serbia's area with no shape, border or name of its
 * own.
 */
describe('the countries of the stories and examples', () => {
  const places = {
    Priština: { lat: 42.66, lng: 21.17 },
    Prizren: { lat: 42.21, lng: 20.74 },
    Peć: { lat: 42.66, lng: 20.29 },
    'Kosovska Mitrovica': { lat: 42.89, lng: 20.87 },
    Gnjilane: { lat: 42.46, lng: 21.47 },
  }

  it('draw Kosovo and Metohija within Serbia', () => {
    for (const [name, point] of Object.entries(places)) {
      expect(pointInArea(point, COUNTRY_SHAPES.serbia), name).toBe(true)
    }
  })

  it('give it no area of its own', () => {
    expect(Object.keys(COUNTRY_SHAPES).some((key) => /kosov/i.test(key))).toBe(false)
    for (const [key, shape] of Object.entries(COUNTRY_SHAPES)) {
      if (key === 'serbia') continue
      for (const [name, point] of Object.entries(places)) {
        expect(pointInArea(point, shape), `${name} in ${key}`).toBe(false)
      }
    }
  })
})
