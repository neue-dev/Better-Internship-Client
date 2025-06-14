"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  Search,
  Heart,
  CheckCircle,
  Clipboard,
  AlertTriangle,
  User,
  Filter,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  useJobs,
  useSavedJobs,
  useProfile,
  useApplications,
} from "@/hooks/use-api";
import { useAuthContext } from "../../../lib/ctx-auth";
import { Application, Job } from "@/lib/db/db.types";
import { Paginator } from "@/components/ui/paginator";
import { useRefs } from "@/lib/db/use-refs";
import {
  DropdownGroup,
  GroupableRadioDropdown,
} from "@/components/ui/dropdown";
import { useFilter } from "@/lib/filter";
import { useAppContext } from "@/lib/ctx-app";
import { useModal } from "@/hooks/use-modal";
import { JobCard, JobDetails, MobileJobCard } from "@/components/shared/jobs";
import { cn } from "@/lib/utils";

export default function SearchPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { is_authenticated } = useAuthContext();
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const { filters, set_filter, filter_setter } = useFilter<{
    job_type: string;
    location: string;
    industry: string;
    category: string;
  }>();
  const {
    open: open_application_modal,
    close: close_application_modal,
    Modal: ApplicationModal,
  } = useModal("application-modal");
  const {
    open: open_success_modal,
    close: close_success_modal,
    Modal: SuccessModal,
  } = useModal("success-modal");
  const {
    open: open_filter_modal,
    close: close_filter_modal,
    Modal: FilterModal,
  } = useModal("filter-modal");
  const {
    open: open_job_modal,
    close: close_job_modal,
    Modal: JobModal,
  } = useModal("job-modal");
  const { is_mobile } = useAppContext();
  const { profile } = useProfile();
  const { ref_is_not_null } = useRefs();

  // Check if profile is complete
  const isProfileComplete = () => {
    if (!profile) return false;
    return !!(
      profile.full_name &&
      profile.phone_number &&
      ref_is_not_null(profile.college) &&
      ref_is_not_null(profile.year_level)
    );
  };

  // Check if job-specific requirements are met
  const areJobRequirementsMet = () => {
    if (!selectedJob || !profile) return false;
    return true;
  };

  const getMissingJobRequirements = () => {
    if (!selectedJob || !profile) return [];
    return [];
  };

  // API hooks
  const jobs_page_size = 10;
  const [jobs_page, setJobsPage] = useState(1);
  const [jobs, setJobs] = useState<Job[]>([]);
  const {
    getJobsPage,
    jobs: allJobs,
    loading: jobs_loading,
    error: jobs_error,
    refetch,
  } = useJobs({
    search: searchTerm.trim() || undefined,
    category: filters.category,
    type: filters.job_type,
    mode: filters.location,
    industry: filters.industry,
  });

  useEffect(() => {
    setJobs(getJobsPage({ page: jobs_page, limit: jobs_page_size }));
  }, [jobs_page, jobs_loading]);

  const { is_saved, saving, save_job } = useSavedJobs();
  const { appliedJob, apply } = useApplications();

  useEffect(() => {
    const query = searchParams.get("q") || "";
    setSearchTerm(query);
  }, [searchParams]);

  useEffect(() => {
    const jobId = searchParams.get("jobId");
    if (jobId && jobs.length > 0) {
      const targetJob = jobs.find((job) => job.id === jobId);
      if (targetJob) {
        setSelectedJob(targetJob);
      }
    } else if (jobs.length > 0 && !selectedJob) {
      setSelectedJob(jobs[0]);
    }
  }, []);

  useEffect(() => {
    const jobId = searchParams.get("jobId");
    const category = searchParams.get("category");
    const jobType = searchParams.get("jobType");
    const location = searchParams.get("location");
    set_filter("category", category ?? "All industries");
    set_filter("job_type", jobType ?? "All types");
    set_filter("location", location ?? "Any location");
    setSelectedJob(jobs.filter((job) => job.id === jobId)[0] ?? {});
  }, [searchParams, jobs]);

  // Set first job as selected when jobs load
  useEffect(() => {
    if (jobs.length > 0 && !selectedJob) {
      setSelectedJob(jobs[0]);
    }
  }, [jobs, selectedJob]);

  const handleSave = async (job: Job) => {
    if (!is_authenticated()) {
      window.location.href = "/login";
      return;
    }

    try {
      await save_job(job.id ?? "");
    } catch (error) {
      console.error("Failed to save job:", error);
    }
  };

  const handleApply = () => {
    if (!is_authenticated()) {
      window.location.href = "/login";
      return;
    }

    // Check if already applied
    const applicationStatus = appliedJob(selectedJob?.id ?? "");
    if (applicationStatus) {
      alert("You have already applied to this job!");
      return;
    }

    // Check if profile is complete
    if (!isProfileComplete()) {
      alert("Please complete your profile before applying.");
      router.push("/profile");
      return;
    }

    // Check if job requirements are met
    if (!areJobRequirementsMet()) {
      open_application_modal();
      return;
    }

    // If everything is complete, apply directly
    handleDirectApplication();
  };

  const handleDirectApplication = async () => {
    if (!selectedJob) return;

    try {
      await apply(selectedJob.id ?? "", {
        github_link: profile?.github_link || undefined,
        portfolio_link: profile?.portfolio_link || undefined,
      });
      open_success_modal();
    } catch (error) {
      console.error("Failed to submit application:", error);
      alert("Failed to submit application. Please try again.");
    } finally {
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      // Apply current search term along with active filters
      // The useJobs hook will automatically filter based on both search and filters
      // @ts-ignore
      e.currentTarget.blur();
      setJobsPage(1);
      setJobs(getJobsPage({ page: 1, limit: jobs_page_size }));
    }
  };

  const handleJobCardClick = (job: Job) => {
    setSelectedJob(job);
    if (is_mobile) open_job_modal();
  };

  if (jobs_error) {
    return (
      <div className="h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">Failed to load jobs: {jobs_error}</p>
          <Button onClick={refetch}>Try Again</Button>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Desktop and Mobile Layout */}
      <div className="flex-1 flex overflow-hidden max-h-full">
        {jobs_loading ? (
          /* Loading State */
          <div className="w-full flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading jobs...</p>
            </div>
          </div>
        ) : is_mobile ? (
          /* Mobile Layout - Only Job Cards */
          <div className="w-full overflow-y-auto p-6">
            {/* Mobile Search Bar */}
            <div className="w-full mb-6">
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-2">
                <div className="flex items-center gap-3">
                  <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Search Job Listings"
                      className="w-full h-12 pl-12 pr-4 bg-transparent border-0 outline-none text-gray-900 placeholder:text-gray-500 text-base"
                    />
                  </div>
                  <Button
                    onClick={() => open_filter_modal()}
                    className="h-12 w-12 flex-shrink-0 bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm"
                    size="icon"
                  >
                    <Filter className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {jobs.length ? (
              <div className="space-y-4">
                {jobs.map((job) => (
                  <MobileJobCard
                    key={job.id}
                    job={job}
                    on_click={() => handleJobCardClick(job)}
                  />
                ))}
              </div>
            ) : (
              <div>
                <p className="p-4">No jobs found.</p>
              </div>
            )}

            {/* Mobile Paginator */}
            <Paginator
              totalItems={allJobs.length}
              itemsPerPage={jobs_page_size}
              onPageChange={(page) => setJobsPage(page)}
            />
          </div>
        ) : (
          /* Desktop Layout - Split View */
          <>
            {/* Job List */}
            <div className="w-1/3 border-r overflow-x-hidden overflow-y-auto p-6">
              {/* Desktop Search Bar */}
              <div className="w-full max-w-4xl mx-auto mb-6">
                <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-2">
                  <div className="flex items-center gap-3">
                    <div className="relative flex-1">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
                      <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Search Job Listings"
                        className="w-full h-12 pl-12 pr-4 bg-transparent border-0 outline-none text-gray-900 placeholder:text-gray-500 text-base"
                      />
                    </div>
                    <Button
                      onClick={() => open_filter_modal()}
                      className="h-12 w-12 flex-shrink-0 bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm"
                      size="icon"
                    >
                      <Filter className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {jobs.length ? (
                <div className="space-y-4">
                  {jobs.map((job) => (
                    <JobCard
                      key={job.id}
                      job={job}
                      selected={selectedJob?.id === job.id}
                      on_click={() => handleJobCardClick(job)}
                    />
                  ))}
                </div>
              ) : (
                <div>
                  <p className="p-4">No jobs found.</p>
                </div>
              )}

              {/* Desktop Paginator */}
              <Paginator
                totalItems={allJobs.length}
                itemsPerPage={jobs_page_size}
                onPageChange={(page) => setJobsPage(page)}
              />
            </div>

            {/* Job Details */}
            <div className="w-2/3 flex flex-col overflow-hidden">
              {selectedJob && (
                <JobDetails
                  job={selectedJob}
                  actions={[
                    <Button
                      disabled={appliedJob(selectedJob.id ?? "")}
                      onClick={() =>
                        !appliedJob(selectedJob.id ?? "") && handleApply()
                      }
                      className={cn(
                        appliedJob(selectedJob.id ?? "")
                          ? "bg-green-600 text-white"
                          : "bg-blue-600 hover:bg-blue-700"
                      )}
                    >
                      {appliedJob(selectedJob.id ?? "") && (
                        <CheckCircle className="w-4 h-4 mr-2" />
                      )}
                      {appliedJob(selectedJob.id ?? "") ? "Applied" : "Apply"}
                    </Button>,
                    <Button
                      variant="outline"
                      onClick={() => handleSave(selectedJob)}
                      className={cn(
                        is_saved(selectedJob.id ?? "")
                          ? "bg-red-50 border-red-200 text-red-600"
                          : ""
                      )}
                    >
                      {is_saved(selectedJob.id ?? "") && <Heart />}
                      {is_saved(selectedJob.id ?? "")
                        ? "Saved"
                        : saving
                        ? "Saving..."
                        : "Save"}
                    </Button>,
                  ]}
                />
              )}
            </div>
          </>
        )}
      </div>

      {/* Mobile Job Details Modal */}
      <JobModal>
        <div className="flex justify-between items-center p-4 border-b bg-white flex-shrink-0">
          <h2 className="text-lg font-bold text-gray-900">Job Details</h2>
        </div>
        <div className="flex-1 overflow-y-auto">
          <JobDetails job={selectedJob ?? {}} />
        </div>
      </JobModal>

      {/* Application Modal - Only for Missing Job Requirements */}
      <ApplicationModal>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">Apply to {selectedJob?.title}</h2>
        </div>

        {/* Missing Job Requirements Warning */}
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="font-medium text-orange-800 mb-2">
                Missing Job Requirements
              </h3>
              <p className="text-sm text-orange-700 mb-3">
                This job requires additional profile information:
              </p>
              <ul className="text-sm text-orange-700 list-disc list-inside mb-4">
                {getMissingJobRequirements().map((field, index) => (
                  <li key={index}>{field}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Update Profile Button */}
        <Button
          onClick={() => {
            close_application_modal();
            router.push("/profile");
          }}
          className="w-full h-12 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-medium"
        >
          <User className="w-4 h-4 mr-2" />
          Update Profile
        </Button>
      </ApplicationModal>

      {/* Success Modal */}
      <SuccessModal>
        {/* Header with close button */}
        <div className="flex justify-between items-center p-6 pb-0"></div>

        {/* Content */}
        <div className="px-6 pb-8 text-center">
          {/* Success Animation */}
          <motion.div
            className="mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <motion.div
              className="w-20 h-20 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center"
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{
                delay: 0.3,
                duration: 0.6,
                type: "spring",
                bounce: 0.5,
              }}
            >
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8, duration: 0.3 }}
              >
                <CheckCircle className="w-10 h-10 text-green-600" />
              </motion.div>
            </motion.div>

            <motion.h2
              className="text-2xl font-bold text-gray-800 mb-2"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.4 }}
            >
              Application Sent!
            </motion.h2>

            <motion.p
              className="text-gray-600 mb-6 leading-relaxed"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.4 }}
            >
              Your application for{" "}
              <span className="font-semibold max-w-prose text-gray-800">
                {selectedJob?.title}
              </span>{" "}
              has been successfully submitted.
            </motion.p>

            <motion.div
              className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.4 }}
            >
              <p className="text-sm text-blue-800 max-w-prose">
                💼 Check <span className="font-semibold">My Applications</span>{" "}
                to keep track of all your submissions and updates.
              </p>
            </motion.div>
          </motion.div>

          {/* Action Buttons */}
          <motion.div
            className="space-y-3"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.4 }}
          >
            <Button
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-medium transition-colors"
              onClick={() => {
                close_success_modal();
                router.push("/applications");
              }}
            >
              <Clipboard className="w-4 h-4 mr-2" />
              View My Applications
            </Button>
          </motion.div>
        </div>
      </SuccessModal>

      {/* Filter Modal */}
      <FilterModal>
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900">Filter Jobs</h2>
        </div>

        <div className="space-y-6">
          <DropdownGroup>
            <div className="relative border-2 p-2 rounded-md hover:bg-slate-100 duration-100">
              <GroupableRadioDropdown
                name="jobType"
                options={["All types", "Internships", "Full-time", "Part-time"]}
                on_change={filter_setter("job_type")}
                default_value={filters.job_type}
              />
            </div>

            <div className="relative border-2 p-2 rounded-md hover:bg-slate-100 duration-100">
              <GroupableRadioDropdown
                name="location"
                options={["Any location", "In-Person", "Remote", "Hybrid"]}
                on_change={filter_setter("location")}
                default_value={filters.location}
              />
            </div>

            <div className="relative border-2 p-2 rounded-md hover:bg-slate-100 duration-100">
              <GroupableRadioDropdown
                name="category"
                options={[
                  "All industries",
                  "Technology",
                  "Creative Services",
                  "Consumer Goods",
                ]}
                on_change={filter_setter("industry")}
                default_value={filters.industry}
              />
            </div>
          </DropdownGroup>

          <div className="flex gap-3 pt-6">
            <Button
              variant="outline"
              onClick={() => {
                // Clear temp filters but keep search term
                set_filter("job_type", "All types");
                set_filter("location", "Any location");
                set_filter("industry", "All industries");
              }}
              className="flex-1 h-12 border-2 border-gray-200 text-gray-700 font-semibold hover:bg-gray-50 hover:border-gray-300 rounded-xl transition-all duration-200"
            >
              Clear Filters
            </Button>
            <Button
              onClick={() => close_filter_modal()}
              className="flex-1 h-12 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
            >
              Apply Filters
            </Button>
          </div>
        </div>
      </FilterModal>
    </>
  );
}
