export type EventSubscription = (
  listener: () => void,
) => () => void

export type StorageChangeSubscription = EventSubscription

export type PathLocation = Pick<Location, "pathname">
