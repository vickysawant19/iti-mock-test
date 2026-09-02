// custom-sw.js - ITI Mitra Background Web Push & Notification Handlers

self.addEventListener('push', function (event) {
  let data = {};
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data = { title: 'ITI Mitra Notification', body: event.data.text() };
    }
  } else {
    data = {
      title: 'ITI Mitra Notification',
      body: 'You have a new update from ITI Mitra.',
    };
  }

  const title = data.title || 'ITI Mitra Notification';
  const options = {
    body: data.body || 'You have a new update from ITI Mitra.',
    icon: data.icon || '/icons/icon-192x192.png',
    badge: '/icons/icon-192x192.png',
    vibrate: [200, 100, 200],
    tag: data.tag || 'iti-mitra-general',
    renotify: true,
    data: {
      url: data.url || '/',
      ...data,
    },
    actions: [
      {
        action: 'open',
        title: 'Open App',
      },
    ],
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', function (event) {
  event.notification.close();
  const targetUrl = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (clientList) {
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
