export enum UserEvents {
  Subscribe,
  Unsubscribe
};

interface SubscribeEvent {
  chat_id: string;
};

interface UnsubscribeEvent {
  chat_id: string;
};

export interface UserEvent extends Record<UserEvents, unknown> {
  [UserEvents.Subscribe]: SubscribeEvent;
  [UserEvents.Unsubscribe]: UnsubscribeEvent;
};
