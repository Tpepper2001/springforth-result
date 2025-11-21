import React, { useState, useRef } from 'react';
import { Plus, Edit2, Trash2, FileText, Download, Save, X } from 'lucide-react';

const ResultManagementSystem = () => {
  const [students, setStudents] = useState([]);
  const [currentStudent, setCurrentStudent] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const reportRef = useRef(null);

  const schoolInfo = {
    name: 'SPRINGFORTH ACADEMY',
    address: 'No 15 Tony Ogonenwe Close Off Living Water Avenue',
    location: 'Barnawa Narayi High Cost Kaduna',
    phone: '08144939839, 08091542027',
    email: 'springforthacademy@gmail.com'
  };

  const defaultSubjects = [
    'MATHEMATICS', 'ENGLISH LANGUAGE', 'PHYSICS', 'CHEMISTRY', 
    'BIOLOGY', 'FURTHER MATHEMATICS', 'ECONOMICS', 'GEOGRAPHY',
    'TECHNICAL DRAWING', 'CIVIC EDUCATION', 'DATA PROCESSING'
  ];

  const behavioralTraits = [
    'COOPERATION', 'LEADERSHIP', 'HONESTY', 'SELF DISCIPLINE',
    'EMPATHY', 'RESPECT', 'RESPONSIBILITY'
  ];

  const gradeScale = [
    { min: 86, max: 100, grade: 'A*', remark: 'Excellent' },
    { min: 76, max: 85, grade: 'A', remark: 'Outstanding' },
    { min: 66, max: 75, grade: 'B', remark: 'Very Good' },
    { min: 60, max: 65, grade: 'C', remark: 'Good' },
    { min: 50, max: 59, grade: 'D', remark: 'Fairly Good' },
    { min: 40, max: 49, grade: 'E', remark: 'Below Expectation' },
    { min: 0, max: 39, grade: 'E*', remark: 'Rarely' }
  ];

  const calculateGrade = (score) => {
    const grade = gradeScale.find(g => score >= g.min && score <= g.max);
    return grade || { grade: 'N/A', remark: 'N/A' };
  };

  const initializeStudent = () => ({
    name: '',
    admNo: '',
    class: 'YEAR 12 RIGEL',
    gender: 'M',
    term: 'TERM ONE (HALF TERM)',
    session: '2025/2026',
    classSize: 24,
    subjects: defaultSubjects.map(name => ({
      name,
      note: 0,
      classwork: 0,
      homework: 0,
      test: 0,
      ca1: 0,
      exam: 0,
      total: 0,
      grade: '',
      remark: '',
      position: '',
      highest: 0
    })),
    behavioral: behavioralTraits.reduce((acc, trait) => {
      acc[trait] = 'Excellent Degree';
      return acc;
    }, {}),
    tutorComment: '',
    principalComment: ''
  });

  const calculateSubjectTotal = (subject) => {
    const note = parseFloat(subject.note) || 0;
    const classwork = parseFloat(subject.classwork) || 0;
    const homework = parseFloat(subject.homework) || 0;
    const test = parseFloat(subject.test) || 0;
    const ca1 = parseFloat(subject.ca1) || 0;
    const exam = parseFloat(subject.exam) || 0;
    
    return note + classwork + homework + test + ca1 + exam;
  };

  const updateSubjectCalculations = (subjects) => {
    return subjects.map(subject => {
      const total = calculateSubjectTotal(subject);
      const gradeInfo = calculateGrade(total);
      return {
        ...subject,
        total: total.toFixed(2),
        grade: gradeInfo.grade,
        remark: gradeInfo.remark
      };
    });
  };

  const calculateOverallStats = (subjects) => {
    const validSubjects = subjects.filter(s => s.total > 0);
    const totalScore = validSubjects.reduce((sum, s) => sum + parseFloat(s.total), 0);
    const avgScore = validSubjects.length > 0 ? totalScore / validSubjects.length : 0;
    const overallGrade = calculateGrade(avgScore);
    
    return {
      totalScore: totalScore.toFixed(2),
      avgScore: avgScore.toFixed(2),
      overallGrade: overallGrade.grade,
      noOfSubjects: validSubjects.length
    };
  };

  const handleSaveStudent = () => {
    if (!currentStudent.name || !currentStudent.admNo) {
      alert('Please fill in student name and admission number');
      return;
    }

    const updatedSubjects = updateSubjectCalculations(currentStudent.subjects);
    const studentData = { ...currentStudent, subjects: updatedSubjects };

    if (isEditing) {
      setStudents(students.map(s => 
        s.admNo === studentData.admNo ? studentData : s
      ));
    } else {
      setStudents([...students, studentData]);
    }

    setCurrentStudent(null);
    setIsEditing(false);
  };

  const handleDeleteStudent = (admNo) => {
    if (window.confirm('Are you sure you want to delete this student?')) {
      setStudents(students.filter(s => s.admNo !== admNo));
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
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      const imgX = (pdfWidth - imgWidth * ratio) / 2;
      const imgY = 0;

      pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio);
      pdf.save(`${selectedStudent.name}_Report_${selectedStudent.term}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating PDF. Please try again.');
    }
  };

  const ReportCard = ({ student }) => {
    const stats = calculateOverallStats(student.subjects);
    
    return (
      <div ref={reportRef} className="bg-white p-8" style={{ 
        width: '210mm',
        minHeight: '297mm',
        fontFamily: 'Arial, sans-serif',
        margin: '0 auto',
        boxSizing: 'border-box'
      }}>
        <div style={{ 
          border: '6px solid #1e3a8a',
          padding: '30px',
          borderRadius: '8px'
        }}>
          {/* Header */}
          <div style={{ 
            textAlign: 'center',
            marginBottom: '25px',
            borderBottom: '3px solid #1e3a8a',
            paddingBottom: '20px'
          }}>
            <h1 style={{ 
              fontSize: '32px',
              fontWeight: 'bold',
              color: '#1e3a8a',
              margin: '0 0 10px 0',
              letterSpacing: '2px'
            }}>
              {schoolInfo.name}
            </h1>
            <p style={{ 
              fontSize: '13px',
              margin: '5px 0',
              color: '#374151'
            }}>
              {schoolInfo.address}
            </p>
            <p style={{ 
              fontSize: '13px',
              margin: '5px 0',
              color: '#374151'
            }}>
              {schoolInfo.location}
            </p>
            <p style={{ 
              fontSize: '13px',
              margin: '5px 0',
              color: '#374151'
            }}>
              PHONE: {schoolInfo.phone}
            </p>
            <p style={{ 
              fontSize: '13px',
              margin: '5px 0',
              color: '#374151'
            }}>
              E-MAIL: {schoolInfo.email}
            </p>
            <h2 style={{ 
              fontSize: '18px',
              fontWeight: 'bold',
              marginTop: '15px',
              color: '#1e3a8a',
              textTransform: 'uppercase'
            }}>
              {student.term} REPORT - {student.session} ACADEMIC SESSION
            </h2>
          </div>

          {/* Student Information */}
          <div style={{ 
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '15px',
            marginBottom: '25px',
            fontSize: '14px',
            backgroundColor: '#f3f4f6',
            padding: '20px',
            borderRadius: '6px'
          }}>
            <div><strong>NAME:</strong> {student.name}</div>
            <div><strong>ADM NO:</strong> {student.admNo}</div>
            <div><strong>CLASS:</strong> {student.class}</div>
            <div><strong>GENDER:</strong> {student.gender}</div>
            <div><strong>CLASS SIZE:</strong> {student.classSize}</div>
            <div><strong>NO OF SUBJECTS:</strong> {stats.noOfSubjects}</div>
            <div><strong>AVERAGE SCORE:</strong> <span style={{ color: '#059669', fontWeight: 'bold' }}>{stats.avgScore}%</span></div>
            <div><strong>OVERALL GRADE:</strong> <span style={{ 
              color: stats.overallGrade.includes('A') ? '#059669' : stats.overallGrade.includes('B') ? '#2563eb' : '#dc2626',
              fontWeight: 'bold',
              fontSize: '16px'
            }}>{stats.overallGrade}</span></div>
          </div>

          {/* Subjects Table */}
          <table style={{ 
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: '11px',
            marginBottom: '25px'
          }}>
            <thead>
              <tr style={{ backgroundColor: '#1e3a8a', color: 'white' }}>
                <th style={{ border: '1px solid #1e3a8a', padding: '10px 5px', textAlign: 'center', fontWeight: 'bold' }}>S/N</th>
                <th style={{ border: '1px solid #1e3a8a', padding: '10px 5px', textAlign: 'left', fontWeight: 'bold' }}>SUBJECTS</th>
                <th style={{ border: '1px solid #1e3a8a', padding: '10px 5px', textAlign: 'center', fontWeight: 'bold' }}>NOTE<br/>(5%)</th>
                <th style={{ border: '1px solid #1e3a8a', padding: '10px 5px', textAlign: 'center', fontWeight: 'bold' }}>CLASS<br/>(5%)</th>
                <th style={{ border: '1px solid #1e3a8a', padding: '10px 5px', textAlign: 'center', fontWeight: 'bold' }}>HOME<br/>(5%)</th>
                <th style={{ border: '1px solid #1e3a8a', padding: '10px 5px', textAlign: 'center', fontWeight: 'bold' }}>TEST<br/>(15%)</th>
                <th style={{ border: '1px solid #1e3a8a', padding: '10px 5px', textAlign: 'center', fontWeight: 'bold' }}>CA1<br/>(15%)</th>
                <th style={{ border: '1px solid #1e3a8a', padding: '10px 5px', textAlign: 'center', fontWeight: 'bold' }}>EXAM<br/>(100%)</th>
                <th style={{ border: '1px solid #1e3a8a', padding: '10px 5px', textAlign: 'center', fontWeight: 'bold' }}>TOTAL</th>
                <th style={{ border: '1px solid #1e3a8a', padding: '10px 5px', textAlign: 'center', fontWeight: 'bold' }}>GRADE</th>
                <th style={{ border: '1px solid #1e3a8a', padding: '10px 5px', textAlign: 'center', fontWeight: 'bold' }}>REMARKS</th>
                <th style={{ border: '1px solid #1e3a8a', padding: '10px 5px', textAlign: 'center', fontWeight: 'bold' }}>POS</th>
                <th style={{ border: '1px solid #1e3a8a', padding: '10px 5px', textAlign: 'center', fontWeight: 'bold' }}>HIGH</th>
              </tr>
            </thead>
            <tbody>
              {student.subjects.map((subject, idx) => (
                <tr key={idx} style={{ backgroundColor: idx % 2 === 0 ? '#ffffff' : '#f9fafb' }}>
                  <td style={{ border: '1px solid #d1d5db', padding: '8px 5px', textAlign: 'center' }}>{idx + 1}</td>
                  <td style={{ border: '1px solid #d1d5db', padding: '8px 5px', fontWeight: '600' }}>{subject.name}</td>
                  <td style={{ border: '1px solid #d1d5db', padding: '8px 5px', textAlign: 'center' }}>{subject.note}</td>
                  <td style={{ border: '1px solid #d1d5db', padding: '8px 5px', textAlign: 'center' }}>{subject.classwork}</td>
                  <td style={{ border: '1px solid #d1d5db', padding: '8px 5px', textAlign: 'center' }}>{subject.homework}</td>
                  <td style={{ border: '1px solid #d1d5db', padding: '8px 5px', textAlign: 'center' }}>{subject.test}</td>
                  <td style={{ border: '1px solid #d1d5db', padding: '8px 5px', textAlign: 'center' }}>{subject.ca1}</td>
                  <td style={{ border: '1px solid #d1d5db', padding: '8px 5px', textAlign: 'center' }}>{subject.exam}</td>
                  <td style={{ border: '1px solid #d1d5db', padding: '8px 5px', textAlign: 'center', fontWeight: 'bold', fontSize: '12px', color: '#1e3a8a' }}>{subject.total}</td>
                  <td style={{ border: '1px solid #d1d5db', padding: '8px 5px', textAlign: 'center', fontWeight: 'bold' }}>{subject.grade}</td>
                  <td style={{ border: '1px solid #d1d5db', padding: '8px 5px', textAlign: 'center', fontSize: '10px' }}>{subject.remark}</td>
                  <td style={{ border: '1px solid #d1d5db', padding: '8px 5px', textAlign: 'center' }}>{subject.position}</td>
                  <td style={{ border: '1px solid #d1d5db', padding: '8px 5px', textAlign: 'center' }}>{subject.highest}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Behavioral Report */}
          <div style={{ marginBottom: '25px' }}>
            <h3 style={{ 
              fontWeight: 'bold',
              fontSize: '16px',
              marginBottom: '15px',
              color: '#1e3a8a',
              borderBottom: '2px solid #1e3a8a',
              paddingBottom: '8px'
            }}>
              STUDENTS BEHAVIOURAL REPORT
            </h3>
            <div style={{ 
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '12px',
              fontSize: '13px',
              backgroundColor: '#f9fafb',
              padding: '15px',
              borderRadius: '6px'
            }}>
              {behavioralTraits.map(trait => (
                <div key={trait} style={{ 
                  display: 'flex',
                  justifyContent: 'space-between',
                  borderBottom: '1px solid #e5e7eb',
                  paddingBottom: '8px'
                }}>
                  <span style={{ fontWeight: '600' }}>{trait}:</span>
                  <span style={{ color: '#059669' }}>{student.behavioral[trait]}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Comments Section */}
          <div style={{ marginBottom: '25px', fontSize: '13px' }}>
            <div style={{ 
              marginBottom: '15px',
              padding: '15px',
              backgroundColor: '#fef3c7',
              borderLeft: '4px solid #f59e0b',
              borderRadius: '4px'
            }}>
              <strong style={{ display: 'block', marginBottom: '8px', color: '#92400e' }}>FORM TUTOR'S COMMENT:</strong>
              <p style={{ fontStyle: 'italic', margin: 0, lineHeight: '1.6', color: '#451a03' }}>
                {student.tutorComment || 'No comment provided'}
              </p>
            </div>
            <div style={{ 
              padding: '15px',
              backgroundColor: '#dbeafe',
              borderLeft: '4px solid #2563eb',
              borderRadius: '4px'
            }}>
              <strong style={{ display: 'block', marginBottom: '8px', color: '#1e3a8a' }}>PRINCIPAL'S COMMENT:</strong>
              <p style={{ fontStyle: 'italic', margin: 0, lineHeight: '1.6', color: '#1e40af' }}>
                {student.principalComment || 'No comment provided'}
              </p>
            </div>
          </div>

          {/* Grade Summary */}
          <div style={{ 
            fontSize: '11px',
            marginBottom: '25px',
            padding: '12px',
            backgroundColor: '#f3f4f6',
            borderRadius: '4px',
            lineHeight: '1.6'
          }}>
            <strong>GRADE SUMMARY:</strong> 86-100 (A*) Excellent | 76-85 (A) Outstanding | 66-75 (B) Very Good | 
            60-65 (C) Good | 50-59 (D) Fairly Good | 40-49 (E) Below Expectation | 0-39 (E*) Rarely
          </div>

          {/* Signatures */}
          <div style={{ 
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '60px',
            fontSize: '13px',
            marginTop: '40px'
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ 
                borderTop: '2px solid #1e3a8a',
                marginTop: '50px',
                paddingTop: '10px',
                fontWeight: 'bold'
              }}>
                FORM TUTOR'S SIGNATURE
              </div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ 
                borderTop: '2px solid #1e3a8a',
                marginTop: '50px',
                paddingTop: '10px',
                fontWeight: 'bold'
              }}>
                PRINCIPAL'S SIGNATURE
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

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

  if (currentStudent) {
    return (
      <div className="min-h-screen bg-gray-100 p-4">
        <div className="max-w-6xl mx-auto bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-bold mb-6 text-blue-900">
            {isEditing ? 'Edit Student' : 'Add New Student'}
          </h2>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-semibold mb-1">Student Name</label>
              <input
                type="text"
                value={currentStudent.name}
                onChange={(e) => setCurrentStudent({...currentStudent, name: e.target.value})}
                className="w-full border border-gray-300 rounded px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">Admission No</label>
              <input
                type="text"
                value={currentStudent.admNo}
                onChange={(e) => setCurrentStudent({...currentStudent, admNo: e.target.value})}
                className="w-full border border-gray-300 rounded px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">Class</label>
              <input
                type="text"
                value={currentStudent.class}
                onChange={(e) => setCurrentStudent({...currentStudent, class: e.target.value})}
                className="w-full border border-gray-300 rounded px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">Gender</label>
              <select
                value={currentStudent.gender}
                onChange={(e) => setCurrentStudent({...currentStudent, gender: e.target.value})}
                className="w-full border border-gray-300 rounded px-3 py-2"
              >
                <option value="M">Male</option>
                <option value="F">Female</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">Class Size</label>
              <input
                type="number"
                value={currentStudent.classSize}
                onChange={(e) => setCurrentStudent({...currentStudent, classSize: parseInt(e.target.value)})}
                className="w-full border border-gray-300 rounded px-3 py-2"
              />
            </div>
          </div>

          <h3 className="text-xl font-bold mb-4 text-blue-900">Subject Scores</h3>
          <div className="overflow-x-auto mb-6">
            <table className="w-full text-sm">
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
                  <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="border p-2 font-semibold">{subject.name}</td>
                    {['note', 'classwork', 'homework', 'test', 'ca1', 'exam'].map(field => (
                      <td key={field} className="border p-2">
                        <input
                          type="number"
                          step="0.01"
                          value={subject[field]}
                          onChange={(e) => {
                            const newSubjects = [...currentStudent.subjects];
                            newSubjects[idx][field] = e.target.value;
                            setCurrentStudent({...currentStudent, subjects: newSubjects});
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
                          setCurrentStudent({...currentStudent, subjects: newSubjects});
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
                          setCurrentStudent({...currentStudent, subjects: newSubjects});
                        }}
                        className="w-full px-2 py-1 border rounded"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <h3 className="text-xl font-bold mb-4 text-blue-900">Behavioral Assessment</h3>
          <div className="grid grid-cols-2 gap-4 mb-6">
            {behavioralTraits.map(trait => (
              <div key={trait}>
                <label className="block text-sm font-semibold mb-1">{trait}</label>
                <select
                  value={currentStudent.behavioral[trait]}
                  onChange={(e) => setCurrentStudent({
                    ...currentStudent,
                    behavioral: {...currentStudent.behavioral, [trait]: e.target.value}
                  })}
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
                onChange={(e) => setCurrentStudent({...currentStudent, tutorComment: e.target.value})}
                className="w-full border border-gray-300 rounded px-3 py-2"
                rows="3"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">Principal's Comment</label>
              <textarea
                value={currentStudent.principalComment}
                onChange={(e) => setCurrentStudent({...currentStudent, principalComment: e.target.value})}
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

          {students.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p className="text-xl mb-2">No students added yet</p>
              <p>Click "Add Student" to get started</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-blue-900 text-white">
                    <th className="border p-3 text-left">Adm No</th>
                    <th className="border p-3 text-left">Name</th>
                    <th className="border p-3 text-left">Class</th>
                    <th className="border p-3 text-left">Gender</th>
                    <th className="border p-3 text-left">Avg Score</th>
                    <th className="border p-3 text-left">Grade</th>
                    <th className="border p-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((student, idx) => {
                    const stats = calculateOverallStats(student.subjects);
                    return (
                      <tr key={idx} className={`${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-blue-50`}>
                        <td className="border p-3">{student.admNo}</td>
                        <td className="border p-3 font-semibold">{student.name}</td>
                        <td className="border p-3">{student.class}</td>
                        <td className="border p-3">{student.gender}</td>
                        <td className="border p-3">
                          <span style={{
                            backgroundColor: parseFloat(stats.avgScore) >= 80 ? '#dcfce7' : 
                                           parseFloat(stats.avgScore) >= 70 ? '#dbeafe' : '#fee2e2',
                            color: parseFloat(stats.avgScore) >= 80 ? '#166534' : 
                                  parseFloat(stats.avgScore) >= 70 ? '#1e40af' : '#991b1b',
                            padding: '4px 8px',
                            borderRadius: '4px',
                            fontWeight: 'bold'
                          }}>
                            {stats.avgScore}%
                          </span>
                        </td>
                        <td className="border p-3">
                          <span style={{
                            backgroundColor: stats.overallGrade.includes('A*') || stats.overallGrade.includes('A') ? '#dcfce7' : 
                                           stats.overallGrade.includes('B') ? '#dbeafe' : '#fee2e2',
                            color: stats.overallGrade.includes('A*') || stats.overallGrade.includes('A') ? '#166534' : 
                                  stats.overallGrade.includes('B') ? '#1e40af' : '#991b1b',
                            padding: '4px 8px',
                            borderRadius: '4px',
                            fontWeight: 'bold'
                          }}>
                            {stats.overallGrade}
                          </span>
                        </td>
                        <td className="border p-3">
                          <div className="flex gap-2 justify-center">
                            <button
                              onClick={() => generateReport(student)}
                              className="bg-green-600 text-white p-2 rounded hover:bg-green-700 transition"
                              title="View Report"
                            >
                              <FileText size={18} />
                            </button>
                            <button
                              onClick={() => {
                                setCurrentStudent(student);
                                setIsEditing(true);
                              }}
                              className="bg-blue-600 text-white p-2 rounded hover:bg-blue-700 transition"
                              title="Edit"
                            >
                              <Edit2 size={18} />
                            </button>
                            <button
                              onClick={() => handleDeleteStudent(student.admNo)}
                              className="bg-red-600 text-white p-2 rounded hover:bg-red-700 transition"
                              title="Delete"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
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
};

export default ResultManagementSystem;
