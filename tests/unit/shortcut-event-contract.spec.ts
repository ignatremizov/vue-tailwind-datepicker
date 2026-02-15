import { nextTick } from 'vue'
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
  it('emits blocked-date with no model update when constraints reject output', async () => {
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
      await button!.trigger('click')
      await nextTick()

      const payload = getLastInvalidPayload(wrapper)
      expect(payload.id).toBe('typed-blocked')
      expect(payload.reason).toBe('blocked-date')
      expect(payload.mode).toBe('range')
      expect(payload.resolvedValue).toBeTruthy()
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
})
