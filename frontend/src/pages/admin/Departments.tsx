import { useEffect, useMemo, useState } from "react";
import { Btn, Input, Select } from "../../components/UI";
import {
  assignDepartmentHead,
  createAdminDepartment,
  getAdminDepartments,
  getAdminTeachers,
  type AdminDepartment,
  type AdminTeacher,
} from "../../services/admin";

interface AdminDepartmentsProps {
  mode: "departments" | "heads";
}

interface DepartmentGroup {
  id: string;
  name: string;
  headId: string;
  teachers: AdminTeacher[];
}

export default function AdminDepartments({ mode }: AdminDepartmentsProps) {
  const [teachers, setTeachers] = useState<AdminTeacher[]>([]);
  const [departments, setDepartments] = useState<AdminDepartment[]>([]);
  const [headsMap, setHeadsMap] = useState<Record<string, string>>({});
  const [newDepartmentName, setNewDepartmentName] = useState("");
  const [feedback, setFeedback] = useState("");

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const [teacherList, departmentList] = await Promise.all([
          getAdminTeachers(),
          getAdminDepartments(),
        ]);
        if (mounted) {
          setTeachers(teacherList);
          setDepartments(departmentList);
          const nextMap: Record<string, string> = {};
          for (const dep of departmentList) {
            nextMap[dep.id] = dep.head?.id ?? "";
          }
          setHeadsMap(nextMap);
        }
      } catch {
        if (mounted) {
          setFeedback("Erreur lors du chargement des départements.");
        }
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, []);

  const groups = useMemo<DepartmentGroup[]>(() => {
    const map = new Map<string, AdminTeacher[]>();
    for (const teacher of teachers) {
      const key = teacher.department?.trim() || "Sans département";
      map.set(key, [...(map.get(key) ?? []), teacher]);
    }
    return departments.map((department) => ({
      id: department.id,
      name: department.name,
      headId: headsMap[department.id] ?? department.head?.id ?? "",
      teachers: map.get(department.name) ?? [],
    }));
  }, [departments, headsMap, teachers]);

  const reload = async () => {
    const [teacherList, departmentList] = await Promise.all([
      getAdminTeachers(),
      getAdminDepartments(),
    ]);
    setTeachers(teacherList);
    setDepartments(departmentList);
    const nextMap: Record<string, string> = {};
    for (const dep of departmentList) {
      nextMap[dep.id] = dep.head?.id ?? "";
    }
    setHeadsMap(nextMap);
  };

  const createDepartment = async () => {
    setFeedback("");
    try {
      await createAdminDepartment({ name: newDepartmentName.trim() });
      setNewDepartmentName("");
      await reload();
      setFeedback("Département enregistré.");
    } catch {
      setFeedback("Erreur lors de la création du département.");
    }
  };

  const saveHeads = async () => {
    setFeedback("");
    try {
      for (const group of groups) {
        await assignDepartmentHead({
          department_id: group.id,
          teacher_id: headsMap[group.id] ?? "",
        });
      }
      await reload();
      setFeedback("Chefs de département mis à jour.");
    } catch {
      setFeedback("Erreur lors de la mise à jour des chefs.");
    }
  };

  if (mode === "heads") {
    return (
      <div style={{ padding: "36px 40px", maxWidth: 1000 }}>
        <h1 style={{ marginTop: 0, marginBottom: 8 }}>Chefs de département</h1>
        <p style={{ color: "var(--text2)", marginTop: 0, marginBottom: 18 }}>
          Affectation des chefs de département (Milestone 3: M3-10/M3-11).
        </p>

        {feedback ? (
          <div
            style={{
              marginBottom: 14,
              border: "1px solid var(--border)",
              borderRadius: "var(--r-md)",
              padding: "10px 12px",
              background: "var(--surface)",
            }}
          >
            {feedback}
          </div>
        ) : null}

        <div style={{ display: "grid", gap: 12 }}>
          {groups.map((group) => (
            <div
              key={group.id}
              style={{
                border: "1px solid var(--border)",
                borderRadius: "var(--r-lg)",
                padding: 14,
              }}
            >
              <div style={{ fontWeight: 700, marginBottom: 8 }}>
                {group.name}
              </div>
              <Select
                label="Chef de département"
                value={headsMap[group.id] ?? ""}
                onChange={(event) =>
                  setHeadsMap((prev) => ({
                    ...prev,
                    [group.id]: event.target.value,
                  }))
                }
              >
                <option value="">-- non défini --</option>
                {group.teachers.map((teacher) => (
                  <option key={teacher.id} value={teacher.id}>
                    {teacher.username}
                  </option>
                ))}
              </Select>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 14 }}>
          <Btn onClick={saveHeads}>Enregistrer sélection</Btn>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: "36px 40px", maxWidth: 1000 }}>
      <h1 style={{ marginTop: 0, marginBottom: 8 }}>Départements</h1>
      <p style={{ color: "var(--text2)", marginTop: 0, marginBottom: 18 }}>
        Création et visualisation des départements (Milestone 3).
      </p>

      <div
        style={{
          border: "1px solid var(--border)",
          borderRadius: "var(--r-lg)",
          padding: 14,
          marginBottom: 14,
          display: "grid",
          gap: 10,
          gridTemplateColumns: "1fr auto",
          alignItems: "end",
        }}
      >
        <Input
          label="Nouveau département"
          value={newDepartmentName}
          onChange={(event) => setNewDepartmentName(event.target.value)}
          placeholder="Ex: Informatique"
        />
        <Btn onClick={createDepartment}>Ajouter</Btn>
      </div>

      {feedback ? (
        <div
          style={{
            marginBottom: 14,
            border: "1px solid var(--border)",
            borderRadius: "var(--r-md)",
            padding: "10px 12px",
            background: "var(--surface)",
          }}
        >
          {feedback}
        </div>
      ) : null}

      <div style={{ display: "grid", gap: 12 }}>
        {groups.map((group) => (
          <div
            key={group.id}
            style={{
              border: "1px solid var(--border)",
              borderRadius: "var(--r-lg)",
              padding: 14,
            }}
          >
            <div style={{ fontWeight: 700, marginBottom: 6 }}>{group.name}</div>
            <div style={{ color: "var(--text2)", marginBottom: 8 }}>
              {group.teachers.length} enseignant(s)
            </div>
            <div style={{ display: "grid", gap: 6 }}>
              {group.teachers.map((teacher) => (
                <div
                  key={teacher.id}
                  style={{
                    border: "1px solid var(--border2)",
                    borderRadius: "var(--r-md)",
                    padding: "8px 10px",
                  }}
                >
                  <strong>{teacher.username}</strong>
                  <div style={{ color: "var(--text2)", fontSize: 13 }}>
                    {teacher.email}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
