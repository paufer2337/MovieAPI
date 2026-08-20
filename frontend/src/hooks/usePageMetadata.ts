import { useEffect, type RefObject } from "react";

export function usePageMetadata(
  title: string,
  headingRef: RefObject<HTMLHeadingElement | null>,
) {
  useEffect(() => {
    document.title = title;
  }, [title]);

  useEffect(() => {
    headingRef.current?.focus({ preventScroll: true });
  }, [headingRef]);
}
