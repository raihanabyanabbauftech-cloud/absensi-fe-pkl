import { apiFetch } from "@/lib/api";

export interface FaceReferenceRecord {
  id: string;
  employee_id: string;
  image_url: string;
  created_at: string;
  employee_name?: string;
  employee_email?: string;
  department_name?: string | null;
}

export function registerSelfFace(
  employeeId: string,
  image: string,
): Promise<{
  id: string;
  image_url: string;
  created_at: string;
  review_status: "pending";
}> {
  return apiFetch<{
    id: string;
    image_url: string;
    created_at: string;
    review_status: "pending";
  }>("/face-recognition/register", {
    method: "POST",
    body: JSON.stringify({ employeeId, image }),
  });
}

export function registerFaceForEmployee(
  employeeId: string,
  image: string,
): Promise<{ id: string; image_url: string; created_at: string }> {
  return apiFetch<{ id: string; image_url: string; created_at: string }>(
    "/face-recognition/register",
    {
      method: "POST",
      body: JSON.stringify({ employeeId, image }),
    },
  );
}

export function getPendingFaceReferences(): Promise<FaceReferenceRecord[]> {
  return apiFetch<FaceReferenceRecord[]>("/face-recognition/pending");
}

export function reviewFaceReference(
  id: string,
  decision: "approve" | "reject",
): Promise<{ employeeId: string; employeeName: string }> {
  return apiFetch<{ employeeId: string; employeeName: string }>(
    `/face-recognition/${id}/review`,
    {
      method: "POST",
      body: JSON.stringify({ decision }),
    },
  );
}