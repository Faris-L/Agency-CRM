"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { Download, FileUp, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  deleteClientFileRecord,
  getClientFileDownloadUrl,
  uploadClientFile,
} from "@/actions/client-files";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import type { ClientFileWithUploader } from "@/lib/queries/client-files";

type ClientFilesSectionProps = {
  clientId: string;
  files: ClientFileWithUploader[];
  canManage: boolean;
};

function formatFileSize(bytes: number | null) {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function ClientFilesSection({ clientId, files, canManage }: ClientFilesSectionProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ClientFileWithUploader | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function handleUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("clientId", clientId);
    formData.append("file", file);

    const result = await uploadClientFile(formData);
    setUploading(false);

    if (inputRef.current) {
      inputRef.current.value = "";
    }

    if (!result.success) {
      toast.error(result.error);
      return;
    }

    toast.success("File uploaded.");
    router.refresh();
  }

  async function handleDownload(file: ClientFileWithUploader) {
    setDownloadingId(file.id);
    const result = await getClientFileDownloadUrl({ id: file.id });
    setDownloadingId(null);

    if (!result.success) {
      toast.error(result.error);
      return;
    }

    if (!result.data) {
      toast.error("Failed to download file.");
      return;
    }

    window.open(result.data, "_blank", "noopener,noreferrer");
  }

  async function handleDelete() {
    if (!deleteTarget) return;

    setDeleting(true);
    const result = await deleteClientFileRecord({ id: deleteTarget.id });
    setDeleting(false);

    if (!result.success) {
      toast.error(result.error);
      return;
    }

    toast.success("File deleted.");
    setDeleteTarget(null);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      {canManage ? (
        <div className="flex items-center gap-3">
          <input
            ref={inputRef}
            type="file"
            className="hidden"
            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp"
            onChange={handleUpload}
          />
          <Button
            variant="outline"
            size="sm"
            disabled={uploading}
            onClick={() => inputRef.current?.click()}
          >
            {uploading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <FileUp className="size-4" />
            )}
            Upload file
          </Button>
          <p className="text-xs text-muted-foreground">PDF, Word, or images up to 10 MB</p>
        </div>
      ) : null}

      {files.length === 0 ? (
        <EmptyState
          icon={FileUp}
          title="No files yet"
          description={
            canManage
              ? "Upload contracts, briefs, or documents for this client."
              : "No files have been uploaded for this client."
          }
        />
      ) : (
        <div className="glass-panel overflow-hidden rounded-2xl">
          <ul className="divide-y">
            {files.map((file) => (
              <li
                key={file.id}
                className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium">{file.file_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(file.file_size)} · Uploaded {formatDate(file.uploaded_at)}
                    {file.profiles?.full_name ? ` by ${file.profiles.full_name}` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={downloadingId === file.id}
                    onClick={() => handleDownload(file)}
                  >
                    {downloadingId === file.id ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Download className="size-4" />
                    )}
                    Download
                  </Button>
                  {canManage ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => setDeleteTarget(file)}
                    >
                      <Trash2 className="size-4" />
                      <span className="sr-only">Delete</span>
                    </Button>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete file"
        description={`Are you sure you want to delete "${deleteTarget?.file_name}"? This cannot be undone.`}
        confirmLabel="Delete"
        variant="destructive"
        loading={deleting}
        onConfirm={handleDelete}
      />
    </div>
  );
}
