import { useEffect, useRef, useCallback, useState } from "react";
import React from "react";

export function useVisibility<T extends HTMLElement>(): [
    React.RefObject<T | null>,
    boolean
] {
    const refElement = useRef<T>(null);
    const [visible, setVisible] = useState(false);

    const checkIsInViewPort = useCallback(
        (
            entries: IntersectionObserverEntry[],
            observer: IntersectionObserver
        ) => {
            const entry = entries[0];
            setVisible(entry.isIntersecting);
        },
        []
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
    });

    return [refElement, visible];
}
