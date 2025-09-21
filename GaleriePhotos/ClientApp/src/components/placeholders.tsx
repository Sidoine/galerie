import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

// Placeholder components for complex components that need full migration

export const DirectoryImagesView = ({ directoryId }: { directoryId: number }) => (
    <View style={styles.placeholder}>
        <Text style={styles.text}>Directory Images View (ID: {directoryId})</Text>
        <Text style={styles.subtext}>Component needs full migration</Text>
    </View>
);

export const SubdirectoriesView = ({ id }: { id: number }) => (
    <View style={styles.placeholder}>
        <Text style={styles.text}>Subdirectories View (ID: {id})</Text>
        <Text style={styles.subtext}>Component needs full migration</Text>
    </View>
);

export const BreadCrumbs = () => (
    <View style={styles.placeholder}>
        <Text style={styles.text}>Breadcrumbs</Text>
        <Text style={styles.subtext}>Navigation breadcrumb</Text>
    </View>
);

export const GalleryMembers = () => (
    <View style={styles.placeholder}>
        <Text style={styles.text}>Gallery Members</Text>
        <Text style={styles.subtext}>Component needs full migration</Text>
    </View>
);

export const DirectoryVisibilitySettings = () => (
    <View style={styles.placeholder}>
        <Text style={styles.text}>Directory Visibility Settings</Text>
        <Text style={styles.subtext}>Component needs full migration</Text>
    </View>
);

export const GallerySettings = () => (
    <View style={styles.placeholder}>
        <Text style={styles.text}>Gallery Settings</Text>
        <Text style={styles.subtext}>Component needs full migration</Text>
    </View>
);

export const Galleries = () => (
    <View style={styles.placeholder}>
        <Text style={styles.text}>Galleries</Text>
        <Text style={styles.subtext}>Component needs full migration</Text>
    </View>
);

const styles = StyleSheet.create({
    placeholder: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 32,
        backgroundColor: '#f5f5f5',
        margin: 16,
        borderRadius: 8,
        borderWidth: 2,
        borderColor: '#e0e0e0',
        borderStyle: 'dashed',
    },
    text: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#666',
        textAlign: 'center',
    },
    subtext: {
        fontSize: 12,
        color: '#999',
        marginTop: 8,
        textAlign: 'center',
    },
});