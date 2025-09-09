import { ReactNode } from "react";
import { observer } from "mobx-react-lite";

interface RedirectOrRenderProps {
    children?: ReactNode;
}

export const RedirectOrRender = observer(function RedirectOrRender({
    children,
}: RedirectOrRenderProps) {
    return <>{children}</>;
});
