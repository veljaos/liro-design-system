// Fixture for src/rules.test.ts: every line marked "expect:" must report exactly those rules.
// This file is not linted by the repository's own configuration.
export function RawColors() {
  return (
    <div>
      <p className="bg-red-500 p-4">Palette</p> {/* expect: liro/no-raw-colors */}
      <p className="text-gray-700/50">Palette with opacity</p> {/* expect: liro/no-raw-colors */}
      <p className="hover:bg-white">White</p> {/* expect: liro/no-raw-colors */}
      <p className="ring-offset-black">Black</p> {/* expect: liro/no-raw-colors */}
      <p className="bg-[#0078d4]">Arbitrary hex</p> {/* expect: liro/no-raw-colors */}
      <p className="text-[rgb(0,0,0)]">Arbitrary rgb</p> {/* expect: liro/no-raw-colors */}
      <p className="[color:oklch(0.5_0_0)]">Property</p> {/* expect: liro/no-raw-colors */}
      <p className="dark:bg-surface-raised">Dark variant</p> {/* expect: liro/no-raw-colors */}
      <p style={{ color: 'red' }}>Named colour</p> {/* expect: liro/no-raw-colors */}
      <p style={{ backgroundColor: '#fff' }}>Hex in style</p> {/* expect: liro/no-raw-colors */}
    </div>
  )
}

export const classes = `border-emerald-600 ${String(1)} fill-sky-50` // expect: liro/no-raw-colors, liro/no-raw-colors
export const brand = '#0078D4' // expect: liro/no-raw-colors

export function Physical() {
  return (
    <div>
      <p className="ml-4">Margin left</p> {/* expect: liro/logical-properties */}
      <p className="md:pr-2">Padding right</p> {/* expect: liro/logical-properties */}
      <p className="-left-2">Left</p> {/* expect: liro/logical-properties */}
      <p className="right-0">Right</p> {/* expect: liro/logical-properties */}
      <p className="text-left">Text left</p> {/* expect: liro/logical-properties */}
      <p className="border-l-2">Border left</p> {/* expect: liro/logical-properties */}
      <p className="rounded-tr-md">Rounded top right</p> {/* expect: liro/logical-properties */}
      <p className="float-right">Float right</p> {/* expect: liro/logical-properties */}
      <p style={{ marginLeft: 8 }}>Style margin</p> {/* expect: liro/logical-properties */}
      <p style={{ textAlign: 'right' }}>Style text align</p> {/* expect: liro/logical-properties */}
      <p className="ml-2 bg-blue-600" /> {/* expect: liro/no-raw-colors, liro/logical-properties */}
    </div>
  )
}
