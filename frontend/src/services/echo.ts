import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

// Extend window object for Pusher
(window as unknown as { Pusher: typeof Pusher }).Pusher = Pusher;

export const echo = new Echo({
  broadcaster: 'reverb',
  key: 'xf5oipjebaf9kjx5te4y',
  wsHost: '127.0.0.1',
  wsPort: 8080,
  wssPort: 8080,
  forceTLS: false,
  enabledTransports: ['ws', 'wss'],
  authEndpoint: 'http://localhost:8005/api/broadcasting/auth',
  auth: {
    headers: {
      Authorization: `Bearer ${localStorage.getItem('bucoride_token') || ''}`,
    },
  },
});

export default echo;
