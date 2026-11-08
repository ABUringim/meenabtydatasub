/**
 * Device detection utility for Google Sign-In flow (popup vs redirect fallback)
 */
export function isMobile(): boolean {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return false;
  }
  const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera || '';
  const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile|mobile|CriOS/i;
  const isTouchScreen = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  return mobileRegex.test(userAgent) || (isTouchScreen && window.innerWidth <= 768);
}
