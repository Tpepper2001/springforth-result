import React, { useState, useEffect } from "react";
import {
  Plus,
  Edit2,
  Trash2,
  FileText,
  Download,
  LogOut,
  Search,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { jsPDF } from "jspdf";

const App = () => {
  // === Authentication ===
  const [teachers, setTeachers] = useState(
    JSON.parse(localStorage.getItem("teachers") || "[]")
  );
  const [currentTeacher, setCurrentTeacher] = useState(
    JSON.parse(localStorage.getItem("currentTeacher") || "null")
  );

  const [loginForm, setLoginForm] = useState({ username: "", password: "" });
  const [signupForm, setSignupForm] = useState({ username: "", password: "", className: "" });

  // === Data ===
  const [subjects, setSubjects] = useState(
    JSON.parse(localStorage.getItem("subjects") || "{}")
  );
  const [students, setStudents] = useState(
    JSON.parse(localStorage.getItem("students") || "{}")
  );

  const [newSubject, setNewSubject] = useState("");
  const [newStudent, setNewStudent] = useState({ name: "", id: "" });
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState(null);
  const [sortOrder, setSortOrder] = useState("asc");

  // === Persist to localStorage ===
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

  // === Auth Functions ===
  const handleSignup = () => {
    if (!signupForm.username || !signupForm.password || !signupForm.className) {
      alert("All fields are required!");
      return;
    }
    if (teachers.find((t) => t.username === signupForm.username)) {
      alert("Username already exists!");
      return;
    }
    const newTeacher = { ...signupForm };
    setTeachers([...teachers, newTeacher]);
    setCurrentTeacher(newTeacher);
    setSignupForm({ username: "", password: "", className: "" });
  };

  const handleLogin = () => {
    const teacher = teachers.find(
      (t) => t.username === loginForm.username && t.password === loginForm.password
    );
    if (!teacher) {
      alert("Invalid username or password");
      return;
    }
    setCurrentTeacher(teacher);
    setLoginForm({ username: "", password: "" });
  };

  const handleLogout = () => setCurrentTeacher(null);

  // === Subject Functions ===
  const addSubject = () => {
    if (!newSubject.trim()) return;
    const cls = currentTeacher.className;
    const currentSubs = subjects[cls] || [];
    if (currentSubs.includes(newSubject)) {
      alert("Subject already exists");
      return;
    }
    setSubjects({ ...subjects, [cls]: [...currentSubs, newSubject] });
    setNewSubject("");
  };

  const deleteSubject = (sub) => {
    const cls = currentTeacher.className;
    const newSubs = subjects[cls].filter((s) => s !== sub);
    setSubjects({ ...subjects, [cls]: newSubs });

    // Remove marks for this subject from all students
    const updatedStudents = (students[cls] || []).map((s) => {
      const { [sub]: _, ...restMarks } = s.marks;
      return { ...s, marks: restMarks };
    });
    setStudents({ ...students, [cls]: updatedStudents });
  };

  };

  // === Student Functions ===
  const addStudent = () => {
    if (!newStudent.name.trim() || !newStudent.id.trim()) {
      alert("Both Name and ID are required");
      return;
    }
    const cls = currentTeacher.className;
    if ((students[cls] || []).find((s) => s.id === newStudent.id)) {
      alert("Student ID already exists");
      return;
    }
    setStudents({
      ...students,
      [cls]: [...(students[cls] || []), { ...newStudent, marks: {} }],
    });
    setNewStudent({ name: "", id: "" });
  };

  const deleteStudent = (id) => {
    const cls = currentTeacher.className;
    setStudents({
      ...students,
      [cls]: students[cls].filter((s) => s.id !== id),
    });
  };

  const updateMarks = (studentId, subject, value) => {
    if (value === "") {
      value = "";
    } else {
      value = Number(value);
      if (isNaN(value) || value < 0 || value > 100) return;
    }

    const cls = currentTeacher.className;
    const updatedStudents = students[cls].map((s) =>
      s.id === studentId ? { ...s, marks: { ...s.marks, [subject]: value } } : s
    );
    setStudents({ ...students, [cls]: updatedStudents });
  };

  // === Calculations ===
  const calculateTotal = (student) => {
    return Object.values(student.marks)
      .filter((v) => v !== "")
      .reduce((a, b) => a + Number(b), 0);
  };

  const calculateAverage = (student) => {
    const vals = Object.values(student.marks).filter((v) => v !== "");
    return vals.length ? (calculateTotal(student) / vals.length).toFixed(2) : "0.00";
  };

  const calculateGrade = (student) => {
    const avg = parseFloat(calculateAverage(student));
    if (avg >= 90) return "A";
    if (avg >= 80) return "B";
    if (avg >= 70) return "C";
    if (avg >= 60) return "D";
    return "F";
  };

  // === Sorting & Searching ===
  const getSortedStudents = () => {
    const cls = currentTeacher.className;
    let list = [...(students[cls] || [])];

    // Search
    if (searchTerm) {
      list = list.filter(
        (s) =>
          s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          s.id.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Sort
    if (sortField) {
      list.sort((a, b) => {
        let aVal = sortField === "total" ? calculateTotal(a) : parseFloat(calculateAverage(a));
        let bVal = sortField === "total" ? calculateTotal(b) : parseFloat(calculateAverage(b));
        return sortOrder === "asc" ? aVal - bVal : bVal - aVal;
      });
    }

    return list;
  };

  // === Export Functions (NO papaparse!) ===
  const downloadCSV = () => {
    const cls = currentTeacher.className;
    const subs = subjects[cls] || [];
    const studs = students[cls] || [];

    let csv = `ID,Name,${subs.join(",")},Total,Average,Grade\n`;

    studs.forEach((s) => {
      const row = [
        s.id,
        `"${s.name}"`,
        ...subs.map((sub) => s.marks[sub] ?? ""),
        calculateTotal(s),
        calculateAverage(s),
        calculateGrade(s),
      ];
      csv += row.join(",") + "\n";
    });

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${cls}_results.csv`;
    link.click();
  };

  const downloadPDF = () => {
    const cls = currentTeacher.className;
    const doc = new jsPDF("l", "mm", "a4"); // landscape
    doc.setFontSize(18);
    doc.text(`Class ${cls} - Academic Report`, 14, 20);

    const headers = ["ID", "Name", ...(subjects[cls] || []), "Total", "Avg", "Grade"];
    const data = (students[cls] || []).map((s) => [
      s.id,
      s.name,
      ... (subjects[cls] || []).map((sub) => s.marks[sub] ?? ""),
      calculateTotal(s),
      calculateAverage(s),
      calculateGrade(s),
    ]);

    doc.autoTable({
      head: [headers],
      body: data,
      startY: 30,
      theme: "grid",
      styles: { fontSize: 10 },
      headStyles: { fillColor: [41, 128, 185] },
    });

    doc.save(`${cls}_report.pdf`);
  };

  // === Login / Signup Screen ===
  if (!currentTeacher) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow-2xl p-10 w-full max-w-md">
          <h1 className="text-3xl font-bold text-center mb-8 text-indigo-700">
            Springforth Result System
          </h1>

          {/* Login */}
          <div className="mb-10">
            <h2 className="text-2xl font-semibold mb-4">Login</h2>
            <input
              className="w-full p-3 border rounded-lg mb-3"
              placeholder="Username"
              value={loginForm.username}
              onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })}
            />
            <input
              type="password"
              className="w-full p-3 border rounded-lg mb-4"
              placeholder="Password"
              value={loginForm.password}
              onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
            />
            <button
              onClick={handleLogin}
              className="w-full bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 transition"
            >
              Login
            </button>
          </div>

          <div className="text-center text-gray-500 my-6">OR</div>

          {/* Signup */}
          <div>
            <h2 className="text-2xl font-semibold mb-4">Create Account</h2>
            <input
              className="w-full p-3 border rounded-lg mb-3"
              placeholder="Username"
              value={signupForm.username}
              onChange={(e) => setSignupForm({ ...signupForm, username: e.target.value })}
            />
            <input
              type="password"
              className="w-full p-3 border rounded-lg mb-3"
              placeholder="Password"
              value={signupForm.password}
              onChange={(e) => setSignupForm({ ...signupForm, password: e.target.value })}
            />
            <input
              className="w-full p-3 border rounded-lg mb-4"
              placeholder="Class (e.g. 10A)"
              value={signupForm.className}
              onChange={(e) => setSignupForm({ ...signupForm, className: e.target.value })}
            />
            <button
              onClick={handleSignup}
              className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition"
            >
              Sign Up
            </button>
          </div>
        </div>
      </div>
    );
  }

  // === Main Dashboard ===
  const cls = currentTeacher.className;
  const clsSubjects = subjects[cls] || [];
  const displayedStudents = getSortedStudents();

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8 mb-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-4xl font-bold text-indigo-700">Springforth Result Management</h1>
              <p className="text-lg text-gray-600 mt-2">
                Teacher: <strong>{currentTeacher.username}</strong> | Class: <strong>{cls}</strong>
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 bg-red-500 text-white px-5 py-3 rounded-lg hover:bg-red-600 transition"
            >
              <LogOut size={20} /> Logout
            </button>
          </div>

          {/* Subjects Section */}
          <div className="bg-blue-50 p-6 rounded-lg mb-8">
            <h2 className="text-2 font-bold text-xl mb-4">Subjects</h2>
            <div className="flex gap-3 mb-4">
              <input
                className="flex-1 p-3 border rounded-lg"
                placeholder="Add new subject..."
                value={newSubject}
                onChange={(e) => setNewSubject(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && addSubject()}
              />
              <button
                onClick={addSubject}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 flex items-center gap-2"
              >
                <Plus size={20} /> Add
              </button>
            </div>
            <div className="flex flex-wrap gap-3">
              {clsSubjects.map((sub) => (
                <span
                  key={sub}
                  className="bg-blue-100 px-4 py-2 rounded-full flex items-center gap-2"
                >
                  {sub}
                  <button
                    onClick={() => deleteSubject(sub)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <Trash2 size={16} />
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Students Section */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-4">Students & Marks</h2>

            {/* Add Student + Search */}
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <input
                className="flex-1 p-3 border rounded-lg"
                placeholder="Student ID"
                value={newStudent.id}
                onChange={(e) => setNewStudent({ ...newStudent, id: e.target.value })}
              />
              <input
                className="flex-1 p-3 border rounded-lg"
                placeholder="Student Name"
                value={newStudent.name}
                onChange={(e) => setNewStudent({ ...newStudent, name: e.target.value })}
                onKeyPress={(e) => e.key === "Enter" && addStudent()}
              />
              <button
                onClick={addStudent}
                className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 flex items-center gap-2"
              >
                <Plus size={20} /> Add Student
              </button>
              <div className="relative">
                <input
                  className="pl-10 pr-4 py-3 border rounded-lg w-full md:w-64"
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <Search className="absolute left-3 top-3.5 text-gray-400" size={20} />
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto shadow-md rounded-lg">
              <table className="w-full border-collapse">
                <thead className="bg-indigo-600 text-white">
                  <tr>
                    <th className="p-4 text-left">ID</th>
                    <th className="p-4 text-left">Name</th>
                    {clsSubjects.map((sub) => (
                      <th key={sub} className="p-4 text-center">{sub}</th>
                    ))}
                    <th className="p-4 cursor-pointer" onClick={() => {
                      setSortField("total");
                      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
                    }}>
                      Total {sortField === "total" && (sortOrder === "asc" ? <ArrowUp size={16} className="inline" /> : <ArrowDown size={16} className="inline" />)}
                    </th>
                    <th className="p-4 cursor-pointer" onClick={() => {
                      setSortField("average");
                      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
                    }}>
                      Average {sortField === "average" && (sortOrder === "asc" ? <ArrowUp size={16} className="inline" /> : <ArrowDown size={16} className="inline" />)}
                    </th>
                    <th className="p-4">Grade</th>
                    <th className="p-4">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {displayedStudents.map((student) => (
                    <tr key={student.id} className="border-b hover:bg-gray-50">
                      <td className="p-4 font-medium">{student.id}</td>
                      <td className="p-4">{student.name}</td>
                      {clsSubjects.map((sub) => (
                        <td key={sub} className="p-4 text-center">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            className="w-16 text-center border rounded px-2 py-1"
                            value={student.marks[sub] || ""}
                            onChange={(e) => updateMarks(student.id, sub, e.target.value)}
                          />
                        </td>
                      ))}
                      <td className="p-4 text-center font-semibold">{calculateTotal(student)}</td>
                      <td className="p-4 text-center font-semibold">{calculateAverage(student)}</td>
                      <td className="p-4 text-center text-lg font-bold">
                        <span className={`px-3 py-1 rounded-full text-white ${
                          calculateGrade(student) === "A" ? "bg-green-500" :
                          calculateGrade(student) === "B" ? "bg-blue-500" :
                          calculateGrade(student) === "C" ? "bg-yellow-500" :
                          calculateGrade(student) === "D" ? "bg-orange-500" :
                          "bg-red-500"
                        }`}>
                          {calculateGrade(student)}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <button
                          onClick={() => deleteStudent(student.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Export Buttons */}
          <div className="flex gap-4 justify-center mt-10">
            <button
              onClick={downloadCSV}
              className="flex items-center gap-3 bg-teal-600 text-white px-8 py-4 rounded-lg hover:bg-teal-700 text-lg font-medium"
            >
              <Download size={24} /> Download CSV
            </button>
            <button
              onClick={downloadPDF}
              className="flex items-center gap-3 bg-purple-600 text-white px-8 py-4 rounded-lg hover:bg-purple-700 text-lg font-medium"
            >
              <FileText size={24} /> Download PDF
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
