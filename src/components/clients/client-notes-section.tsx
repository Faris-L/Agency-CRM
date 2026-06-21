"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2, MessageSquarePlus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { createNoteRecord, deleteNoteRecord } from "@/actions/notes";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { NoteWithAuthor } from "@/lib/queries/notes";

type ClientNotesSectionProps = {
  clientId: string;
  notes: NoteWithAuthor[];
  canManage: boolean;
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function ClientNotesSection({ clientId, notes, canManage }: ClientNotesSectionProps) {
  const router = useRouter();
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<NoteWithAuthor | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!content.trim()) return;

    setSubmitting(true);
    const result = await createNoteRecord({ clientId, content });
    setSubmitting(false);

    if (!result.success) {
      toast.error(result.error);
      return;
    }

    toast.success("Note added.");
    setContent("");
    router.refresh();
  }

  async function handleDelete() {
    if (!deleteTarget) return;

    setDeleting(true);
    const result = await deleteNoteRecord({ id: deleteTarget.id });
    setDeleting(false);

    if (!result.success) {
      toast.error(result.error);
      return;
    }

    toast.success("Note deleted.");
    setDeleteTarget(null);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      {canManage ? (
        <form onSubmit={handleSubmit} className="space-y-3">
          <Textarea
            rows={3}
            placeholder="Add a note about this client…"
            value={content}
            onChange={(event) => setContent(event.target.value)}
            maxLength={5000}
          />
          <Button type="submit" size="sm" disabled={submitting || !content.trim()}>
            {submitting ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <MessageSquarePlus className="size-4" />
            )}
            Add note
          </Button>
        </form>
      ) : null}

      {notes.length === 0 ? (
        <EmptyState
          icon={MessageSquarePlus}
          title="No notes yet"
          description={
            canManage
              ? "Add notes to keep track of conversations and context."
              : "No notes have been added for this client."
          }
        />
      ) : (
        <div className="space-y-3">
          {notes.map((note) => (
            <div key={note.id} className="glass-panel rounded-2xl p-4">
              <div className="mb-2 flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium">
                    {note.profiles?.full_name ?? note.profiles?.email ?? "Unknown"}
                  </p>
                  <p className="text-xs text-muted-foreground">{formatDate(note.created_at)}</p>
                </div>
                {canManage ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={() => setDeleteTarget(note)}
                  >
                    <Trash2 className="size-4" />
                    <span className="sr-only">Delete</span>
                  </Button>
                ) : null}
              </div>
              <p className="text-sm whitespace-pre-wrap">{note.content}</p>
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete note"
        description="Are you sure you want to delete this note? This cannot be undone."
        confirmLabel="Delete"
        variant="destructive"
        loading={deleting}
        onConfirm={handleDelete}
      />
    </div>
  );
}
