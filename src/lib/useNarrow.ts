// useNarrow — one breakpoint hook for the whole tool's responsive behavior. Desktop
// is the design target; below `max` the surfaces adapt (stack, wrap, scroll) so the
// instrument stays usable on tablet + phone. matchMedia so it's cheap + reactive.
import React from "react";

export function useNarrow(max = 720): boolean {
  const query = `(max-width: ${max}px)`;
  const [narrow, setNarrow] = React.useState(
    () => typeof window !== "undefined" && window.matchMedia(query).matches,
  );
  React.useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${max}px)`);
    const on = () => setNarrow(mq.matches);
    on();
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, [max]); // depend on the INPUT, not the derived query string (react-effects-discipline)
  return narrow;
}
