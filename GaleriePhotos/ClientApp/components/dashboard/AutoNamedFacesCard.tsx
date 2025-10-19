import React from "react";
import Icon from "@/components/Icon";
import { palette } from "@/stores/theme";
import DashboardCard from "./DashboardCard";

export type AutoNamedFacesCardProps = {
  totalCount: number;
  hasSamples: boolean;
  expanded: boolean;
  onToggle: () => void;
};

const AutoNamedFacesCard: React.FC<AutoNamedFacesCardProps> = ({
  totalCount,
  hasSamples,
  expanded,
  onToggle,
}) => {
  const handlePress = () => {
    if (!hasSamples) return;
    onToggle();
  };

  return (
    <DashboardCard
      title="Visages auto-nommés"
      value={totalCount}
      description="Paires de visages automatiquement liées"
      onPress={hasSamples ? handlePress : undefined}
      disabled={!hasSamples}
      rightAccessory={
        hasSamples ? (
          <Icon
            set="mi"
            name={expanded ? "expand-less" : "expand-more"}
            size={20}
            color={palette.textSecondary}
          />
        ) : null
      }
      actionText={
        hasSamples
          ? expanded
            ? "Masquer les paires"
            : "Afficher les paires"
          : undefined
      }
    />
  );
};

export default AutoNamedFacesCard;
