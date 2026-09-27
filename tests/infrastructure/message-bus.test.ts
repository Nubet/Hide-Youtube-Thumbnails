import { afterEach, describe, expect, it, vi } from "vitest"
import {
  sendMessageToActiveTab,
  subscribeToMessages,
} from "../../src/infrastructure/message-bus"

const browserGlobal = globalThis as typeof globalThis & { browser?: unknown }

afterEach(() => {
  delete browserGlobal.browser
})

describe("message bus", () => {
  it("registers and removes message listeners", () => {
    const addListener = vi.fn()
    const removeListener = vi.fn()
    browserGlobal.browser = {
      runtime: { onMessage: { addListener, removeListener } },
      tabs: {},
    }
    const listener = vi.fn()

    const unsubscribe = subscribeToMessages(listener)
    unsubscribe()

    expect(addListener).toHaveBeenCalledWith(listener)
    expect(removeListener).toHaveBeenCalledWith(listener)
  })

  it("supports content-script listeners without the tabs API", () => {
    const addListener = vi.fn()
    const removeListener = vi.fn()
    browserGlobal.browser = {
      runtime: { onMessage: { addListener, removeListener } },
    }
    const listener = vi.fn()

    const unsubscribe = subscribeToMessages(listener)
    unsubscribe()

    expect(addListener).toHaveBeenCalledWith(listener)
    expect(removeListener).toHaveBeenCalledWith(listener)
  })

  it("sends a message to the active tab", async () => {
    const sendMessage = vi.fn(async () => ({ ok: true as const }))
    const message = { type: "get-runtime-state" as const }
    browserGlobal.browser = {
      runtime: { onMessage: {} },
      tabs: {
        query: vi.fn(async () => [{ id: 42 }]),
        sendMessage,
      },
    }

    await expect(sendMessageToActiveTab(message)).resolves.toEqual({ ok: true })
    expect(sendMessage).toHaveBeenCalledWith(42, message)
  })

  it("returns an error when there is no active tab", async () => {
    browserGlobal.browser = {
      runtime: { onMessage: {} },
      tabs: { query: vi.fn(async () => []), sendMessage: vi.fn() },
    }

    await expect(
      sendMessageToActiveTab({ type: "get-runtime-state" }),
    ).resolves.toEqual({ ok: false, error: "Active tab is unavailable" })
  })
})
