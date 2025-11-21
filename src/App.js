import React, { useState, useEffect } from "react";
import {
  Plus,
  Edit2,
  Trash2,
  FileText,
  Download,
  Save,
  X,
  Search,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { jsPDF } from "jspdf";

const App = () => {
  // --- State for auth ---
  const [teachers, setTeachers] = useState(
    JSON.parse(localStorage.getItem("teachers")) || []
  );
  const [currentTeacher, setCurrentTeacher] = useState(
    JSON.parse(localStorage.getItem("currentTeacher")) || null
  );
  const [loginForm, setLoginForm] = useState({ username: "", password: "" });
  const [signupForm, setSignupForm] = useState({ username: "", password: "", className: "" });

  // --- Subjects & Students ---
  const [subjects, setSubjects] = useState(
    JSON.parse(localStorage.getItem("subjects")) || {}
  );
  const [students, setStudents] = useState(
    JSON.parse(localStorage.getItem("students")) || {}
  );
  const [newSubject, setNewSubject] = useState("");
  const [newStudent, setNewStudent] = useState({ name: "", id: "" });
  const [marksInput, setMarksInput] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState(null);
  const [sortOrder, setSortOrder] = useState("asc"); // or desc

  // --- Save to localStorage ---
  useEffect(() => {
    localStorage.setItem("teachers", JSON.stringify(teachers));
  }, [teachers]);
  useEffect(() => {
    localStorage.setItem("currentTeacher", JSON.stringify(currentTeacher));
  }, [currentTeacher]);
  useEffect(() => {
    localStorage.setItem("subjects", JSON.stringify(subjects));
  }, [subjects]);
  useEffect(() => {
    localStorage.setItem("students", JSON.stringify(students));
  }, [students]);

  // --- Auth Handlers ---
  const handleSignup = () => {
    if (!signupForm.username || !signupForm.password || !signupForm.className) {
      alert("All fields required");
      return;
    }
    const exists = teachers.find(t => t.username === signupForm.username);
    if (exists) return alert("Username exists");
    const newTeacher = { ...signupForm };
    setTeachers([...teachers, newTeacher]);
    setCurrentTeacher(newTeacher);
    setSignupForm({ username: "", password: "", className: "" });
  };

  const handleLogin = () => {
    const teacher = teachers.find(
      t => t.username === loginForm.username && t.password === loginForm.password
    );
    if (!teacher) return alert("Invalid credentials");
    setCurrentTeacher(teacher);
    setLoginForm({ username: "", password: "" });
  };

  const handleLogout = () => setCurrentTeacher(null);

  // --- Subject Handlers ---
  const addSubject = () => {
    if (!newSubject) return;
    const cls = currentTeacher.className;
    const clsSubjects = subjects[cls] || [];
    if (clsSubjects.includes(newSubject)) return alert("Subject exists");
    setSubjects({ ...subjects, [cls]: [...clsSubjects, newSubject] });
    setNewSubject("");
  };

  const deleteSubject = (subject) => {
    const cls = currentTeacher.className;
    const clsSubjects = subjects[cls].filter(s => s !== subject);
    setSubjects({ ...subjects, [cls]: clsSubjects });
    const clsStudents = students[cls]?.map(s => {
      const newMarks = { ...s.marks };
      delete newMarks[subject];
      return { ...s, marks: newMarks };
    }) || [];
    setStudents({ ...students, [cls]: clsStudents });
  };

  // --- Student Handlers ---
  const addStudent = () => {
    const cls = currentTeacher.className;
    if (!newStudent.name || !newStudent.id) return alert("Student name & ID required");
    const clsStudents = students[cls] || [];
    if (clsStudents.find(s => s.id === newStudent.id)) return alert("ID exists");
    setStudents({
      ...students,
      [cls]: [...clsStudents, { ...newStudent, marks: {} }],
    });
    setNewStudent({ name: "", id: "" });
  };

  const deleteStudent = (id) => {
    const cls = currentTeacher.className;
    const clsStudents = students[cls].filter(s => s.id !== id);
    setStudents({ ...students, [cls]: clsStudents });
  };

  const updateMarks = (id, subject, value) => {
    if (isNaN(value) || value < 0 || value > 100) return; // validation
    const cls = currentTeacher.className;
    const clsStudents = students[cls].map(s => {
      if (s.id === id) {
        return { ...s, marks: { ...s.marks, [subject]: value } };
      }
      return s;
    });
    setStudents({ ...students, [cls]: clsStudents });
  };

  // --- Calculate Total, Average, Grade ---
  const calculateTotal = (s) => {
    return Object.values(s.marks).reduce((a, b) => a + (Number(b) || 0), 0);
  };

  const calculateAverage = (s) => {
    const clsSubjects = subjects[currentTeacher.className] || [];
    return clsSubjects.length ? (calculateTotal(s) / clsSubjects.length).toFixed(2) : 0;
  };

  const calculateGrade = (s) => {
    const avg = calculateAverage(s);
    if (avg >= 90) return "A";
    if (avg >= 80) return "B";
    if (avg >= 70) return "C";
    if (avg >= 60) return "D";
    return "F";
  };

  // --- Sorting & Filtering ---
  const sortedStudents = () => {
    const cls = currentTeacher.className;
    let clsStudents = [...(students[cls] || [])];
    if (searchTerm) {
      clsStudents = clsStudents.filter(
        s =>
          s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          s.id.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    if (sortField) {
      clsStudents.sort((a, b) => {
        const aVal = sortField === "total" ? calculateTotal(a) : calculateAverage(a);
        const bVal = sortField === "total" ? calculateTotal(b) : calculateAverage(b);
        return sortOrder === "asc" ? aVal - bVal : bVal - aVal;
      });
    }
    return clsStudents;
  };

  // --- Download CSV & PDF ---
  const downloadCSV = () => {
    const cls = currentTeacher.className;
    const clsStudents = students[cls] || [];
    const clsSubjects = subjects[cls] || [];
    let csv = "ID,Name," + clsSubjects.join(",") + ",Total,Average,Grade\n";
    clsStudents.forEach(s => {
      const total = calculateTotal(s);
      const avg = calculateAverage(s);
      const grade = calculateGrade(s);
      const row = [
        s.id,
        s.name,
        ...clsSubjects.map(sub => s.marks[sub] || ""),
        total,
        avg,
        grade
      ].join(",");
      csv += row + "\n";
    });
    const blob = new Blob([csv], { type: "text/csv" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${cls}_report.csv`;
    link.click();
  };

  const downloadPDF = () => {
    const cls = currentTeacher.className;
    const clsStudents = students[cls] || [];
    const clsSubjects = subjects[cls] || [];
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text(`Class ${cls} Report`, 14, 20);
    doc.setFontSize(12);
    let y = 30;
    const header = ["ID", "Name", ...clsSubjects, "Total", "Average", "Grade"];
    doc.text(header.join(" | "), 14, y);
    y += 10;
    clsStudents.forEach(s => {
      const row = [
        s.id,
        s.name,
        ...clsSubjects.map(sub => s.marks[sub] || ""),
        calculateTotal(s),
        calculateAverage(s),
        calculateGrade(s),
      ];
      doc.text(row.join(" | "), 14, y);
      y += 10;
      if (y > 280) { doc.addPage(); y = 20; }
    });
    doc.save(`${cls}_report.pdf`);
  };

  // --- Render ---
  if (!currentTeacher) {
    return (
      <div style={{ padding: 20 }}>
        <h2>Teacher Login</h2>
        <input
          placeholder="Username"
          value={loginForm.username}
          onChange={e => setLoginForm({ ...loginForm, username: e.target.value })}
        />
        <input
          placeholder="Password"
          type="password"
          value={loginForm.password}
          onChange={e => setLoginForm({ ...loginForm, password: e.target.value })}
        />
        <button onClick={handleLogin}>Login</button>

        <h2>Or Sign Up</h2>
        <input
          placeholder="Username"
          value={signupForm.username}
          onChange={e => setSignupForm({ ...signupForm, username: e.target.value })}
        />
        <input
          placeholder="Password"
          type="password"
          value={signupForm.password}
          onChange={e => setSignupForm({ ...signupForm, password: e.target.value })}
        />
        <input
          placeholder="Class (e.g., 1A)"
          value={signupForm.className}
          onChange={e => setSignupForm({ ...signupForm, className: e.target.value })}
        />
        <button onClick={handleSignup}>Sign Up</button>
      </div>
    );
  }

  const cls = currentTeacher.className;
  const clsSubjects = subjects[cls] || [];
  const clsStudents = sortedStudents();

  return (
    <div style={{ padding: 20 }}>
      <h1>Springforth Result Management</h1>
      <h3>Teacher: {currentTeacher.username} | Class: {cls}</h3>
      <button onClick={handleLogout}>Logout</button>

      <hr />

      {/* Subjects */}
      <h2>Subjects</h2>
      <input
        placeholder="New Subject"
        value={newSubject}
        onChange={e => setNewSubject(e.target.value)}
      />
      <button onClick={addSubject}><Plus size={16} /> Add Subject</button>
      <ul>
        {clsSubjects.map(sub => (
          <li key={sub}>
            {sub} <button onClick={() => deleteSubject(sub)}><Trash2 size={14} /></button>
          </li>
        ))}
      </ul>

      <hr />

      {/* Students */}
      <h2>Students</h2>
      <div>
        <input
          placeholder="Search by name or ID"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
        <Search size={16} />
      </div>
      <input
        placeholder="Student ID"
        value={newStudent.id}
        onChange={e => setNewStudent({ ...newStudent, id: e.target.value })}
      />
      <input
        placeholder="Student Name"
        value={newStudent.name}
        onChange={e => setNewStudent({ ...newStudent, name: e.target.value })}
      />
      <button onClick={addStudent}><Plus size={16} /> Add Student</button>

      <table border="1" cellPadding="5" style={{ marginTop: 10, width: "100%" }}>
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            {clsSubjects.map(sub => <th key={sub}>{sub}</th>)}
            <th>
              Total
              <button onClick={() => {
                setSortField("total");
                setSortOrder(sortOrder === "asc" ? "desc" : "asc");
              }}>{sortOrder === "asc" ? <ArrowUp size={12}/> : <ArrowDown size={12}/>}</button>
            </th>
            <th>
              Average
              <button onClick={() => {
                setSortField("average");
                setSortOrder(sortOrder === "asc" ? "desc" : "asc");
              }}>{sortOrder === "asc" ? <ArrowUp size={12}/> : <ArrowDown size={12}/>}</button>
            </th>
            <th>Grade</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {clsStudents.map(s => (
            <tr key={s.id}>
              <td>{s.id}</td>
              <td>{s.name}</td>
              {clsSubjects.map(sub => (
                <td key={sub}>
                  <input
                    type="number"
                    value={s.marks[sub] || ""}
                    onChange={e => updateMarks(s.id, sub, e.target.value)}
                    style={{ width: 50 }}
                  />
                </td>
              ))}
              <td>{calculateTotal(s)}</td>
              <td>{calculateAverage(s)}</td>
              <td>{calculateGrade(s)}</td>
              <td>
                <button onClick={() => deleteStudent(s.id)}><Trash2 size={14} /></button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <hr />

      {/* Reports */}
      <h2>Reports</h2>
      <button onClick={downloadCSV}><Download size={16} /> Download CSV</button>
      <button onClick={downloadPDF}><FileText size={16} /> Download PDF</button>
    </div>
  );
};

export default App;
