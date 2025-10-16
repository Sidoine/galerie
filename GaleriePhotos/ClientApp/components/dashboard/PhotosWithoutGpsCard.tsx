import React from "react";
import Icon from "@/components/Icon";
import { palette } from "@/stores/theme";
import DashboardCard from "./DashboardCard";

type PhotosWithoutGpsCardProps = {
  totalCount: number;
  hasAlbums: boolean;
  expanded: boolean;
  onToggle: () => void;
};

const PhotosWithoutGpsCard: React.FC<PhotosWithoutGpsCardProps> = ({
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
      title="Photos sans coordonnées GPS"
      value={totalCount}
      description="Nombre total de photos sans localisation dans cette galerie"
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

export default PhotosWithoutGpsCard;
