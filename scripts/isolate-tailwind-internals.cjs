// Copyright © 2026 Ignat Remizov
module.exports = () => ({
  postcssPlugin: 'vtd-isolate-tailwind-internals',
  OnceExit(root, { result }) {
    if (!result.opts.from?.replaceAll('\\', '/').endsWith('/src/style.css'))
      return
    // Tailwind's prefix covers utilities and theme tokens, but its implementation
    // properties still use --tw-*. Keep those independent from the host runtime.
    root.walkDecls((declaration) => {
      declaration.prop = declaration.prop.replaceAll('--tw-', '--vtd-tw-')
      declaration.value = declaration.value.replaceAll('--tw-', '--vtd-tw-')
    })
    root.walkAtRules('property', (rule) => {
      rule.params = rule.params.replaceAll('--tw-', '--vtd-tw-')
    })
    root.walkRules((rule) => {
      if (rule.parent.type === 'atrule' && rule.parent.name === 'supports'
        && rule.nodes.some(node => node.type === 'decl' && node.prop.startsWith('--vtd-tw-'))) {
        rule.selector = '.vtd-root, .vtd-root *, .vtd-root ::before, .vtd-root ::after, .vtd-root ::backdrop'
      }
    })
  },
})
module.exports.postcss = true
