import type {
  ExtensionMessage,
  ExtensionResponse,
} from "../shared/messages"

type MessageListener = (
  message: ExtensionMessage,
) => ExtensionResponse | Promise<ExtensionResponse>

type MessageApi = {
  runtime: {
    onMessage: {
      addListener(listener: MessageListener): void
      removeListener(listener: MessageListener): void
    }
  }
  tabs: {
    query(query: { active: boolean; currentWindow: boolean }): Promise<Array<{ id?: number }>>
    sendMessage(tabId: number, message: ExtensionMessage): Promise<ExtensionResponse>
  }
}

function getMessageApi(): MessageApi {
  const extensionApi = globalThis.browser ?? globalThis.chrome

  if (!extensionApi?.runtime?.onMessage || !extensionApi?.tabs) {
    throw new Error("Browser messaging API is unavailable")
  }

  return extensionApi as MessageApi
}

export function subscribeToMessages(listener: MessageListener): () => void {
  const api = getMessageApi()
  api.runtime.onMessage.addListener(listener)

  return () => api.runtime.onMessage.removeListener(listener)
}

export async function sendMessageToActiveTab(
  message: ExtensionMessage,
): Promise<ExtensionResponse> {
  const api = getMessageApi()
  const [activeTab] = await api.tabs.query({ active: true, currentWindow: true })

  if (activeTab?.id === undefined) {
    return { ok: false, error: "Active tab is unavailable" }
  }

  return api.tabs.sendMessage(activeTab.id, message)
}
