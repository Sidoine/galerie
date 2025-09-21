import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, Dimensions } from 'react-native';
import { observer } from "mobx-react-lite";
import { useApiClient } from "folke-service-helpers";
import { useRoute } from "@react-navigation/native";
import { FaceController } from "../services/face";
import { Photo } from "../services/views";
import ImageCard from "./image-card";

const { width: screenWidth } = Dimensions.get('window');
const imageSize = (screenWidth - 48) / 3; // 3 columns with padding

/**
 * Page affichant toutes les photos liées à un FaceName donné.
 */
const FaceNamePhotos = observer(function FaceNamePhotos() {
    const route = useRoute();
    const { galleryId, faceNameId } = route.params as { galleryId: number; faceNameId: number };
    const apiClient = useApiClient();
    const [photos, setPhotos] = useState<Photo[] | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!galleryId || !faceNameId) return;
        const controller = new FaceController(apiClient);
        setLoading(true);
        controller
            .getPhotosByFaceName(Number(galleryId), Number(faceNameId))
            .then((resp) => {
                if (!resp.ok) {
                    setError(resp.message || "Erreur de chargement");
                    return;
                }
                setPhotos(resp.value);
            })
            .catch((error) => {
                setError(error.message);
            })
            .finally(() => {
                setLoading(false);
            });
    }, [galleryId, faceNameId, apiClient]);

    if (loading) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" />
                <Text style={styles.loadingText}>Chargement des photos...</Text>
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

    if (!photos || photos.length === 0) {
        return (
            <View style={styles.centerContainer}>
                <Text style={styles.emptyText}>Aucune photo trouvée pour ce visage</Text>
            </View>
        );
    }

    const renderPhoto = ({ item }: { item: Photo }) => (
        <View style={styles.photoContainer}>
            <ImageCard photo={item} size={imageSize} />
        </View>
    );

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Photos du visage</Text>
            <FlatList
                data={photos}
                keyExtractor={(item) => item.id.toString()}
                renderItem={renderPhoto}
                numColumns={3}
                contentContainerStyle={styles.photoGrid}
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
    photoGrid: {
        paddingHorizontal: 8,
    },
    photoContainer: {
        flex: 1,
        margin: 8,
        maxWidth: imageSize,
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

export default FaceNamePhotos;
