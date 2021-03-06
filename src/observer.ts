export type Observer<EventType> = (event: EventType) => void;

interface ISubject<EventType> {
  registerObserver(observer: Observer<EventType>): () => void;
  notifyObservers(ev: EventType): void;
}

export function createSubject<EventType>(): ISubject<EventType> {
  let observers: Observer<EventType>[] = [];

  const register = (observer: Observer<EventType>) => {
    observers.push(observer);

    return () => {
      observers = observers.filter((o) => o !== observer);
    };
  };

  const notify = (ev: EventType) => {
    for (const observer of observers) {
      observer(ev);
    }
  };

  return {
    registerObserver: register,
    notifyObservers: notify,
  };
}
