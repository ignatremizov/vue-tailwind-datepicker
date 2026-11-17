// Copyright © 2026 Zolvat Ltd

// Optional Tailwind 3/4 bridge; the application remains the palette owner.
module.exports = ({ addBase, theme }) => {
  const variables = {}
  for (const name of ['primary', 'secondary']) {
    const palette = theme(`colors.vtd-${name}`, {})
    if (!palette || typeof palette !== 'object' || Array.isArray(palette))
      continue
    for (const [shade, value] of Object.entries(palette)) {
      if (typeof value === 'string')
        variables[`--color-vtd-${name}${shade === 'DEFAULT' ? '' : `-${shade}`}`] = value.replaceAll('<alpha-value>', '1')
    }
  }
  addBase({ ':root, :host': variables })
}
