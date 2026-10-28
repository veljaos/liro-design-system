import { describe, expect, it } from 'vitest'
import { FILE_NAME_TAIL, splitFileName } from './file-name'

describe('splitFileName (P5.93 item 5)', () => {
  it('keeps the extension and the last characters before it at the end', () => {
    expect(
      splitFileName('Izvestaj_o_izvrsenim_radovima_na_prosirenju_hale_B_konacna_verzija.pdf'),
    ).toEqual(['Izvestaj_o_izvrsenim_radovima_na_prosirenju_hale_B_konac', 'na_verzija.pdf'])
  })

  it('leaves a short name whole, as the start', () => {
    expect(splitFileName('IMG_20261014_812.jpg')).toEqual(['IMG_20261014_812.jpg', ''])
    expect(splitFileName('README')).toEqual(['README', ''])
  })

  it('takes a long last part as no extension', () => {
    const name = 'contract.signed-by-everyone-on-the-site'
    const [start, end] = splitFileName(name)
    expect(start + end).toBe(name)
    expect(end).toHaveLength(FILE_NAME_TAIL)
  })
})
