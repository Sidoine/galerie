import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { observer } from "mobx-react-lite";
import { useNavigation } from "@react-navigation/native";
import { useGalleriesStore } from "../stores/galleries";

const GalleryChooser = observer(function GalleryChooser() {
    const galleriesStore = useGalleriesStore();
    const navigation = useNavigation();
    
    if (!galleriesStore.memberships && !galleriesStore.loading) {
        galleriesStore.load();
    }
    
    const memberships = galleriesStore.memberships;
    
    useEffect(() => {
        if (memberships && memberships.length === 1) {
            const galleryId = memberships[0].galleryId;
            (navigation as any).navigate('Gallery', { galleryId });
        }
    }, [memberships, navigation]);
    
    if (!memberships) {
        return (
            <View style={styles.container}>
                <ActivityIndicator size="large" />
                <Text style={styles.loadingText}>Chargement...</Text>
            </View>
        );
    }
    
    return (
        <View style={styles.container}>
            {memberships.map((m) => (
                <TouchableOpacity
                    key={m.galleryId}
                    style={styles.galleryButton}
                    onPress={() => {
                        (navigation as any).navigate('Gallery', { galleryId: m.galleryId });
                    }}
                >
                    <Text style={styles.galleryText}>{m.galleryName}</Text>
                </TouchableOpacity>
            ))}
            {memberships.length === 0 && (
                <Text style={styles.noGalleryText}>
                    Vous n'êtes membre d'aucune galerie. Demandez à en rejoindre
                    une ou demandez à l'administrateur de créer une nouvelle
                    galerie.
                </Text>
            )}
        </View>
    );
});

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
    },
    galleryButton: {
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
        backgroundColor: '#f5f5f5',
        marginBottom: 8,
        borderRadius: 8,
    },
    galleryText: {
        fontSize: 16,
        color: '#333',
    },
    noGalleryText: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
        marginTop: 32,
        padding: 16,
    },
    loadingText: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        marginTop: 16,
    },
});

export default GalleryChooser;
