import { View, StyleSheet, Image } from "react-native";

function FaceThumbnail({
  galleryId,
  face,
}: {
  galleryId: string;
  face: { id: number };
}) {
  return (
    <View style={styles.faceWrapper}>
      <Image
        source={{
          uri: `/api/gallery/${galleryId}/faces/${face.id}/thumbnail`,
        }}
        style={styles.faceImage}
      />
    </View>
  );
}

export default FaceThumbnail;

const styles = StyleSheet.create({
  faceWrapper: {
    width: 72,
    height: 72,
    borderRadius: 36,
    overflow: "hidden",
    marginRight: 8,
    backgroundColor: "#f0f0f0",
  },
  faceImage: { width: "100%", height: "100%" },
});
