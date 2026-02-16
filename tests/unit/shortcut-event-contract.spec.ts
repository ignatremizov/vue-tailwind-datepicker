import { h, nextTick } from 'vue'
import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import VueTailwindDatePicker from '../../src/VueTailwindDatePicker.vue'
import useShortcut from '../../src/composables/shortcut'
import { SHORTCUT_EDGE_FIXTURES, createLocalDate, withFixedNow } from './shortcut-test-utils'

async function mountPicker(props: Record<string, unknown> = {}) {
  const wrapper = mount(VueTailwindDatePicker, {
    attachTo: document.body,
    props: {
      noInput: true,
      shortcuts: true,
      autoApply: true,
      asSingle: true,
      useRange: true,
      modelValue: [
        createLocalDate(2026, 0, 15, 12, 0, 0),
        createLocalDate(2026, 0, 15, 12, 0, 0),
      ],
      ...props,
    },
  })
  await vi.advanceTimersByTimeAsync(320)
  await nextTick()
  return wrapper
}

function getShortcutButton(wrapper: ReturnType<typeof mount>, label: string) {
  return wrapper.findAll('button.vtd-shortcuts').find(button => button.text().trim() === label)
}

function expectNoModelUpdate(wrapper: ReturnType<typeof mount>) {
  expect(wrapper.emitted('update:modelValue')).toBeFalsy()
}

function getLastInvalidPayload(wrapper: ReturnType<typeof mount>) {
  const invalidEvents = wrapper.emitted('invalid-shortcut')
  expect(invalidEvents).toBeTruthy()
  return invalidEvents!.at(-1)?.[0] as Record<string, unknown>
}

describe.sequential('invalid-shortcut event contract', () => {
  it('treats explicit disabled shortcuts as disabled failures', () => {
    const { activateShortcut } = useShortcut()
    const now = SHORTCUT_EDGE_FIXTURES.monthBoundary.now
    const result = activateShortcut({
      item: {
        id: 'typed-disabled',
        label: 'Typed disabled',
        disabled: true,
        resolver: () => now,
      },
      mode: 'range',
      currentValue: now,
      now,
      constraints: {
        isDateBlocked: () => false,
      },
    })

    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.payload.id).toBe('typed-disabled')
      expect(result.payload.reason).toBe('disabled')
      expect(result.payload.mode).toBe('range')
      expect(result.payload.resolvedValue).toBeNull()
    }
  })

  it('marks typed shortcuts disabled when constraints reject resolver output', async () => {
    await withFixedNow(SHORTCUT_EDGE_FIXTURES.monthBoundary.now, async () => {
      const wrapper = await mountPicker({
        useRange: true,
        asSingle: true,
        disableDate: () => true,
        shortcuts: [
          {
            id: 'typed-blocked',
            label: 'Blocked typed',
            resolver: ({ now }: { now: Date }) => now,
          },
        ],
      })

      const button = getShortcutButton(wrapper, 'Blocked typed')
      expect(button).toBeTruthy()
      expect(button!.attributes('disabled')).toBeDefined()
      await button!.trigger('click')
      await nextTick()

      expect(wrapper.emitted('invalid-shortcut')).toBeFalsy()
      expectNoModelUpdate(wrapper)
      wrapper.unmount()
    })
  })

  it('returns mode-mismatch for typed [Date, Date] in single mode', async () => {
    const { activateShortcut } = useShortcut()
    const now = SHORTCUT_EDGE_FIXTURES.monthBoundary.now
    const result = activateShortcut({
      item: {
        id: 'typed-mode-mismatch',
        label: 'Typed range in single',
        resolver: () => [now, now] as [Date, Date],
      },
      mode: 'single',
      currentValue: now,
      now,
      constraints: {
        isDateBlocked: () => false,
      },
    })

    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.payload.id).toBe('typed-mode-mismatch')
      expect(result.payload.reason).toBe('mode-mismatch')
      expect(result.payload.mode).toBe('single')
    }
  })

  it('emits resolver-error on thrown typed resolver with no model update', async () => {
    await withFixedNow(SHORTCUT_EDGE_FIXTURES.monthBoundary.now, async () => {
      const wrapper = await mountPicker({
        shortcuts: [
          {
            id: 'typed-throws',
            label: 'Typed throws',
            resolver: () => {
              throw new Error('broken resolver')
            },
          },
        ],
      })

      const button = getShortcutButton(wrapper, 'Typed throws')
      expect(button).toBeTruthy()
      await button!.trigger('click')
      await nextTick()

      const payload = getLastInvalidPayload(wrapper)
      expect(payload.id).toBe('typed-throws')
      expect(payload.reason).toBe('resolver-error')
      expect(payload.mode).toBe('range')
      expectNoModelUpdate(wrapper)
      wrapper.unmount()
    })
  })

  it('emits invalid-result for malformed resolver output with no model update', async () => {
    await withFixedNow(SHORTCUT_EDGE_FIXTURES.monthBoundary.now, async () => {
      const wrapper = await mountPicker({
        shortcuts: [
          {
            id: 'typed-invalid-result',
            label: 'Typed invalid',
            resolver: () => null as unknown as Date,
          },
        ],
      })

      const button = getShortcutButton(wrapper, 'Typed invalid')
      expect(button).toBeTruthy()
      await button!.trigger('click')
      await nextTick()

      const payload = getLastInvalidPayload(wrapper)
      expect(payload.id).toBe('typed-invalid-result')
      expect(payload.reason).toBe('invalid-result')
      expect(payload.mode).toBe('range')
      expectNoModelUpdate(wrapper)
      wrapper.unmount()
    })
  })

  it('generates deterministic fallback ids for legacy shortcuts without id', async () => {
    await withFixedNow(SHORTCUT_EDGE_FIXTURES.monthBoundary.now, async () => {
      const wrapper = await mountPicker({
        shortcuts: [
          {
            label: 'Last 15 Days',
            atClick: () => [] as Date[],
          },
        ],
      })

      const button = getShortcutButton(wrapper, 'Last 15 Days')
      expect(button).toBeTruthy()
      await button!.trigger('click')
      await nextTick()

      const payload = getLastInvalidPayload(wrapper)
      expect(payload.id).toBe('legacy-0-last-15-days')
      expect(payload.reason).toBe('invalid-result')
      expectNoModelUpdate(wrapper)
      wrapper.unmount()
    })
  })

  it('marks custom shortcut buttons disabled when disabled(context) resolves true', async () => {
    await withFixedNow(SHORTCUT_EDGE_FIXTURES.monthBoundary.now, async () => {
      const wrapper = await mountPicker({
        shortcuts: [
          {
            id: 'typed-disabled-flag',
            label: 'Disabled via context',
            disabled: () => true,
            resolver: ({ now }: { now: Date }) => now,
          },
        ],
      })

      const button = getShortcutButton(wrapper, 'Disabled via context')
      expect(button).toBeTruthy()
      expect(button!.attributes('disabled')).toBeDefined()
      wrapper.unmount()
    })
  })

  it('marks typed custom shortcuts disabled when resolver output is blocked by disableDate', async () => {
    await withFixedNow(SHORTCUT_EDGE_FIXTURES.monthBoundary.now, async () => {
      const wrapper = await mountPicker({
        shortcuts: [
          {
            id: 'typed-saturday',
            label: 'Typed Saturday',
            resolver: ({ now }: { now: Date }) => {
              const date = new Date(now)
              date.setDate(date.getDate() + ((6 - date.getDay() + 7) % 7 || 7))
              return date
            },
          },
        ],
        disableDate: (date: Date) => [0, 6].includes(date.getDay()),
      })

      const button = getShortcutButton(wrapper, 'Typed Saturday')
      expect(button).toBeTruthy()
      expect(button!.attributes('disabled')).toBeDefined()
      wrapper.unmount()
    })
  })

  it('normalizes padded custom shortcut ids consistently for slot payload and events', async () => {
    await withFixedNow(SHORTCUT_EDGE_FIXTURES.monthBoundary.now, async () => {
      const wrapper = mount(VueTailwindDatePicker, {
        attachTo: document.body,
        props: {
          noInput: true,
          shortcuts: [
            {
              id: '  typed-padded-id  ',
              label: 'Padded id shortcut',
              resolver: () => null as unknown as Date,
            },
          ],
          autoApply: true,
          asSingle: true,
          useRange: true,
          modelValue: [
            createLocalDate(2026, 0, 15, 12, 0, 0),
            createLocalDate(2026, 0, 15, 12, 0, 0),
          ],
        },
        slots: {
          'shortcut-item': ({ id, label, activate }: any) => h(
            'button',
            {
              type: 'button',
              class: 'slot-shortcut-item',
              'data-shortcut-id': id,
              onClick: activate,
            },
            label,
          ),
        },
      })
      await vi.advanceTimersByTimeAsync(320)
      await nextTick()

      const slotButton = wrapper.get('button.slot-shortcut-item')
      expect(slotButton.attributes('data-shortcut-id')).toBe('typed-padded-id')
      await slotButton.trigger('click')
      await nextTick()

      const payload = getLastInvalidPayload(wrapper)
      expect(payload.id).toBe('typed-padded-id')
      wrapper.unmount()
    })
  })

  it('normalizes padded legacy shortcut ids consistently for slot payload and events', async () => {
    await withFixedNow(SHORTCUT_EDGE_FIXTURES.monthBoundary.now, async () => {
      const wrapper = mount(VueTailwindDatePicker, {
        attachTo: document.body,
        props: {
          noInput: true,
          shortcuts: [
            {
              id: '  legacy-padded-id  ',
              label: 'Legacy padded id shortcut',
              atClick: () => [] as Date[],
            },
          ],
          autoApply: true,
          asSingle: true,
          useRange: true,
          modelValue: [
            createLocalDate(2026, 0, 15, 12, 0, 0),
            createLocalDate(2026, 0, 15, 12, 0, 0),
          ],
        },
        slots: {
          'shortcut-item': ({ id, label, activate }: any) => h(
            'button',
            {
              type: 'button',
              class: 'slot-shortcut-item',
              'data-shortcut-id': id,
              onClick: activate,
            },
            label,
          ),
        },
      })
      await vi.advanceTimersByTimeAsync(320)
      await nextTick()

      const slotButton = wrapper.get('button.slot-shortcut-item')
      expect(slotButton.attributes('data-shortcut-id')).toBe('legacy-padded-id')
      await slotButton.trigger('click')
      await nextTick()

      const payload = getLastInvalidPayload(wrapper)
      expect(payload.id).toBe('legacy-padded-id')
      expect(payload.reason).toBe('invalid-result')
      wrapper.unmount()
    })
  })

  it('caches typed shortcut disabled-state checks across unrelated rerenders', async () => {
    await withFixedNow(SHORTCUT_EDGE_FIXTURES.monthBoundary.now, async () => {
      const resolver = vi.fn(({ now }: { now: Date }) => now)
      const wrapper = await mountPicker({
        shortcuts: [
          {
            id: 'typed-cache',
            label: 'Typed cache',
            resolver,
          },
        ],
      })

      const initialCalls = resolver.mock.calls.length
      expect(initialCalls).toBeGreaterThan(0)

      await wrapper.setProps({
        inputClasses: 'cache-check',
      })
      await nextTick()
      expect(resolver).toHaveBeenCalledTimes(initialCalls)

      await wrapper.setProps({
        modelValue: [
          createLocalDate(2026, 0, 16, 12, 0, 0),
          createLocalDate(2026, 0, 16, 12, 0, 0),
        ],
      })
      await nextTick()
      expect(resolver.mock.calls.length).toBeGreaterThan(initialCalls)
      wrapper.unmount()
    })
  })

  it('invalidates cached activation state when the minute bucket changes under fake timers', async () => {
    const now = SHORTCUT_EDGE_FIXTURES.monthBoundary.now
    await withFixedNow(now, async () => {
      const resolver = vi.fn(() => null as unknown as Date)
      const wrapper = await mountPicker({
        shortcuts: [
          {
            id: 'typed-minute-bucket-cache',
            label: 'Typed minute bucket cache',
            resolver,
          },
        ],
      })

      const initialCalls = resolver.mock.calls.length
      expect(initialCalls).toBeGreaterThan(0)

      const button = getShortcutButton(wrapper, 'Typed minute bucket cache')
      expect(button).toBeTruthy()
      await button!.trigger('click')
      await nextTick()
      expect(resolver).toHaveBeenCalledTimes(initialCalls)

      vi.setSystemTime(new Date(now.getTime() + 61000))
      await button!.trigger('click')
      await nextTick()
      expect(resolver.mock.calls.length).toBeGreaterThan(initialCalls)
      wrapper.unmount()
    })
  })

  it('reuses typed activation state cached during disabled-state evaluation on first click', async () => {
    await withFixedNow(SHORTCUT_EDGE_FIXTURES.monthBoundary.now, async () => {
      const resolver = vi.fn(() => null as unknown as Date)
      const wrapper = await mountPicker({
        shortcuts: [
          {
            id: 'typed-first-click-cache',
            label: 'Typed first click cache',
            resolver,
          },
        ],
      })

      const initialCalls = resolver.mock.calls.length
      expect(initialCalls).toBeGreaterThan(0)

      const button = getShortcutButton(wrapper, 'Typed first click cache')
      expect(button).toBeTruthy()
      await button!.trigger('click')
      await nextTick()

      const payload = getLastInvalidPayload(wrapper)
      expect(payload.id).toBe('typed-first-click-cache')
      expect(payload.reason).toBe('invalid-result')
      expect(resolver).toHaveBeenCalledTimes(initialCalls)
      wrapper.unmount()
    })
  })

  it('marks built-in buttons disabled when disableDate blocks their resolved values', async () => {
    await withFixedNow(SHORTCUT_EDGE_FIXTURES.monthBoundary.now, async () => {
      const wrapper = await mountPicker({
        shortcuts: true,
        shortcutPreset: 'modern',
        disableDate: () => true,
      })

      const buttons = wrapper.findAll('button.vtd-shortcuts')
      expect(buttons.length).toBeGreaterThan(0)
      expect(buttons.every(button => button.attributes('disabled') !== undefined)).toBe(true)
      wrapper.unmount()
    })
  })

  it('keeps built-in slot ids aligned with invalid-shortcut payload ids', async () => {
    await withFixedNow(SHORTCUT_EDGE_FIXTURES.monthBoundary.now, async () => {
      const wrapper = mount(VueTailwindDatePicker, {
        attachTo: document.body,
        props: {
          noInput: true,
          shortcuts: true,
          shortcutPreset: 'modern',
          autoApply: true,
          asSingle: true,
          useRange: true,
          disableDate: () => true,
          modelValue: [
            createLocalDate(2026, 0, 15, 12, 0, 0),
            createLocalDate(2026, 0, 15, 12, 0, 0),
          ],
        },
        slots: {
          'shortcut-item': ({ id, label, activate }: any) => h(
            'button',
            {
              type: 'button',
              class: 'slot-shortcut-item',
              'data-shortcut-id': id,
              onClick: activate,
            },
            label,
          ),
        },
      })
      await vi.advanceTimersByTimeAsync(320)
      await nextTick()

      const todayButton = wrapper.get('button.slot-shortcut-item[data-shortcut-id="today"]')
      await todayButton.trigger('click')
      await nextTick()

      const payload = getLastInvalidPayload(wrapper)
      expect(payload.id).toBe('today')
      expect(payload.reason).toBe('blocked-date')
      wrapper.unmount()
    })
  })
})
