"use client";

import { useEffect, useMemo } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import {
  createInvoiceRecord,
  getSuggestedInvoiceNumber,
  updateInvoiceRecord,
} from "@/actions/invoices";
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
import { CURRENCY_SYMBOL, INVOICE_STATUSES } from "@/lib/constants/app";
import {
  invoiceFormSchema,
  type InvoiceFormInput,
} from "@/lib/validations/invoices";
import type { Client, Project } from "@/types";
import type { InvoiceWithRelations } from "@/lib/queries/invoices";

type InvoiceFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoice?: InvoiceWithRelations | null;
  clients: Pick<Client, "id" | "name">[];
  projects: Pick<Project, "id" | "name" | "client_id">[];
  onSuccess: () => void;
};

const emptyValues: InvoiceFormInput = {
  client_id: "",
  project_id: "",
  invoice_number: "",
  amount: "",
  due_date: "",
  status: "Pending",
};

export function InvoiceFormDialog({
  open,
  onOpenChange,
  invoice,
  clients,
  projects,
  onSuccess,
}: InvoiceFormDialogProps) {
  const isEditing = Boolean(invoice);

  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<InvoiceFormInput>({
    resolver: zodResolver(invoiceFormSchema),
    defaultValues: emptyValues,
  });

  const selectedClientId = watch("client_id");

  const clientProjects = useMemo(
    () => projects.filter((project) => project.client_id === selectedClientId),
    [projects, selectedClientId],
  );

  useEffect(() => {
    if (open) {
      if (invoice) {
        reset({
          client_id: invoice.client_id,
          project_id: invoice.project_id ?? "",
          invoice_number: invoice.invoice_number,
          amount: String(invoice.amount),
          due_date: invoice.due_date,
          status: invoice.status,
        });
      } else {
        reset({
          ...emptyValues,
          client_id: clients[0]?.id ?? "",
        });

        getSuggestedInvoiceNumber().then((result) => {
          if (result.success && result.data) {
            setValue("invoice_number", result.data);
          }
        });
      }
    }
  }, [open, invoice, clients, reset, setValue]);

  useEffect(() => {
    if (!isEditing && selectedClientId) {
      const currentProjectId = watch("project_id");
      if (currentProjectId && !clientProjects.some((p) => p.id === currentProjectId)) {
        setValue("project_id", "");
      }
    }
  }, [selectedClientId, clientProjects, isEditing, setValue, watch]);

  async function onSubmit(values: InvoiceFormInput) {
    const result = isEditing
      ? await updateInvoiceRecord({ ...values, id: invoice!.id })
      : await createInvoiceRecord(values);

    if (!result.success) {
      toast.error(result.error);
      return;
    }

    toast.success(isEditing ? "Invoice updated." : "Invoice created.");
    onOpenChange(false);
    onSuccess();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit invoice" : "Create invoice"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update invoice details and payment status."
              : "Create a new invoice for a client."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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

          <FormField id="project_id" label="Project (optional)" error={errors.project_id?.message}>
            <Controller
              name="project_id"
              control={control}
              render={({ field }) => (
                <Select value={field.value || "none"} onValueChange={(v) => field.onChange(v === "none" ? "" : v)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select project" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No project</SelectItem>
                    {clientProjects.map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </FormField>

          <FormField
            id="invoice_number"
            label="Invoice number"
            error={errors.invoice_number?.message}
          >
            <Input id="invoice_number" placeholder="INV-1001" {...register("invoice_number")} />
          </FormField>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField id="amount" label={`Amount (${CURRENCY_SYMBOL})`} error={errors.amount?.message}>
              <Input id="amount" type="number" min={0} step="0.01" placeholder="2500" {...register("amount")} />
            </FormField>

            <FormField id="due_date" label="Due date" error={errors.due_date?.message}>
              <Input id="due_date" type="date" {...register("due_date")} />
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
                    {INVOICE_STATUSES.map((status) => (
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
                "Create invoice"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
