"use client";

import { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { createClientRecord, updateClientRecord } from "@/actions/clients";
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
import { CLIENT_STATUSES } from "@/lib/constants/app";
import {
  clientFormSchema,
  type ClientFormInput,
} from "@/lib/validations/clients";
import type { Client } from "@/types";

type ClientFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client?: Client | null;
  onSuccess: () => void;
};

const emptyValues: ClientFormInput = {
  name: "",
  company: "",
  email: "",
  phone: "",
  status: "Lead",
  notes: "",
};

export function ClientFormDialog({
  open,
  onOpenChange,
  client,
  onSuccess,
}: ClientFormDialogProps) {
  const isEditing = Boolean(client);

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ClientFormInput>({
    resolver: zodResolver(clientFormSchema),
    defaultValues: emptyValues,
  });

  useEffect(() => {
    if (open) {
      reset(
        client
          ? {
              name: client.name,
              company: client.company ?? "",
              email: client.email ?? "",
              phone: client.phone ?? "",
              status: client.status,
              notes: client.notes ?? "",
            }
          : emptyValues,
      );
    }
  }, [open, client, reset]);

  async function onSubmit(values: ClientFormInput) {
    const result = isEditing
      ? await updateClientRecord({ ...values, id: client!.id })
      : await createClientRecord(values);

    if (!result.success) {
      toast.error(result.error);
      return;
    }

    toast.success(isEditing ? "Client updated." : "Client created.");
    onOpenChange(false);
    onSuccess();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit client" : "Add client"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update client details for your workspace."
              : "Create a new client in your workspace."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <FormField id="name" label="Name" error={errors.name?.message}>
            <Input id="name" placeholder="Acme Corp" {...register("name")} />
          </FormField>

          <FormField id="company" label="Company" error={errors.company?.message}>
            <Input id="company" placeholder="Acme Inc." {...register("company")} />
          </FormField>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField id="email" label="Email" error={errors.email?.message}>
              <Input id="email" type="email" placeholder="contact@acme.com" {...register("email")} />
            </FormField>

            <FormField id="phone" label="Phone" error={errors.phone?.message}>
              <Input id="phone" placeholder="+1 555 0100" {...register("phone")} />
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
                    {CLIENT_STATUSES.map((status) => (
                      <SelectItem key={status} value={status}>
                        {status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </FormField>

          <FormField id="notes" label="Notes" error={errors.notes?.message}>
            <Textarea id="notes" rows={3} placeholder="Optional notes…" {...register("notes")} />
          </FormField>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Saving…
                </>
              ) : isEditing ? (
                "Save changes"
              ) : (
                "Create client"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
