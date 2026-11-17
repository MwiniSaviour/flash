import { useLocation, useNavigate } from "react-router-dom";

/**
 * Back navigation that survives a cold start. A deep link (or a native URL
 * open) has no history to pop, so `navigate(-1)` would leave the app; in that
 * case we fall back to the screen the page logically belongs to.
 */
export function useGoBack(fallback = "/") {
  const navigate = useNavigate();
  const location = useLocation();

  return () => {
    if (location.key === "default") navigate(fallback, { replace: true });
    else navigate(-1);
  };
}
