import { useEffect, useRef, useCallback } from "react";
import React from "react";

export interface VisibilityProps {
    onChange: (visible: boolean) => void;
    length: number;
}

export function Visibility({ onChange, length }: VisibilityProps) {
    const isInViewPort = useRef(false);
    const refElement = useRef<HTMLDivElement>(null);

    const checkIsInViewPort = useCallback(
        (
            entries: IntersectionObserverEntry[],
            observer: IntersectionObserver
        ) => {
            const entry = entries[0];
            if (entry.isIntersecting !== isInViewPort.current) {
                isInViewPort.current = entry.isIntersecting;
                onChange(entry.isIntersecting);
            }
        },
        [isInViewPort, onChange]
    );

    useEffect(() => {
        isInViewPort.current = false;
    }, [length]);

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

    return (
        <div ref={refElement}>{isInViewPort.current ? "..." : "&nbsp;"}</div>
    );
}
