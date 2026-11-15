import { useLocalSearchParams } from "expo-router";
import { List } from "lucide-react-native";
import { useState, type ReactNode } from "react";
import type { CatalogName } from "@/lib/catalogs";
import { getCollection, type CollectionName } from "@/lib/collections";
import type { LedgerRecord } from "@/lib/types";
import { canWrite, loadProject, loadRecords, useLoad } from "./data";
import { RecordForm } from "./RecordForm";
import { RecordList, type Extra } from "./RecordList";
import { colors } from "./theme";
import { Button, Loading, Message, Screen, SectionTitle } from "./ui";

/**
 * An entry page like the website's: the add form is always open, and saved entries sit behind
 * "View saved entries", still there to edit or delete mistakes.
 */
export function EntryPage({
  collection,
  catalog,
  multiple,
  header,
  extras,
  footer,
}: {
  collection: CollectionName;
  catalog?: CatalogName;
  multiple?: boolean;
  /** Stat tiles above the form, worked out from the saved entries. */
  header?: (records: LedgerRecord[]) => ReactNode;
  extras?: (records: LedgerRecord[]) => Extra[];
  /** More sections below the list (e.g. labour attendance). */
  footer?: (records: LedgerRecord[], reload: () => void) => ReactNode;
}) {
  const { id } = useLocalSearchParams<{ id: string }>();
  const def = getCollection(collection);
  const { data, error, refreshing, reload, onRefresh } = useLoad(async () => {
    const [project, records] = await Promise.all([loadProject(id), loadRecords(id, collection)]);
    return { project, records };
  });
  const [showSaved, setShowSaved] = useState(false);
  const [savedNote, setSavedNote] = useState<string | null>(null);

  if (!data) return error ? <Screen onRefresh={onRefresh}>{<Message text={error} />}</Screen> : <Loading />;
  const editable = canWrite(data.project.role);

  return (
    <Screen refreshing={refreshing} onRefresh={onRefresh}>
      {error ? <Message text={error} /> : null}
      {header?.(data.records)}
      {savedNote ? <Message tone="success" text={savedNote} /> : null}
      {editable ? (
        <RecordForm
          projectId={id}
          collection={collection}
          catalog={catalog}
          multiple={multiple}
          onDone={(count) => {
            setSavedNote(count > 1 ? `Saved ${count} entries.` : "Saved.");
            setTimeout(() => setSavedNote(null), 4000);
            void reload();
          }}
        />
      ) : (
        <Message text="You can view this project but not add entries (viewer access)." />
      )}

      <SectionTitle text={`Saved ${def.label.toLowerCase()} (${data.records.length})`} />
      {showSaved || !editable ? (
        <>
          <RecordList projectId={id} collection={collection} records={data.records} canEdit={editable} extras={extras?.(data.records)} catalog={catalog} onChanged={() => void reload()} />
          {editable && data.records.length > 0 ? <Button tone="ghost" label="Hide saved entries" onPress={() => setShowSaved(false)} /> : null}
        </>
      ) : (
        <Button tone="secondary" label={`View saved entries (${data.records.length})`} icon={<List size={16} color={colors.text} />} onPress={() => setShowSaved(true)} />
      )}
      {footer?.(data.records, () => void reload())}
    </Screen>
  );
}
