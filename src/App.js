import React, { useState, useEffect } from 'react';
import { Page, Text, View, Document, StyleSheet, PDFViewer, Image as PDFImage } from '@react-pdf/renderer';
import { 
  School, Users, BookOpen, GraduationCap, FileText, 
  ArrowRight, ArrowLeft, Plus, Trash2, UserPlus, Upload, CheckCircle 
} from 'lucide-react';

// ==========================================
// 1. PDF DOCUMENT DEFINITION (The Template)
// ==========================================
const styles = StyleSheet.create({
  page: { padding: 20, fontSize: 8, fontFamily: 'Helvetica' },
  headerContainer: { flexDirection: 'row', marginBottom: 5, alignItems: 'center' },
  logoBox: { width: 60, height: 60, marginRight: 10 },
  logoImage: { width: '100%', height: '100%', objectFit: 'contain' },
  schoolInfo: { flex: 1, textAlign: 'center' },
  schoolName: { fontSize: 16, color: '#1a365d', fontWeight: 'bold', textTransform: 'uppercase' },
  schoolMeta: { fontSize: 8, marginTop: 2, fontWeight: 'bold' },
  titleBox: { marginTop: 5, padding: 2, backgroundColor: '#dbeafe', textAlign: 'center', fontWeight: 'bold' },
  
  // Grid System
  grid: { flexDirection: 'row', border: '1px solid #000', marginTop: 5, backgroundColor: '#f8fafc' },
  col: { flex: 1, padding: 4 },
  rowItem: { flexDirection: 'row', marginBottom: 2 },
  label: { fontWeight: 'bold', width: 70 },

  // Table
  table: { width: '100%', borderLeft: '1px solid #000', borderTop: '1px solid #000', marginTop: 10 },
  row: { flexDirection: 'row' },
  cell: { borderRight: '1px solid #000', borderBottom: '1px solid #000', textAlign: 'center', padding: 3 },
  header: { backgroundColor: '#bfdbfe', fontWeight: 'bold' },
  
  // Columns
  wSubject: { width: '30%', textAlign: 'left', paddingLeft: 5 },
  wSmall: { width: '8%' },
  wRem: { flex: 1 },

  // Footer
  footer: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 30 },
  signLine: { borderTop: '1px solid #000', width: '40%', textAlign: 'center', paddingTop: 5 }
});

const ResultPDF = ({ school, student, results, staff, termInfo }) => {
  const totalScore = results.scores.reduce((acc, curr) => acc + (parseFloat(curr.total) || 0), 0);
  const average = (totalScore / (results.scores.length || 1)).toFixed(1);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.headerContainer}>
          {school.logo && (
             <View style={styles.logoBox}>
               <PDFImage src={school.logo} style={styles.logoImage} />
             </View>
          )}
          <View style={styles.schoolInfo}>
            <Text style={styles.schoolName}>{school.name}</Text>
            <Text style={styles.schoolMeta}>{school.address}</Text>
            <Text style={styles.schoolMeta}>{school.contact}</Text>
            <Text style={[styles.schoolMeta, { marginTop: 5, fontSize: 10 }]}>{termInfo.term} REPORT {termInfo.session}</Text>
          </View>
        </View>

        <View style={{height: 2, backgroundColor:'red', marginVertical: 5}} />

        {/* Student Details */}
        <View style={styles.grid}>
          <View style={styles.col}>
            <View style={styles.rowItem}><Text style={styles.label}>NAME:</Text><Text>{student.name}</Text></View>
            <View style={styles.rowItem}><Text style={styles.label}>CLASS:</Text><Text>{student.className}</Text></View>
          </View>
          <View style={styles.col}>
            <View style={styles.rowItem}><Text style={styles.label}>ADM NO:</Text><Text>{student.admNo || 'N/A'}</Text></View>
            <View style={styles.rowItem}><Text style={styles.label}>GENDER:</Text><Text>{student.gender}</Text></View>
          </View>
          <View style={styles.col}>
            <View style={styles.rowItem}><Text style={styles.label}>AVERAGE:</Text><Text>{average}%</Text></View>
            <View style={styles.rowItem}><Text style={styles.label}>TOTAL:</Text><Text>{totalScore}</Text></View>
          </View>
        </View>

        {/* Academic Table */}
        <View style={styles.table}>
          <View style={[styles.row, styles.header]}>
            <Text style={[styles.cell, styles.wSubject]}>SUBJECT</Text>
            <Text style={[styles.cell, styles.wSmall]}>CA</Text>
            <Text style={[styles.cell, styles.wSmall]}>EXAM</Text>
            <Text style={[styles.cell, styles.wSmall]}>TOTAL</Text>
            <Text style={[styles.cell, styles.wSmall]}>GRADE</Text>
            <Text style={[styles.cell, styles.wRem]}>REMARK</Text>
          </View>
          {results.scores.map((sub, i) => (
            <View key={i} style={styles.row}>
              <Text style={[styles.cell, styles.wSubject]}>{sub.subject}</Text>
              <Text style={[styles.cell, styles.wSmall]}>{sub.ca}</Text>
              <Text style={[styles.cell, styles.wSmall]}>{sub.exam}</Text>
              <Text style={[styles.cell, styles.wSmall, { fontWeight: 'bold' }]}>{sub.total}</Text>
              <Text style={[styles.cell, styles.wSmall]}>{sub.grade}</Text>
              <Text style={[styles.cell, styles.wRem]}>{sub.remark}</Text>
            </View>
          ))}
        </View>

        {/* Comments */}
        <View style={[styles.titleBox, {marginTop: 15}]}><Text>COMMENTS</Text></View>
        <View style={{border: '1px solid #000', padding: 5, minHeight: 40}}>
          <Text style={{fontWeight: 'bold', fontSize: 7}}>FORM TUTOR:</Text>
          <Text style={{marginBottom: 5}}>{results.tutorComment}</Text>
          <Text style={{fontWeight: 'bold', fontSize: 7}}>PRINCIPAL:</Text>
          <Text>{results.principalComment}</Text>
        </View>

        {/* Signatures */}
        <View style={styles.footer}>
          <View style={styles.signLine}>
            <Text>{staff.selectedTutor}</Text>
            <Text style={{fontSize: 6, color: '#666'}}>FORM TUTOR</Text>
          </View>
          <View style={styles.signLine}>
            <Text>{staff.selectedPrincipal}</Text>
            <Text style={{fontSize: 6, color: '#666'}}>PRINCIPAL</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
};

// ==========================================
// 2. MAIN APPLICATION (The Wizard)
// ==========================================

const App = () => {
  // --- STATE ---
  const [step, setStep] = useState(1);
  
  // Data States
  const [schoolData, setSchoolData] = useState({ name: '', address: '', contact: '', logo: null });
  const [classes, setClasses] = useState([]);
  const [staff, setStaff] = useState({ principals: [], teachers: [] });
  const [subjects, setSubjects] = useState([]);
  const [students, setStudents] = useState([]);
  
  // Current Session Info
  const [termInfo, setTermInfo] = useState({ term: 'TERM ONE', session: '2025/2026' });

  // Result Generation State
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [currentResult, setCurrentResult] = useState({
    scores: [],
    tutorComment: '',
    principalComment: '',
    selectedTutor: '',
    selectedPrincipal: ''
  });

  // --- HANDLERS ---
  
  // Logo Upload
  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setSchoolData({ ...schoolData, logo: url });
    }
  };

  // Generic List Adders
  const addItem = (setter, list, newItem) => {
    if (newItem.trim() !== '') setter([...list, newItem]);
  };
  
  const removeItem = (setter, list, index) => {
    const newList = [...list];
    newList.splice(index, 1);
    setter(newList);
  };

  const addStudent = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const newStudent = {
      id: Date.now().toString(),
      name: formData.get('name'),
      className: formData.get('className'),
      gender: formData.get('gender'),
      admNo: formData.get('admNo')
    };
    setStudents([...students, newStudent]);
    e.target.reset();
  };

  // Initialize Result Form when Student Selected
  useEffect(() => {
    if (selectedStudentId) {
      // Pre-fill subjects with 0 scores
      const initialScores = subjects.map(sub => ({
        subject: sub, ca: 0, exam: 0, total: 0, grade: 'F', remark: ''
      }));
      setCurrentResult(prev => ({ ...prev, scores: initialScores }));
    }
  }, [selectedStudentId, subjects]);

  const handleScoreChange = (index, field, value) => {
    const newScores = [...currentResult.scores];
    newScores[index][field] = value;
    
    // Auto Calc
    const ca = parseFloat(newScores[index].ca) || 0;
    const exam = parseFloat(newScores[index].exam) || 0;
    const total = ca + exam;
    newScores[index].total = total;
    
    // Auto Grade
    if (total >= 75) { newScores[index].grade = 'A'; newScores[index].remark = 'Excellent'; }
    else if (total >= 65) { newScores[index].grade = 'B'; newScores[index].remark = 'Very Good'; }
    else if (total >= 50) { newScores[index].grade = 'C'; newScores[index].remark = 'Good'; }
    else if (total >= 40) { newScores[index].grade = 'D'; newScores[index].remark = 'Pass'; }
    else { newScores[index].grade = 'F'; newScores[index].remark = 'Fail'; }

    setCurrentResult({ ...currentResult, scores: newScores });
  };

  // --- RENDER STEPS ---

  const renderStep = () => {
    switch(step) {
      case 1: // School Profile
        return (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-blue-900">Step 1: School Profile</h2>
            <p className="text-gray-500">First, let's set up your school identity.</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                 <label className="label">School Name</label>
                 <input className="input-field" value={schoolData.name} onChange={(e)=>setSchoolData({...schoolData, name: e.target.value})} placeholder="e.g. Springfield High" />
              </div>
              <div className="space-y-2">
                 <label className="label">Address</label>
                 <input className="input-field" value={schoolData.address} onChange={(e)=>setSchoolData({...schoolData, address: e.target.value})} placeholder="Full Address" />
              </div>
              <div className="space-y-2">
                 <label className="label">Contact (Phone/Email)</label>
                 <input className="input-field" value={schoolData.contact} onChange={(e)=>setSchoolData({...schoolData, contact: e.target.value})} placeholder="Phone / Email" />
              </div>
              <div className="space-y-2">
                 <label className="label">School Logo</label>
                 <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 cursor-pointer bg-blue-50 text-blue-600 px-4 py-2 rounded hover:bg-blue-100 border border-blue-200">
                      <Upload size={16}/> Upload Logo
                      <input type="file" className="hidden" accept="image/*" onChange={handleLogoUpload}/>
                    </label>
                    {schoolData.logo && <img src={schoolData.logo} alt="Preview" className="w-12 h-12 object-contain border rounded" />}
                 </div>
              </div>
            </div>
            
            <div className="pt-4 border-t mt-4 grid grid-cols-2 gap-4">
               <div className="space-y-2">
                 <label className="label">Current Term</label>
                 <input className="input-field" value={termInfo.term} onChange={(e)=>setTermInfo({...termInfo, term: e.target.value})} />
               </div>
               <div className="space-y-2">
                 <label className="label">Academic Session</label>
                 <input className="input-field" value={termInfo.session} onChange={(e)=>setTermInfo({...termInfo, session: e.target.value})} />
               </div>
            </div>
          </div>
        );

      case 2: // Classes & Subjects
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-blue-900">Step 2: Academics</h2>
            
            {/* Classes */}
            <div className="bg-white p-4 rounded shadow-sm border">
               <h3 className="font-bold flex items-center gap-2 mb-3"><BookOpen size={18}/> Manage Classes</h3>
               <div className="flex gap-2 mb-3">
                 <input id="newClass" className="input-field flex-1" placeholder="e.g. Year 7 Rigel" />
                 <button onClick={()=>{
                    addItem(setClasses, classes, document.getElementById('newClass').value);
                    document.getElementById('newClass').value = '';
                 }} className="btn-primary"><Plus size={16}/></button>
               </div>
               <div className="flex flex-wrap gap-2">
                 {classes.map((c, i) => (
                   <span key={i} className="chip bg-blue-100 text-blue-800">
                     {c} <button onClick={()=>removeItem(setClasses, classes, i)}><Trash2 size={12} className="ml-1"/></button>
                   </span>
                 ))}
                 {classes.length === 0 && <span className="text-gray-400 text-sm">No classes added yet.</span>}
               </div>
            </div>

            {/* Subjects */}
            <div className="bg-white p-4 rounded shadow-sm border">
               <h3 className="font-bold flex items-center gap-2 mb-3"><BookOpen size={18}/> Manage Subjects</h3>
               <div className="flex gap-2 mb-3">
                 <input id="newSubject" className="input-field flex-1" placeholder="e.g. Mathematics" />
                 <button onClick={()=>{
                    addItem(setSubjects, subjects, document.getElementById('newSubject').value);
                    document.getElementById('newSubject').value = '';
                 }} className="btn-primary"><Plus size={16}/></button>
               </div>
               <div className="flex flex-wrap gap-2">
                 {subjects.map((s, i) => (
                   <span key={i} className="chip bg-green-100 text-green-800">
                     {s} <button onClick={()=>removeItem(setSubjects, subjects, i)}><Trash2 size={12} className="ml-1"/></button>
                   </span>
                 ))}
                 {subjects.length === 0 && <span className="text-gray-400 text-sm">No subjects added yet.</span>}
               </div>
            </div>
          </div>
        );

      case 3: // Staff
        return (
          <div className="space-y-6">
             <h2 className="text-2xl font-bold text-blue-900">Step 3: Staff Management</h2>
             
             {/* Teachers */}
             <div className="bg-white p-4 rounded shadow-sm border">
               <h3 className="font-bold flex items-center gap-2 mb-3"><Users size={18}/> Teachers / Form Tutors</h3>
               <div className="flex gap-2 mb-3">
                 <input id="newTeacher" className="input-field flex-1" placeholder="Teacher Name" />
                 <button onClick={()=>{
                    addItem((v)=>setStaff({...staff, teachers:v}), staff.teachers, document.getElementById('newTeacher').value);
                    document.getElementById('newTeacher').value = '';
                 }} className="btn-primary"><Plus size={16}/></button>
               </div>
               <ul className="list-disc pl-5 text-sm text-gray-700">
                  {staff.teachers.map((t, i) => <li key={i}>{t}</li>)}
               </ul>
             </div>

             {/* Principals */}
             <div className="bg-white p-4 rounded shadow-sm border">
               <h3 className="font-bold flex items-center gap-2 mb-3"><GraduationCap size={18}/> Principals</h3>
               <div className="flex gap-2 mb-3">
                 <input id="newPrincipal" className="input-field flex-1" placeholder="Principal Name" />
                 <button onClick={()=>{
                    addItem((v)=>setStaff({...staff, principals:v}), staff.principals, document.getElementById('newPrincipal').value);
                    document.getElementById('newPrincipal').value = '';
                 }} className="btn-primary"><Plus size={16}/></button>
               </div>
               <ul className="list-disc pl-5 text-sm text-gray-700">
                  {staff.principals.map((p, i) => <li key={i}>{p}</li>)}
               </ul>
             </div>
          </div>
        );

      case 4: // Students
        return (
           <div className="space-y-6">
             <h2 className="text-2xl font-bold text-blue-900">Step 4: Student Enrollment</h2>
             
             <form onSubmit={addStudent} className="bg-white p-4 rounded shadow-sm border grid grid-cols-2 gap-4">
                <input name="name" required className="input-field col-span-2" placeholder="Full Student Name" />
                <input name="admNo" className="input-field" placeholder="Admission No" />
                <select name="gender" className="input-field">
                  <option value="M">Male</option>
                  <option value="F">Female</option>
                </select>
                <select name="className" className="input-field col-span-2" required>
                  <option value="">Select Class...</option>
                  {classes.map((c,i) => <option key={i} value={c}>{c}</option>)}
                </select>
                <button type="submit" className="btn-primary col-span-2 flex justify-center items-center gap-2">
                   <UserPlus size={16}/> Enrol Student
                </button>
             </form>

             <div className="mt-4">
                <h3 className="font-bold mb-2">Enrolled Students ({students.length})</h3>
                <div className="bg-gray-50 rounded border max-h-60 overflow-y-auto">
                   {students.map((s) => (
                      <div key={s.id} className="p-3 border-b flex justify-between items-center hover:bg-white">
                         <div>
                           <div className="font-bold">{s.name}</div>
                           <div className="text-xs text-gray-500">{s.className} | {s.gender}</div>
                         </div>
                      </div>
                   ))}
                   {students.length === 0 && <div className="p-4 text-center text-gray-500">No students yet.</div>}
                </div>
             </div>
           </div>
        );

      case 5: // Results
        const selectedStudentData = students.find(s => s.id === selectedStudentId);

        return (
          <div className="flex flex-col h-full gap-4">
             <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-blue-900">Step 5: Generate Result</h2>
             </div>

             <div className="flex flex-col lg:flex-row gap-4 h-full">
                {/* Left: Input Form */}
                <div className="w-full lg:w-1/2 overflow-y-auto pr-2 space-y-4 pb-20">
                   
                   <div className="bg-blue-50 p-4 rounded border border-blue-200">
                      <label className="block text-sm font-bold text-blue-900 mb-1">Select Student to Grade</label>
                      <select 
                        className="input-field w-full" 
                        value={selectedStudentId} 
                        onChange={(e)=>setSelectedStudentId(e.target.value)}
                      >
                         <option value="">-- Choose Student --</option>
                         {students.map(s => <option key={s.id} value={s.id}>{s.name} ({s.className})</option>)}
                      </select>
                   </div>

                   {selectedStudentId && (
                     <>
                        <div className="space-y-2">
                           <h3 className="font-bold text-gray-700">Academic Scores</h3>
                           {currentResult.scores.map((score, i) => (
                              <div key={i} className="flex items-center gap-2 bg-gray-50 p-2 rounded border">
                                 <span className="text-xs font-bold w-24 truncate" title={score.subject}>{score.subject}</span>
                                 <input type="number" placeholder="CA" className="w-16 p-1 text-sm border rounded" 
                                    value={score.ca} onChange={(e)=>handleScoreChange(i, 'ca', e.target.value)} />
                                 <input type="number" placeholder="Exam" className="w-16 p-1 text-sm border rounded" 
                                    value={score.exam} onChange={(e)=>handleScoreChange(i, 'exam', e.target.value)} />
                                 <div className="text-xs font-bold text-blue-600 w-12 text-center">{score.total}</div>
                                 <div className="text-xs text-gray-500 w-8">{score.grade}</div>
                              </div>
                           ))}
                        </div>

                        <div className="space-y-3 pt-4 border-t">
                           <h3 className="font-bold text-gray-700">Remarks & Signatures</h3>
                           <textarea 
                             className="input-field h-20 text-sm" 
                             placeholder="Tutor's Comment"
                             value={currentResult.tutorComment}
                             onChange={(e)=>setCurrentResult({...currentResult, tutorComment: e.target.value})}
                           />
                           <select 
                             className="input-field"
                             value={currentResult.selectedTutor}
                             onChange={(e)=>setCurrentResult({...currentResult, selectedTutor: e.target.value})}
                           >
                              <option value="">Select Signing Tutor...</option>
                              {staff.teachers.map((t,i)=><option key={i} value={t}>{t}</option>)}
                           </select>

                           <textarea 
                             className="input-field h-20 text-sm" 
                             placeholder="Principal's Comment"
                             value={currentResult.principalComment}
                             onChange={(e)=>setCurrentResult({...currentResult, principalComment: e.target.value})}
                           />
                           <select 
                             className="input-field"
                             value={currentResult.selectedPrincipal}
                             onChange={(e)=>setCurrentResult({...currentResult, selectedPrincipal: e.target.value})}
                           >
                              <option value="">Select Signing Principal...</option>
                              {staff.principals.map((p,i)=><option key={i} value={p}>{p}</option>)}
                           </select>
                        </div>
                     </>
                   )}
                </div>

                {/* Right: PDF Preview */}
                <div className="w-full lg:w-1/2 bg-gray-800 rounded-lg overflow-hidden h-[600px] shadow-2xl">
                   {selectedStudentId && selectedStudentData ? (
                      <PDFViewer width="100%" height="100%" className="border-none">
                         <ResultPDF 
                            school={schoolData} 
                            student={selectedStudentData}
                            results={currentResult}
                            staff={currentResult} // passing selection
                            termInfo={termInfo}
                         />
                      </PDFViewer>
                   ) : (
                      <div className="h-full flex flex-col items-center justify-center text-gray-400 p-8 text-center">
                         <FileText size={48} className="mb-4 opacity-50"/>
                         <p>Select a student and enter details to see the live result preview here.</p>
                      </div>
                   )}
                </div>
             </div>
          </div>
        );

      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 font-sans text-gray-800">
      {/* Top Bar */}
      <header className="bg-blue-900 text-white p-4 shadow-md flex justify-between items-center">
         <div className="flex items-center gap-2">
            <School size={24} />
            <h1 className="font-bold text-lg">SchoolManager Pro</h1>
         </div>
         <div className="text-sm opacity-80">Step {step} of 5</div>
      </header>

      <main className="max-w-6xl mx-auto p-4 md:p-8">
        {/* Wizard Progress Bar (Simple) */}
        <div className="flex justify-between mb-8 px-2 relative">
           <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-300 -z-10 transform -translate-y-1/2"></div>
           {[1,2,3,4,5].map(num => (
              <div key={num} 
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold border-4 
                ${step >= num ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-gray-300 text-gray-400'}`}
              >
                {step > num ? <CheckCircle size={20}/> : num}
              </div>
           ))}
        </div>

        {/* Content Card */}
        <div className="bg-white rounded-xl shadow-xl p-6 min-h-[500px] flex flex-col">
           <div className="flex-1">
             {renderStep()}
           </div>

           {/* Navigation Buttons */}
           <div className="flex justify-between pt-6 mt-6 border-t">
              <button 
                onClick={() => setStep(s => Math.max(1, s - 1))}
                disabled={step === 1}
                className="px-6 py-2 rounded flex items-center gap-2 hover:bg-gray-100 disabled:opacity-50 text-gray-600 font-medium"
              >
                <ArrowLeft size={18}/> Previous
              </button>

              {step < 5 ? (
                 <button 
                   onClick={() => setStep(s => Math.min(5, s + 1))}
                   className="px-6 py-2 bg-blue-600 text-white rounded flex items-center gap-2 hover:bg-blue-700 font-medium shadow-md"
                 >
                   Next Step <ArrowRight size={18}/>
                 </button>
              ) : (
                <div className="text-green-600 flex items-center gap-2 font-bold animate-pulse">
                   <CheckCircle size={18}/> Ready to Print
                </div>
              )}
           </div>
        </div>
      </main>
      
      {/* CSS Utility Classes for cleaner JSX */}
      <style>{`
        .label { display: block; font-size: 0.875rem; font-weight: 600; color: #374151; margin-bottom: 0.25rem; }
        .input-field { width: 100%; padding: 0.5rem; border: 1px solid #d1d5db; border-radius: 0.375rem; outline: none; transition: border-color 0.2s; }
        .input-field:focus { border-color: #2563eb; ring: 2px solid #bfdbfe; }
        .btn-primary { background-color: #2563eb; color: white; padding: 0.5rem 1rem; border-radius: 0.375rem; font-weight: 500; transition: background-color 0.2s; }
        .btn-primary:hover { background-color: #1d4ed8; }
        .chip { display: inline-flex; align-items: center; padding: 0.25rem 0.75rem; border-radius: 9999px; font-size: 0.875rem; font-weight: 500; }
      `}</style>
    </div>
  );
};

export default App;
