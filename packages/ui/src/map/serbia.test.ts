import { describe, expect, it } from 'vitest'
import { areaAt } from './map-logic'
import {
  loadSerbiaBoundaries,
  loadSerbiaChildren,
  SERBIA_DIVIDED_CITIES,
  SERBIA_LEVELS,
  serbiaChildren,
  serbiaLowerLevel,
} from './serbia'
import { decodeArcs, ringFromArcs, topologyFeatures, type Topology } from './topology'

const SQUARES: Topology = {
  type: 'Topology',
  transform: { scale: [0.5, 0.5], translate: [10, 40] },
  // Arc 0 the shared edge (x = 2, y from 0 to 2), arc 1 the left square's rest, arc 2 the right's.
  arcs: [
    [
      [2, 0],
      [0, 2],
    ],
    [
      [2, 2],
      [-2, 0],
      [0, -2],
      [2, 0],
    ],
    [
      [2, 0],
      [2, 0],
      [0, 2],
      [-2, 0],
    ],
  ],
  objects: {
    areas: {
      type: 'GeometryCollection',
      geometries: [
        { type: 'Polygon', arcs: [[1, 0]], properties: { id: 'left' } },
        { type: 'MultiPolygon', arcs: [[[2, ~0]]], properties: { id: 'right' } },
      ],
    },
  },
}

describe('topology', () => {
  it('decodes delta-encoded arcs through the transform', () => {
    expect(decodeArcs(SQUARES)[0]).toEqual([
      [11, 40],
      [11, 41],
    ])
  })
  it('joins arcs into closed rings, a negative index backwards, shared points once', () => {
    const arcs = decodeArcs(SQUARES)
    expect(ringFromArcs([1, 0], arcs)).toEqual([
      [11, 41],
      [10, 41],
      [10, 40],
      [11, 40],
      [11, 41],
    ])
    expect(ringFromArcs([2, ~0], arcs)).toEqual([
      [11, 40],
      [12, 40],
      [12, 41],
      [11, 41],
      [11, 40],
    ])
  })
  it('reads polygons and multipolygons with their properties', () => {
    const features = topologyFeatures(SQUARES, 'areas')
    expect(features.map((feature) => feature.properties.id)).toEqual(['left', 'right'])
    expect(features[1]?.geometry.type).toBe('MultiPolygon')
    expect(topologyFeatures(SQUARES, 'none')).toEqual([])
  })
})

describe('Serbia’s boundaries', () => {
  it('has the five statistical regions, the districts, the 145 cities and municipalities and the city municipalities', async () => {
    const [regions, districts, municipalities, cityMunicipalities] = await Promise.all(
      SERBIA_LEVELS.map((level) => loadSerbiaBoundaries(level)),
    )
    expect(regions?.areas).toHaveLength(5)
    // The 24 districts, the City of Belgrade and the Autonomous Province of Kosovo and Metohija.
    expect(districts?.areas).toHaveLength(26)
    expect(municipalities?.areas).toHaveLength(146)
    // Belgrade 17, Niš 5, Požarevac, Užice and Vranje 2 each (P5.94 item 1).
    expect(cityMunicipalities?.areas).toHaveLength(28)
    expect(regions?.attribution).toContain('OpenStreetMap')
    expect(cityMunicipalities?.attribution).toBe('© OpenStreetMap contributors (ODbL)')
  })

  it('divides the cities that have city municipalities, each named in Serbian and English', async () => {
    const municipalities = (await loadSerbiaBoundaries('municipality')).areas
    const parts = (await loadSerbiaBoundaries('city-municipality')).areas
    expect([...new Set(parts.map((area) => area.parent))].sort()).toEqual(
      [...SERBIA_DIVIDED_CITIES].sort(),
    )
    const cityIds = new Set(municipalities.map((area) => area.id))
    expect(parts.every((area) => area.parent !== null && cityIds.has(area.parent))).toBe(true)
    expect(serbiaChildren(parts, 'beograd')).toHaveLength(17)
    expect(serbiaChildren(parts, 'nis')).toHaveLength(5)
    expect(new Set(parts.map((area) => area.id)).size).toBe(parts.length)
    const newBelgrade = parts.find((area) => area.id === 'beograd-novi-beograd')
    expect(newBelgrade).toMatchObject({ name: 'Novi Beograd', nameEn: 'New Belgrade' })
    expect(newBelgrade?.kind).toBe('city-municipality')
    // Places in their own city municipality.
    expect(areaAt({ lat: 44.8176, lng: 20.4569 }, parts)?.id).toBe('beograd-stari-grad') // Knez Mihailova
    expect(areaAt({ lat: 44.8433, lng: 20.4107 }, parts)?.id).toBe('beograd-zemun') // Zemun's quay
    expect(areaAt({ lat: 43.3209, lng: 21.8958 }, parts)?.id).toBe('nis-medijana') // Niš, King Milan Square
  })

  it('says which areas open a level under them', async () => {
    const [regions, districts, municipalities, parts] = await Promise.all(
      SERBIA_LEVELS.map((level) => loadSerbiaBoundaries(level)),
    )
    const opens = (areas: { id: string; hasLowerLevel: boolean }[] | undefined) =>
      (areas ?? []).filter((area) => area.hasLowerLevel).map((area) => area.id)
    // Kosovo and Metohija is one area under the region (D31): nothing opens under it.
    expect(opens(regions?.areas)).toHaveLength(4)
    expect(opens(districts?.areas)).toHaveLength(25)
    expect(opens(municipalities?.areas).sort()).toEqual([...SERBIA_DIVIDED_CITIES].sort())
    expect(opens(parts?.areas)).toEqual([])
    expect(serbiaLowerLevel('municipality')).toBe('city-municipality')
    expect(serbiaLowerLevel('city-municipality')).toBeNull()
  })

  it('opens the level under an area, skipping a level of one area', async () => {
    // The Belgrade Region's one district and the City of Belgrade's one city open by themselves.
    const belgrade = await loadSerbiaChildren('region', 'beograd')
    expect(belgrade?.level).toBe('city-municipality')
    expect(belgrade?.areas).toHaveLength(17)
    expect(belgrade?.through.map((area) => area.id)).toEqual(['RS-00', 'beograd'])
    expect(belgrade?.attribution).toBe('© OpenStreetMap contributors (ODbL)')
    const vojvodina = await loadSerbiaChildren('region', 'vojvodina')
    expect(vojvodina?.level).toBe('district')
    expect(vojvodina?.through).toEqual([])
    expect(vojvodina?.areas).toHaveLength(7)
    expect((await loadSerbiaChildren('municipality', 'nis'))?.areas).toHaveLength(5)
    expect(await loadSerbiaChildren('municipality', 'cacak')).toBeNull()
    expect(await loadSerbiaChildren('city-municipality', 'beograd-zemun')).toBeNull()
  })

  it('links every area to its parent one level up', async () => {
    const regions = (await loadSerbiaBoundaries('region')).areas
    const districts = (await loadSerbiaBoundaries('district')).areas
    const municipalities = (await loadSerbiaBoundaries('municipality')).areas
    const regionIds = new Set(regions.map((area) => area.id))
    const districtIds = new Set(districts.map((area) => area.id))
    expect(districts.every((area) => area.parent !== null && regionIds.has(area.parent))).toBe(true)
    expect(
      municipalities.every((area) => area.parent !== null && districtIds.has(area.parent)),
    ).toBe(true)
    expect(serbiaChildren(districts, 'vojvodina').map((area) => area.id)).toEqual(
      expect.arrayContaining(['RS-01', 'RS-02', 'RS-03', 'RS-04', 'RS-05', 'RS-06', 'RS-07']),
    )
    expect(serbiaChildren(municipalities, 'RS-06')).toHaveLength(12)
    expect(municipalities.find((area) => area.id === 'novi-sad')?.parent).toBe('RS-06')
    expect(municipalities.find((area) => area.id === 'cacak')?.name).toBe('Čačak')
  })

  it('draws Kosovo and Metohija within Serbia, as Serbian law names it (D31)', async () => {
    const places = [
      { lat: 42.6629, lng: 21.1655 }, // Priština
      { lat: 42.2139, lng: 20.7397 }, // Prizren
      { lat: 42.6593, lng: 20.2883 }, // Peć
      { lat: 42.8914, lng: 20.866 }, // Kosovska Mitrovica
      { lat: 42.4635, lng: 21.4694 }, // Gnjilane
    ]
    const expected = { region: 'kosovo-metohija', district: 'RS-KM', municipality: 'RS-KM' }
    for (const level of ['region', 'district', 'municipality'] as const) {
      const { areas } = await loadSerbiaBoundaries(level)
      for (const place of places) {
        expect(areaAt(place, areas)?.id).toBe(expected[level])
      }
    }
  })

  it('places a city in its own area at every level', async () => {
    const noviSad = { lat: 45.2671, lng: 19.8335 }
    expect(areaAt(noviSad, (await loadSerbiaBoundaries('region')).areas)?.id).toBe('vojvodina')
    expect(areaAt(noviSad, (await loadSerbiaBoundaries('district')).areas)?.id).toBe('RS-06')
    expect(areaAt(noviSad, (await loadSerbiaBoundaries('municipality')).areas)?.id).toBe('novi-sad')
  })

  it('draws no city municipality in Kosovo and Metohija (D31)', async () => {
    const parts = (await loadSerbiaBoundaries('city-municipality')).areas
    expect(areaAt({ lat: 42.6629, lng: 21.1655 }, parts)).toBeUndefined()
  })
})
