/** The Google mark, used only on the third-party sign-in button. */
export function GoogleMark({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true" focusable="false">
      <path
        fill="#EA4335"
        d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.7 2.4 30.2 0 24 0 14.6 0 6.5 5.4 2.6 13.3l7.9 6.1C12.3 13.3 17.7 9.5 24 9.5z"
      />
      <path
        fill="#4285F4"
        d="M46.9 24.6c0-1.6-.2-3.2-.5-4.6H24v9.2h12.9c-.6 3.1-2.4 5.7-5 7.4l7.8 6c4.6-4.3 7.2-10.6 7.2-18z"
      />
      <path
        fill="#FBBC05"
        d="M10.5 28.6c-.5-1.5-.8-3-.8-4.6s.3-3.1.8-4.6l-7.9-6.1C.9 16.8 0 20.3 0 24s.9 7.2 2.6 10.7l7.9-6.1z"
      />
      <path
        fill="#34A853"
        d="M24 48c6.2 0 11.4-2 15.2-5.5l-7.8-6c-2.1 1.4-4.8 2.3-7.4 2.3-6.3 0-11.7-3.8-13.5-9.2l-7.9 6.1C6.5 42.6 14.6 48 24 48z"
      />
    </svg>
  );
}
