export enum UserEvents {
  Subscribe,
  Unsubscribe,
  SendMessage
};

interface SubscribeEvent {
  chat_id: string;
};

interface UnsubscribeEvent {
  chat_id: string;
};

interface SendMessageEvent {
  chat_id: string;
  content: string;
}

export interface UserEvent extends Record<UserEvents, unknown> {
  [UserEvents.Subscribe]: SubscribeEvent;
  [UserEvents.Unsubscribe]: UnsubscribeEvent;
  [UserEvents.SendMessage]: SendMessageEvent;
};
