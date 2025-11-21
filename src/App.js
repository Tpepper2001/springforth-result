import React, { useState, useEffect } from "react";
import { Save, FileText, Download, X } from "lucide-react";
import jsPDF from "jspdf";

const App = () => {
  // --------------------
  // LOCAL STORAGE KEYS
  // --------------------
  const TEACHERS_KEY = "springforth_teachers";
  const SUBJECTS_KEY = "springforth_subjects";
  const STUDENTS_KEY = "springforth_students";

  // --------------------
  // STATE
  // --------------------
  const [teachers, setTeachers] = useState([]);
  const [currentTeacher, setCurrentTeacher] = useState(null);
  const [students, setStudents] = useState([]);
  const [subjects, setSubjects] = useState({});
  const [loginData, setLoginData] = useState({ email: "", password: "" });
  const [signupData, setSignupData] = useState({ name: "", email: "", password: "", className: "" });
  const [newStudent, setNewStudent] = useState({ name: "", scores: {} });
  const [newSubject, setNewSubject] = useState("");

  // --------------------
  // LOAD FROM LOCAL STORAGE
  // --------------------
  useEffect(() => {
    const storedTeachers = JSON.parse(localStorage.getItem(TEACHERS_KEY)) || [];
    const storedSubjects = JSON.parse(localStorage.getItem(SUBJECTS_KEY)) || {};
    const storedStudents = JSON.parse(localStorage.getItem(STUDENTS_KEY)) || [];
    setTeachers(storedTeachers);
    setSubjects(storedSubjects);
    setStudents(storedStudents);
  }, []);

  useEffect(() => {
    localStorage.setItem(TEACHERS_KEY, JSON.stringify(teachers));
  }, [teachers]);

  useEffect(() => {
    localStorage.setItem(SUBJECTS_KEY, JSON.stringify(subjects));
  }, [subjects]);

  useEffect(() => {
    localStorage.setItem(STUDENTS_KEY, JSON.stringify(students));
  }, [students]);

  // --------------------
  // AUTH HANDLERS
  // --------------------
  const handleLogin = () => {
    const teacher = teachers.find(
      (t) => t.email === loginData.email && t.password === loginData.password
    );
    if (teacher) {
      setCurrentTeacher(teacher);
    } else {
      alert("Invalid credentials");
    }
  };

  const handleSignup = () => {
    if (!signupData.name || !signupData.email || !signupData.password || !signupData.className) {
      alert("All fields required");
      return;
    }
    if (teachers.find((t) => t.email === signupData.email)) {
      alert("Email already exists");
      return;
    }
    const newT = { ...signupData };
    setTeachers([...teachers, newT]);
    setCurrentTeacher(newT);
  };

  const handleLogout = () => {
    setCurrentTeacher(null);
  };

  // --------------------
  // SUBJECT HANDLERS
  // --------------------
  const addSubject = () => {
    if (!newSubject) return;
    const cls = currentTeacher.className;
    const clsSubjects = subjects[cls] || [];
    if (clsSubjects.includes(newSubject)) {
      alert("Subject already exists");
      return;
    }
    const updatedSubjects = { ...subjects, [cls]: [...clsSubjects, newSubject] };
    setSubjects(updatedSubjects);
    setNewSubject("");
  };

  const removeSubject = (sub) => {
    const cls = currentTeacher.className;
    const updatedSubjects = { ...subjects, [cls]: subjects[cls].filter((s) => s !== sub) };
    setSubjects(updatedSubjects);
    // Remove score from students
    setStudents(
      students.map((st) => ({
        ...st,
        scores: Object.fromEntries(
          Object.entries(st.scores).filter(([k]) => k !== sub)
        ),
      }))
    );
  };

  // --------------------
  // STUDENT HANDLERS
  // --------------------
  const addStudent = () => {
    if (!newStudent.name) return;
    const cls = currentTeacher.className;
    const studentToAdd = { ...newStudent, className: cls };
    setStudents([...students, studentToAdd]);
    setNewStudent({ name: "", scores: {} });
  };

  const removeStudent = (name) => {
    setStudents(students.filter((s) => s.name !== name));
  };

  const handleScoreChange = (studentName, subject, value) => {
    setStudents(
      students.map((s) =>
        s.name === studentName
          ? { ...s, scores: { ...s.scores, [subject]: Number(value) } }
          : s
      )
    );
  };

  // --------------------
  // REPORT HANDLERS
  // --------------------
  const downloadPDF = () => {
    const doc = new jsPDF();
    const cls = currentTeacher.className;
    doc.setFontSize(16);
    doc.text(`Result Sheet - Class ${cls}`, 10, 10);
    let y = 20;
    const clsStudents = students.filter((s) => s.className === cls);
    const clsSubjects = subjects[cls] || [];
    clsStudents.forEach((st) => {
      doc.text(`${st.name}: ${clsSubjects.map((sub) => `${sub}=${st.scores[sub] || 0}`).join(", ")}`, 10, y);
      y += 10;
    });
    doc.save(`Class_${cls}_Results.pdf`);
  };

  const downloadCSV = () => {
    const cls = currentTeacher.className;
    const clsStudents = students.filter((s) => s.className === cls);
    const clsSubjects = subjects[cls] || [];
    let csv = ["Name," + clsSubjects.join(",")].join("\n") + "\n";
    clsStudents.forEach((st) => {
      csv += [st.name, ...clsSubjects.map((sub) => st.scores[sub] || 0)].join(",") + "\n";
    });
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `Class_${cls}_Results.csv`;
    a.click();
  };

  // --------------------
  // RENDER
  // --------------------
  if (!currentTeacher) {
    return (
      <div style={{ padding: 20 }}>
        <h2>Login</h2>
        <input
          placeholder="Email"
          value={loginData.email}
          onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
        />
        <input
          type="password"
          placeholder="Password"
          value={loginData.password}
          onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
        />
        <button onClick={handleLogin}>Login</button>

        <h2>Sign Up</h2>
        <input
          placeholder="Name"
          value={signupData.name}
          onChange={(e) => setSignupData({ ...signupData, name: e.target.value })}
        />
        <input
          placeholder="Email"
          value={signupData.email}
          onChange={(e) => setSignupData({ ...signupData, email: e.target.value })}
        />
        <input
          type="password"
          placeholder="Password"
          value={signupData.password}
          onChange={(e) => setSignupData({ ...signupData, password: e.target.value })}
        />
        <input
          placeholder="Class Name"
          value={signupData.className}
          onChange={(e) => setSignupData({ ...signupData, className: e.target.value })}
        />
        <button onClick={handleSignup}>Sign Up</button>
      </div>
    );
  }

  const cls = currentTeacher.className;
  const clsSubjects = subjects[cls] || [];
  const clsStudents = students.filter((s) => s.className === cls);

  return (
    <div style={{ padding: 20 }}>
      <h2>Springforth Result Management</h2>
      <p>Welcome, {currentTeacher.name} (Class {cls})</p>
      <button onClick={handleLogout}>Logout</button>

      <h3>Subjects</h3>
      <input
        placeholder="New Subject"
        value={newSubject}
        onChange={(e) => setNewSubject(e.target.value)}
      />
      <button onClick={addSubject}>Add Subject</button>
      <ul>
        {clsSubjects.map((sub) => (
          <li key={sub}>
            {sub} <X size={16} onClick={() => removeSubject(sub)} style={{ cursor: "pointer" }} />
          </li>
        ))}
      </ul>

      <h3>Students</h3>
      <input
        placeholder="Student Name"
        value={newStudent.name}
        onChange={(e) => setNewStudent({ ...newStudent, name: e.target.value })}
      />
      <button onClick={addStudent}>Add Student</button>

      <table border="1" cellPadding="5" style={{ marginTop: 10 }}>
        <thead>
          <tr>
            <th>Name</th>
            {clsSubjects.map((sub) => (
              <th key={sub}>{sub}</th>
            ))}
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {clsStudents.map((st) => (
            <tr key={st.name}>
              <td>{st.name}</td>
              {clsSubjects.map((sub) => (
                <td key={sub}>
                  <input
                    type="number"
                    value={st.scores[sub] || ""}
                    onChange={(e) => handleScoreChange(st.name, sub, e.target.value)}
                  />
                </td>
              ))}
              <td>
                <button onClick={() => removeStudent(st.name)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <h3>Reports</h3>
      <button onClick={downloadPDF}>Download PDF</button>
      <button onClick={downloadCSV}>Download CSV</button>
    </div>
  );
};

export default App;
