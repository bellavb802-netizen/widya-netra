export function getCheckinUrl(memberId) {
  const url = new URL("/check-in", window.location.origin);
  const isLocalhost = ["localhost", "127.0.0.1"].includes(window.location.hostname);

  if (import.meta.env.DEV && isLocalhost) {
    url.hostname = import.meta.env.VITE_DEV_SERVER_HOST || window.location.hostname;
  }

  if (memberId) {
    url.searchParams.set("mid", memberId);
  }

  return url.toString();
}
