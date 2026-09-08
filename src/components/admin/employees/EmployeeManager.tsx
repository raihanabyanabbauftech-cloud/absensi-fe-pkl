"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { ApiError } from "@/lib/api";
import {
  getEmployees,
  getRoles,
  getDepartments,
  getPositions,
  createEmployee,
  updateEmployee,
  resignEmployee,
  type AdminEmployee,
  type Role,
  type Department,
  type Position,
} from "@/lib/services/admin";
import EmployeeHeader from "./EmployeeHeader";
import EmployeeFilters from "./EmployeeFilters";
import EmployeesTable from "./EmployeesTable";
import EmployeeFormModal from "./EmployeeFormModal";
import EmployeeFaceScanModal from "./EmployeeFaceScanModal";
import EmployeeDetailModal from "./EmployeeDetailModal";
import ResignConfirmModal from "./ResignConfirmModal";

const DEFAULT_EMPLOYEE_PASSWORD = "Karyawan123";

type ModalState = { mode: "create" } | { mode: "edit"; row: AdminEmployee } | null;

export default function EmployeeManager() {
  const { t } = useLanguage();

  const [rows, setRows] = useState<AdminEmployee[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [modal, setModal] = useState<ModalState>(null);
  const [values, setValues] = useState<Record<string, string>>({});
  const [faceScanTarget, setFaceScanTarget] = useState<AdminEmployee | null>(null);
  const [detailRow, setDetailRow] = useState<AdminEmployee | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const [emps, r, d, p] = await Promise.all([
        getEmployees(),
        getRoles(),
        getDepartments(),
        getPositions(),
      ]);
      setRows(Array.isArray(emps) ? emps : []);
      setRoles(Array.isArray(r) ? r : []);
      setDepartments(Array.isArray(d) ? d : []);
      setPositions(Array.isArray(p) ? p : []);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : t("adminMaster.failed"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    load();
  }, [load]);

  const supervisors = useMemo(
    () =>
      rows.filter(
        (e) =>
          e.status === "active" &&
          (e.role_name === "supervisor" || e.role_name === "admin")
      ),
    [rows]
  );

  const filteredRows = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    return rows.filter((e) => {
      const matchSearch =
        !keyword || e.name.toLowerCase().includes(keyword);
      const matchDept =
        !departmentFilter || e.department_id === departmentFilter;
      const matchStatus =
        !statusFilter || e.status === statusFilter;
      return matchSearch && matchDept && matchStatus;
    });
  }, [rows, search, departmentFilter, statusFilter]);

  const openCreate = () => {
    setValues({ contract_status: "kontrak", password: DEFAULT_EMPLOYEE_PASSWORD });
    setError(null);
    setModal({ mode: "create" });
  };

  const openEdit = (row: AdminEmployee) => {
    setValues({
      name: row.name,
      department_id: row.department_id ?? "",
      position_id: row.position_id ?? "",
      phone: row.phone ?? "",
      address: row.address ?? "",
      birth_date: row.birth_date ?? "",
      gender: row.gender ?? "",
      marital_status: row.marital_status ?? "",
    });
    setError(null);
    setModal({ mode: "edit", row });
  };

  const closeModal = () => {
    setModal(null);
    setError(null);
  };

  const closeFaceScan = async () => {
    setFaceScanTarget(null);
    await load();
  };

  const submit = async () => {
    if (!modal) return;
    setError(null);

    if (modal.mode === "create") {
      if (!values.name?.trim() || !values.email?.trim()) {
        setError(t("adminMaster.required"));
        return;
      }
      const employeeRole =
        roles.find((r) => r.name.toLowerCase() === "employee")?.id ??
        roles[0]?.id;
      if (!employeeRole) {
        setError(t("adminMaster.required"));
        return;
      }
      setSaving(true);
      try {
        const created = await createEmployee({
          name: values.name,
          email: values.email,
          password: values.password || DEFAULT_EMPLOYEE_PASSWORD,
          role_id: employeeRole,
          department_id: values.department_id || null,
          position_id: values.position_id || null,
          supervisor_id: values.supervisor_id || null,
          join_date: values.start_contract || null,
          nik: values.nik || null,
          npwp: values.npwp || null,
          phone: values.whatsapp || null,
          no_telp: values.no_telp || null,
          address: values.address || null,
          birth_date: values.birth_date || null,
          gender: values.gender || null,
          marital_status: values.marital_status || null,
        });
        setModal(null);
        setValues({});
        setFaceScanTarget(created);
      } catch (err) {
        setError(err instanceof ApiError ? err.message : t("adminMaster.failed"));
      } finally {
        setSaving(false);
      }
    } else {
      if (!values.name?.trim()) {
        setError(t("adminMaster.required"));
        return;
      }
      setSaving(true);
      try {
        await updateEmployee(modal.row.id, {
          name: values.name,
          department_id: values.department_id || undefined,
          position_id: values.position_id || undefined,
          phone: values.phone || undefined,
          address: values.address || undefined,
          birth_date: values.birth_date || undefined,
          gender: values.gender || undefined,
          marital_status: values.marital_status || undefined,
        });
        closeModal();
        await load();
      } catch (err) {
        setError(err instanceof ApiError ? err.message : t("adminMaster.failed"));
      } finally {
        setSaving(false);
      }
    }
  };

  const confirmResign = async () => {
    if (!confirmId) return;
    setSaving(true);
    setError(null);
    try {
      await resignEmployee(confirmId);
      setConfirmId(null);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("adminMaster.deleteFailed"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
        <EmployeeHeader onAdd={openCreate} />
        <EmployeeFilters
          search={search}
          onSearch={setSearch}
          departmentFilter={departmentFilter}
          onDepartmentFilter={setDepartmentFilter}
          statusFilter={statusFilter}
          onStatusFilter={setStatusFilter}
          departments={departments}
        />

        {error && (
          <div className="px-6 py-3 bg-red-50 dark:bg-red-500/10 text-xs text-red-600 dark:text-red-400">
            {error}
          </div>
        )}

        <EmployeesTable
          rows={filteredRows}
          departments={departments}
          positions={positions}
          loading={loading}
          loadError={loadError}
          onDetail={setDetailRow}
          onEdit={openEdit}
          onDelete={(row) => {
            setConfirmId(row.id);
            setError(null);
          }}
        />
      </div>

      {modal && (
        <EmployeeFormModal
          mode={modal.mode}
          values={values}
          onChange={(patch) => setValues((p) => ({ ...p, ...patch }))}
          departments={departments}
          positions={positions}
          supervisors={supervisors}
          error={error}
          saving={saving}
          onClose={closeModal}
          onSubmit={submit}
        />
      )}

      {faceScanTarget && (
        <EmployeeFaceScanModal
          employeeId={faceScanTarget.id}
          employeeName={faceScanTarget.name}
          onClose={() => closeFaceScan()}
          onComplete={() => closeFaceScan()}
        />
      )}

      {detailRow && (
        <EmployeeDetailModal
          employee={detailRow}
          departments={departments}
          positions={positions}
          onClose={() => setDetailRow(null)}
        />
      )}

      {confirmId && (
        <ResignConfirmModal
          saving={saving}
          onCancel={() => setConfirmId(null)}
          onConfirm={confirmResign}
        />
      )}
    </div>
  );
}
