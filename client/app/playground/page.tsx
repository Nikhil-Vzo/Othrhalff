"use client";

import React, { useEffect, useState } from 'react';
import { Playground } from '../../src/views/Playground';
import { useAuth } from '../../src/context/AuthContext';
import { LiveKitRoom, RoomAudioRenderer } from '@livekit/components-react';

export default function Page() {
  const { currentUser } = useAuth();
  const [token, setToken] = useState<string | null>(null);

  const livekitUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL || 'wss://othrhalff-tmqcxj0g.livekit.cloud';

  useEffect(() => {
    let isMounted = true;
    const fetchToken = async () => {
      try {
        const identity = currentUser?.id || `anon-${Math.random().toString(36).substring(2, 9)}`;
        const name = currentUser?.realName || 'Student';
        const res = await fetch(
          `/api/livekit-token?room=playground-global-voice&identity=${encodeURIComponent(identity)}&name=${encodeURIComponent(name)}`
        );
        const data = await res.json();
        if (isMounted && data.token) {
          setToken(data.token);
        }
      } catch (err) {
        console.warn('[LiveKit Token Error]:', err);
      }
    };

    fetchToken();
    return () => {
      isMounted = false;
    };
  }, [currentUser]);

  if (!token) {
    return <Playground />;
  }

  return (
    <LiveKitRoom
      serverUrl={livekitUrl}
      token={token}
      connect={true}
      audio={true}
      video={false}
      className="w-full h-full"
    >
      <RoomAudioRenderer />
      <Playground />
    </LiveKitRoom>
  );
}
