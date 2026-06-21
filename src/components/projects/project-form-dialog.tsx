"use client";

import { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { createProjectRecord, updateProjectRecord } from "@/actions/projects";
import { FormField } from "@/components/auth/form-field";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { CURRENCY_SYMBOL, PROJECT_STATUSES } from "@/lib/constants/app";
import {
  projectFormSchema,
  type ProjectFormInput,
} from "@/lib/validations/projects";
import type { Client, Project } from "@/types";

type ProjectFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project?: Project | null;
  clients: Pick<Client, "id" | "name">[];
  onSuccess: () => void;
};

const emptyValues: ProjectFormInput = {
  name: "",
  client_id: "",
  description: "",
  budget: "",
  deadline: "",
  status: "Planning",
};

export function ProjectFormDialog({
  open,
  onOpenChange,
  project,
  clients,
  onSuccess,
}: ProjectFormDialogProps) {
  const isEditing = Boolean(project);

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProjectFormInput>({
    resolver: zodResolver(projectFormSchema),
    defaultValues: emptyValues,
  });

  useEffect(() => {
    if (open) {
      reset(
        project
          ? {
              name: project.name,
              client_id: project.client_id,
              description: project.description ?? "",
              budget: project.budget != null ? String(project.budget) : "",
              deadline: project.deadline ?? "",
              status: project.status,
            }
          : {
              ...emptyValues,
              client_id: clients[0]?.id ?? "",
            },
      );
    }
  }, [open, project, clients, reset]);

  async function onSubmit(values: ProjectFormInput) {
    const result = isEditing
      ? await updateProjectRecord({ ...values, id: project!.id })
      : await createProjectRecord(values);

    if (!result.success) {
      toast.error(result.error);
      return;
    }

    toast.success(isEditing ? "Project updated." : "Project created.");
    onOpenChange(false);
    onSuccess();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit project" : "Add project"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update project details and status."
              : "Create a new project linked to a client."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <FormField id="name" label="Project name" error={errors.name?.message}>
            <Input id="name" placeholder="Website redesign" {...register("name")} />
          </FormField>

          <FormField id="client_id" label="Client" error={errors.client_id?.message}>
            <Controller
              name="client_id"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select client" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </FormField>

          <FormField id="description" label="Description" error={errors.description?.message}>
            <Textarea
              id="description"
              rows={3}
              placeholder="Project scope and goals…"
              {...register("description")}
            />
          </FormField>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField id="budget" label={`Budget (${CURRENCY_SYMBOL})`} error={errors.budget?.message}>
              <Input id="budget" type="number" min={0} step="0.01" placeholder="5000" {...register("budget")} />
            </FormField>

            <FormField id="deadline" label="Deadline" error={errors.deadline?.message}>
              <Input id="deadline" type="date" {...register("deadline")} />
            </FormField>
          </div>

          <FormField id="status" label="Status" error={errors.status?.message}>
            <Controller
              name="status"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {PROJECT_STATUSES.map((status) => (
                      <SelectItem key={status} value={status}>
                        {status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </FormField>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || clients.length === 0}>
              {isSubmitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Saving…
                </>
              ) : isEditing ? (
                "Save changes"
              ) : (
                "Create project"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
