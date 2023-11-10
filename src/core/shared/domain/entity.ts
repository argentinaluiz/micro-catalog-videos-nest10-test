import { Notification } from './validators/notification';
import { ValueObject } from './value-object';

export abstract class Entity {
  abstract get entity_id(): ValueObject;

  abstract toJSON(): any;

  notification: Notification = new Notification();
}
