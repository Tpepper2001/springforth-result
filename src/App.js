import React, { useState, useRef } from "react";
import { Plus, Edit2, Trash2, FileText, Download, Save, X } from "lucide-react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

const App = () => {
  /** ----- State ----- **/
  const [teachers, setTeachers] = useState([]);
  const [currentTeacher, setCurrentTeacher] = useState(null);
  const [students, setStudents] = useState([]);
  const [currentStudent, setCurrentStudent] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [classes, setClasses] = useState({});
  const reportRef = useRef(null);

  /** ----- School Info ----- **/
  const schoolInfo = {
    name: "SPRINGFORTH ACADEMY",
    address: "No 15 Tony Ogonenwe Close Off Living Water Avenue",
    location: "Barnawa Narayi High Cost Kaduna",
    phone: "08144939839, 08091542027",
    email: "springforthacademy@gmail.com",
  };

  /** ----- Behavioral Traits & Grade Scale ----- **/
  const behavioralTraits = [
    "COOPERATION",
    "LEADERSHIP",
    "HONESTY",
    "SELF DISCIPLINE",
    "EMPATHY",
    "RESPECT",
    "RESPONSIBILITY",
  ];

  const gradeScale = [
    { min: 86, max: 100, grade: "A*", remark: "Excellent" },
    { min: 76, max: 85, grade: "A", remark: "Outstanding" },
    { min: 66, max: 75, grade: "B", remark: "Very Good" },
    { min: 60, max: 65, grade: "C", remark: "Good" },
    { min: 50, max: 59, grade: "D", remark: "Fairly Good" },
    { min: 40, max: 49, grade: "E", remark: "Below Expectation" },
    { min: 0, max: 39, grade: "E*", remark: "Rarely" },
  ];

  /** ----- Helper Functions ----- **/
  const calculateGrade = (score) => {
    const grade = gradeScale.find((g) => score >= g.min && score <= g.max);
    return grade || { grade: "N/A", remark: "N/A" };
  };

  const calculateSubjectTotal = (subject) => {
    const note = parseFloat(subject.note) || 0;
    const classwork = parseFloat(subject.classwork) || 0;
    const homework = parseFloat(subject.homework) || 0;
    const test = parseFloat(subject.test) || 0;
    const ca1 = parseFloat(subject.ca1) || 0;
    const exam = parseFloat(subject.exam) || 0;

    return note + classwork + homework + test + ca1 + exam;
  };

  const updateSubjectCalculations = (subjects) =>
    subjects.map((subject) => {
      const total = calculateSubjectTotal(subject);
      const gradeInfo = calculateGrade(total);
      return {
        ...subject,
        total: total.toFixed(2),
        grade: gradeInfo.grade,
        remark: gradeInfo.remark,
      };
    });

  const calculateOverallStats = (subjects) => {
    const validSubjects = subjects.filter((s) => s.total > 0);
    const totalScore = validSubjects.reduce((sum, s) => sum + parseFloat(s.total), 0);
    const avgScore = validSubjects.length > 0 ? totalScore / validSubjects.length : 0;
    const overallGrade = calculateGrade(avgScore);

    return {
      totalScore: totalScore.toFixed(2),
      avgScore: avgScore.toFixed(2),
      overallGrade: overallGrade.grade,
      noOfSubjects: validSubjects.length,
    };
  };

  /** ----- Teacher Login/Register ----- **/
  const [authMode, setAuthMode] = useState("login"); // login / register
  const [authData, setAuthData] = useState({ name: "", password: "", class: "" });

  const handleTeacherRegister = () => {
    if (!authData.name || !authData.password || !authData.class) {
      alert("Please fill in all fields");
      return;
    }
    if (teachers.find((t) => t.name === authData.name)) {
      alert("Teacher already exists");
      return;
    }
    setTeachers([...teachers, { ...authData }]);
    setCurrentTeacher(authData);
  };

  const handleTeacherLogin = () => {
    const teacher = teachers.find(
      (t) => t.name === authData.name && t.password === authData.password
    );
    if (!teacher) return alert("Invalid credentials");
    setCurrentTeacher(teacher);
  };

  /** ----- Initialize Student with Class Subjects ----- **/
  const initializeStudent = () => {
    const subjectsList = classes[currentTeacher.class] || [];
    return {
      name: "",
      admNo: "",
      class: currentTeacher.class,
      gender: "M",
      term: "TERM ONE (HALF TERM)",
      session: "2025/2026",
      classSize: 24,
      subjects: subjectsList.map((name) => ({
        name,
        note: 0,
        classwork: 0,
        homework: 0,
        test: 0,
        ca1: 0,
        exam: 0,
        total: 0,
        grade: "",
        remark: "",
        position: "",
        highest: 0,
      })),
      behavioral: behavioralTraits.reduce((acc, trait) => {
        acc[trait] = "Excellent Degree";
        return acc;
      }, {}),
      tutorComment: "",
      principalComment: "",
    };
  };

  /** ----- Add Subjects Manually ----- **/
  const [newSubject, setNewSubject] = useState("");
  const handleAddSubject = () => {
    if (!newSubject.trim()) return;
    setClasses((prev) => {
      const updated = { ...prev };
      if (!updated[currentTeacher.class]) updated[currentTeacher.class] = [];
      updated[currentTeacher.class].push(newSubject.trim().toUpperCase());
      return updated;
    });
    setNewSubject("");
  };

  /** ----- Student Management ----- **/
  const handleSaveStudent = () => {
    if (!currentStudent.name || !currentStudent.admNo) {
      alert("Please fill in student name and admission number");
      return;
    }

    const updatedSubjects = updateSubjectCalculations(currentStudent.subjects);
    const studentData = { ...currentStudent, subjects: updatedSubjects };

    if (isEditing) {
      setStudents(students.map((s) => (s.admNo === studentData.admNo ? studentData : s)));
    } else {
      setStudents([...students, studentData]);
    }

    setCurrentStudent(null);
    setIsEditing(false);
  };

  const handleDeleteStudent = (admNo) => {
    if (window.confirm("Are you sure you want to delete this student?")) {
      setStudents(students.filter((s) => s.admNo !== admNo));
    }
  };

  /** ----- Report Generation ----- **/
  const generateReport = (student) => {
    setSelectedStudent(student);
    setShowReport(true);
  };

  const downloadPDF = async () => {
    const element = reportRef.current;
    if (!element) return;
    try {
      const canvas = await html2canvas(element, { scale: 2, useCORS: true });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const ratio = Math.min(pdfWidth / canvas.width, pdfHeight / canvas.height);
      pdf.addImage(imgData, "PNG", 0, 0, canvas.width * ratio, canvas.height * ratio);
      pdf.save(`${selectedStudent.name}_Report.pdf`);
    } catch (error) {
      console.error(error);
      alert("Error generating PDF");
    }
  };

  /** ----- Rendering ----- **/

  // 1️⃣ Teacher Login/Register
  if (!currentTeacher) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4">
        <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
          <h2 className="text-2xl font-bold mb-4 text-blue-900">
            {authMode === "login" ? "Teacher Login" : "Register Teacher"}
          </h2>
          <div className="mb-4">
            <label className="block text-sm font-semibold mb-1">Name</label>
            <input
              type="text"
              value={authData.name}
              onChange={(e) => setAuthData({ ...authData, name: e.target.value })}
              className="w-full border px-3 py-2 rounded"
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-semibold mb-1">Password</label>
            <input
              type="password"
              value={authData.password}
              onChange={(e) => setAuthData({ ...authData, password: e.target.value })}
              className="w-full border px-3 py-2 rounded"
            />
          </div>
          {authMode === "register" && (
            <div className="mb-4">
              <label className="block text-sm font-semibold mb-1">Class</label>
              <input
                type="text"
                value={authData.class}
                onChange={(e) => setAuthData({ ...authData, class: e.target.value })}
                className="w-full border px-3 py-2 rounded"
              />
            </div>
          )}
          <div className="flex gap-4">
            <button
              onClick={authMode === "login" ? handleTeacherLogin : handleTeacherRegister}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 flex-1"
            >
              {authMode === "login" ? "Login" : "Register"}
            </button>
            <button
              onClick={() => setAuthMode(authMode === "login" ? "register" : "login")}
              className="bg-gray-500 text-white px-4 py-2 rounded flex-1 hover:bg-gray-600"
            >
              {authMode === "login" ? "Switch to Register" : "Switch to Login"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 2️⃣ Subject Management
  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-blue-900">{schoolInfo.name}</h1>
            <button
              onClick={() => setCurrentStudent(initializeStudent())}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 flex items-center gap-2 font-semibold"
            >
              <Plus size={20} /> Add Student
            </button>
          </div>

          <div className="mb-6">
            <h2 className="font-bold mb-2 text-blue-900">Subjects for {currentTeacher.class}</h2>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                placeholder="New Subject"
                value={newSubject}
                onChange={(e) => setNewSubject(e.target.value)}
                className="border px-3 py-2 rounded flex-1"
              />
              <button
                onClick={handleAddSubject}
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
              >
                Add
              </button>
            </div>
            <ul className="list-disc pl-5">
              {(classes[currentTeacher.class] || []).map((sub, idx) => (
                <li key={idx} className="mb-1">{sub}</li>
              ))}
            </ul>
          </div>

          {/* Student list table will go here (reuse previous App.js code) */}
          {/* For brevity, student management and report generation can be copied from your earlier App.js */}
        </div>
      </div>
    </div>
  );
};

export default App;
