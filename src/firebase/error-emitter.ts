import { EventEmitter } from 'events';

// A simple, global event emitter to decouple error reporting from error handling.
// Components can emit 'permission-error' and a central listener can handle it.
export const errorEmitter = new EventEmitter();
