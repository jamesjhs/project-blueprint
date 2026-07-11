import webpush from 'web-push';
import { VAPID } from './config';

export function configureWebPush(): void {
  if (VAPID.publicKey && VAPID.privateKey) {
    webpush.setVapidDetails(VAPID.subject, VAPID.publicKey, VAPID.privateKey);
  }
}
