interface ReadyEvent {

};

export interface UserEvents {
  Ready: ReadyEvent;
};


export type UserEventName = keyof UserEvents;
