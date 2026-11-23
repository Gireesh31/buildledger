import { useVideoPlayer, VideoView } from "expo-video";
import { Image, View, type StyleProp, type ViewStyle } from "react-native";
import type { AnnouncementMedia } from "@/lib/app-config";

/** One announcement picture or video, 16:9. Videos start muted and loop; the controls unmute them. */
export function MediaView({ media, style }: { media: Pick<AnnouncementMedia, "type" | "url">; style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[{ aspectRatio: 16 / 9, width: "100%", borderRadius: 12, overflow: "hidden", backgroundColor: "#000" }, style]}>
      {media.type === "image" ? (
        <Image source={{ uri: media.url }} style={{ width: "100%", height: "100%" }} resizeMode="cover" accessibilityIgnoresInvertColors />
      ) : (
        <Video url={media.url} />
      )}
    </View>
  );
}

function Video({ url }: { url: string }) {
  const player = useVideoPlayer(url, (p) => {
    p.muted = true;
    p.loop = true;
    p.play();
  });
  return <VideoView player={player} style={{ width: "100%", height: "100%" }} contentFit="contain" nativeControls />;
}
