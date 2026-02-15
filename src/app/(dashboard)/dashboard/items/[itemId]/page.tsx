"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { ItemForm } from "@/components/items/item-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Trash2, ClipboardCheck, ChevronLeft, ChevronRight, MapPin, Check, X } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import type { FieldGroupDefinition } from "@/lib/tag-types";

interface ItemData {
  id: string;
  name: string;
  data: Record<string, unknown>;
  photoUrls: string[];
  primaryPhotoUrl: string | null;
  ownerPhone: string | null;
  ownerEmail: string | null;
  ownerAddress: string | null;
  rewardOffered: boolean;
  rewardDetails: string | null;
  visibility: Record<string, boolean>;
  tagType: {
    id: string;
    slug: string;
    name: string;
    icon: string;
    color: string;
    fieldGroups: FieldGroupDefinition[];
    defaultVisibility: Record<string, boolean>;
  };
}

interface ChecklistResult {
  id: string;
  label: string;
  type: string;
  value: boolean | number | string;
}

interface ChecklistSubmission {
  id: string;
  results: ChecklistResult[];
  scannerName: string | null;
  scannerEmail: string | null;
  latitude: number | null;
  longitude: number | null;
  createdAt: string;
}

export default function EditItemPage() {
  const params = useParams();
  const router = useRouter();
  const [item, setItem] = useState<ItemData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Checklist submission history state
  const [submissions, setSubmissions] = useState<ChecklistSubmission[]>([]);
  const [submissionsPage, setSubmissionsPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalSubmissions, setTotalSubmissions] = useState(0);
  const [expandedSubmission, setExpandedSubmission] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/items/${params.itemId}`)
      .then((res) => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then(setItem)
      .catch(() => {
        toast.error("Item not found");
        router.push("/dashboard");
      })
      .finally(() => setIsLoading(false));
  }, [params.itemId, router]);

  const fetchSubmissions = useCallback(
    async (page: number) => {
      try {
        const res = await fetch(
          `/api/items/${params.itemId}/checklists?page=${page}&limit=10`
        );
        if (!res.ok) return;
        const data = await res.json();
        setSubmissions(data.submissions);
        setTotalPages(data.totalPages);
        setTotalSubmissions(data.total);
        setSubmissionsPage(data.page);
      } catch {
        // Silently fail
      }
    },
    [params.itemId]
  );

  // Fetch submissions when item is loaded and is a checklist type
  useEffect(() => {
    if (item?.tagType.slug === "checklist") {
      fetchSubmissions(1);
    }
  }, [item, fetchSubmissions]);

  async function handleDelete() {
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/items/${params.itemId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        toast.success("Item deleted");
        router.push("/dashboard");
        router.refresh();
      } else {
        toast.error("Failed to delete");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setIsDeleting(false);
      setDeleteOpen(false);
    }
  }

  function getCheckboxSummary(results: ChecklistResult[]): string {
    const checkboxes = results.filter((r) => r.type === "checkbox");
    if (checkboxes.length === 0) return "";
    const checked = checkboxes.filter((r) => r.value === true).length;
    return `${checked}/${checkboxes.length} checked`;
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!item) return null;

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Edit {item.name}</h1>
          <p className="text-muted-foreground text-sm">
            {item.tagType.name}
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setDeleteOpen(true)}
        >
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      </div>

      <ItemForm
        tagType={{
          slug: item.tagType.slug,
          name: item.tagType.name,
          icon: item.tagType.icon,
          color: item.tagType.color,
          fieldGroups: item.tagType.fieldGroups as unknown as FieldGroupDefinition[],
          defaultVisibility: item.tagType.defaultVisibility as Record<string, boolean>,
        }}
        itemId={item.id}
        initialData={{
          name: item.name,
          data: item.data as Record<string, unknown>,
          photoUrls: item.photoUrls,
          primaryPhotoUrl: item.primaryPhotoUrl || "",
          ownerPhone: item.ownerPhone || "",
          ownerEmail: item.ownerEmail || "",
          ownerAddress: item.ownerAddress || "",
          rewardOffered: item.rewardOffered,
          rewardDetails: item.rewardDetails || "",
          visibility: item.visibility as Record<string, boolean>,
        }}
      />

      {/* Checklist Submission History */}
      {item.tagType.slug === "checklist" && (
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClipboardCheck className="h-5 w-5" />
              Submission History
              {totalSubmissions > 0 && (
                <Badge variant="secondary">{totalSubmissions}</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {submissions.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">
                No submissions yet. Submissions will appear here when someone
                completes the checklist by scanning the tag.
              </p>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Conducted By</TableHead>
                      <TableHead>Summary</TableHead>
                      <TableHead>Location</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {submissions.map((sub) => {
                      const results = sub.results as ChecklistResult[];
                      const isExpanded = expandedSubmission === sub.id;

                      return (
                        <>
                          <TableRow
                            key={sub.id}
                            className="cursor-pointer hover:bg-muted/50"
                            onClick={() =>
                              setExpandedSubmission(
                                isExpanded ? null : sub.id
                              )
                            }
                          >
                            <TableCell className="text-sm">
                              {new Date(sub.createdAt).toLocaleDateString()}{" "}
                              <span className="text-muted-foreground">
                                {new Date(sub.createdAt).toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </span>
                            </TableCell>
                            <TableCell className="text-sm">
                              {sub.scannerName || "Unknown"}
                              {sub.scannerEmail && (
                                <span className="text-xs text-muted-foreground block">
                                  {sub.scannerEmail}
                                </span>
                              )}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">
                                {getCheckboxSummary(results)}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {sub.latitude && sub.longitude ? (
                                <a
                                  href={`https://www.google.com/maps?q=${sub.latitude},${sub.longitude}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-primary hover:underline text-sm flex items-center gap-1"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <MapPin className="h-3 w-3" />
                                  View
                                </a>
                              ) : (
                                <span className="text-xs text-muted-foreground">
                                  —
                                </span>
                              )}
                            </TableCell>
                          </TableRow>
                          {isExpanded && (
                            <TableRow key={`${sub.id}-detail`}>
                              <TableCell colSpan={4} className="bg-muted/30">
                                <div className="py-2 space-y-1">
                                  {results.map((r) => (
                                    <div
                                      key={r.id}
                                      className="flex items-center gap-2 text-sm"
                                    >
                                      {r.type === "checkbox" ? (
                                        r.value ? (
                                          <Check className="h-4 w-4 text-green-600" />
                                        ) : (
                                          <X className="h-4 w-4 text-red-500" />
                                        )
                                      ) : (
                                        <span className="w-4 h-4 flex items-center justify-center text-xs text-muted-foreground">
                                          #
                                        </span>
                                      )}
                                      <span className="font-medium">
                                        {r.label}:
                                      </span>
                                      <span className="text-muted-foreground">
                                        {r.type === "checkbox"
                                          ? r.value
                                            ? "Yes"
                                            : "No"
                                          : String(r.value || "—")}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </TableCell>
                            </TableRow>
                          )}
                        </>
                      );
                    })}
                  </TableBody>
                </Table>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-4">
                    <p className="text-xs text-muted-foreground">
                      Page {submissionsPage} of {totalPages} ({totalSubmissions}{" "}
                      total)
                    </p>
                    <div className="flex gap-1">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        disabled={submissionsPage <= 1}
                        onClick={() => fetchSubmissions(submissionsPage - 1)}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        disabled={submissionsPage >= totalPages}
                        onClick={() => fetchSubmissions(submissionsPage + 1)}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      )}

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete {item.name}?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            This will permanently delete this item and unlink all associated
            tags. This action cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
