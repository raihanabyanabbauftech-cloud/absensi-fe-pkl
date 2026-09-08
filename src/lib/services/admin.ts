import { apiFetch } from "@/lib/api";

export interface Department {
  id: string;
  name: string;
  status?: string | null;
  employee_count?: number | string;
}

export interface Position {
  id: string;
  name: string;
  employee_count?: number | string;
  reimbursement_limit?: number | string;
}

export interface OfficeLocation {
  id: string;
  name: string;
  latitude: string | number;
  longitude: string | number;
  radius_meters: string | number;
  address?: string | null;
  type?: string;
  is_active?: boolean;
}

export interface Shift {
  id: string;
  name: string;
  start_time: string;
  end_time: string;
  tolerance_minutes: string | number;
}

export interface Role {
  id: string;
  name: string;
}

export interface AdminEmployee {
  id: string;
  name: string;
  email: string;
  status: string;
  role_name?: string;
  department_id?: string | null;
  position_id?: string | null;
  phone?: string | null;
  address?: string | null;
  birth_date?: string | null;
  gender?: "male" | "female" | null;
  marital_status?: "single" | "married" | "divorced" | null;
  join_date?: string | null;
  image?: string | null;
}

export function getDepartments(): Promise<Department[]> {
  return apiFetch<Department[]>("/departments");
}
export function createDepartment(body: { name: string; status?: string }): Promise<Department> {
  return apiFetch<Department>("/departments", { method: "POST", body: JSON.stringify(body) });
}
export function updateDepartment(id: string, body: { name: string; status?: string }): Promise<Department> {
  return apiFetch<Department>(`/departments/${id}`, { method: "PUT", body: JSON.stringify(body) });
}
export function deleteDepartment(id: string): Promise<{ id: string }> {
  return apiFetch<{ id: string }>(`/departments/${id}`, { method: "DELETE" });
}

export function getPositions(): Promise<Position[]> {
  return apiFetch<Position[]>("/positions");
}
export function createPosition(body: {
  name: string;
  reimbursement_limit?: number;
}): Promise<Position> {
  return apiFetch<Position>("/positions", { method: "POST", body: JSON.stringify(body) });
}
export function updatePosition(
  id: string,
  body: { name: string; reimbursement_limit?: number }
): Promise<Position> {
  return apiFetch<Position>(`/positions/${id}`, { method: "PUT", body: JSON.stringify(body) });
}
export function deletePosition(id: string): Promise<{ id: string }> {
  return apiFetch<{ id: string }>(`/positions/${id}`, { method: "DELETE" });
}

export function getOfficeLocations(): Promise<OfficeLocation[]> {
  return apiFetch<OfficeLocation[]>("/locations");
}
export interface OfficeLocationBody {
  name: string;
  latitude: string | number;
  longitude: string | number;
  radius_meters: string | number;
  address?: string;
  type?: string;
  is_active?: boolean;
}

export function createOfficeLocation(body: OfficeLocationBody): Promise<OfficeLocation> {
  return apiFetch<OfficeLocation>("/locations", { method: "POST", body: JSON.stringify(body) });
}
export function updateOfficeLocation(id: string, body: Partial<OfficeLocationBody>): Promise<OfficeLocation> {
  return apiFetch<OfficeLocation>(`/locations/${id}`, { method: "PUT", body: JSON.stringify(body) });
}
export function deleteOfficeLocation(id: string): Promise<{ id: string }> {
  return apiFetch<{ id: string }>(`/locations/${id}`, { method: "DELETE" });
}

export function getShifts(): Promise<Shift[]> {
  return apiFetch<Shift[]>("/shifts");
}
export function createShift(body: {
  name: string;
  start_time: string;
  end_time: string;
  tolerance_minutes: string | number;
}): Promise<Shift> {
  return apiFetch<Shift>("/shifts", { method: "POST", body: JSON.stringify(body) });
}
export function updateShift(
  id: string,
  body: {
    name: string;
    start_time: string;
    end_time: string;
    tolerance_minutes: string | number;
  }
): Promise<Shift> {
  return apiFetch<Shift>(`/shifts/${id}`, { method: "PUT", body: JSON.stringify(body) });
}
export function deleteShift(id: string): Promise<{ id: string }> {
  return apiFetch<{ id: string }>(`/shifts/${id}`, { method: "DELETE" });
}

export function getRoles(): Promise<Role[]> {
  return apiFetch<Role[]>("/roles");
}

export function getEmployees(): Promise<AdminEmployee[]> {
  return apiFetch<AdminEmployee[]>("/employees");
}
export function createEmployee(body: {
  name: string;
  email: string;
  password: string;
  role_id: string;
  department_id?: string | null;
  position_id?: string | null;
  supervisor_id?: string | null;
  join_date?: string | null;
  nik?: string | null;
  npwp?: string | null;
  phone?: string | null;
  no_telp?: string | null;
  address?: string | null;
  birth_date?: string | null;
  gender?: string | null;
  marital_status?: string | null;
}): Promise<AdminEmployee> {
  return apiFetch<AdminEmployee>("/employees", { method: "POST", body: JSON.stringify(body) });
}
export function updateEmployee(
  id: string,
  body: {
    name: string;
    department_id?: string | null;
    position_id?: string | null;
    phone?: string | null;
    address?: string | null;
    birth_date?: string | null;
    gender?: string | null;
    marital_status?: string | null;
  }
): Promise<AdminEmployee> {
  return apiFetch<AdminEmployee>(`/employees/${id}`, { method: "PUT", body: JSON.stringify(body) });
}
export function resignEmployee(id: string): Promise<{ id: string }> {
  return apiFetch<{ id: string }>(`/employees/${id}`, { method: "DELETE" });
}

export interface AttendanceReportRow {
  id: string;
  employee_id?: string | null;
  employee_name?: string | null;
  department_id?: string | null;
  clock_in_time?: string | null;
  clock_out_time?: string | null;
  clock_in_lat?: string | number | null;
  clock_in_lng?: string | number | null;
  clock_in_distance_m?: string | number | null;
  clock_out_distance_m?: string | number | null;
  face_match_status?: string | null;
  status?: string | null;
}

export interface AttendanceReportParams {
  department_id?: string;
  status?: string;
  start_date?: string;
  end_date?: string;
}

export function getAttendanceReport(
  params: AttendanceReportParams = {}
): Promise<AttendanceReportRow[]> {
  const query = new URLSearchParams();
  if (params.department_id) query.set("department_id", params.department_id);
  if (params.status) query.set("status", params.status);
  if (params.start_date) query.set("start_date", params.start_date);
  if (params.end_date) query.set("end_date", params.end_date);
  const qs = query.toString();
  return apiFetch<AttendanceReportRow[]>(`/attendance${qs ? `?${qs}` : ""}`);
}

export interface Holiday {
  id: string;
  date: string;
  name: string;
}
export function getHolidays(): Promise<Holiday[]> {
  return apiFetch<Holiday[]>("/holidays");
}
export function createHoliday(body: { date: string; name: string }): Promise<Holiday> {
  return apiFetch<Holiday>("/holidays", { method: "POST", body: JSON.stringify(body) });
}
export function deleteHoliday(id: string): Promise<{ id: string }> {
  return apiFetch<{ id: string }>(`/holidays/${id}`, { method: "DELETE" });
}

export type EventType = "meeting" | "training" | "event" | "lainnya";

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string | null;
  event_type?: string | null;
  event_date: string;
  start_time?: string | null;
  end_time?: string | null;
  location?: string | null;
  location_lat?: string | number | null;
  location_lng?: string | number | null;
}
export interface CalendarEventBody {
  title: string;
  description?: string;
  event_type?: string;
  event_date: string;
  start_time?: string;
  end_time?: string;
  location?: string;
  location_lat?: number;
  location_lng?: number;
}
export function getCalendarEvents(): Promise<CalendarEvent[]> {
  return apiFetch<CalendarEvent[]>("/calendar-events");
}
export function createCalendarEvent(body: CalendarEventBody): Promise<CalendarEvent> {
  return apiFetch<CalendarEvent>("/calendar-events", { method: "POST", body: JSON.stringify(body) });
}
export function updateCalendarEvent(
  id: string,
  body: Partial<CalendarEventBody>
): Promise<CalendarEvent> {
  return apiFetch<CalendarEvent>(`/calendar-events/${id}`, { method: "PUT", body: JSON.stringify(body) });
}
export function deleteCalendarEvent(id: string): Promise<{ id: string }> {
  return apiFetch<{ id: string }>(`/calendar-events/${id}`, { method: "DELETE" });
}

export interface WorkingDayPattern {
  id: string;
  name: string;
  active_days: number[];
}

export function getWorkingDayPatterns(): Promise<WorkingDayPattern[]> {
  return apiFetch<WorkingDayPattern[]>("/working-day-patterns");
}
export function createWorkingDayPattern(body: {
  name: string;
  active_days: number[];
}): Promise<WorkingDayPattern> {
  return apiFetch<WorkingDayPattern>("/working-day-patterns", {
    method: "POST",
    body: JSON.stringify(body),
  });
}
export function updateWorkingDayPattern(
  id: string,
  body: { name: string; active_days: number[] }
): Promise<WorkingDayPattern> {
  return apiFetch<WorkingDayPattern>(`/working-day-patterns/${id}`, {
    method: "PUT",
    body: JSON.stringify(body),
  });
}

export interface DepartmentPolicy {
  id: string;
  department_id: string;
  allow_overtime: boolean;
  allow_wfh: boolean;
  min_attendance_percentage: number;
  effective_date: string;
}

export function getDepartmentPolicy(departmentId: string): Promise<DepartmentPolicy | null> {
  return apiFetch<DepartmentPolicy | null>(`/departments/${departmentId}/policy`);
}
export function updateDepartmentPolicy(
  departmentId: string,
  body: {
    allow_overtime: boolean;
    allow_wfh: boolean;
    min_attendance_percentage: number;
    effective_date: string;
  }
): Promise<DepartmentPolicy> {
  return apiFetch<DepartmentPolicy>(`/departments/${departmentId}/policy`, {
    method: "PUT",
    body: JSON.stringify(body),
  });
}

export interface EmployeeSchedule {
  id: string;
  employee_id: string;
  shift_id: string;
  working_day_pattern_id?: string | null;
  location_id: string;
  start_date: string;
  end_date?: string | null;
  shift_name?: string | null;
  start_time?: string | null;
  end_time?: string | null;
  location_name?: string | null;
}

export function assignEmployeeSchedule(body: {
  employee_id: string;
  shift_id: string;
  working_day_pattern_id?: string | null;
  location_id: string;
  start_date: string;
}): Promise<EmployeeSchedule> {
  return apiFetch<EmployeeSchedule>("/schedules", {
    method: "POST",
    body: JSON.stringify(body),
  });
}
export function endEmployeeSchedule(id: string, endDate?: string): Promise<EmployeeSchedule> {
  return apiFetch<EmployeeSchedule>(`/schedules/${id}/end`, {
    method: "PUT",
    body: JSON.stringify({ end_date: endDate ?? null }),
  });
}

export function adjustLeaveQuota(
  employeeId: string,
  body: { amount: number; reason: string }
): Promise<{ id: string }> {
  return apiFetch<{ id: string }>(`/leave/quota/${employeeId}/adjust`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function triggerCronJob(job: "auto-alpha" | "monthly-quota" | "monthly-recap"): Promise<{
  message: string;
}> {
  return apiFetch<{ message: string }>(`/admin/cron/${job}/trigger`, {
    method: "POST",
    body: JSON.stringify({}),
  });
}

export function registerFaceReference(body: {
  employeeId: string;
  image: string;
}): Promise<{ message: string }> {
  return apiFetch<{ message: string }>("/face-recognition/register", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export interface Company {
  id: string;
  name: string;
  status: "active" | "inactive";
  pic_name?: string | null;
  pic_email?: string | null;
  onboarded_at?: string | null;
  created_at?: string;
  updated_at?: string;
}

export async function getCompanies(): Promise<Company[]> {
  return apiFetch<Company[]>("/companies");
}

export async function createCompany(
  name: string,
  picName: string | undefined,
  picEmail: string | undefined,
  officeLocation: {
    name: string;
    latitude: number;
    longitude: number;
    radius_meters: number;
  },
): Promise<Company> {
  return apiFetch<Company>("/companies", {
    method: "POST",
    body: JSON.stringify({
      name,
      pic_name: picName,
      pic_email: picEmail,
      office_location: officeLocation ?? null,
    }),
  });
}

export async function updateCompany(
  id: string,
  name: string,
  picName?: string,
  picEmail?: string,
): Promise<Company> {
  return apiFetch<Company>(`/companies/${id}`, {
    method: "PUT",
    body: JSON.stringify({ name, pic_name: picName, pic_email: picEmail }),
  });
}

export async function inviteCompanyAdmin(
  id: string,
  email: string,
): Promise<{ message: string; expiresAt?: string; emailSent?: boolean }> {
  return apiFetch(`/companies/${id}/invite`, {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export async function updateCompanyStatus(
  id: string,
  status: "active" | "inactive",
): Promise<Company> {
  return apiFetch<Company>(`/companies/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

export async function deleteCompany(id: string): Promise<{ message: string }> {
  return apiFetch<{ message: string }>(`/companies/${id}`, {
    method: "DELETE",
  });
}