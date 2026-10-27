import { collections, type CollectionName } from "@/lib/collections";
import { deleteProjectAttachments } from "./attachment-store";
import { deleteProjectInvites } from "./invite-store";
import { deleteProject } from "./project-store";
import { deleteProjectRecords } from "./record-store";

/** Deletes a project with everything recorded in it: entries, uploaded files and invites. */
export async function deleteProjectAndData(projectId: string) {
  await deleteProjectRecords(projectId, Object.keys(collections) as CollectionName[]);
  await deleteProjectAttachments(projectId);
  await deleteProjectInvites(projectId);
  await deleteProject(projectId);
}
