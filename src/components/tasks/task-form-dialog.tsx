"use client";

import { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { createTaskRecord, updateTaskRecord } from "@/actions/tasks";
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
import { TASK_PRIORITIES, TASK_STATUSES } from "@/lib/constants/app";
import { taskFormSchema, type TaskFormInput } from "@/lib/validations/tasks";
import type { Profile, Project, Task } from "@/types";

type TaskFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task?: Task | null;
  projects: Pick<Project, "id" | "name">[];
  members: Pick<Profile, "id" | "full_name" | "email">[];
  onSuccess: () => void;
};

const emptyValues: TaskFormInput = {
  title: "",
  project_id: "",
  description: "",
  due_date: "",
  priority: "Medium",
  status: "Todo",
  assigned_user: "",
};

export function TaskFormDialog({
  open,
  onOpenChange,
  task,
  projects,
  members,
  onSuccess,
}: TaskFormDialogProps) {
  const isEditing = Boolean(task);

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<TaskFormInput>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: emptyValues,
  });

  useEffect(() => {
    if (open) {
      reset(
        task
          ? {
              title: task.title,
              project_id: task.project_id,
              description: task.description ?? "",
              due_date: task.due_date ?? "",
              priority: task.priority,
              status: task.status,
              assigned_user: task.assigned_user ?? "",
            }
          : {
              ...emptyValues,
              project_id: projects[0]?.id ?? "",
            },
      );
    }
  }, [open, task, projects, reset]);

  async function onSubmit(values: TaskFormInput) {
    const result = isEditing
      ? await updateTaskRecord({ ...values, id: task!.id })
      : await createTaskRecord(values);

    if (!result.success) {
      toast.error(result.error);
      return;
    }

    toast.success(isEditing ? "Task updated." : "Task created.");
    onOpenChange(false);
    onSuccess();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit task" : "Add task"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update task details, assignment, and status."
              : "Create a new task and assign it to a team member."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <FormField id="title" label="Title" error={errors.title?.message}>
            <Input id="title" placeholder="Design homepage mockups" {...register("title")} />
          </FormField>

          <FormField id="project_id" label="Project" error={errors.project_id?.message}>
            <Controller
              name="project_id"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select project" />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name}
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
              placeholder="Task details…"
              {...register("description")}
            />
          </FormField>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField id="due_date" label="Due date" error={errors.due_date?.message}>
              <Input id="due_date" type="date" {...register("due_date")} />
            </FormField>

            <FormField id="priority" label="Priority" error={errors.priority?.message}>
              <Controller
                name="priority"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Priority" />
                    </SelectTrigger>
                    <SelectContent>
                      {TASK_PRIORITIES.map((priority) => (
                        <SelectItem key={priority} value={priority}>
                          {priority}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </FormField>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField id="status" label="Status" error={errors.status?.message}>
              <Controller
                name="status"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      {TASK_STATUSES.map((status) => (
                        <SelectItem key={status} value={status}>
                          {status}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </FormField>

            <FormField id="assigned_user" label="Assignee" error={errors.assigned_user?.message}>
              <Controller
                name="assigned_user"
                control={control}
                render={({ field }) => (
                  <Select value={field.value || "unassigned"} onValueChange={(value) => field.onChange(value === "unassigned" ? "" : value)}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Unassigned" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unassigned">Unassigned</SelectItem>
                      {members.map((member) => (
                        <SelectItem key={member.id} value={member.id}>
                          {member.full_name?.trim() || member.email}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </FormField>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || projects.length === 0}>
              {isSubmitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Saving…
                </>
              ) : isEditing ? (
                "Save changes"
              ) : (
                "Create task"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
