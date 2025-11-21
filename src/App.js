import React, { useState, useRef } from "react";
import { Plus, Edit2, Trash2, FileText, Download, Save, X } from "lucide-react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import Papa from "papaparse";

const ResultManagementSystem = () => {
  const [students, setStudents] = useState([]);
  const [currentStudent, setCurrentStudent] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [classes, setClasses] = useState({});
  const reportRef = useRef(null);

  const schoolInfo = {
    name: "SPRINGFORTH ACADEMY",
    address: "No 15 Tony Ogonenwe Close Off Living Water Avenue",
    location: "Barnawa Narayi High Cost Kaduna",
    phone: "08144939839, 08091542027",
    email: "springforthacademy@gmail.com",
  };

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

  const calculateGrade = (score) => {
    const grade = gradeScale.find((g) => score >= g.min && score <= g.max);
    return grade || { grade: "N/A", remark: "N/A" };
  };

  // Initialize student based on class
  const initializeStudent = (className = "YEAR 12 RIGEL") => {
    const subjects = classes[className] || [];
    return {
      name: "",
      admNo: "",
      class: className,
      gender: "M",
      term: "TERM ONE (HALF TERM)",
      session: "2025/2026",
      classSize: 24,
      subjects: subjects.map((name) => ({
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

  // CSV Upload handler
  const handleSubjectUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const newClasses = {};
        results.data.forEach(({ Class: cls, Subject: sub }) => {
          if (!newClasses[cls]) newClasses[cls] = [];
          newClasses[cls].push(sub);
        });
        setClasses((prev) => ({ ...prev, ...newClasses }));
        alert("Subjects uploaded successfully!");
      },
    });
  };

  // Subject calculations
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

  const generateReport = (student) => {
    setSelectedStudent(student);
    setShowReport(true);
  };

  const downloadPDF = async () => {
    const element = reportRef.current;
    if (!element) return;
    try {
      const canvas = await html2canvas(element, { scale: 2, useCORS: true, backgroundColor: "#ffffff" });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      pdf.addImage(imgData, "PNG", 0, 0, imgWidth * ratio, imgHeight * ratio);
      pdf.save(`${selectedStudent.name}_Report_${selectedStudent.term}.pdf`);
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Error generating PDF. Please try again.");
    }
  };

  // ------------------ JSX Rendering ------------------

  if (showReport && selectedStudent) {
    return (
      <div className="min-h-screen bg-gray-100 p-4">
        <div className="max-w-5xl mx-auto mb-4 flex gap-4">
          <button
            onClick={() => setShowReport(false)}
            className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 flex items-center gap-2 font-semibold"
          >
            <X size={20} /> Close Report
          </button>
          <button
            onClick={downloadPDF}
            className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 flex items-center gap-2 font-semibold"
          >
            <Download size={20} /> Download PDF
          </button>
        </div>
        <div className="bg-gray-200 p-8 rounded-lg">
          <ReportCard student={selectedStudent} />
        </div>
      </div>
    );
  }

  // Adding / Editing Student
  if (currentStudent) {
    return (
      <div className="min-h-screen bg-gray-100 p-4">
        <div className="max-w-6xl mx-auto bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-bold mb-6 text-blue-900">
            {isEditing ? "Edit Student" : "Add New Student"}
          </h2>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-semibold mb-1">Student Name</label>
              <input
                type="text"
                value={currentStudent.name}
                onChange={(e) => setCurrentStudent({ ...currentStudent, name: e.target.value })}
                className="w-full border border-gray-300 rounded px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">Admission No</label>
              <input
                type="text"
                value={currentStudent.admNo}
                onChange={(e) => setCurrentStudent({ ...currentStudent, admNo: e.target.value })}
                className="w-full border border-gray-300 rounded px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">Class</label>
              <select
                value={currentStudent.class}
                onChange={(e) =>
                  setCurrentStudent(initializeStudent(e.target.value))
                }
                className="w-full border border-gray-300 rounded px-3 py-2"
              >
                {Object.keys(classes).map((cls) => (
                  <option key={cls} value={cls}>
                    {cls}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">Gender</label>
              <select
                value={currentStudent.gender}
                onChange={(e) => setCurrentStudent({ ...currentStudent, gender: e.target.value })}
                className="w-full border border-gray-300 rounded px-3 py-2"
              >
                <option value="M">Male</option>
                <option value="F">Female</option>
              </select>
            </div>
          </div>

          {/* Subject Scores Table */}
          <h3 className="text-xl font-bold mb-4 text-blue-900">Subject Scores</h3>
          <div className="overflow-x-auto mb-6">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-blue-900 text-white">
                  <th className="border p-2">Subject</th>
                  <th className="border p-2">Note (5%)</th>
                  <th className="border p-2">Class (5%)</th>
                  <th className="border p-2">Home (5%)</th>
                  <th className="border p-2">Test (15%)</th>
                  <th className="border p-2">CA1 (15%)</th>
                  <th className="border p-2">Exam (100%)</th>
                  <th className="border p-2">Position</th>
                  <th className="border p-2">Highest</th>
                </tr>
              </thead>
              <tbody>
                {currentStudent.subjects.map((subject, idx) => (
                  <tr key={idx} className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                    <td className="border p-2 font-semibold">{subject.name}</td>
                    {["note", "classwork", "homework", "test", "ca1", "exam"].map((field) => (
                      <td key={field} className="border p-2">
                        <input
                          type="number"
                          step="0.01"
                          value={subject[field]}
                          onChange={(e) => {
                            const newSubjects = [...currentStudent.subjects];
                            newSubjects[idx][field] = e.target.value;
                            setCurrentStudent({ ...currentStudent, subjects: newSubjects });
                          }}
                          className="w-full px-2 py-1 border rounded"
                        />
                      </td>
                    ))}
                    <td className="border p-2">
                      <input
                        type="text"
                        value={subject.position}
                        onChange={(e) => {
                          const newSubjects = [...currentStudent.subjects];
                          newSubjects[idx].position = e.target.value;
                          setCurrentStudent({ ...currentStudent, subjects: newSubjects });
                        }}
                        className="w-full px-2 py-1 border rounded"
                      />
                    </td>
                    <td className="border p-2">
                      <input
                        type="number"
                        value={subject.highest}
                        onChange={(e) => {
                          const newSubjects = [...currentStudent.subjects];
                          newSubjects[idx].highest = e.target.value;
                          setCurrentStudent({ ...currentStudent, subjects: newSubjects });
                        }}
                        className="w-full px-2 py-1 border rounded"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Behavioral & Comments */}
          <h3 className="text-xl font-bold mb-4 text-blue-900">Behavioral Assessment</h3>
          <div className="grid grid-cols-2 gap-4 mb-6">
            {behavioralTraits.map((trait) => (
              <div key={trait}>
                <label className="block text-sm font-semibold mb-1">{trait}</label>
                <select
                  value={currentStudent.behavioral[trait]}
                  onChange={(e) =>
                    setCurrentStudent({
                      ...currentStudent,
                      behavioral: { ...currentStudent.behavioral, [trait]: e.target.value },
                    })
                  }
                  className="w-full border border-gray-300 rounded px-3 py-2"
                >
                  <option>Excellent Degree</option>
                  <option>Good Degree</option>
                  <option>Fair Degree</option>
                  <option>Poor Degree</option>
                </select>
              </div>
            ))}
          </div>

          <h3 className="text-xl font-bold mb-4 text-blue-900">Comments</h3>
          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-sm font-semibold mb-1">Form Tutor's Comment</label>
              <textarea
                value={currentStudent.tutorComment}
                onChange={(e) => setCurrentStudent({ ...currentStudent, tutorComment: e.target.value })}
                className="w-full border border-gray-300 rounded px-3 py-2"
                rows="3"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">Principal's Comment</label>
              <textarea
                value={currentStudent.principalComment}
                onChange={(e) => setCurrentStudent({ ...currentStudent, principalComment: e.target.value })}
                className="w-full border border-gray-300 rounded px-3 py-2"
                rows="3"
              />
            </div>
          </div>

          <div className="flex gap-4">
            <button
              onClick={handleSaveStudent}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 flex items-center gap-2 font-semibold"
            >
              <Save size={20} /> Save Student
            </button>
            <button
              onClick={() => {
                setCurrentStudent(null);
                setIsEditing(false);
              }}
              className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 font-semibold"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Main Dashboard
  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold text-blue-900">SPRINGFORTH ACADEMY</h1>
              <p className="text-sm text-gray-600">Result Management System</p>
            </div>
            <button
              onClick={() => setCurrentStudent(initializeStudent())}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 flex items-center gap-2 font-semibold"
            >
              <Plus size={20} /> Add Student
            </button>
          </div>

          {/* CSV Upload */}
          <div className="mb-6">
            <label className="font-semibold mb-2 block">Upload Subjects CSV:</label>
            <input type="file" accept=".csv" onChange={handleSubjectUpload} className="border p-2 rounded" />
          </div>

          {students.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p className="text-xl mb-2">No students added yet</p>
              <p>Click "Add Student" to get started</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-blue-900 text-white">
                    <th className="border p-3 text-left">Adm No</th>
                    <th className="border p-3 text-left">Name</th>
                    <th className="border p-3 text-left">Class</th>
                    <th className="border p-3 text-left">Gender</th>
                    <th className="border p-3 text-left">Avg Score</th>
                    <th className="border p-3 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((student) => {
                    const stats = calculateOverallStats(student.subjects);
                    return (
                      <tr key={student.admNo} className="bg-white hover:bg-gray-50">
                        <td className="border p-2">{student.admNo}</td>
                        <td className="border p-2">{student.name}</td>
                        <td className="border p-2">{student.class}</td>
                        <td className="border p-2">{student.gender}</td>
                        <td className="border p-2">{stats.avgScore}</td>
                        <td className="border p-2 flex gap-2">
                          <button
                            onClick={() => {
                              setIsEditing(true);
                              setCurrentStudent(student);
                            }}
                            className="bg-yellow-400 text-white px-3 py-1 rounded hover:bg-yellow-500 flex items-center gap-1"
                          >
                            <Edit2 size={16} /> Edit
                          </button>
                          <button
                            onClick={() => handleDeleteStudent(student.admNo)}
                            className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 flex items-center gap-1"
                          >
                            <Trash2 size={16} /> Delete
                          </button>
                          <button
                            onClick={() => generateReport(student)}
                            className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 flex items-center gap-1"
                          >
                            <FileText size={16} /> Report
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // ------------------ Report Card Component ------------------
  function ReportCard({ student }) {
    const stats = calculateOverallStats(student.subjects);

    return (
      <div ref={reportRef} className="bg-white p-6 rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold text-center mb-4">{schoolInfo.name}</h2>
        <p className="text-center mb-2">{schoolInfo.address}</p>
        <p className="text-center mb-4">{schoolInfo.location}</p>
        <div className="mb-4">
          <strong>Student Name:</strong> {student.name} | <strong>Adm No:</strong> {student.admNo} | <strong>Class:</strong>{" "}
          {student.class} | <strong>Gender:</strong> {student.gender}
        </div>
        <table className="w-full border-collapse mb-4">
          <thead>
            <tr className="bg-blue-900 text-white">
              <th className="border p-2">Subject</th>
              <th className="border p-2">Total</th>
              <th className="border p-2">Grade</th>
              <th className="border p-2">Remark</th>
            </tr>
          </thead>
          <tbody>
            {student.subjects.map((sub, idx) => (
              <tr key={idx} className={idx % 2 === 0 ? "bg-gray-100" : "bg-white"}>
                <td className="border p-2">{sub.name}</td>
                <td className="border p-2">{sub.total}</td>
                <td className="border p-2">{sub.grade}</td>
                <td className="border p-2">{sub.remark}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mb-4">
          <strong>Total Score:</strong> {stats.totalScore} | <strong>Average:</strong> {stats.avgScore} |{" "}
          <strong>Overall Grade:</strong> {stats.overallGrade}
        </div>

        <h3 className="text-lg font-bold mb-2">Behavioral Assessment</h3>
        <ul className="list-disc pl-6 mb-4">
          {behavioralTraits.map((trait) => (
            <li key={trait}>
              <strong>{trait}:</strong> {student.behavioral[trait]}
            </li>
          ))}
        </ul>

        <h3 className="text-lg font-bold mb-2">Comments</h3>
        <p>
          <strong>Form Tutor:</strong> {student.tutorComment}
        </p>
        <p>
          <strong>Principal:</strong> {student.principalComment}
        </p>
      </div>
    );
  }
};

export default ResultManagementSystem;
