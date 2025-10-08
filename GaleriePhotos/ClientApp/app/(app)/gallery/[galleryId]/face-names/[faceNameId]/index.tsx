import React from "react";
import { DirectoryView } from "@/components/directory-view";
import SuggestedFaces from "@/components/suggested-faces";
import { View } from "react-native";

function FaceNameScreen() {
  return (
    <View style={{ flex: 1 }}>
      <SuggestedFaces />
      <DirectoryView />
    </View>
  );
}

export default FaceNameScreen;
