const SECONDS_PER_MINUTE = 60;
const SECONDS_PER_HOUR = 3600;

function pad(value: number): string {
  return String(value).padStart(2, '0');
}

export function formatElapsed(totalSeconds: number): string {
  const seconds = Math.max(0, totalSeconds);
  const hours = Math.floor(seconds / SECONDS_PER_HOUR);
  const minutes = Math.floor((seconds % SECONDS_PER_HOUR) / SECONDS_PER_MINUTE);
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds % SECONDS_PER_MINUTE)}`;
}
