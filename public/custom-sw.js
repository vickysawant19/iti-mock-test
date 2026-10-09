// custom-sw.js — ITI Mitra Background Web Push & Notification Handlers
// This file is imported by the Workbox-generated service worker via importScripts().
// It runs in the SW context — no DOM, no React, no module imports.

// ─────────────────────────────────────────────────────────────────────────────
// PUSH EVENT — fires when the Appwrite Function sends a Web Push message
// Works when the browser/tab is CLOSED.
// ─────────────────────────────────────────────────────────────────────────────
self.addEventListener('push', function (event) {
  let data = {};
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data = { title: 'ITI Mitra', body: event.data.text() };
    }
  } else {
    data = {
      title: 'ITI Mitra',
      body: 'You have a new update from ITI Mitra.',
    };
  }

  const tag = data.tag || 'iti-mitra-general';

  const showPromise = (async () => {
    // If this is an attendance reminder push, check if student already marked today
    if (tag.startsWith('iti-attendance')) {
      try {
        const cache = await caches.open('iti-sw-state');
        const today = new Date().toISOString().split('T')[0];
        const markedRes = await cache.match(`att-marked-${today}`);
        if (markedRes) {
          const isMarked = await markedRes.text();
          if (isMarked === 'true') {
            return; // Already marked today, skip notification
          }
        }
      } catch {}
    }

    console.log('[custom-sw.js] Background Push event received:', data);
    const title = data.title || 'ITI Mitra';
    const options = {
      body: data.body || 'You have a new update.',
      icon: data.icon || '/icons/icon-192x192.png',
      badge: '/icons/icon-192x192.png',
      vibrate: data.vibrate || [200, 100, 200],
      tag,
      renotify: true,
      requireInteraction: data.requireInteraction !== undefined ? data.requireInteraction : true,
      data: {
        url: data.url || '/arena',
        ...data,
      },
      actions: [
        { action: 'open', title: 'Open App' },
        { action: 'dismiss', title: 'Dismiss' },
      ],
    };

    return self.registration.showNotification(title, options);
  })();

  event.waitUntil(showPromise);
});

// ─────────────────────────────────────────────────────────────────────────────
// NOTIFICATION CLICK — navigate to the correct page when user taps
// ─────────────────────────────────────────────────────────────────────────────
self.addEventListener('notificationclick', function (event) {
  event.notification.close();

  if (event.action === 'dismiss') return;

  const targetUrl = event.notification.data?.url || '/arena';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (clientList) {
      // Focus an existing window if possible
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }
      // Open a new window
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// PERIODIC BACKGROUND SYNC — attendance reminder (Chrome/Android only, ~daily)
// Complements the server-sent Web Push for devices that support it.
// ─────────────────────────────────────────────────────────────────────────────
self.addEventListener('periodicsync', function (event) {
  if (event.tag === 'iti-attendance-check') {
    event.waitUntil(checkAndShowAttendanceReminder());
  }
});

async function checkAndShowAttendanceReminder() {
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0 = Sunday
  const hour = now.getHours();

  // Only remind Mon–Sat between 08:30 and 17:30
  if (dayOfWeek === 0) return;
  if (hour < 8 || hour >= 18) return;
  if (hour === 8 && now.getMinutes() < 30) return;

  const cache = await caches.open('iti-sw-state');
  const today = now.toISOString().split('T')[0];

  // If attendance is already marked today in cache, skip reminder!
  const markedRes = await cache.match(`att-marked-${today}`);
  if (markedRes) {
    const isMarked = await markedRes.text();
    if (isMarked === 'true') return;
  }

  // Check snooze key persisted in the SW cache storage
  const snoozeKey = `att-snooze-${today}`;
  const snoozeRes = await cache.match(snoozeKey);
  if (snoozeRes) {
    const snoozeUntil = await snoozeRes.text();
    if (Date.now() < Number(snoozeUntil)) return;
  }

  // Fetch batch details from cache if stored
  let batchName = '';
  const batchRes = await cache.match('iti-active-batch');
  if (batchRes) {
    try {
      const bData = await batchRes.json();
      batchName = bData.name || bData.BatchName || '';
    } catch {}
  }

  await self.registration.showNotification('📋 Attendance Reminder', {
    body: batchName
      ? `Don't forget to mark your attendance today for ${batchName}! Tap to mark now.`
      : "Don't forget to mark your attendance today! Tap to mark now.",
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-192x192.png',
    tag: 'iti-attendance-daily',
    renotify: false,
    vibrate: [200, 100, 200],
    data: { url: '/attendance/mark-my-attendance' },
    actions: [
      { action: 'mark', title: 'Mark Now' },
      { action: 'snooze', title: 'Remind in 1h' },
    ],
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// NOTIFICATION CLOSE / SNOOZE ACTION
// ─────────────────────────────────────────────────────────────────────────────
self.addEventListener('notificationclose', function (event) {
  // Track which notifications were dismissed (optional analytics)
});

// Handle snooze action from attendance notification
self.addEventListener('notificationclick', function (event) {
  // Note: This is a second listener — both fire, order matters.
  // The first listener above handles 'dismiss' and navigation.
  // This one handles the 'snooze' action from attendance notifications.
  if (event.action === 'snooze' && event.notification.tag === 'iti-attendance-daily') {
    event.notification.close();
    event.waitUntil(
      (async () => {
        const cache = await caches.open('iti-sw-state');
        const today = new Date().toISOString().split('T')[0];
        const snoozeUntil = String(Date.now() + 60 * 60 * 1000); // 1 hour
        await cache.put(`att-snooze-${today}`, new Response(snoozeUntil));
      })()
    );
  }

  if (event.action === 'mark' && event.notification.tag === 'iti-attendance-daily') {
    event.notification.close();
    event.waitUntil(
      clients.openWindow('/attendance/mark-my-attendance')
    );
  }
}, { once: false });

// ─────────────────────────────────────────────────────────────────────────────
// MESSAGE FROM PAGE — page can post messages to the SW
// e.g., to register periodic sync after user grants permission
// ─────────────────────────────────────────────────────────────────────────────
self.addEventListener('message', function (event) {
  if (event.data?.type === 'REGISTER_PERIODIC_SYNC') {
    // The page requested we register the attendance check periodic sync
    self.registration.periodicSync?.register('iti-attendance-check', {
      minInterval: 8 * 60 * 60 * 1000, // at most every 8 hours
    }).catch(() => {
      // periodicSync not available on this browser — server-push handles it
    });
  }

  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
