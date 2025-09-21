import React from 'react';
import { useRoute } from "@react-navigation/native";
import { DirectoryView } from "./directory-view";

export function DirectoryPage() {
    const route = useRoute();
    const { id } = route.params as { id: number };
    return <DirectoryView id={Number(id)} />;
}
