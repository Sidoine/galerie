import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { observer } from "mobx-react-lite";
import { useApiClient } from "folke-service-helpers";
import { FaceController } from "../services/face";
import { FaceName } from "../services/views";
import { useRoute, useNavigation } from "@react-navigation/native";

const FaceNames = observer(function FaceNames() {
    const route = useRoute();
    const navigation = useNavigation();
    const { galleryId } = route.params as { galleryId: number };
    const apiClient = useApiClient();
    const [names, setNames] = useState<FaceName[] | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!galleryId) return;
        const controller = new FaceController(apiClient);
        setLoading(true);
        controller
            .getNames(Number(galleryId))
            .then((resp) => {
                if (!resp.ok) {
                    setError(`Erreur ${resp.status}: ${resp.statusText}`);
                    return;
                }
                setNames(resp.data);
            })
            .catch((error) => {
                setError(error.message);
            })
            .finally(() => {
                setLoading(false);
            });
    }, [galleryId, apiClient]);

    if (loading) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" />
                <Text style={styles.loadingText}>Chargement...</Text>
            </View>
        );
    }

    if (error) {
        return (
            <View style={styles.centerContainer}>
                <Text style={styles.errorText}>Erreur: {error}</Text>
            </View>
        );
    }

    if (!names || names.length === 0) {
        return (
            <View style={styles.centerContainer}>
                <Text style={styles.emptyText}>Aucun nom de visage trouvé</Text>
            </View>
        );
    }

    const renderFaceName = ({ item }: { item: FaceName }) => (
        <TouchableOpacity
            style={styles.faceNameItem}
            onPress={() => navigation.navigate('FaceNamePhotos' as never, { faceNameId: item.id } as never)}
        >
            <Text style={styles.faceNameText}>{item.name}</Text>
            <Text style={styles.photoCount}>{item.photoCount} photos</Text>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Noms des visages</Text>
            <FlatList
                data={names}
                keyExtractor={(item) => item.id.toString()}
                renderItem={renderFaceName}
            />
        </View>
    );
});

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 16,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 16,
    },
    faceNameItem: {
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
        backgroundColor: '#f9f9f9',
        marginBottom: 8,
        borderRadius: 8,
    },
    faceNameText: {
        fontSize: 16,
        fontWeight: '500',
    },
    photoCount: {
        fontSize: 14,
        color: '#666',
        marginTop: 4,
    },
    loadingText: {
        fontSize: 16,
        color: '#666',
        marginTop: 16,
    },
    errorText: {
        fontSize: 16,
        color: '#d32f2f',
        textAlign: 'center',
    },
    emptyText: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
    },
});

export default FaceNames;
