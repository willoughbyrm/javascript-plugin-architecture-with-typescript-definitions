type Options = {
  [key: string]: unknown;
};

type ApiExtension = { [key: string]: any };
type TestPlugin = (
  instance: Base,
  options: Options
) => ApiExtension | undefined;
type Constructor<T> = new (...args: any[]) => T;

/**
 * @author https://stackoverflow.com/users/2887218/jcalz
 * @see https://stackoverflow.com/a/50375286/10325032
 */
type UnionToIntersection<Union> = (Union extends any
  ? (argument: Union) => void
  : never) extends (argument: infer Intersection) => void // tslint:disable-line: no-unused
  ? Intersection
  : never;

type AnyFunction = (...args: any) => any;

type ReturnTypeOf<T extends AnyFunction | AnyFunction[]> = T extends AnyFunction
  ? ReturnType<T>
  : T extends AnyFunction[]
  ? UnionToIntersection<ReturnType<T[number]>>
  : never;

export class Base {
  static plugins: TestPlugin[] = [];
  static plugin<
    S extends Constructor<any> & { plugins: any[] },
    T extends TestPlugin | TestPlugin[]
  >(this: S, plugin: T) {
    const currentPlugins = this.plugins;

    const BaseWithPlugins = class extends this {
      static plugins = currentPlugins.concat(plugin);
    };

    type Extension = ReturnTypeOf<T>;
    return BaseWithPlugins as typeof BaseWithPlugins & Constructor<Extension>;
  }

  static defaults<S extends Constructor<any>>(this: S, defaults: Options) {
    const OctokitWithDefaults = class extends this {
      constructor(...args: any[]) {
        super(Object.assign({}, defaults, args[0] || {}));
      }
    };

    return OctokitWithDefaults;
  }

  constructor(options: Options = {}) {
    this.options = options;

    // apply plugins
    // https://stackoverflow.com/a/16345172
    const classConstructor = this.constructor as typeof Base;
    classConstructor.plugins.forEach(plugin => {
      Object.assign(this, plugin(this, options));
    });
  }

  options: Options;
}
