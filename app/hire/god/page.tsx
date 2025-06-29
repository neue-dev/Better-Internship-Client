"use client";

import { Autocomplete } from "@/components/ui/autocomplete";
import { Button } from "@/components/ui/button";
import { TabGroup, Tab } from "@/components/ui/tabs";
import { useEmployers, useUsers } from "@/hooks/use-employer-api";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuthContext } from "../authctx";
import { Badge } from "@/components/ui/badge";
import { cn, formatDate } from "@/lib/utils";
import { CheckCircle, XCircle } from "lucide-react";
import { get_full_name } from "@/lib/utils/user-utils";

export default function GodLandingPage() {
  const { login_as } = useAuthContext();
  const { employers, loading, verify } = useEmployers();
  const { users } = useUsers();
  const [search_name, set_search_name] = useState<string | null>();
  const [selected, set_selected] = useState("");
  const router = useRouter();

  // Redirect if no employers found (not god)
  useEffect(() => {
    if (!employers.length && !loading) router.push("/dashboard");
  }, [employers, loading]);

  /**
   * Handle auth by proxy
   *
   * @returns
   */
  const authorize_as = async (employer_id: string) => {
    await login_as(employer_id);
    router.push("/dashboard");
  };

  return (
    <div className="w-full h-full overflow-hidden">
      <TabGroup>
        <Tab name="verified employers">
          <div className="absolute w-full px-4 py-4 border-b">
            <Autocomplete
              setter={set_search_name}
              options={employers.map((e) => e.name ?? "")}
              placeholder="Search name..."
            ></Autocomplete>
          </div>
          <div className="absolute top-18 w-[100%] h-[85%] flex flex-col overflow-scroll p-4">
            {employers
              .filter((e) =>
                e.name?.toLowerCase().includes(search_name?.toLowerCase() ?? "")
              )
              .filter((e) => e.is_verified)
              .toSorted((a, b) => a.name?.localeCompare(b.name ?? "") ?? 0)
              .map((e) => (
                <div
                  key={e.id}
                  className="flex flex-row items-center p-2 space-x-2 hover:bg-gray-200 hover:cursor-pointer transition-all"
                >
                  <Button
                    variant="outline"
                    className="border-blue-500 text-blue-500 hover:text-white hover:bg-blue-600 border-opacity-50 rounded-sm text-xs h-8 p-2"
                    onClick={() => authorize_as(e.id ?? "")}
                  >
                    View
                  </Button>
                  <Button
                    variant="outline"
                    className="border-red-500 text-red-500 hover:text-white hover:bg-red-600 border-opacity-50 rounded-sm text-xs h-8 p-2"
                    disabled={loading && e.id === selected}
                    onClick={() => {
                      set_selected(e.id ?? "");
                      verify(e.id ?? "", false);
                    }}
                  >
                    {loading && e.id === selected
                      ? "Unverifying..."
                      : "Unverify"}
                  </Button>
                  <div className="text-gray-700 w-full">{e.name}</div>
                  <Badge
                    className={cn(
                      e.is_verified ? "bg-green-500" : "bg-gray-400"
                    )}
                  >
                    {e.is_verified ? (
                      <CheckCircle className="w-3 h-3 mr-1"></CheckCircle>
                    ) : (
                      <XCircle className="w-3 h-3 mr-1"></XCircle>
                    )}
                    {e.is_verified ? "verified" : "unverified"}
                  </Badge>
                </div>
              ))}
          </div>
        </Tab>

        <Tab name="unverified employers">
          <div className="absolute w-full px-4 py-4 border-b">
            <Autocomplete
              setter={set_search_name}
              options={employers.map((e) => e.name ?? "")}
              placeholder="Search name..."
            ></Autocomplete>
          </div>
          <div className="absolute top-18 w-[100%] h-[85%] flex flex-col overflow-scroll p-4">
            {employers
              .filter((e) =>
                e.name?.toLowerCase().includes(search_name?.toLowerCase() ?? "")
              )
              .filter((e) => !e.is_verified)
              .toSorted((a, b) => a.name?.localeCompare(b.name ?? "") ?? 0)
              .map((e) => (
                <div
                  key={e.id}
                  className="flex flex-row items-center p-2 space-x-2 hover:bg-gray-200 hover:cursor-pointer transition-all"
                >
                  <Button
                    variant="outline"
                    className="border-blue-500 text-blue-500 hover:text-white hover:bg-blue-600 border-opacity-50 rounded-sm text-xs h-8 p-2"
                    onClick={() => authorize_as(e.id ?? "")}
                  >
                    View
                  </Button>
                  <Button
                    variant="outline"
                    className="border-green-500 text-green-500 hover:text-white hover:bg-green-600 border-opacity-50 rounded-sm text-xs h-8 p-2"
                    disabled={loading && e.id === selected}
                    onClick={() => {
                      set_selected(e.id ?? "");
                      verify(e.id ?? "", true);
                    }}
                  >
                    {loading && e.id === selected ? "Verifying..." : "Verify"}
                  </Button>
                  <div className="text-gray-700 w-full">{e.name}</div>
                  <Badge
                    className={cn(
                      e.is_verified ? "bg-green-500" : "bg-gray-400"
                    )}
                  >
                    {e.is_verified ? (
                      <CheckCircle className="w-3 h-3 mr-1"></CheckCircle>
                    ) : (
                      <XCircle className="w-3 h-3 mr-1"></XCircle>
                    )}
                    {e.is_verified ? "verified" : "unverified"}
                  </Badge>
                </div>
              ))}
          </div>
        </Tab>

        <Tab name="students">
          <div className="absolute w-full px-4 py-4 border-b">
            <Autocomplete
              setter={set_search_name}
              options={users.map((u) => get_full_name(u) ?? "")}
              placeholder="Search name..."
            ></Autocomplete>
          </div>
          <div className="absolute top-18 w-[100%] h-[85%] flex flex-col overflow-scroll p-4">
            {users
              .filter((u) =>
                `${get_full_name(u)} ${u.email}`
                  ?.toLowerCase()
                  .includes(search_name?.toLowerCase() ?? "")
              )
              .toSorted(
                (a, b) =>
                  new Date(b.created_at ?? "").getTime() -
                  new Date(a.created_at ?? "").getTime()
              )
              .map((u) => (
                <div
                  key={u.id}
                  className="flex flex-row items-center p-2 space-x-2 hover:bg-gray-200 hover:cursor-pointer transition-all"
                >
                  <div className="text-gray-700 w-full">
                    {get_full_name(u)}{" "}
                    <Badge className="opacity-65 bg-gray-400 pointer-events-none">
                      {u.email}
                    </Badge>
                  </div>
                  <Badge
                    className={cn(
                      u.is_verified ? "bg-green-500" : "bg-gray-400"
                    )}
                  >
                    {u.is_verified ? (
                      <CheckCircle className="w-3 h-3 mr-1"></CheckCircle>
                    ) : (
                      <XCircle className="w-3 h-3 mr-1"></XCircle>
                    )}
                    {u.is_verified ? "verified" : "unverified"}
                  </Badge>

                  <Badge className="w-48 justify-center opacity-65">
                    {formatDate(u.created_at ?? "")}
                  </Badge>
                </div>
              ))}
          </div>
        </Tab>
      </TabGroup>
    </div>
  );
}
