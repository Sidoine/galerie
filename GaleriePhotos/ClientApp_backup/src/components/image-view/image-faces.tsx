import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import { Box } from "@mui/material";
import { Face } from "../../services/views";
import { FaceController } from "../../services/face";
import { useApiClient } from "folke-service-helpers";
import FaceSelector from "./face-selector";
import { useDirectoriesStore } from "../../stores/directories";

/**
 * Composant d'affichage des visages détectés sur une photo.
 * Affiche un overlay positionné absolument au-dessus de l'image principale
 * en recalculant l'échelle en fonction de la taille rendue de l'image.
 */
export function ImageFaces({
    photoId,
    imageRef,
    visible,
}: {
    photoId: number;
    /** Référence de l'élément <img> source pour calculer les ratios */
    imageRef: React.RefObject<HTMLImageElement | null>;
    visible: boolean;
}) {
    const directoriesStore = useDirectoriesStore();
    const apiClient = useApiClient();
    const faceController = useMemo(
        () => new FaceController(apiClient),
        [apiClient]
    );
    const [faces, setFaces] = useState<Face[] | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Charger les visages quand visible passe à true ou photoId change
    useEffect(() => {
        if (!visible) return; // Ne charge que si demandé
        setLoading(true);
        setError(null);
        async function loadFaces() {
            const result = await faceController.getFacesByPhoto(
                directoriesStore.galleryId,
                photoId
            );
            setLoading(false);
            if (result.ok) {
                setFaces(result.value);
            } else {
                setError(result.message);
            }
        }
        loadFaces();
    }, [photoId, faceController, visible, directoriesStore.galleryId]);

    // Observer resize de l'image pour recalculer sans re-render superflu
    const resizeObserver = useRef<ResizeObserver | null>(null);
    const img = imageRef.current;
    const [metrics, setMetrics] = useState<{
        scaleX: number;
        scaleY: number;
    } | null>(null);
    const updateMetrics = useCallback((img: HTMLImageElement) => {
        const naturalWidth = img.naturalWidth || 1;
        const naturalHeight = img.naturalHeight || 1;
        const renderedWidth = img.clientWidth || naturalWidth;
        const renderedHeight = img.clientHeight || naturalHeight;
        setMetrics({
            scaleX: renderedWidth / naturalWidth,
            scaleY: renderedHeight / naturalHeight,
        });
    }, []);
    useEffect(() => {
        if (!imageRef.current) return;
        resizeObserver.current = new ResizeObserver(() => {
            if (imageRef.current) updateMetrics(imageRef.current);
        });
        resizeObserver.current.observe(imageRef.current);
        return () => resizeObserver.current?.disconnect();
    }, [imageRef, updateMetrics]);

    useEffect(() => {
        if (img) updateMetrics(img);
    }, [img, updateMetrics]);

    if (!visible) return null;
    if (loading) {
        return (
            <Box
                sx={{
                    position: "absolute",
                    top: 8,
                    right: 8,
                    backgroundColor: "rgba(0,0,0,0.5)",
                    color: "white",
                    p: 1,
                    borderRadius: 1,
                    fontSize: 12,
                }}
            >
                Chargement visages…
            </Box>
        );
    }
    if (error) {
        return (
            <Box
                sx={{
                    position: "absolute",
                    top: 8,
                    right: 8,
                    backgroundColor: "rgba(139,0,0,0.6)",
                    color: "white",
                    p: 1,
                    borderRadius: 1,
                    fontSize: 12,
                }}
            >
                {error}
            </Box>
        );
    }
    if (!faces || !metrics) return null;

    return (
        <Box
            sx={{
                position: "absolute",
                inset: 0,
                pointerEvents: "none",
                left: img?.offsetLeft || 0,
                top: img?.offsetTop || 0,
            }}
        >
            {faces.map((f) => {
                const left = f.x * metrics.scaleX;
                const top = f.y * metrics.scaleY;
                const width = f.width * metrics.scaleX;
                const height = f.height * metrics.scaleY;
                return (
                    <Box
                        key={f.id}
                        sx={{
                            position: "absolute",
                            left,
                            top,
                            width,
                            height,
                            border: "2px solid #00e5ff",
                            boxShadow: "0 0 4px 1px rgba(0,229,255,0.7)",
                            borderRadius: 0.5,
                            display: "flex",
                            alignItems: "flex-start",
                            justifyContent: "flex-start",
                            fontSize: 10,
                            fontWeight: 600,
                            color: "#00e5ff",
                            textShadow: "0 0 2px #000",
                            pointerEvents: "auto",
                            backdropFilter: f.name ? undefined : "blur(1px)",
                        }}
                    >
                        <Box
                            sx={{
                                backgroundColor: "rgba(0,0,0,0.55)",
                                p: 0.5,
                                borderBottomRightRadius: 4,
                            }}
                        >
                            <FaceSelector
                                face={f}
                                dense
                                onNameAssigned={(name) =>
                                    setFaces((prev) =>
                                        prev
                                            ? prev.map((pf) =>
                                                  pf.id === f.id
                                                      ? { ...pf, name }
                                                      : pf
                                              )
                                            : prev
                                    )
                                }
                            />
                        </Box>
                    </Box>
                );
            })}
        </Box>
    );
}

export default ImageFaces;
