import { useEffect, useState } from 'react';

// Single source of truth for the mobile breakpoint (matches the design's ≤720px).
// ?mobile=1 / ?mobile=0 forces a mode — useful for testing the mobile layout on a
// desktop browser.
const QUERY = '(max-width: 720px)';

function forcedMode(): boolean | null {
  if (typeof window === 'undefined') return null;
  const v = new URLSearchParams(window.location.search).get('mobile');
  return v === '1' ? true : v === '0' ? false : null;
}

export function useIsMobile(): boolean {
  const forced = forcedMode();
  const [mobile, setMobile] = useState(() =>
    forced != null ? forced : typeof window !== 'undefined' ? window.matchMedia(QUERY).matches : false
  );
  useEffect(() => {
    if (forced != null) return;
    const mq = window.matchMedia(QUERY);
    const on = () => setMobile(mq.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, [forced]);
  return mobile;
}
