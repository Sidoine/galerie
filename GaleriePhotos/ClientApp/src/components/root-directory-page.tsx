import React from 'react';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { observer } from "mobx-react-lite";
import { useNavigation } from "@react-navigation/native";
import { useDirectoriesStore } from "../stores/directories";
import { DirectoryView } from "./directory-view";

export const RootDirectoryPage = observer(function RootDirectoryPage() {
    const directoriesStore = useDirectoriesStore();
    const root = directoriesStore.root;
    const navigation = useNavigation();
    
    if (!root) {
        if (directoriesStore.isInError) {
            navigation.navigate('GallerySettings' as never);
        }
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" />
            </View>
        );
    }
    
    return <DirectoryView id={root.id} />;
});

const styles = StyleSheet.create({
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
});
