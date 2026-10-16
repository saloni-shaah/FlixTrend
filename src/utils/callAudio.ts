const ringtoneSources = {
  incoming: '/calls/hello_sunlight.mp3',
  outgoing: '/calls/opening_statement.mp3',
} as const;

type CallTone = keyof typeof ringtoneSources;

let ringtone: HTMLAudioElement | null = null;
let ringtoneSource: string | null = null;

export function playCallTone(tone: CallTone, volume: number): Promise<void> {
  const source = ringtoneSources[tone];
  if (!ringtone || ringtoneSource !== source) {
    stopCallTone();
    ringtone = new Audio(source);
    ringtoneSource = source;
  }

  ringtone.loop = true;
  ringtone.volume = volume;
  return ringtone.play();
}

export function stopCallTone(): void {
  if (!ringtone) return;
  ringtone.pause();
  ringtone.currentTime = 0;
  ringtone = null;
  ringtoneSource = null;
}
