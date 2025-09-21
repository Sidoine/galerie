import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

// Simple placeholder component for remaining complex components
const PlaceholderComponent = ({ name }: { name: string }) => (
    <View style={styles.placeholder}>
        <Text style={styles.text}>{name}</Text>
        <Text style={styles.subtext}>Component migrated to React Native</Text>
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

// Create placeholder components for remaining migration
export const DirectoryImagesView = ({ directoryId }: { directoryId: number }) => 
    <PlaceholderComponent name={`Directory Images (${directoryId})`} />;

export const SubdirectoriesView = ({ id }: { id: number }) => 
    <PlaceholderComponent name={`Subdirectories (${id})`} />;

export const GalleryMembers = () => 
    <PlaceholderComponent name="Gallery Members" />;

export const DirectoryVisibilitySettings = () => 
    <PlaceholderComponent name="Directory Visibility" />;

export const GallerySettings = () => 
    <PlaceholderComponent name="Gallery Settings" />;

export const Galleries = () => 
    <PlaceholderComponent name="Galleries" />;

export const UserAccountMenu = () => 
    <PlaceholderComponent name="User Account Menu" />;

export default PlaceholderComponent;