import { useEffect, useRef, useCallback, useState } from "react";
import React from "react";
import { CircularProgress, LinearProgress } from "@mui/material";

export interface VisibilityProps {
    onChange: (visible: boolean) => void;
    visible: boolean;
}

export function Visibility({ onChange, visible }: VisibilityProps) {
    const refElement = useRef<HTMLDivElement>(null);
    const [isVisible, setVisible] = useState(false);

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
        if (isVisible !== visible) onChange(isVisible);
    }, [isVisible, onChange, visible]);

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
        <div ref={refElement}>
            {visible && <LinearProgress variant="indeterminate" />}
            {!visible && <CircularProgress variant="indeterminate" />}
        </div>
    );
}
