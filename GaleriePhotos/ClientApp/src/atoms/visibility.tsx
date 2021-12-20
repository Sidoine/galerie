import { useEffect, useRef, useCallback } from "react";
import React from "react";
import { CircularProgress, LinearProgress } from "@material-ui/core";

export interface VisibilityProps {
  onChange: (visible: boolean) => void;
  visible: boolean;
}

export function Visibility({ onChange, visible }: VisibilityProps) {
  const refElement = useRef<HTMLDivElement>(null);
  const visibleRef = useRef(visible);

  const checkIsInViewPort = useCallback(
    (entries: IntersectionObserverEntry[], observer: IntersectionObserver) => {
      const entry = entries[0];
      if (entry.isIntersecting !== visibleRef.current) {
        onChange(entry.isIntersecting);
      }
    },
    [onChange]
  );

  useEffect(() => {
    const element = refElement.current;
    if (element) {
      const observer = new IntersectionObserver(checkIsInViewPort, {
        threshold: [0, 1],
      });

      observer.observe(element);

      return () => {
        observer.disconnect();
      };
    }
  }, [checkIsInViewPort]);

  useEffect(() => {
    visibleRef.current = visible;
  }, [visible]);

  return (
    <div ref={refElement}>
      {visible && <LinearProgress variant="indeterminate" />}
      {!visible && <CircularProgress variant="indeterminate" />}
    </div>
  );
}
