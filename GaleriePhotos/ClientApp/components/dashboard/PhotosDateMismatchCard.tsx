import React from "react";
import Icon from "@/components/Icon";
import { palette } from "@/stores/theme";
import DashboardCard from "./DashboardCard";

type PhotosDateMismatchCardProps = {
  totalCount: number;
  hasAlbums: boolean;
  expanded: boolean;
  onToggle: () => void;
};

const PhotosDateMismatchCard: React.FC<PhotosDateMismatchCardProps> = ({
  totalCount,
  hasAlbums,
  expanded,
  onToggle,
}) => {
  const handlePress = () => {
    if (!hasAlbums) {
      return;
    }
    onToggle();
  };

  return (
    <DashboardCard
      title="Photos avec date de fichier incohérente"
      value={totalCount}
      description="Photos dont la date de prise de vue diffère de la date détectée dans le nom du fichier"
      onPress={hasAlbums ? handlePress : undefined}
      disabled={!hasAlbums}
      rightAccessory={
        hasAlbums ? (
          <Icon
            set="mi"
            name={expanded ? "expand-less" : "expand-more"}
            size={20}
            color={palette.textSecondary}
          />
        ) : null
      }
      actionText={
        hasAlbums
          ? expanded
            ? "Masquer les albums concernés"
            : "Afficher les albums concernés"
          : undefined
      }
    />
  );
};

export default PhotosDateMismatchCard;
