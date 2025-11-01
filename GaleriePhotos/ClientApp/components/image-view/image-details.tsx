import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { observer } from "mobx-react-lite";
import { Photo, PhotoFull, PhotoPatch } from "@/services/views";
import Icon from "../Icon";
import { theme } from "@/stores/theme";
import AdaptiveMap from "./adaptive-map";
import { usePhotosStore } from "@/stores/photos";
import { DirectoryBulkDateModal } from "../modals/directory-bulk-date-modal";
import { DirectoryBulkLocationModal } from "../modals/directory-bulk-location-modal";

interface ImageDetailsProps {
  image: PhotoFull;
  open: boolean;
  onClose: () => void;
}

export const ImageDetails = observer(function ImageDetails({
  image,
  open,
  onClose,
}: ImageDetailsProps) {
  const photosStore = usePhotosStore();
  const [editingDescription, setEditingDescription] = useState(false);
  const [descriptionDraft, setDescriptionDraft] = useState(
    image.description ?? ""
  );
  const [savingDescription, setSavingDescription] = useState(false);
  const [descriptionError, setDescriptionError] = useState<string | null>(null);
  const [dateModalVisible, setDateModalVisible] = useState(false);
  const [locationModalVisible, setLocationModalVisible] = useState(false);

  const normalizedCurrentDescription = (image.description ?? "").trim();
  const normalizedDraftDescription = descriptionDraft.trim();
  const hasDescriptionChanges =
    normalizedDraftDescription !== normalizedCurrentDescription;
  const formattedDate = useMemo(() => {
    if (!image.dateTime) return "Date inconnue";
    const parsed = new Date(image.dateTime);
    return Number.isFinite(parsed.getTime())
      ? parsed.toLocaleDateString()
      : image.dateTime;
  }, [image.dateTime]);
  const hasCoordinates =
    image.latitude !== null &&
    image.latitude !== undefined &&
    image.longitude !== null &&
    image.longitude !== undefined;
  const locationText = hasCoordinates
    ? `Lat: ${image.latitude?.toFixed(5)} / Lon: ${image.longitude?.toFixed(5)}`
    : "Aucune localisation";
  const locationActionLabel = hasCoordinates ? "Modifier" : "Ajouter";
  const photoForLocationModal = useMemo<Photo>(
    () => ({
      id: image.id,
      publicId: image.publicId,
      name: image.name,
      video: image.video,
      directoryId: image.directoryId,
      dateTime: image.dateTime,
      place: image.place,
      isFavorite: image.isFavorite,
    }),
    [
      image.dateTime,
      image.directoryId,
      image.id,
      image.name,
      image.place,
      image.publicId,
      image.video,
      image.isFavorite,
    ]
  );

  useEffect(() => {
    if (!editingDescription) {
      setDescriptionDraft(image.description ?? "");
    }
  }, [image.description, editingDescription]);

  useEffect(() => {
    if (!open) {
      setEditingDescription(false);
      setDescriptionDraft(image.description ?? "");
      setSavingDescription(false);
      setDescriptionError(null);
      setDateModalVisible(false);
      setLocationModalVisible(false);
    }
  }, [open, image.description]);

  useEffect(() => {
    setDateModalVisible(false);
    setLocationModalVisible(false);
  }, [image.id]);

  const handleStartEditing = useCallback(() => {
    setDescriptionDraft(image.description ?? "");
    setDescriptionError(null);
    setEditingDescription(true);
  }, [image.description]);

  const handleDescriptionChange = useCallback((text: string) => {
    setDescriptionDraft(text);
  }, []);

  const handleCancelEditing = useCallback(() => {
    setEditingDescription(false);
    setDescriptionDraft(image.description ?? "");
    setDescriptionError(null);
  }, [image.description]);

  const handleSaveDescription = useCallback(async () => {
    if (!hasDescriptionChanges) {
      setEditingDescription(false);
      return;
    }
    const trimmed = normalizedDraftDescription;
    const nextDescription = trimmed.length === 0 ? null : trimmed;
    const patch: PhotoPatch = { description: trimmed };
    setSavingDescription(true);
    setDescriptionError(null);
    try {
      await photosStore.patchPhoto(image, patch);
      photosStore.imageLoader.updateCache([image.id], {
        ...image,
        description: nextDescription,
      });
      setEditingDescription(false);
    } catch {
      setDescriptionError(
        "Impossible d'enregistrer la description. Réessayez."
      );
    } finally {
      setSavingDescription(false);
    }
  }, [hasDescriptionChanges, image, normalizedDraftDescription, photosStore]);

  const handleOpenDateModal = useCallback(() => {
    setDateModalVisible(true);
  }, []);
  const handleCloseDateModal = useCallback(() => {
    setDateModalVisible(false);
  }, []);
  const handleOpenLocationModal = useCallback(() => {
    setLocationModalVisible(true);
  }, []);
  const handleCloseLocationModal = useCallback(() => {
    setLocationModalVisible(false);
  }, []);

  if (!open) return null;
  return (
    <View style={styles.overlay}>
      <View style={styles.panel}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={onClose}
            style={styles.closeBtn}
            accessibilityRole="button"
          >
            <Icon name="close" set="mci" size={22} />
          </TouchableOpacity>
          <Text style={styles.title}>Renseignements</Text>
        </View>
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.sectionCaption}>Détails</Text>
          <DetailRow
            icon={<Icon name="calendar" set="mci" size={18} />}
            text={formattedDate}
            onEdit={handleOpenDateModal}
          />
          {image.camera && (
            <DetailRow
              icon={<Icon name="camera-outline" set="mci" size={18} />}
              text={image.camera}
            />
          )}
          <DetailRow
            icon={<Icon name="image-outline" set="mci" size={18} />}
            text={image.name}
          />
          <DetailRow
            icon={<Icon name="map-marker" set="mci" size={18} />}
            text={locationText}
            onEdit={handleOpenLocationModal}
            editLabel={locationActionLabel}
          />
          <Text style={styles.sectionCaption}>Description</Text>
          {editingDescription ? (
            <View style={styles.descriptionEditor}>
              <TextInput
                value={descriptionDraft}
                onChangeText={handleDescriptionChange}
                style={styles.descriptionInput}
                placeholder="Ajouter une description"
                editable={!savingDescription}
                multiline
              />
              {!!descriptionError && (
                <Text style={styles.errorText}>{descriptionError}</Text>
              )}
              <View style={styles.descriptionActions}>
                <TouchableOpacity
                  onPress={handleCancelEditing}
                  disabled={savingDescription}
                  style={[
                    styles.actionButton,
                    styles.actionButtonFirst,
                    savingDescription && styles.actionButtonDisabled,
                  ]}
                  accessibilityRole="button"
                >
                  <Text style={styles.actionButtonText}>Annuler</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleSaveDescription}
                  disabled={!hasDescriptionChanges || savingDescription}
                  style={[
                    styles.actionButton,
                    (!hasDescriptionChanges || savingDescription) &&
                      styles.actionButtonDisabled,
                    styles.actionButtonPrimary,
                  ]}
                  accessibilityRole="button"
                >
                  {savingDescription ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text
                      style={[
                        styles.actionButtonText,
                        styles.actionButtonPrimaryText,
                      ]}
                    >
                      Enregistrer
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={styles.descriptionRow}>
              <View style={styles.detailIcon}>
                <Icon name="text-box-outline" set="mci" size={18} />
              </View>
              <Text
                style={[
                  styles.descriptionText,
                  !normalizedCurrentDescription &&
                    styles.descriptionPlaceholder,
                ]}
              >
                {normalizedCurrentDescription || "Aucune description"}
              </Text>
              <TouchableOpacity
                onPress={handleStartEditing}
                style={styles.editButton}
                accessibilityRole="button"
                accessibilityLabel="Modifier la description"
              >
                <Icon
                  name="pencil"
                  set="mci"
                  size={18}
                  color={theme.palette.textSecondary}
                />
              </TouchableOpacity>
            </View>
          )}
          {hasCoordinates && (
            <View style={styles.geoBox}>
              <AdaptiveMap
                latitude={image.latitude!}
                longitude={image.longitude!}
                title="Photo prise ici"
                description={image.name}
                style={styles.map}
              />
            </View>
          )}
        </ScrollView>
        {dateModalVisible && (
          <DirectoryBulkDateModal
            visible={dateModalVisible}
            photoIds={[image.id]}
            directoryPath={image.name}
            onClose={handleCloseDateModal}
          />
        )}
        {locationModalVisible && (
          <DirectoryBulkLocationModal
            visible={locationModalVisible}
            photos={[photoForLocationModal]}
            onClose={handleCloseLocationModal}
            overwriteExisting
          />
        )}
      </View>
    </View>
  );
});

function DetailRow({
  icon,
  text,
  onEdit,
  editLabel = "Modifier",
}: {
  icon: React.ReactNode;
  text: string;
  onEdit?: () => void;
  editLabel?: string;
}) {
  return (
    <View style={styles.detailRow}>
      <View style={styles.detailIcon}>{icon}</View>
      <Text style={styles.detailText}>{text}</Text>
      {onEdit && (
        <TouchableOpacity
          onPress={onEdit}
          style={styles.detailActionButton}
          accessibilityRole="button"
        >
          <Icon
            name="pencil"
            set="mci"
            size={18}
            color={theme.palette.textSecondary}
          />
        </TouchableOpacity>
      )}
    </View>
  );
}

const PANEL_WIDTH = 360;

const styles = StyleSheet.create({
  overlay: {
    position: "absolute",
    top: 0,
    bottom: 0,
    right: 0,
    width: PANEL_WIDTH,
    backgroundColor: theme.palette.background,
    elevation: 8,
    zIndex: 3000,
    pointerEvents: "box-none",
  },
  panel: {
    flex: 1,
    paddingHorizontal: theme.spacing(4),
    paddingTop: theme.spacing(3),
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  closeBtn: {
    padding: 8,
    color: theme.palette.textPrimary,
    marginRight: 8,
  },
  closeTxt: {
    color: theme.palette.textPrimary,
    fontSize: 18,
  },
  title: {
    color: theme.palette.textPrimary,
    fontSize: 18,
    fontWeight: "600",
  },
  content: {
    paddingBottom: 40,
  },
  sectionCaption: {
    color: theme.palette.textSecondary,
    fontSize: 12,
    marginTop: theme.spacing(3),
    marginBottom: theme.spacing(1),
    letterSpacing: 1,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: theme.spacing(1.5),
  },
  detailIcon: {
    width: 26,
    alignItems: "center",
    justifyContent: "center",
  },
  detailText: {
    color: theme.palette.textPrimary,
    flexShrink: 1,
  },
  detailActionButton: {
    marginLeft: theme.spacing(2),
    paddingVertical: theme.spacing(0.5),
    paddingHorizontal: theme.spacing(1.5),
  },
  descriptionRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: theme.spacing(2),
  },
  descriptionText: {
    flex: 1,
    color: theme.palette.textPrimary,
  },
  descriptionPlaceholder: {
    color: theme.palette.textMuted,
    fontStyle: "italic",
  },
  editButton: {
    padding: theme.spacing(1),
    marginLeft: theme.spacing(1),
  },
  descriptionEditor: {
    backgroundColor: theme.palette.surface,
    padding: theme.spacing(3),
    borderRadius: theme.radius.md,
    marginBottom: theme.spacing(2),
  },
  descriptionInput: {
    minHeight: 96,
    borderWidth: 1,
    borderColor: theme.palette.border,
    borderRadius: theme.radius.sm,
    paddingHorizontal: theme.spacing(2),
    paddingVertical: theme.spacing(2),
    color: theme.palette.textPrimary,
    textAlignVertical: "top",
  },
  descriptionActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    marginTop: theme.spacing(2),
  },
  actionButton: {
    paddingVertical: theme.spacing(1.5),
    paddingHorizontal: theme.spacing(3),
    borderRadius: theme.radius.sm,
    borderWidth: 1,
    borderColor: theme.palette.border,
    backgroundColor: "transparent",
    marginLeft: theme.spacing(2),
  },
  actionButtonFirst: {
    marginLeft: 0,
  },
  actionButtonPrimary: {
    backgroundColor: theme.palette.primary,
    borderColor: theme.palette.primary,
  },
  actionButtonText: {
    color: theme.palette.textPrimary,
    fontSize: 14,
    fontWeight: "500",
  },
  actionButtonPrimaryText: {
    color: "#fff",
  },
  actionButtonDisabled: {
    opacity: 0.5,
  },
  errorText: {
    color: theme.palette.danger,
    marginTop: theme.spacing(1),
  },
  geoBox: {
    marginTop: theme.spacing(3),
    backgroundColor: theme.palette.surface,
    padding: theme.spacing(3),
    borderRadius: theme.radius.md,
  },
  geoText: {
    color: theme.palette.textPrimary,
    fontSize: 14,
  },
  geoHint: {
    marginTop: theme.spacing(2),
    fontSize: 11,
    color: theme.palette.textMuted,
  },
  map: {
    height: 200,
    marginTop: theme.spacing(2),
    borderRadius: theme.radius.md,
  },
});
