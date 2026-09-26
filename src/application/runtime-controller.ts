import { defaultSettings, type Settings } from "../domain/settings"
import { createRuntimeState } from "../domain/policy"
import type { RuntimeState } from "../domain/runtime-state"
import type { PageType } from "../domain/page-type"
import { getChannelVideosKey } from "../domain/channel-whitelist"
import type {
  PathLocation,
  EventSubscription,
  StorageChangeSubscription,
} from "../shared/contracts"

type SettingsRepository = {
  load(): Promise<Settings>
}

type StyleState = {
  markLoading(): void
  apply(state: RuntimeState): void
  clear(): void
}

export type RuntimeControllerDependencies = {
  settingsRepository: SettingsRepository
  styleState: StyleState
  getLocation: () => PathLocation
  classify: (location: PathLocation) => PageType
  subscribeToStorageChanges?: StorageChangeSubscription
  subscribeToNavigationChanges?: EventSubscription
  onStateApplied?: (state: RuntimeState) => void
}

export class RuntimeController {
  private refreshVersion = 0
  private unsubscribeFromStorage: (() => void) | undefined
  private unsubscribeFromNavigation: (() => void) | undefined
  private currentState: RuntimeState | undefined

  public constructor(
    private readonly dependencies: RuntimeControllerDependencies,
  ) {}

  public start(): void {
    this.dependencies.styleState.markLoading()
    this.unsubscribeFromStorage = (
      this.dependencies.subscribeToStorageChanges ?? (() => () => undefined)
    )(() => {
      void this.refresh()
    })
    this.unsubscribeFromNavigation = (
      this.dependencies.subscribeToNavigationChanges ?? (() => () => undefined)
    )(() => {
      void this.refresh()
    })

    void this.refresh()
  }

  public async refresh(): Promise<void> {
    const version = ++this.refreshVersion
    const settings = await this.loadSettings()

    if (version !== this.refreshVersion) return

    const pageType = this.dependencies.classify(this.dependencies.getLocation())
    const state = createRuntimeState(
      settings,
      pageType,
      getChannelVideosKey(this.dependencies.getLocation().pathname),
    )

    this.currentState = state
    this.dependencies.styleState.apply(state)
    this.dependencies.onStateApplied?.(state)
  }

  public getState(): RuntimeState | undefined {
    return this.currentState
  }

  public dispose(): void {
    this.refreshVersion += 1
    this.unsubscribeFromStorage?.()
    this.unsubscribeFromStorage = undefined
    this.unsubscribeFromNavigation?.()
    this.unsubscribeFromNavigation = undefined
    this.currentState = undefined
    this.dependencies.styleState.clear()
  }

  private async loadSettings(): Promise<Settings> {
    try {
      return await this.dependencies.settingsRepository.load()
    } catch {
      return defaultSettings
    }
  }
}
