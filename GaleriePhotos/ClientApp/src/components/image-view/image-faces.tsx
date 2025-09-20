import { useEffect, useRef, useState, useMemo } from "react";
import { Box } from "@mui/material";
import { Face } from "../../services/views";
import { FaceController } from "../../services/face";
import { useApiClient } from "folke-service-helpers";

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
    const apiClient = useApiClient();
    const faceController = useMemo(
        () => new FaceController(apiClient),
        [apiClient]
    );
    const [faces, setFaces] = useState<Face[] | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [, force] = useState(0);

    // Charger les visages quand visible passe à true ou photoId change
    useEffect(() => {
        if (!visible) return; // Ne charge que si demandé
        setLoading(true);
        setError(null);
        async function loadFaces() {
            const result = await faceController.getFacesByPhoto(photoId);
            setLoading(false);
            if (result.ok) {
                setFaces(result.value);
            } else {
                setError(result.message);
            }
        }
        loadFaces();
    }, [photoId, faceController, visible]);

    // Observer resize de l'image pour recalculer sans re-render superflu
    const resizeObserver = useRef<ResizeObserver | null>(null);
    useEffect(() => {
        if (!imageRef.current) return;
        resizeObserver.current = new ResizeObserver(() => {
            // Déclenche un nouveau calcul d'échelle
            force((v) => v + 1);
        });
        resizeObserver.current.observe(imageRef.current);
        return () => resizeObserver.current?.disconnect();
    }, [imageRef]);

    const img = imageRef.current;
    const metrics = useMemo(() => {
        if (!img) return null;
        const naturalWidth = img.naturalWidth || 1;
        const naturalHeight = img.naturalHeight || 1;
        const renderedWidth = img.clientWidth || naturalWidth;
        const renderedHeight = img.clientHeight || naturalHeight;
        return {
            scaleX: renderedWidth / naturalWidth,
            scaleY: renderedHeight / naturalHeight,
        };
    }, [img]);

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
                        }}
                    >
                        {f.name && (
                            <Box
                                sx={{
                                    backgroundColor: "rgba(0,0,0,0.6)",
                                    px: 0.5,
                                    py: 0.25,
                                    borderBottomRightRadius: 4,
                                }}
                            >
                                {f.name}
                            </Box>
                        )}
                    </Box>
                );
            })}
        </Box>
    );
}

export default ImageFaces;
