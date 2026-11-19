import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import { Camera, FileText, ImagePlus, Trash2, Upload, X } from "lucide-react-native";
import { useEffect, useState } from "react";
import { Alert, Image, Linking, Modal, Platform, Pressable, ScrollView, View, type ImageStyle, type StyleProp } from "react-native";
import { Text } from "../../../src/text";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { formatDate } from "@/lib/format";
import type { Attachment, AttachmentKind } from "@/lib/types";
import { api, API_URL, authHeaders, errorMessage } from "../../../src/api";
import { canWrite, loadProject, useLoad, useProjectId } from "../../../src/data";
import { colors, radius } from "../../../src/theme";
import { Badge, Button, Card, Chip, Empty, Field, Input, Loading, Message, PressableScale, Screen } from "../../../src/ui";

const KINDS: { value: AttachmentKind; label: string }[] = [
  { value: "bill", label: "Bill" },
  { value: "photo", label: "Site photo" },
  { value: "document", label: "Document" },
];
const kindLabel = (kind: string) => KINDS.find((k) => k.value === kind)?.label ?? kind;
const MAX_BYTES = 10 * 1024 * 1024;

type Picked = { uri: string; name: string; type: string; size?: number };

/** Bills, site photos and PDFs for the project: the website's "Bills & photos", on the phone. */
export default function Files() {
  const id = useProjectId();
  const { data, error, refreshing, reload, onRefresh } = useLoad(async () => {
    const [project, files] = await Promise.all([loadProject(id), api<Attachment[]>(`/api/projects/${id}/files`)]);
    return { project, files: [...files].sort((a, b) => b.createdAt.localeCompare(a.createdAt)) };
  }, `files:${id}`);
  const [filter, setFilter] = useState<AttachmentKind | "all">("all");
  const [picked, setPicked] = useState<Picked | null>(null);
  const [kind, setKind] = useState<AttachmentKind>("bill");
  const [caption, setCaption] = useState("");
  const [uploading, setUploading] = useState(false);
  const [note, setNote] = useState<{ text: string; tone: "error" | "success" } | null>(null);
  const [open, setOpen] = useState<Attachment | null>(null);

  if (!data) return error ? <Screen onRefresh={onRefresh}><Message text={error} /></Screen> : <Loading />;
  const editable = canWrite(data.project.role);
  const shown = data.files.filter((f) => filter === "all" || f.kind === filter);

  async function fromCamera() {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) return setNote({ text: "Allow camera access in your phone settings to take photos.", tone: "error" });
    const result = await ImagePicker.launchCameraAsync({ mediaTypes: ["images"], quality: 0.7 });
    if (!result.canceled) choose(result.assets[0], "bill");
  }

  async function fromGallery() {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 0.7 });
    if (!result.canceled) choose(result.assets[0], "photo");
  }

  async function fromFiles() {
    const result = await DocumentPicker.getDocumentAsync({ type: ["application/pdf", "image/*"], copyToCacheDirectory: true });
    if (!result.canceled) {
      const a = result.assets[0];
      choose({ uri: a.uri, fileName: a.name, mimeType: a.mimeType, fileSize: a.size }, a.mimeType === "application/pdf" ? "document" : "bill");
    }
  }

  function choose(asset: { uri: string; fileName?: string | null; mimeType?: string | null; fileSize?: number | null }, suggested: AttachmentKind) {
    const type = asset.mimeType || "image/jpeg";
    const ext = type === "application/pdf" ? "pdf" : type.split("/")[1]?.replace("jpeg", "jpg") || "jpg";
    setPicked({ uri: asset.uri, name: asset.fileName || `${suggested}-${Date.now()}.${ext}`, type, size: asset.fileSize ?? undefined });
    setKind(suggested);
    setCaption("");
    setNote(null);
  }

  async function upload() {
    if (!picked) return;
    if (picked.size && picked.size > MAX_BYTES) return setNote({ text: "That file is larger than 10 MB. Choose a smaller one.", tone: "error" });
    setUploading(true);
    try {
      const form = new FormData();
      if (Platform.OS === "web") form.append("file", await (await fetch(picked.uri)).blob(), picked.name);
      else form.append("file", { uri: picked.uri, name: picked.name, type: picked.type } as unknown as Blob);
      form.append("kind", kind);
      if (caption.trim()) form.append("caption", caption.trim());
      await api(`/api/projects/${id}/files`, { form });
      setPicked(null);
      setNote({ text: "Uploaded.", tone: "success" });
      setTimeout(() => setNote(null), 3000);
      await reload();
    } catch (e) {
      setNote({ text: errorMessage(e), tone: "error" });
    } finally {
      setUploading(false);
    }
  }

  function remove(file: Attachment) {
    const run = async () => {
      try {
        await api(`/api/projects/${id}/files/${file.id}`, { method: "DELETE" });
        setOpen(null);
        await reload();
      } catch (e) {
        Alert.alert("Couldn't delete", errorMessage(e));
      }
    };
    if (Platform.OS === "web") return void run();
    Alert.alert("Delete this file?", file.caption || file.fileName, [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: run },
    ]);
  }

  return (
    <>
      <Screen refreshing={refreshing} onRefresh={onRefresh}>
        {note ? <Message text={note.text} tone={note.tone} /> : null}
        {editable && !picked ? (
          <Card title="Add a bill or photo">
            <View style={{ flexDirection: "row", gap: 8 }}>
              <SourceButton icon={<Camera size={22} color={colors.brand} />} label="Camera" onPress={fromCamera} />
              <SourceButton icon={<ImagePlus size={22} color={colors.brand} />} label="Gallery" onPress={fromGallery} />
              <SourceButton icon={<Upload size={22} color={colors.brand} />} label="PDF / file" onPress={fromFiles} />
            </View>
            <Text style={{ fontSize: 12, color: colors.muted }}>JPG, PNG, WebP, HEIC or PDF · up to 10 MB</Text>
          </Card>
        ) : null}

        {picked ? (
          <Card title="Upload">
            {picked.type.startsWith("image/") ? (
              <Image source={{ uri: picked.uri }} style={{ width: "100%", height: 220, borderRadius: radius.md, backgroundColor: colors.border }} resizeMode="cover" />
            ) : (
              <PdfTile name={picked.name} />
            )}
            <Field label="What is it?">
              <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
                {KINDS.map((k) => (
                  <Chip key={k.value} label={k.label} selected={kind === k.value} onPress={() => setKind(k.value)} />
                ))}
              </View>
            </Field>
            <Field label="Note (optional)">
              <Input value={caption} onChangeText={setCaption} placeholder="e.g. Cement bill, 50 bags" />
            </Field>
            <View style={{ flexDirection: "row", gap: 10 }}>
              <View style={{ flex: 1 }}>
                <Button tone="secondary" label="Cancel" onPress={() => setPicked(null)} />
              </View>
              <View style={{ flex: 2 }}>
                <Button label="Upload" icon={<Upload size={17} color="#fff" />} busy={uploading} onPress={upload} />
              </View>
            </View>
          </Card>
        ) : null}

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
          <Chip label={`All (${data.files.length})`} selected={filter === "all"} onPress={() => setFilter("all")} />
          {KINDS.map((k) => (
            <Chip key={k.value} label={`${k.label}s (${data.files.filter((f) => f.kind === k.value).length})`} selected={filter === k.value} onPress={() => setFilter(k.value)} />
          ))}
        </ScrollView>

        {shown.length === 0 ? (
          <Empty text={data.files.length === 0 ? "No bills or photos yet. Use Camera or Gallery above to add the first one." : "Nothing of this type yet."} />
        ) : (
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
            {shown.map((file) => (
              <PressableScale key={file.id} onPress={() => setOpen(file)} containerStyle={{ width: "48%", flexGrow: 1, maxWidth: "49%" }} style={{ backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, overflow: "hidden" }}>
                {file.mimeType.startsWith("image/") ? (
                  <AuthImage projectId={id} file={file} style={{ width: "100%", height: 130, backgroundColor: colors.border }} />
                ) : (
                  <View style={{ height: 130, alignItems: "center", justifyContent: "center", backgroundColor: colors.brandSoft }}>
                    <FileText size={40} color={colors.brand} />
                  </View>
                )}
                <View style={{ padding: 8, gap: 4 }}>
                  <Badge label={kindLabel(file.kind)} bg={colors.brandSoft} fg={colors.brandStrong} />
                  <Text numberOfLines={1} style={{ fontSize: 13, fontWeight: "600", color: colors.text }}>
                    {file.caption || file.fileName}
                  </Text>
                  <Text style={{ fontSize: 11, color: colors.muted }}>{formatDate(file.createdAt)}</Text>
                </View>
              </PressableScale>
            ))}
          </View>
        )}
      </Screen>

      <Viewer file={open} projectId={id} onClose={() => setOpen(null)} onDelete={editable ? remove : undefined} />
    </>
  );
}

function SourceButton({ icon, label, onPress }: { icon: React.ReactNode; label: string; onPress: () => void }) {
  return (
    <PressableScale onPress={onPress} accessibilityRole="button" containerStyle={{ flex: 1 }} style={{ alignItems: "center", gap: 6, paddingVertical: 14, borderRadius: radius.md, borderWidth: 1.5, borderStyle: "dashed", borderColor: colors.brand, backgroundColor: colors.brandSoft }}>
      {icon}
      <Text style={{ fontSize: 13, fontWeight: "700", color: colors.brandStrong }}>{label}</Text>
    </PressableScale>
  );
}

function PdfTile({ name }: { name: string }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 10, padding: 14, borderRadius: radius.md, backgroundColor: colors.brandSoft }}>
      <FileText size={28} color={colors.brand} />
      <Text style={{ flex: 1, color: colors.text, fontWeight: "600" }} numberOfLines={2}>
        {name}
      </Text>
    </View>
  );
}

const fileUrl = (projectId: string, fileId: string) => `${API_URL}/api/projects/${projectId}/files/${fileId}`;

/** A stored photo; the request carries the sign-in token. */
function AuthImage({ projectId, file, style, contain }: { projectId: string; file: Attachment; style: StyleProp<ImageStyle>; contain?: boolean }) {
  const url = fileUrl(projectId, file.id);
  const [webUri, setWebUri] = useState<string | null>(null);
  useEffect(() => {
    // The browser preview can't add headers to <img>, so it fetches the picture first.
    if (Platform.OS !== "web") return;
    let objectUrl: string | null = null;
    fetch(url, { headers: authHeaders() })
      .then((r) => r.blob())
      .then((b) => setWebUri((objectUrl = URL.createObjectURL(b))))
      .catch(() => {});
    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [url]);
  const source = Platform.OS === "web" ? (webUri ? { uri: webUri } : undefined) : { uri: url, headers: authHeaders() };
  return <Image source={source} style={style} resizeMode={contain ? "contain" : "cover"} />;
}

function Viewer({ file, projectId, onClose, onDelete }: { file: Attachment | null; projectId: string; onClose: () => void; onDelete?: (f: Attachment) => void }) {
  const insets = useSafeAreaInsets();
  if (!file) return null;
  const image = file.mimeType.startsWith("image/");
  return (
    <Modal visible animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <View style={{ flex: 1, backgroundColor: "#0c0a09", paddingTop: insets.top, paddingBottom: insets.bottom + 12 }}>
        <View style={{ flexDirection: "row", alignItems: "center", padding: 12, gap: 12 }}>
          <Pressable onPress={onClose} hitSlop={10} accessibilityLabel="Close">
            <X size={26} color="#fff" />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={{ color: "#fff", fontWeight: "700" }} numberOfLines={1}>
              {file.caption || file.fileName}
            </Text>
            <Text style={{ color: "#a8a29e", fontSize: 12 }}>
              {kindLabel(file.kind)} · {formatDate(file.createdAt)} · {(file.size / 1024 / 1024).toFixed(1)} MB
            </Text>
          </View>
          {onDelete ? (
            <Pressable onPress={() => onDelete(file)} hitSlop={10} accessibilityLabel="Delete">
              <Trash2 size={22} color="#f87171" />
            </Pressable>
          ) : null}
        </View>
        {image ? (
          <AuthImage projectId={projectId} file={file} style={{ flex: 1, width: "100%" }} contain />
        ) : (
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: 16, padding: 24 }}>
            <FileText size={64} color="#fdba74" />
            <Text style={{ color: "#fff", textAlign: "center" }}>{file.fileName}</Text>
            <Button label="Open on the website" onPress={() => Linking.openURL(`${API_URL}/projects/${projectId}/files`)} />
          </View>
        )}
      </View>
    </Modal>
  );
}
