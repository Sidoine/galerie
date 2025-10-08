import React from "react";
import { DirectoryView } from "@/components/directory-view";
import SuggestedFaces from "@/components/suggested-faces";
import { View } from "react-native";
import { useFaceNameStore } from "@/stores/face-name";

function FaceNameScreen() {
  return (
    <View style={{ flex: 1 }}>
      <SuggestedFaces />
      <DirectoryView store={useFaceNameStore()} />
    </View>
  );
}

export default FaceNameScreen;
