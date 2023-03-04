import { FakeP } from './fakeP'

export const isFunction = (value: unknown): value is Function => typeof value === 'function'

export const isObject = (value: unknown): value is Object => value ? typeof value === 'object' : false

export const isFakeP = (value: unknown): value is FakeP => value instanceof FakeP