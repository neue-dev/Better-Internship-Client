"use client";

import { HeaderIcon, HeaderText } from "@/components/ui/text";
import { Newspaper, MessageSquare, HelpCircle, Facebook, Mail } from "lucide-react";
import FormTemplateCard from "@/components/features/student/forms/FormGenerateCard";
import { useRouter } from "next/navigation";
import { Loader } from "@/components/ui/loader";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { HorizontalCollapsible } from "@/components/ui/horizontal-collapse";
import { Button } from "../ui/button";
import Link from "next/link";

/**
 * Generate Forms View
 */
export function FormGenerateView({
  formTemplates,
  isLoading,
}: {
  formTemplates: any[] | undefined;
  isLoading: boolean;
}) {
  const router = useRouter();

  return (
    <div className="h-full overflow-y-auto py-3 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="mb-6 sm:mb-8 animate-fade-in">
          <div className="flex flex-row items-center gap-3 mt-4 mb-2">
            <HeaderIcon icon={Newspaper}></HeaderIcon>
            <HeaderText>Internship Forms</HeaderText>
          </div>

          {formTemplates?.length &&
            <div className="text-gray-600 text-sm space-y-3">
              <HorizontalCollapsible
                title="How to generate a form"
                className="bg-transparent"
              >
                <div className="aspect-video rounded-[0.33em] overflow-hidden border border-gray-200 bg-gray-100 ">
                  <iframe
                    loading="lazy"
                    src="https://www.canva.com/design/DAG2Z5YJXgA/gS-WRa6O-bFzg77gnzBeyA/view?embed"
                    className="w-full h-full"
                  ></iframe>
                </div>
              </HorizontalCollapsible>
            </div>
          }
        </div>

        <Separator className="" />

        <div className="mb-6 sm:mb-8 animate-fade-in space-y-6">
          {isLoading && <Loader>Loading latest forms...</Loader>}
          <div className="space-y-3">
            {!isLoading && (formTemplates?.length ?? 0) === 0 && (
              <div className="flex flex-col gap-1 items-center justify-center py-12 text-center">
                <p className="text-lg font-medium text-gray-600">We're currently adding forms for this department.</p>
                <p className="text-sm text-gray-500">
                  In the meantime, please contact us and we'll personally assist you.
                </p>
                <div className="flex gap-2 mt-4">
                  <Link
                    href="https://www.facebook.com/profile.php?id=61586110929431"
                  >
                    <Button
                      className="px-8 py-6"
                      variant="outline"
                    >
                      <MessageSquare />
                      Contact us on Facebook.
                    </Button>
                  </Link>
                  <Link
                    href="mailto://hello@betterinternship.com"
                  >
                    <Button
                      className="px-8 py-6"
                      variant="outline"
                    >
                      <Mail />
                      Contact us through email.
                    </Button>
                  </Link>
                </div>
              </div>
            )}
            <div
              className={cn(
                isLoading ? "opacity-50 pointer-events-none" : "",
                "flex flex-col",
              )}
            >
              {formTemplates?.length &&
                formTemplates
                  .sort((a, b) => a.formName.localeCompare(b.formName))
                  .map((form, i) => (
                    <FormTemplateCard
                      key={form.formName + i}
                      formLabel={form.formLabel}
                      formName={form.formName}
                      onGenerate={() => router.push(`/forms/${form.formName}`)}
                    />
                  ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
