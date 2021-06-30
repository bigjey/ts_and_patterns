import { createSubject, Observer } from "./observer";

interface IPokemon {
  id: string;
  attack: number;
  armor: number;
}

interface IVegetable {
  id: string;
  name: string;
}

interface IBaseDBRecord {
  id: string;
}

type ScoreFunction<T> = (item: T) => number;

type BestStrategy<T> = { evaluate: (item: T) => number };

interface IDatabase<T extends IBaseDBRecord> {
  set(item: T): void;
  get(key: string): T | undefined;
  each(callback: (item: T) => void): void;
  getBestByScore(scoreStrategy: ScoreFunction<T>): T[];
  setBestStrategy(strategy: BestStrategy<T>): void;

  getBestWiki(): T[];
}

interface IBeforeSetSubject<T> {
  onBeforeSet(observer: Observer<OnBeforeSetEvent<T>>): () => void;
}

type OnBeforeSetEvent<T> = { existingItem: T | undefined; item: T };
type OnReadEvent = { id: string };

class Database<T extends IBaseDBRecord>
  implements IDatabase<T>, IBeforeSetSubject<T>
{
  private db: Record<string, T> = {};

  private beforeSetSubject = createSubject<OnBeforeSetEvent<T>>();
  private onReadSubject = createSubject<OnReadEvent>();

  private bestStrategy: BestStrategy<T>;

  constructor(strategy: BestStrategy<T>) {
    this.bestStrategy = strategy;
  }

  set(item: T) {
    this.beforeSetSubject.notifyObservers({
      existingItem: this.db[item.id],
      item: item,
    });

    this.db[item.id] = item;
  }

  get(key: string): T | undefined {
    this.onReadSubject.notifyObservers({
      id: key,
    });

    return this.db[key];
  }

  each(callback: (item: T) => void): void {
    for (const item of Object.values(this.db)) {
      callback(item);
    }
  }

  getBestByScore(scoreStrategy: ScoreFunction<T>): T[] {
    let result: T[] = [];
    let bestScore = Number.MIN_SAFE_INTEGER;

    this.each((item) => {
      const score = scoreStrategy(item);

      if (score > bestScore) {
        result = [item];
        bestScore = score;
      } else if (score === bestScore) {
        result.push(item);
      }
    });

    return result;
  }

  setBestStrategy(strategy: BestStrategy<T>) {
    this.bestStrategy = strategy;
  }

  getBestWiki(): T[] {
    let result: T[] = [];
    let bestScore = Number.MIN_SAFE_INTEGER;

    this.each((item) => {
      const score = this.bestStrategy.evaluate(item);

      if (score > bestScore) {
        result = [item];
        bestScore = score;
      } else if (score === bestScore) {
        result.push(item);
      }
    });

    return result;
  }

  onBeforeSet(observer: Observer<OnBeforeSetEvent<T>>) {
    return this.beforeSetSubject.registerObserver(observer);
  }

  onRead(observer: Observer<OnReadEvent>) {
    return this.onReadSubject.registerObserver(observer);
  }
}

const BestAttack: BestStrategy<IPokemon> = {
  evaluate(pokemon) {
    return pokemon.attack;
  },
};

const BestBalance: BestStrategy<IPokemon> = {
  evaluate(pokemon) {
    let deviation = 0;

    const median = (pokemon.attack + pokemon.armor) * 0.5;

    if (median === 0) {
      console.warn("median is 0, skipping evaluation", pokemon);
      return Number.MIN_SAFE_INTEGER;
    }

    deviation += Math.abs(median - pokemon.attack) / median;
    deviation += Math.abs(median - pokemon.armor) / median;

    return -deviation;
  },
};

console.log("\n---- Pokemons -----\n");

const pokemonsDB = new Database<IPokemon>(BestAttack);

pokemonsDB.set({
  id: "pikachu",
  attack: 10,
  armor: 2,
});

pokemonsDB.set({
  id: "pikachu",
  attack: 90,
  armor: 10,
});

pokemonsDB.set({
  id: "bulbasaur",
  attack: 1,
  armor: -1,
});

pokemonsDB.set({
  id: "coffy",
  attack: 41,
  armor: 60,
});

pokemonsDB.set({
  id: "charmander",
  attack: 40,
  armor: 60,
});

pokemonsDB.each(console.log);

console.log("best pokemon by attack", pokemonsDB.getBestWiki());

pokemonsDB.setBestStrategy(BestBalance);

console.log("best pokemon by balance", pokemonsDB.getBestWiki());

console.log("\n---- Veggies -----\n");

const veggiesDB = new Database<IVegetable>({
  evaluate(item) {
    return 0;
  },
});

veggiesDB.set({
  id: "carrot",
  name: "Mighty Carrot",
});

veggiesDB.each(console.log);
