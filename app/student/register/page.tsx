"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Upload, Award } from "lucide-react";
import { useAuthContext } from "../../../lib/ctx-auth";
import { useRefs } from "@/lib/db/use-refs";
import { University } from "@/lib/db/db.types";
import { RefDropdown } from "@/components/ui/ref-dropdown";

export default function RegisterPage() {
  const defaultYearLevel = "Select Year Level";
  const defaultCollege = "Select College";
  const validFieldClassName = "border-green-600 border-opacity-50";
  const {
    levels,
    colleges,
    universities,
    get_level_by_name,
    get_college_by_name,
    get_university_by_domain,
  } = useRefs();
  const [formData, setFormData] = useState({
    fullName: "",
    yearLevel: defaultYearLevel,
    college: defaultCollege,
    portfolioLink: "",
    githubLink: "",
    phoneNumber: "",
    linkedinProfile: "",
    acceptTerms: false,
    takingForCredit: false,
    linkageOfficer: "",
  });
  const { register, redirect_if_logged_in } = useAuthContext();
  const [email, setEmail] = useState("");
  const [university, setUniversity] = useState<University>();
  const [activeDropdown, setActiveDropdown] = useState("");
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const searchParams = useSearchParams();
  const resumeInputRef = useRef<HTMLInputElement>(null);

  redirect_if_logged_in();

  // Pre-fill email if coming from login redirect
  useEffect(() => {
    const emailParam = searchParams.get("email");
    if (!emailParam) return router.push("/login");
    setEmail(emailParam);
    if (!universities.length) return;

    const domain = emailParam.split("@")[1];
    const uni = get_university_by_domain(domain);
    if (!uni) return router.push("/login");
    setUniversity(uni);
  }, [searchParams, universities, router]);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const domain = email.split("@")[1];

    if (!formData.fullName || !formData.yearLevel || !formData.phoneNumber) {
      setError("Please fill in all required fields");
      return;
    }

    if (formData.takingForCredit && !formData.linkageOfficer.trim()) {
      setError("Please provide your linkage officer information");
      return;
    }

    if (!formData.acceptTerms) {
      setError(
        "Please accept the Terms & Conditions and Privacy Policy to continue"
      );
      return;
    }

    if (!get_university_by_domain(domain)) {
      setError("Please use your university email address (e.g. @dlsu.edu.ph)");
      return;
    }

    if (
      formData.college === defaultCollege ||
      formData.yearLevel === defaultYearLevel
    ) {
      setError("Please fill in the dropdown fields too.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      // User form
      const user_form_data = new FormData();
      user_form_data.append("email", email);
      user_form_data.append("full_name", formData.fullName);
      user_form_data.append("phone_number", formData.phoneNumber);
      user_form_data.append(
        "year_level",
        (get_level_by_name(formData.yearLevel)?.id ?? "") + ""
      );
      user_form_data.append(
        "college",
        (get_college_by_name(formData.college)?.id ?? "") + ""
      );
      user_form_data.append("portfolio_link", formData.portfolioLink);
      user_form_data.append("github_link", formData.githubLink);
      user_form_data.append("linkedin_link", formData.linkedinProfile);
      user_form_data.append(
        "taking_for_credit",
        formData.takingForCredit.toString()
      );
      user_form_data.append("linkage_officer", formData.linkageOfficer);
      // @ts-ignore
      user_form_data.append("resume", resumeFile);

      for (let pair of user_form_data.entries()) {
        console.log(pair[0], pair[1]);
      }
      // @ts-ignore
      await register(user_form_data)
        .then((r) => {
          if (r && r.success) {
            router.push("/verify");
          } else {
            setError("Ensure that your inputs are correct.");
          }
        })
        .catch((e) => {
          setError(e.message || "Registration failed. Please try again.");
        });
    } catch (err: any) {
      setError(err.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!email) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Let's Create your Profile
          </h2>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-lg max-w-2xl mx-auto">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Profile Form */}
        <form onSubmit={handleSubmit} className="max-w-2xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* Full Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Name <span className="text-red-500">*</span>
              </label>
              <Input
                type="text"
                value={formData.fullName}
                onChange={(e) => handleInputChange("fullName", e.target.value)}
                placeholder="Enter Full Name"
                className={
                  (formData.fullName === ""
                    ? "border-gray-300"
                    : validFieldClassName) +
                  " w-full h-12 px-4 text-gray-900 placeholder-gray-500 border-2 rounded-lg focus:border-gray-900 focus:ring-0"
                }
                disabled={loading}
                required
              />
            </div>

            {/* Phone Number */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number <span className="text-red-500">*</span>
              </label>
              <Input
                type="tel"
                value={formData.phoneNumber}
                onChange={(e) =>
                  handleInputChange("phoneNumber", e.target.value)
                }
                placeholder="Enter Phone Number"
                className={
                  (formData.phoneNumber === ""
                    ? "border-gray-300"
                    : validFieldClassName) +
                  " w-full h-12 px-4 text-gray-900 placeholder-gray-500 border-2 rounded-lg focus:border-gray-900 focus:ring-0"
                }
                disabled={loading}
                required
              />
            </div>

            {/* College */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                College <span className="text-red-500">*</span>
              </label>
              <RefDropdown
                name="college"
                defaultValue={defaultCollege}
                value={formData.college}
                options={colleges
                  .filter((c) => c.university_id === university?.id)
                  .sort((a, b) => a.name.localeCompare(b.name))
                  .map((college) => college.name)}
                activeDropdown={activeDropdown}
                validFieldClassName={validFieldClassName}
                onChange={(value) => handleInputChange("college", value)}
                onClick={() => setActiveDropdown("college")}
              ></RefDropdown>
            </div>

            {/* School Year */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Year Level <span className="text-red-500">*</span>
              </label>
              <RefDropdown
                name="yearLevel"
                defaultValue={defaultYearLevel}
                value={formData.yearLevel}
                options={levels
                  .sort(
                    (a, b) => a.order - b.order || a.name.localeCompare(b.name)
                  )
                  .map((level) => level.name)}
                activeDropdown={activeDropdown}
                validFieldClassName={validFieldClassName}
                onChange={(value) => handleInputChange("yearLevel", value)}
                onClick={() => setActiveDropdown("yearLevel")}
              ></RefDropdown>
            </div>

            {/* Portfolio Link */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Portfolio Link{" "}
                <span className="text-gray-500 italic">(Optional)</span>
              </label>
              <Input
                type="url"
                value={formData.portfolioLink}
                onChange={(e) =>
                  handleInputChange("portfolioLink", e.target.value)
                }
                placeholder="Enter Portfolio Link"
                className={
                  (formData.portfolioLink === ""
                    ? "border-gray-300"
                    : validFieldClassName) +
                  " w-full h-12 px-4 text-gray-900 placeholder-gray-500 border-2 rounded-lg focus:border-gray-900 focus:ring-0"
                }
                disabled={loading}
              />
            </div>

            {/* LinkedIn Profile */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                LinkedIn Profile{" "}
                <span className="text-gray-500 italic">(Optional)</span>
              </label>
              <Input
                type="url"
                value={formData.linkedinProfile}
                onChange={(e) =>
                  handleInputChange("linkedinProfile", e.target.value)
                }
                placeholder="Enter LinkedIn Profile Link"
                className={
                  (formData.linkedinProfile === ""
                    ? "border-gray-300"
                    : validFieldClassName) +
                  " w-full h-12 px-4 text-gray-900 placeholder-gray-500 border-2 rounded-lg focus:border-gray-900 focus:ring-0"
                }
                disabled={loading}
              />
            </div>

            {/* Github Link */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Github Link{" "}
                <span className="text-gray-500 italic">(Optional)</span>
              </label>
              <Input
                type="url"
                value={formData.githubLink}
                onChange={(e) =>
                  handleInputChange("githubLink", e.target.value)
                }
                placeholder="Enter Github Link"
                className={
                  (formData.githubLink === ""
                    ? "border-gray-300"
                    : validFieldClassName) +
                  " w-full h-12 px-4 text-gray-900 placeholder-gray-500 border-2 rounded-lg focus:border-gray-900 focus:ring-0"
                }
                disabled={loading}
              />
            </div>

            {/* Resume Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Resume <span className="text-gray-500 italic">(Optional)</span>
              </label>
              <input
                type="file"
                ref={resumeInputRef}
                onChange={(r) =>
                  setResumeFile((r.target?.files ?? [])[0] ?? null)
                }
                accept=".pdf,.doc,.docx"
                disabled={loading}
                style={{ display: "none" }}
              />
              <div
                onClick={() => resumeInputRef.current?.click()}
                className={
                  (!resumeFile || !resumeFile.name
                    ? "border-gray-300"
                    : validFieldClassName) +
                  " w-full h-12 px-4 border-2 rounded-lg cursor-pointer hover:border-gray-400 transition-colors flex items-center justify-between"
                }
              >
                <span
                  className={
                    resumeFile
                      ? " line-clamp-1 text-gray-900 text-ellipsis"
                      : "line-clamp-1 text-gray-500 text-ellipsis"
                  }
                >
                  {resumeFile ? resumeFile.name : "Upload File Here"}
                </span>
                <Upload className="h-4 w-4 text-gray-400" />
              </div>
            </div>

            {/* Taking for Credit */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Academic Credit
              </label>
              <div className="flex items-center space-x-3">
                <Checkbox
                  checked={formData.takingForCredit}
                  onCheckedChange={(checked) => {
                    handleInputChange("takingForCredit", checked as boolean);
                    // Clear linkage officer if unchecked
                    if (!checked) {
                      handleInputChange("linkageOfficer", "");
                    }
                  }}
                  className="border-gray-300"
                />
                <div className="flex items-center gap-2">
                  <Award className="w-4 h-4 text-blue-600" />
                  <span className="text-sm text-gray-700 font-medium">
                    I am taking this internship for academic credit
                  </span>
                </div>
              </div>
            </div>

            {/* Linkage Officer - Conditional */}
            {formData.takingForCredit && (
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Linkage Officer <span className="text-red-500">*</span>
                </label>
                <Input
                  type="text"
                  value={formData.linkageOfficer}
                  onChange={(e) =>
                    handleInputChange("linkageOfficer", e.target.value)
                  }
                  placeholder="Enter your linkage officer's name"
                  className={
                    (formData.linkageOfficer === ""
                      ? "border-gray-300"
                      : validFieldClassName) +
                    " w-full h-12 px-4 text-gray-900 placeholder-gray-500 border-2 rounded-lg focus:border-gray-900 focus:ring-0"
                  }
                  disabled={loading}
                  required={formData.takingForCredit}
                />
                <p className="text-xs text-gray-500 mt-2">
                  Please provide the name of your assigned linkage officer from
                  your college.
                </p>
              </div>
            )}
          </div>

          {/* Terms & Conditions Acceptance */}
          <div className="mb-8">
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
              <div className="flex items-start gap-3">
                <Checkbox
                  id="accept-terms"
                  checked={formData.acceptTerms}
                  onCheckedChange={(checked) =>
                    handleInputChange("acceptTerms", checked as boolean)
                  }
                  className="mt-1"
                />
                <label
                  htmlFor="accept-terms"
                  className="text-sm text-gray-700 leading-relaxed cursor-pointer flex-1"
                >
                  I have read and agree to the{" "}
                  <a
                    href="/TermsConditions.pdf"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 underline font-medium"
                  >
                    Terms & Conditions
                  </a>{" "}
                  and{" "}
                  <a
                    href="/PrivacyPolicy.pdf"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 underline font-medium"
                  >
                    Privacy Policy
                  </a>
                  .
                </label>
              </div>
            </div>
          </div>

          {/* Continue Button */}
          <div className="flex justify-center">
            <Button
              type="submit"
              disabled={loading || !formData.acceptTerms}
              className="w-80 h-12 bg-black hover:bg-gray-800 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Creating Profile..." : "Continue"}
            </Button>
          </div>
        </form>

        {/* Footer */}
        <div className="text-center text-sm text-gray-600 mt-8">
          <p>
            Need help? Contact us at{" "}
            <a
              href="mailto:hello@betterinternship.com"
              className="text-blue-600 hover:underline"
            >
              hello@betterinternship.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
