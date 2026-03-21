'use client';

import { useGameStore } from '@/stores/gameStore';

export default function Notifications() {
  const notifications = useGameStore((s) => s.notifications);

  if (notifications.length === 0) return null;

  return (
    <div className="notifications-container">
      {notifications.map((notif) => (
        <div key={notif.id} className="notification-toast">
          {notif.text}
        </div>
      ))}
    </div>
  );
}
