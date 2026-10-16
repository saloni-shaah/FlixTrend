"use client";

import { useEffect, useRef, useState } from 'react';
import { LiveKitRoom, RoomAudioRenderer, useLocalParticipant, useRoomContext, useTracks, VideoTrack } from '@livekit/components-react';
import { Room, Track } from 'livekit-client';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { Mic, MicOff, Phone, PhoneOff, ScreenShare, ScreenShareOff, SwitchCamera, Video, VideoOff } from 'lucide-react';
import { auth, app } from '@/utils/firebaseClient';
import { ActiveCall, useAppState } from '@/utils/AppStateContext';
import { playCallTone, stopCallTone } from '@/utils/callAudio';
import { livekitCallUrl } from '@/utils/livekit';

function ParticipantVideo({
  track,
  name,
  avatarUrl,
  muted = false,
  className,
}: {
  track?: ReturnType<typeof useTracks>[number];
  name: string;
  avatarUrl?: string | null;
  muted?: boolean;
  className: string;
}) {
  if (!track?.publication?.track) {
    return (
      <div className={`${className} flex items-center justify-center bg-gradient-to-br from-gray-900 to-black text-5xl font-bold text-white`}>
        {avatarUrl
          ? <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
          : name.charAt(0).toUpperCase() || '?'}
      </div>
    );
  }

  return <VideoTrack trackRef={track} muted={muted} className={className} />;
}

function LocalCallPreview({ stream }: { stream: MediaStream }) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.srcObject = stream;
    void video.play().catch(error => {
      console.warn('Could not start the local call preview:', error);
    });
    return () => {
      video.srcObject = null;
    };
  }, [stream]);

  return (
    <video
      ref={videoRef}
      autoPlay
      playsInline
      muted
      aria-label="Your camera preview"
      className="absolute inset-0 h-full w-full scale-x-[-1] object-cover"
    />
  );
}

function ConnectedCall({
  call,
  onEnd,
  connectionError,
}: {
  call: ActiveCall;
  onEnd: () => void;
  connectionError: string | null;
}) {
  const { localParticipant, isMicrophoneEnabled, isCameraEnabled, isScreenShareEnabled } = useLocalParticipant();
  const room = useRoomContext();
  const tracks = useTracks([Track.Source.Camera, Track.Source.ScreenShare]);
  const userId = auth.currentUser?.uid;
  const remoteScreenTrack = tracks.find(track =>
    track.source === Track.Source.ScreenShare && track.participant.identity !== userId
  );
  const localScreenTrack = tracks.find(track =>
    track.source === Track.Source.ScreenShare && track.participant.identity === userId
  );
  const remoteCameraTrack = tracks.find(track =>
    track.source === Track.Source.Camera && track.participant.identity !== userId
  );
  const localCameraTrack = tracks.find(track =>
    track.source === Track.Source.Camera && track.participant.identity === userId
  );
  const primaryTrack = remoteScreenTrack || localScreenTrack || remoteCameraTrack;
  const primaryTrackIsScreen = primaryTrack?.source === Track.Source.ScreenShare;
  const [elapsed, setElapsed] = useState(0);
  const [mediaError, setMediaError] = useState<string | null>(null);
  const [mediaActionInProgress, setMediaActionInProgress] = useState(false);
  const [cameraFacingMode, setCameraFacingMode] = useState<'user' | 'environment'>('user');
  const isOutgoing = call.callerId === userId;
  const remoteName = (isOutgoing ? call.receiverName : call.callerName) || 'User';
  const remoteAvatar = isOutgoing ? call.receiverAvatar : call.callerAvatar;

  useEffect(() => {
    const timer = window.setInterval(() => setElapsed(seconds => seconds + 1), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const facingMode = localCameraTrack?.publication?.track?.mediaStreamTrack.getSettings().facingMode;
    if (facingMode === 'user' || facingMode === 'environment') {
      setCameraFacingMode(facingMode);
    }
  }, [localCameraTrack]);

  const toggleMicrophone = async () => {
    try {
      await localParticipant.setMicrophoneEnabled(!isMicrophoneEnabled);
      setMediaError(null);
    } catch (error) {
      console.error('Unable to change microphone state:', error);
      setMediaError('Microphone access is unavailable. Check your browser permissions.');
    }
  };

  const toggleCamera = async () => {
    try {
      await localParticipant.setCameraEnabled(!isCameraEnabled);
      setMediaError(null);
    } catch (error) {
      console.error('Unable to change camera state:', error);
      setMediaError('Camera access is unavailable. Check your browser permissions.');
    }
  };

  const switchCamera = async () => {
    if (!isCameraEnabled) {
      setMediaError('Turn your camera on before switching cameras.');
      return;
    }

    setMediaActionInProgress(true);
    try {
      const devices = await Room.getLocalDevices('videoinput', false);
      const currentDeviceId = room.getActiveDevice('videoinput')
        || localCameraTrack?.publication?.track?.mediaStreamTrack.getSettings().deviceId;
      const availableCameras = devices.filter(device => device.deviceId);
      const currentIndex = availableCameras.findIndex(device => device.deviceId === currentDeviceId);

      if (availableCameras.length > 1 && currentIndex >= 0) {
        const nextCamera = availableCameras[(currentIndex + 1) % availableCameras.length];
        await room.switchActiveDevice('videoinput', nextCamera.deviceId);
        const nextFacingMode = localParticipant.getTrackPublication(Track.Source.Camera)
          ?.track?.mediaStreamTrack.getSettings().facingMode;
        if (nextFacingMode === 'user' || nextFacingMode === 'environment') {
          setCameraFacingMode(nextFacingMode);
        }
      } else {
        const nextFacingMode = cameraFacingMode === 'user' ? 'environment' : 'user';
        await localParticipant.setCameraEnabled(false);
        try {
          await localParticipant.setCameraEnabled(true, { facingMode: nextFacingMode });
          setCameraFacingMode(nextFacingMode);
        } catch (error) {
          await localParticipant.setCameraEnabled(true, { facingMode: cameraFacingMode });
          throw error;
        }
      }
      setMediaError(null);
    } catch (error) {
      console.error('Unable to switch camera:', error);
      setMediaError(error instanceof Error && error.name === 'NotFoundError'
        ? 'No other camera is available on this device.'
        : 'Could not switch cameras. Check your camera permissions and try again.');
    } finally {
      setMediaActionInProgress(false);
    }
  };

  const toggleScreenShare = async () => {
    if (!isScreenShareEnabled && (!window.isSecureContext || !navigator.mediaDevices?.getDisplayMedia)) {
      setMediaError('Screen sharing requires a secure connection and browser support.');
      return;
    }

    setMediaActionInProgress(true);
    try {
      await localParticipant.setScreenShareEnabled(!isScreenShareEnabled);
      setMediaError(null);
    } catch (error) {
      console.error('Unable to change screen sharing state:', error);
      setMediaError(error instanceof Error && error.name === 'NotAllowedError'
        ? 'Screen sharing was cancelled or blocked by the browser.'
        : 'Could not start screen sharing. Check your browser permissions and try again.');
    } finally {
      setMediaActionInProgress(false);
    }
  };

  return (
    <div className="absolute inset-0 bg-black text-white">
      <RoomAudioRenderer />

      <div className="absolute inset-0">
        {call.type === 'video' ? (
          <>
            <ParticipantVideo
              track={primaryTrack}
              name={remoteName}
              avatarUrl={remoteAvatar}
              className={`h-full w-full ${primaryTrackIsScreen ? 'object-contain' : 'object-cover'}`}
            />
            {localCameraTrack && (
              <div className="absolute bottom-28 right-5 h-44 w-32 overflow-hidden rounded-2xl border border-white/20 bg-gray-900 shadow-2xl sm:bottom-28 sm:right-8 sm:h-56 sm:w-40">
                <ParticipantVideo
                  track={localCameraTrack}
                  name="You"
                  avatarUrl={auth.currentUser?.photoURL}
                  muted
                  className="h-full w-full scale-x-[-1] object-cover"
                />
              </div>
            )}
          </>
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-5 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-cyan-950 via-gray-950 to-black">
            <div className="flex h-32 w-32 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-fuchsia-600 text-5xl font-bold shadow-xl">
              {remoteName.charAt(0).toUpperCase() || '?'}
            </div>
            <div className="text-center">
              <h2 className="text-2xl font-semibold">{remoteName}</h2>
              <p className="mt-2 text-sm text-white/60">Voice call</p>
            </div>
          </div>
        )}
      </div>

      <div className="absolute left-0 right-0 top-0 flex items-start justify-between bg-gradient-to-b from-black/70 to-transparent px-6 pb-12 pt-8">
        <div>
          <h2 className="text-lg font-semibold">{remoteName}</h2>
          <p className="mt-1 text-sm text-white/70">
            {String(Math.floor(elapsed / 60)).padStart(2, '0')}:{String(elapsed % 60).padStart(2, '0')}
          </p>
        </div>
        <span className="rounded-full bg-black/40 px-3 py-1 text-xs uppercase tracking-wide text-white/70">
          {call.type} call
        </span>
      </div>

      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent px-4 pb-8 pt-16">
        {(mediaError || connectionError) && (
          <p role="alert" className="mb-4 text-center text-sm text-red-300">{mediaError || connectionError}</p>
        )}
        <div className="flex items-center justify-center gap-5">
          <button
            type="button"
            onClick={toggleMicrophone}
            disabled={mediaActionInProgress}
            aria-label={isMicrophoneEnabled ? 'Mute microphone' : 'Unmute microphone'}
            className={`rounded-full p-4 ${isMicrophoneEnabled ? 'bg-white/15' : 'bg-red-600'} text-white disabled:opacity-50`}
          >
            {isMicrophoneEnabled ? <Mic size={22} /> : <MicOff size={22} />}
          </button>
          {call.type === 'video' && (
            <button
              type="button"
              onClick={toggleCamera}
              disabled={mediaActionInProgress}
              aria-label={isCameraEnabled ? 'Turn camera off' : 'Turn camera on'}
              className={`rounded-full p-4 ${isCameraEnabled ? 'bg-white/15' : 'bg-red-600'} text-white disabled:opacity-50`}
            >
              {isCameraEnabled ? <Video size={22} /> : <VideoOff size={22} />}
            </button>
          )}
          {call.type === 'video' && (
            <>
              <button
                type="button"
                onClick={() => void switchCamera()}
                disabled={mediaActionInProgress || !isCameraEnabled}
                aria-label="Switch camera"
                title="Switch camera"
                className="rounded-full bg-white/15 p-4 text-white disabled:opacity-50"
              >
                <SwitchCamera size={22} />
              </button>
              <button
                type="button"
                onClick={() => void toggleScreenShare()}
                disabled={mediaActionInProgress}
                aria-label={isScreenShareEnabled ? 'Stop screen sharing' : 'Share screen'}
                title={isScreenShareEnabled ? 'Stop screen sharing' : 'Share screen'}
                className={`rounded-full p-4 text-white ${isScreenShareEnabled ? 'bg-cyan-600' : 'bg-white/15'} disabled:opacity-50`}
              >
                {isScreenShareEnabled ? <ScreenShareOff size={22} /> : <ScreenShare size={22} />}
              </button>
            </>
          )}
          <button
            type="button"
            onClick={onEnd}
            aria-label="End call"
            className="rounded-full bg-red-600 p-4 text-white hover:bg-red-500"
          >
            <PhoneOff size={22} />
          </button>
        </div>
      </div>
    </div>
  );
}

export function CallScreen({ call }: { call: ActiveCall }) {
  const { answerCall, rejectCall, handleEndCall, localCallPreview } = useAppState();
  const [token, setToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isResponding, setIsResponding] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [ringtoneError, setRingtoneError] = useState<string | null>(null);
  const [canRetryRingtone, setCanRetryRingtone] = useState(false);
  const userId = auth.currentUser?.uid;
  const isIncoming = call.receiverId === userId;
  const isTerminal = ['rejected', 'ended', 'missed'].includes(call.status);
  const contactName = (isIncoming ? call.callerName : call.receiverName) || 'User';

  useEffect(() => {
    const isRinging = call.status === 'ringing';
    setRingtoneError(null);
    setCanRetryRingtone(isRinging);
    if (!isRinging) {
      stopCallTone();
      return;
    }

    playCallTone(isIncoming ? 'incoming' : 'outgoing', isIncoming ? 1 : 0.6).catch(reason => {
      console.warn(`Call ringtone playback failed for ${call.id}:`, reason);
      setRingtoneError('Browser sound is blocked. Allow sound for FlixTrend and enable the ringtone.');
    });
    return () => {
      stopCallTone();
    };
  }, [call.id, call.status, isIncoming]);

  useEffect(() => {
    if (call.status !== 'accepted') {
      setToken(null);
      setIsConnected(false);
      return;
    }

    setIsConnected(false);
    let cancelled = false;
    const getCallToken = httpsCallable<{ callId: string; participantName: string }, { token: string }>(
      getFunctions(app),
      'getLiveKitToken'
    );

    getCallToken({
      callId: call.id,
      participantName: auth.currentUser?.displayName || auth.currentUser?.email || 'User',
    }).then(({ data }) => {
      if (!data.token) throw new Error('The call server did not return an access token.');
      if (!cancelled) {
        setError(null);
        setToken(data.token);
      }
    }).catch(reason => {
      console.error('Failed to join LiveKit call:', reason);
      if (!cancelled) {
        setError(reason instanceof Error ? reason.message : 'Could not connect to the call.');
      }
    });

    return () => {
      cancelled = true;
    };
  }, [call.id, call.status]);

  const respond = async (action: () => Promise<void>) => {
    setIsResponding(true);
    try {
      await action();
      setError(null);
    } catch (reason) {
      console.error('Call action failed:', reason);
      setError(reason instanceof Error ? reason.message : 'The call action failed. Please try again.');
    } finally {
      setIsResponding(false);
    }
  };

  const retryRingtone = () => {
    playCallTone(isIncoming ? 'incoming' : 'outgoing', isIncoming ? 1 : 0.6).then(() => {
      setRingtoneError(null);
      setCanRetryRingtone(false);
    }).catch(reason => {
      console.warn('Call tone playback remains blocked:', reason);
      setRingtoneError('Browser sound is blocked. Allow sound for FlixTrend and try again.');
      setCanRetryRingtone(true);
    });
  };

  const livekitUrl = livekitCallUrl;
  const isJoining = call.status === 'accepted' && !token && !error;

  return (
    <div className="fixed inset-0 z-[130] bg-black text-white" role="dialog" aria-modal="true" aria-label={`${call.type} call`}>
      {call.status === 'accepted' && token && livekitUrl && (
        <LiveKitRoom
          token={token}
          serverUrl={livekitUrl}
          connect
          audio
          video={call.type === 'video'}
          onConnected={() => setIsConnected(true)}
          onDisconnected={() => setIsConnected(false)}
          onError={reason => {
            console.error('LiveKit call error:', reason);
            setError(reason.message || 'Unable to connect to the call.');
          }}
          onMediaDeviceFailure={(_failure, kind) => {
            setError(`${kind === 'videoinput' ? 'Camera' : 'Microphone'} access is unavailable. Check your browser permissions.`);
          }}
          className="h-full"
        >
          <ConnectedCall
            call={call}
            onEnd={() => void respond(handleEndCall)}
            connectionError={error}
          />
        </LiveKitRoom>
      )}
      {call.status === 'accepted' && token && livekitUrl && !isConnected && !error && (
        <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center text-sm text-white/80">
          Connecting to call…
        </div>
      )}

      {(call.status === 'ringing' || isJoining || (call.status === 'accepted' && (!token || !livekitUrl))) && (
        <div className="relative flex h-full flex-col items-center justify-center overflow-hidden bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-cyan-950 via-gray-950 to-black px-6 text-center">
          {call.status === 'ringing' && !isIncoming && call.type === 'video' && localCallPreview && (
            <>
              <LocalCallPreview stream={localCallPreview} />
              <div className="absolute inset-0 bg-black/35" />
            </>
          )}
          <div className="relative z-10 flex flex-col items-center">
            {!(call.status === 'ringing' && !isIncoming && call.type === 'video' && localCallPreview) && (
              <div className="mb-6 flex h-28 w-28 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-cyan-500 to-fuchsia-600 text-4xl font-bold">
                {(isIncoming ? call.callerAvatar : call.receiverAvatar)
                  ? <img src={(isIncoming ? call.callerAvatar : call.receiverAvatar) || ''} alt="" className="h-full w-full object-cover" />
                  : contactName.charAt(0).toUpperCase() || '?'}
              </div>
            )}
            <h2 className="text-2xl font-semibold drop-shadow-lg">{contactName}</h2>
            <p className="mt-2 text-white/85 drop-shadow">
              {call.status === 'accepted' ? 'Connecting securely…' : isIncoming ? `Incoming ${call.type} call` : `Calling…`}
            </p>
            {call.status === 'ringing' && !isIncoming && call.type === 'video' && localCallPreview && (
              <p className="mt-2 text-sm text-white/80 drop-shadow">Your camera preview · Only you can see this until they answer</p>
            )}
            {error && <p role="alert" className="mt-4 max-w-md text-sm text-red-200">{error}</p>}
            {ringtoneError && (
              <div className="mt-4 max-w-md text-sm text-amber-200">
                <p role="alert">{ringtoneError}</p>
                {call.status === 'ringing' && canRetryRingtone && (
                  <button type="button" onClick={retryRingtone} className="mt-2 underline underline-offset-4">
                    Enable ringtone
                  </button>
                )}
              </div>
            )}
            {!livekitUrl && call.status === 'accepted' && (
              <p role="alert" className="mt-4 max-w-md text-sm text-red-200">Calling is not configured on this web deployment.</p>
            )}
            <div className="mt-10 flex items-center gap-6">
              {call.status === 'ringing' && isIncoming && (
                <>
                  <button
                    type="button"
                    onClick={() => void respond(rejectCall)}
                    disabled={isResponding}
                    aria-label="Decline call"
                    className="rounded-full bg-red-600 p-5 text-white shadow-lg disabled:opacity-50"
                  >
                    <PhoneOff size={26} />
                  </button>
                  <button
                    type="button"
                    onClick={() => void respond(answerCall)}
                    disabled={isResponding}
                    aria-label="Accept call"
                    className="rounded-full bg-green-500 p-5 text-white shadow-lg disabled:opacity-50"
                  >
                    {call.type === 'video' ? <Video size={26} /> : <Phone size={26} />}
                  </button>
                </>
              )}
              {(call.status === 'ringing' && !isIncoming || call.status === 'accepted') && (
                <button
                  type="button"
                  onClick={() => void respond(handleEndCall)}
                  disabled={isResponding}
                  aria-label="End call"
                  className="rounded-full bg-red-600 p-5 text-white shadow-lg disabled:opacity-50"
                >
                  <PhoneOff size={26} />
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {isTerminal && (
        <div className="flex h-full flex-col items-center justify-center bg-gray-950 text-center">
          <p className="text-xl font-semibold">
            {call.status === 'rejected' ? 'Call declined' : call.status === 'missed' ? 'Call not answered' : 'Call ended'}
          </p>
          {ringtoneError && <p role="alert" className="mt-3 max-w-md text-sm text-amber-200">{ringtoneError}</p>}
        </div>
      )}
    </div>
  );
}
