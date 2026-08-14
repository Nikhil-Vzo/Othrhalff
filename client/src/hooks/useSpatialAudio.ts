import { useEffect, useRef } from 'react';

interface RemotePlayerPos {
  x: number;
  y: number;
}

export interface SpatialAudioTrack {
  participant: {
    identity: string;
    isLocal?: boolean;
  };
  track: {
    mediaStream?: MediaStream;
  };
}

/**
 * useSpatialAudio
 * Attenuates remote participant audio volume based on Euclidean distance in the 2D Playground world.
 * Uses Web Audio API GainNodes to smoothly ramp gain and prevent audio pops/clicks.
 */
export function useSpatialAudio(
  localPlayerPos: { x: number; y: number },
  remotePlayers: Map<string, RemotePlayerPos>,
  tracks: SpatialAudioTrack[],
  maxAudibleDistance: number = 500
) {
  const audioContextRef = useRef<AudioContext | null>(null);
  const gainNodesRef = useRef<Map<string, GainNode>>(new Map());

  // Initialize Web Audio API context safely
  useEffect(() => {
    if (typeof window !== 'undefined' && !audioContextRef.current) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        audioContextRef.current = new AudioContextClass();
      }
    }

    return () => {
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(() => {});
      }
    };
  }, []);

  useEffect(() => {
    const ctx = audioContextRef.current;
    if (!ctx || ctx.state === 'closed') return;

    // Resume suspended audio context on user gesture if needed
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    tracks.forEach(({ participant, track }) => {
      if (participant.isLocal) return; // Never apply gain node to our own microphone

      const remotePlayer = remotePlayers.get(participant.identity);
      if (!remotePlayer || !track.mediaStream) return;

      // Create or retrieve GainNode for this participant
      let gainNode = gainNodesRef.current.get(participant.identity);
      if (!gainNode) {
        try {
          gainNode = ctx.createGain();
          const source = ctx.createMediaStreamSource(track.mediaStream);
          source.connect(gainNode);
          gainNode.connect(ctx.destination);
          gainNodesRef.current.set(participant.identity, gainNode);
        } catch (err) {
          console.warn('[Spatial Audio] Failed to connect media stream source:', err);
          return;
        }
      }

      // 1. Calculate 2D Euclidean Distance
      const dx = remotePlayer.x - localPlayerPos.x;
      const dy = remotePlayer.y - localPlayerPos.y;
      const distance = Math.hypot(dx, dy);

      // 2. Linear / Inverse attenuation curve
      let volume = 0;
      if (distance < maxAudibleDistance) {
        volume = Math.max(0, 1 - (distance / maxAudibleDistance));
      }

      // 3. Smooth exponential volume transition (prevents audio clipping)
      try {
        gainNode.gain.setTargetAtTime(volume, ctx.currentTime, 0.1);
      } catch {
        gainNode.gain.value = volume;
      }
    });
  }, [localPlayerPos, remotePlayers, tracks, maxAudibleDistance]);

  // Clean up disconnected audio nodes on unmount
  useEffect(() => {
    return () => {
      gainNodesRef.current.forEach(node => {
        try {
          node.disconnect();
        } catch {}
      });
      gainNodesRef.current.clear();
    };
  }, []);
}
