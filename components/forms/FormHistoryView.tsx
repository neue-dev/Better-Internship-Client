"use client";

import { HeaderIcon, HeaderText } from "@/components/ui/text";
import { Newspaper, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

import { FormLog } from "./FormLog";
import { IFormSigningParty } from "@betterinternship/core/forms";
import { cn, formatDate } from "@/lib/utils";
import { Button } from "../ui/button";
import { useFormsLayout } from "@/app/student/forms/layout";
import { useAppContext } from "@/lib/ctx-app";

interface FormHistoryViewProps {
  forms: Array<{
    form_process_id?: string;
    label: string;
    prefilled_document_id?: string | null;
    pending_document_id?: string | null;
    signed_document_id?: string | null;
    latest_document_url?: string | null;
    timestamp: string;
    signing_parties?: IFormSigningParty[];
    status?: string | null;
    rejection_reason?: string;
    pending?: boolean;
  }>;
}

/**
 * Form History View
 */
export function FormHistoryView({ forms }: FormHistoryViewProps) {
  const { setActiveView } = useFormsLayout();
  const { isMobile } = useAppContext();

  return (
    <div className="h-full overflow-y-auto py-3 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="animate-fade-in">
          <div className="flex flex-row items-center gap-3 mt-4 mb-2">
            <HeaderIcon icon={Newspaper}></HeaderIcon>
            <HeaderText>Form History</HeaderText>
          </div>
          <Badge>{forms.length} generated forms</Badge>
        </div>
        <Separator className="mt-4" />

        <div className="animate-fade-in">
          {forms.length === 0 ? (
            <div className="flex flex-col gap-1 items-center justify-center py-12 text-center">
              <p className="text-lg font-medium text-gray-600">No forms yet</p>
              <p className="text-sm text-gray-500">
                You haven't generated any forms yet. Generate your first form to
                get started!
              </p>
              <div className={cn("flex gap-2 mt-4", isMobile && "flex-col")}>
                <Button
                  className="px-8 py-6"
                  variant="default"
                  onClick={() => setActiveView("generate")}
                >
                  <Plus />
                  Generate a form
                </Button>
              </div>
            </div>
          ) : (
            forms
              .toSorted(
                (a, b) =>
                  Date.parse(b.timestamp ?? "") - Date.parse(a.timestamp ?? ""),
              )
              .map((form, index) => (
                <FormLog
                  formProcessId={form.form_process_id}
                  key={form.timestamp}
                  label={form.label}
                  timestamp={formatDate(form.timestamp)}
                  downloadUrl={form.latest_document_url}
                  signingParties={form.signing_parties}
                  status={form.status}
                  rejectionReason={form.rejection_reason}
                  index={index}
                  pending={form.pending}
                />
              ))
          )}
        </div>
      </div>
    </div>
  );
}
