import { useEffect, useRef, useCallback, useState } from "react";
import React from "react";

export function useVisibility(): [React.RefObject<HTMLElement>, boolean] {
    const refElement = useRef<HTMLElement>(null);
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
    }, [checkIsInViewPort]);

    return [refElement, visible];
}
