import { useState, useEffect, useRef } from "react";
import React from "react";

export interface VisibilityProps {
    onChange: (visible: boolean) => void;
}
function isElementInViewport(el: HTMLElement) {
    let eap: Element | null;
    const rect = el.getBoundingClientRect();
    const docEl = document.documentElement;
    const vWidth = window.innerWidth || docEl.clientWidth;
    const vHeight = window.innerHeight || docEl.clientHeight;
    const efp = (x: number, y: number) => document.elementFromPoint(x, y);
    const contains = el.contains
        ? (node: Element | null) => el.contains(node)
        : (node: Element | null) =>
              node && el.compareDocumentPosition(node) === 0x10;

    // Return false if it's not in the viewport
    if (
        rect.right < 0 ||
        rect.bottom < 0 ||
        rect.left > vWidth ||
        rect.top > vHeight
    )
        return false;

    // Return true if any of its four corners are visible
    return (
        (eap = efp(rect.left, rect.top)) === el ||
        contains(eap) ||
        (eap = efp(rect.right, rect.top)) === el ||
        contains(eap) ||
        (eap = efp(rect.right, rect.bottom)) === el ||
        contains(eap) ||
        (eap = efp(rect.left, rect.bottom)) === el ||
        contains(eap) ||
        false
    );
}

export function Visibility({ onChange }: VisibilityProps) {
    const [isInViewPort, setIsInViewPort] = useState(false);
    const refElement = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const element = refElement.current;
        if (element) {
            const checkIsInViewPort = () => {
                const isInViewPortNow = isElementInViewport(element);
                if (isInViewPort !== isInViewPortNow) {
                    setIsInViewPort(isInViewPortNow);
                    onChange(isInViewPortNow);
                }
            };
            let ancestor = element.parentElement;
            const ancestors = new Array<HTMLElement>();
            while (ancestor != null && ancestor.style) {
                if (ancestor.style.overflowY === "auto") {
                    ancestors.push(ancestor);
                    ancestor.addEventListener("scroll", checkIsInViewPort);
                }
                ancestor = ancestor.parentElement;
            }

            checkIsInViewPort();
            document.addEventListener("ready", checkIsInViewPort);
            window.addEventListener("load", checkIsInViewPort);
            window.addEventListener("scroll", checkIsInViewPort);
            window.addEventListener("resize", checkIsInViewPort);

            return () => {
                for (var ancestor of ancestors) {
                    ancestor.removeEventListener("scroll", checkIsInViewPort);
                }
                document.removeEventListener("ready", checkIsInViewPort);
                window.removeEventListener("load", checkIsInViewPort);
                window.removeEventListener("resize", checkIsInViewPort);
                window.removeEventListener("scroll", checkIsInViewPort);
            };
        }
    });

    return <div ref={refElement}>&nbsp;</div>;
}
