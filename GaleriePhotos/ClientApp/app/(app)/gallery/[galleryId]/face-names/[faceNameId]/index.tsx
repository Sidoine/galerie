import React from "react";
import { DirectoryView } from "@/components/container-view/directory-view";
import SuggestedFaces from "@/components/faces/suggested-faces";
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
