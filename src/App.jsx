import React, { useState, useEffect } from 'react';
import { Document, Page, Text, View, StyleSheet, PDFViewer, Image as PDFImage } from '@react-pdf/renderer';
import { 
  School, Users, BookOpen, GraduationCap, FileText, 
  ArrowRight, Plus, Trash2, UserPlus, Upload, 
  LayoutDashboard, ChevronRight, Search, MapPin, AlertCircle, Layers, Copy
} from 'lucide-react';

// ==========================================
// 1. PDF DOCUMENT STYLES
// ==========================================
const pdfStyles = StyleSheet.create({
  page: { padding: 30, fontSize: 10, fontFamily: 'Helvetica', color: '#333' },
  header: { flexDirection: 'row', marginBottom: 20, borderBottom: '2px solid #1e40af', paddingBottom: 10 },
  logo: { width: 60, height: 60, marginRight: 15, borderRadius: 4 },
  schoolInfo: { justifyContent: 'center' },
  schoolName: { fontSize: 18, color: '#1e40af', fontWeight: 'bold', textTransform: 'uppercase' },
  schoolMeta: { fontSize: 9, color: '#555', marginTop: 2 },
  
  gridBox: { backgroundColor: '#f8fafc', padding: 10, borderRadius: 4, marginBottom: 15, flexDirection: 'row', flexWrap: 'wrap' },
  gridItem: { width: '33%', marginBottom: 5 },
  label: { fontSize: 8, color: '#64748b', fontWeight: 'bold', marginBottom: 2, textTransform: 'uppercase' },
  value: { fontSize: 10, fontWeight: 'bold', color: '#0f172a' },

  table: { width: '100%', border: '1px solid #e2e8f0', borderRadius: 4, overflow: 'hidden', marginBottom: 20 },
  row: { flexDirection: 'row', borderBottom: '1px solid #e2e8f0' },
  headerRow: { backgroundColor: '#eff6ff', borderBottom: '1px solid #1e40af' },
  cell: { padding: 6, fontSize: 9, textAlign: 'center' },
  cellLeft: { textAlign: 'left', paddingLeft: 10 },
  wSub: { width: '35%' },
  wSmall: { width: '10%' },
  wRem: { flex: 1 },

  commentSection: { marginBottom: 20 },
  commentBox: { borderLeft: '2px solid #1e40af', paddingLeft: 8, marginBottom: 10, backgroundColor: '#f8fafc', padding: 8 },
  footer: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 30 },
  signBox: { width: '40%', borderTop: '1px solid #94a3b8', paddingTop: 8, alignItems: 'center' }
});

const ResultPDF = ({ school, student, results, termInfo }) => {
  const totalScore = results.scores.reduce((acc, curr) => acc + (parseFloat(curr.total) || 0), 0);
  const average = (totalScore / (results.scores.length || 1)).toFixed(1);

  return (
    <Document>
      <Page size="A4" style={pdfStyles.page}>
        <View style={pdfStyles.header}>
          {school.logo && <PDFImage src={school.logo} style={pdfStyles.logo} />}
          <View style={pdfStyles.schoolInfo}>
            <Text style={pdfStyles.schoolName}>{school.name}</Text>
            <Text style={pdfStyles.schoolMeta}>{school.address}</Text>
            <Text style={pdfStyles.schoolMeta}>{school.contact}</Text>
            <Text style={[pdfStyles.schoolMeta, {color: '#1e40af', fontWeight: 'bold', marginTop: 4}]}>
              {termInfo.term} • {termInfo.session}
            </Text>
          </View>
        </View>

        <View style={pdfStyles.gridBox}>
          <View style={pdfStyles.gridItem}><Text style={pdfStyles.label}>Name</Text><Text style={pdfStyles.value}>{student.name}</Text></View>
          <View style={pdfStyles.gridItem}><Text style={pdfStyles.label}>Adm No</Text><Text style={pdfStyles.value}>{student.admNo || '-'}</Text></View>
          <View style={pdfStyles.gridItem}><Text style={pdfStyles.label}>Class</Text><Text style={pdfStyles.value}>{student.className}</Text></View>
          <View style={pdfStyles.gridItem}><Text style={pdfStyles.label}>Gender</Text><Text style={pdfStyles.value}>{student.gender}</Text></View>
          <View style={pdfStyles.gridItem}><Text style={pdfStyles.label}>Average</Text><Text style={pdfStyles.value}>{average}%</Text></View>
          <View style={pdfStyles.gridItem}><Text style={pdfStyles.label}>Total</Text><Text style={pdfStyles.value}>{totalScore}</Text></View>
        </View>

        <View style={pdfStyles.table}>
          <View style={[pdfStyles.row, pdfStyles.headerRow]}>
            <Text style={[pdfStyles.cell, pdfStyles.cellLeft, pdfStyles.wSub, {fontWeight: 'bold', color: '#1e40af'}]}>SUBJECT</Text>
            <Text style={[pdfStyles.cell, pdfStyles.wSmall, {fontWeight: 'bold'}]}>CA</Text>
            <Text style={[pdfStyles.cell, pdfStyles.wSmall, {fontWeight: 'bold'}]}>EXAM</Text>
            <Text style={[pdfStyles.cell, pdfStyles.wSmall, {fontWeight: 'bold'}]}>TOTAL</Text>
            <Text style={[pdfStyles.cell, pdfStyles.wSmall, {fontWeight: 'bold'}]}>GRD</Text>
            <Text style={[pdfStyles.cell, pdfStyles.cellLeft, pdfStyles.wRem, {fontWeight: 'bold'}]}>REMARK</Text>
          </View>
          {results.scores.map((s, i) => (
            <View key={i} style={[pdfStyles.row, {backgroundColor: i % 2 === 0 ? '#fff' : '#f8fafc'}]}>
              <Text style={[pdfStyles.cell, pdfStyles.cellLeft, pdfStyles.wSub]}>{s.subject}</Text>
              <Text style={[pdfStyles.cell, pdfStyles.wSmall]}>{s.ca}</Text>
              <Text style={[pdfStyles.cell, pdfStyles.wSmall]}>{s.exam}</Text>
              <Text style={[pdfStyles.cell, pdfStyles.wSmall, {fontWeight: 'bold'}]}>{s.total}</Text>
              <Text style={[pdfStyles.cell, pdfStyles.wSmall]}>{s.grade}</Text>
              <Text style={[pdfStyles.cell, pdfStyles.cellLeft, pdfStyles.wRem, {fontSize: 8, color: '#555'}]}>{s.remark}</Text>
            </View>
          ))}
        </View>

        <View style={pdfStyles.commentSection}>
          <Text style={{fontSize: 9, fontWeight: 'bold', color: '#1e40af', marginBottom: 4}}>FORM TUTOR'S REMARK</Text>
          <View style={pdfStyles.commentBox}><Text>{results.tutorComment || 'No comment provided.'}</Text></View>
          <Text style={{fontSize: 9, fontWeight: 'bold', color: '#1e40af', marginBottom: 4, marginTop: 10}}>PRINCIPAL'S REMARK</Text>
          <View style={pdfStyles.commentBox}><Text>{results.principalComment || 'No comment provided.'}</Text></View>
        </View>

        <View style={pdfStyles.footer}>
          <View style={pdfStyles.signBox}>
            <Text style={{fontFamily: 'Helvetica-Bold', marginBottom: 2}}>{results.selectedTutor}</Text>
            <Text style={{fontSize: 7, color: '#94a3b8'}}>FORM TUTOR</Text>
          </View>
          <View style={pdfStyles.signBox}>
            <Text style={{fontFamily: 'Helvetica-Bold', marginBottom: 2}}>{results.selectedPrincipal}</Text>
            <Text style={{fontSize: 7, color: '#94a3b8'}}>PRINCIPAL</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
};

// ==========================================
// 2. UI COMPONENTS
// ==========================================
const InputGroup = ({ icon: Icon, label, className, ...props }) => (
  <div className={`space-y-1.5 ${className}`}>
    {label && <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider ml-1">{label}</label>}
    <div className="relative group">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-500 transition-colors">
        {Icon && <Icon size={18} />}
      </div>
      <input 
        className="block w-full pl-10 pr-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm shadow-sm placeholder-slate-400
        focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all duration-200"
        {...props}
      />
    </div>
  </div>
);

const StepCard = ({ active, title, subtitle, onClick, icon: Icon }) => (
  <button 
    onClick={onClick}
    className={`w-full flex items-center gap-4 p-4 rounded-xl transition-all duration-300 text-left group relative overflow-hidden
      ${active ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30' : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-100'}`}
  >
    <div className={`p-2 rounded-lg ${active ? 'bg-white/20' : 'bg-slate-100 group-hover:bg-indigo-50 group-hover:text-indigo-600'} transition-colors`}>
      <Icon size={20} />
    </div>
    <div>
      <h3 className={`font-bold text-sm ${active ? 'text-white' : 'text-slate-800'}`}>{title}</h3>
      <p className={`text-xs ${active ? 'text-indigo-100' : 'text-slate-400'}`}>{subtitle}</p>
    </div>
    {active && <ChevronRight className="absolute right-4 opacity-50" size={16} />}
  </button>
);

// ==========================================
// 3. MAIN APP
// ==========================================

const App = () => {
  const [step, setStep] = useState(1);
  const [schoolData, setSchoolData] = useState({ name: '', address: '', contact: '', logo: null });
  
  // Data Structure Changes
  const [classes, setClasses] = useState([]);
  const [classSubjects, setClassSubjects] = useState({}); // { "Year 7": ["Math", "Eng"], "Year 8": ... }
  
  const [staff, setStaff] = useState({ principals: [], teachers: [] }); // Teachers: {name, assignedClass}
  const [students, setStudents] = useState([]);
  const [termInfo, setTermInfo] = useState({ term: 'First Term', session: '2025/2026' });
  
  // View State for Subject Management
  const [activeClassForSubjects, setActiveClassForSubjects] = useState('');

  // Results State
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [scoreLimits, setScoreLimits] = useState({ ca: 40, exam: 60 });
  const [currentResult, setCurrentResult] = useState({
    scores: [], tutorComment: '', principalComment: '', selectedTutor: '', selectedPrincipal: ''
  });

  // --- ACTIONS ---

  const handleLogoUpload = (e) => {
    if (e.target.files[0]) setSchoolData({ ...schoolData, logo: URL.createObjectURL(e.target.files[0]) });
  };
  
  const addClass = (className) => {
    if (className && !classes.includes(className)) {
      setClasses([...classes, className]);
      setClassSubjects(prev => ({...prev, [className]: []})); // Init empty subject list
    }
  };

  const removeClass = (className) => {
    setClasses(classes.filter(c => c !== className));
    // Optional: cleanup classSubjects[className]
  };

  const addSubjectToClass = (className, subject, addToAll) => {
    if (!subject) return;

    if (addToAll) {
      // Add to ALL classes
      const updated = { ...classSubjects };
      classes.forEach(cls => {
        const current = updated[cls] || [];
        if (!current.includes(subject)) {
          updated[cls] = [...current, subject];
        }
      });
      setClassSubjects(updated);
    } else {
      // Add to specific class
      const current = classSubjects[className] || [];
      if (!current.includes(subject)) {
        setClassSubjects({
          ...classSubjects,
          [className]: [...current, subject]
        });
      }
    }
  };

  const removeSubjectFromClass = (className, subject) => {
    const current = classSubjects[className] || [];
    setClassSubjects({
      ...classSubjects,
      [className]: current.filter(s => s !== subject)
    });
  };

  // Auto-Initialize Result Form
  useEffect(() => {
    if (selectedStudentId) {
      const student = students.find(s => s.id === selectedStudentId);
      if (!student) return;

      const cls = student.className;
      const subjectsForClass = classSubjects[cls] || [];
      const classTutor = staff.teachers.find(t => t.assignedClass === cls);

      setCurrentResult(prev => ({ 
        ...prev, 
        selectedTutor: classTutor ? classTutor.name : '',
        // Generate scores ONLY for subjects assigned to this class
        scores: subjectsForClass.map(sub => ({ subject: sub, ca: 0, exam: 0, total: 0, grade: 'F', remark: 'Fail' })) 
      }));
    }
  }, [selectedStudentId, students, classSubjects, staff.teachers]);

  // Score Logic
  const updateScore = (idx, field, val) => {
    const value = parseFloat(val) || 0;
    const updated = [...currentResult.scores];
    
    if (field === 'ca' && value > scoreLimits.ca) return;
    if (field === 'exam' && value > scoreLimits.exam) return;

    updated[idx][field] = value;
    
    const total = (parseFloat(updated[idx].ca)||0) + (parseFloat(updated[idx].exam)||0);
    if (total > 100) { alert('Total exceeds 100!'); return; }

    updated[idx].total = total;
    updated[idx].grade = total >= 75 ? 'A' : total >= 65 ? 'B' : total >= 50 ? 'C' : total >= 40 ? 'D' : 'F';
    updated[idx].remark = total >= 75 ? 'Excellent' : total >= 65 ? 'V. Good' : total >= 50 ? 'Good' : total >= 40 ? 'Fair' : 'Fail';
    
    setCurrentResult({ ...currentResult, scores: updated });
  };

  const steps = [
    { id: 1, title: 'School Profile', sub: 'Identity & Branding', icon: School },
    { id: 2, title: 'Academics', sub: 'Classes & Subjects', icon: BookOpen },
    { id: 3, title: 'Staff', sub: 'Teachers & Principals', icon: Users },
    { id: 4, title: 'Enrollment', sub: 'Add Students', icon: UserPlus },
    { id: 5, title: 'Results', sub: 'Grading & Printing', icon: FileText },
  ];

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-800 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-80 bg-white border-r border-slate-200 p-6 flex flex-col shadow-sm z-10">
        <div className="flex items-center gap-3 mb-10 px-2">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-500/30">
            <LayoutDashboard size={20} />
          </div>
          <div>
            <h1 className="font-bold text-lg leading-tight text-slate-900">Result<span className="text-indigo-600">Wizard</span></h1>
            <p className="text-xs text-slate-400 font-medium">School Management OS</p>
          </div>
        </div>
        <nav className="space-y-3 flex-1">
          {steps.map(s => <StepCard key={s.id} active={step === s.id} title={s.title} subtitle={s.sub} icon={s.icon} onClick={() => setStep(s.id)} />)}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto relative scroll-smooth">
        <div className="max-w-5xl mx-auto p-8 lg:p-12">
          
          {/* STEP 1: PROFILE */}
          {step === 1 && (
            <div className="space-y-8 animate-fade-in-up">
              <h2 className="text-3xl font-bold text-slate-900">School Identity</h2>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1">
                  <label className="block w-full aspect-square rounded-2xl border-2 border-dashed border-slate-300 hover:border-indigo-500 hover:bg-indigo-50 transition-all cursor-pointer flex flex-col items-center justify-center gap-3 group bg-white">
                    {schoolData.logo ? <img src={schoolData.logo} className="w-32 h-32 object-contain" alt="Logo" /> : <><Upload size={24} className="text-slate-400 group-hover:text-indigo-600"/><span className="text-sm font-medium text-slate-500">Upload Logo</span></>}
                    <input type="file" className="hidden" accept="image/*" onChange={handleLogoUpload} />
                  </label>
                </div>
                <div className="lg:col-span-2 space-y-5 bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
                   <InputGroup label="School Name" icon={School} value={schoolData.name} onChange={e => setSchoolData({...schoolData, name: e.target.value})} />
                   <InputGroup label="Address" icon={MapPin} value={schoolData.address} onChange={e => setSchoolData({...schoolData, address: e.target.value})} />
                   <div className="grid grid-cols-2 gap-4">
                      <InputGroup label="Term" value={termInfo.term} onChange={e => setTermInfo({...termInfo, term: e.target.value})} />
                      <InputGroup label="Session" value={termInfo.session} onChange={e => setTermInfo({...termInfo, session: e.target.value})} />
                   </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: ACADEMICS (Split View) */}
          {step === 2 && (
            <div className="space-y-8 animate-fade-in-up">
               <h2 className="text-3xl font-bold text-slate-900">Curriculum Management</h2>
               
               <div className="flex flex-col lg:flex-row gap-6 h-[500px]">
                 
                 {/* Left: Class List */}
                 <div className="w-full lg:w-1/3 bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col">
                    <h3 className="font-bold mb-4 flex gap-2 text-indigo-900"><LayoutDashboard size={18}/> Classes</h3>
                    <div className="flex gap-2 mb-4">
                       <input id="clsIn" className="flex-1 bg-slate-50 rounded-xl px-4 border-none text-sm" placeholder="New Class..." />
                       <button onClick={()=>{
                          const val = document.getElementById('clsIn').value;
                          addClass(val);
                          document.getElementById('clsIn').value='';
                       }} className="bg-indigo-600 text-white p-2 rounded-xl"><Plus size={20}/></button>
                    </div>
                    <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                       {classes.map((c, i) => (
                         <div key={i} 
                           onClick={() => setActiveClassForSubjects(c)}
                           className={`p-3 rounded-xl flex justify-between items-center cursor-pointer transition-all border
                           ${activeClassForSubjects === c ? 'bg-indigo-50 border-indigo-200 shadow-sm' : 'bg-white border-transparent hover:bg-slate-50'}`}
                         >
                           <span className={`font-bold text-sm ${activeClassForSubjects === c ? 'text-indigo-700' : 'text-slate-600'}`}>{c}</span>
                           <div className="flex items-center gap-2">
                             <span className="text-[10px] bg-slate-200 px-2 py-0.5 rounded-full text-slate-600">
                               {(classSubjects[c] || []).length} Subs
                             </span>
                             <Trash2 size={14} className="text-slate-300 hover:text-red-500" onClick={(e)=>{e.stopPropagation(); removeClass(c)}}/>
                           </div>
                         </div>
                       ))}
                       {classes.length === 0 && <p className="text-slate-400 text-sm text-center italic mt-10">Add a class to start.</p>}
                    </div>
                 </div>

                 {/* Right: Subject List for Active Class */}
                 <div className="w-full lg:w-2/3 bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col">
                    {activeClassForSubjects ? (
                      <>
                        <div className="flex justify-between items-center mb-4">
                           <h3 className="font-bold flex gap-2 text-emerald-900 items-center">
                             <BookOpen size={18}/> Subjects for <span className="bg-indigo-100 text-indigo-700 px-2 rounded">{activeClassForSubjects}</span>
                           </h3>
                        </div>
                        
                        <div className="bg-slate-50 p-4 rounded-xl mb-4 border border-slate-100">
                           <div className="flex gap-2 mb-2">
                              <input id="subIn" className="flex-1 bg-white border border-slate-200 rounded-xl px-4 text-sm" placeholder={`Add Subject to ${activeClassForSubjects}...`} />
                              <button onClick={()=>{
                                 const val = document.getElementById('subIn').value;
                                 const all = document.getElementById('chkAll').checked;
                                 addSubjectToClass(activeClassForSubjects, val, all);
                                 document.getElementById('subIn').value='';
                                 document.getElementById('chkAll').checked = false;
                              }} className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 rounded-xl font-bold text-sm">Add</button>
                           </div>
                           <div className="flex items-center gap-2">
                              <input type="checkbox" id="chkAll" className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500 border-gray-300"/>
                              <label htmlFor="chkAll" className="text-xs text-slate-500 font-medium select-none cursor-pointer">Add to ALL classes (e.g. Mathematics)</label>
                           </div>
                        </div>

                        <div className="flex-1 overflow-y-auto content-start flex flex-wrap gap-2 pr-1 custom-scrollbar">
                           {(classSubjects[activeClassForSubjects] || []).map((s, i) => (
                             <span key={i} className="px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-lg text-sm font-bold flex items-center gap-2 group">
                               {s} 
                               <button onClick={()=>removeSubjectFromClass(activeClassForSubjects, s)} className="text-emerald-300 hover:text-red-500 transition-colors"><Trash2 size={12}/></button>
                             </span>
                           ))}
                           {(classSubjects[activeClassForSubjects] || []).length === 0 && (
                             <div className="w-full h-full flex flex-col items-center justify-center text-slate-300">
                                <Layers size={40} className="mb-2"/>
                                <p>No subjects assigned to this class yet.</p>
                             </div>
                           )}
                        </div>
                      </>
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center text-slate-400">
                         <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                           <ArrowRight size={24} className="opacity-50"/>
                         </div>
                         <p className="font-medium">Select a Class on the left to manage its subjects.</p>
                      </div>
                    )}
                 </div>

               </div>
               
               {/* Global Settings */}
               <div className="bg-orange-50 p-6 rounded-3xl border border-orange-100 flex gap-4 items-center">
                  <div className="p-3 bg-orange-100 text-orange-600 rounded-full"><AlertCircle size={24}/></div>
                  <div className="flex-1 flex gap-4">
                     <div className="space-y-1">
                        <label className="text-xs font-bold text-orange-600 uppercase">Max CA Score</label>
                        <input type="number" value={scoreLimits.ca} onChange={(e)=>setScoreLimits({...scoreLimits, ca: parseFloat(e.target.value)})} className="w-24 p-2 rounded border border-orange-200 bg-white" />
                     </div>
                     <div className="space-y-1">
                        <label className="text-xs font-bold text-orange-600 uppercase">Max Exam Score</label>
                        <input type="number" value={scoreLimits.exam} onChange={(e)=>setScoreLimits({...scoreLimits, exam: parseFloat(e.target.value)})} className="w-24 p-2 rounded border border-orange-200 bg-white" />
                     </div>
                  </div>
               </div>
            </div>
          )}

          {/* STEP 3: STAFF */}
          {step === 3 && (
             <div className="space-y-8 animate-fade-in-up">
                <h2 className="text-3xl font-bold text-slate-900">Staff Management</h2>
                <div className="grid md:grid-cols-2 gap-8">
                  <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                     <h3 className="font-bold mb-4 text-indigo-900 flex items-center gap-2"><Users size={18}/> Teachers</h3>
                     <div className="space-y-3 p-4 bg-slate-50 rounded-xl mb-4">
                        <InputGroup id="teachName" placeholder="Teacher Name" icon={UserPlus} />
                        <select id="teachClass" className="w-full p-2.5 rounded-xl border border-slate-200 text-sm">
                           <option value="">Assign to Class (Optional)...</option>
                           {classes.map((c,i)=><option key={i} value={c}>{c}</option>)}
                        </select>
                        <button onClick={()=>{
                           const name = document.getElementById('teachName').value;
                           const cls = document.getElementById('teachClass').value;
                           if(name) setStaff(prev => ({...prev, teachers: [...prev.teachers, {name, assignedClass: cls}]}));
                           document.getElementById('teachName').value = '';
                        }} className="w-full bg-slate-900 text-white py-2 rounded-xl text-sm font-bold">Add Teacher</button>
                     </div>
                     <div className="space-y-4">
                        {classes.map(cls => {
                           const ts = staff.teachers.filter(t => t.assignedClass === cls);
                           return ts.length > 0 && (
                              <div key={cls}>
                                 <div className="text-xs font-bold text-indigo-500 uppercase mb-1 border-b border-indigo-100 pb-1">{cls}</div>
                                 {ts.map((t, i) => (
                                    <div key={i} className="flex justify-between items-center text-sm py-1 pl-2">
                                       <span>{t.name}</span>
                                       <button onClick={()=>setStaff(p=>({...p, teachers: p.teachers.filter(x=>x.name!==t.name)}))} className="text-red-400"><Trash2 size={14}/></button>
                                    </div>
                                 ))}
                              </div>
                           );
                        })}
                     </div>
                  </div>
                  <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 h-fit">
                     <h3 className="font-bold mb-4 text-purple-900 flex items-center gap-2"><GraduationCap size={18}/> Principals</h3>
                     <div className="flex gap-2 mb-4">
                        <input id="prinIn" className="flex-1 bg-slate-50 rounded-xl px-3 border-none text-sm" placeholder="Principal Name" />
                        <button onClick={()=>{
                           const val = document.getElementById('prinIn').value;
                           if(val) setStaff(prev => ({...prev, principals: [...prev.principals, val]}));
                           document.getElementById('prinIn').value='';
                        }} className="bg-purple-600 text-white p-2 rounded-xl"><Plus size={18}/></button>
                     </div>
                     {staff.principals.map((p,i) => <div key={i} className="bg-slate-50 p-2 rounded-lg text-sm flex justify-between mb-1">{p} <Trash2 size={14} className="text-red-400 cursor-pointer" onClick={()=>setStaff(prev=>({...prev, principals: prev.principals.filter((_,idx)=>idx!==i)}))}/></div>)}
                  </div>
                </div>
             </div>
          )}

          {/* STEP 4: ENROLLMENT */}
          {step === 4 && (
             <div className="space-y-8 animate-fade-in-up">
                <h2 className="text-3xl font-bold text-slate-900">Student Enrollment</h2>
                <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
                   <form onSubmit={(e) => {
                      e.preventDefault();
                      const fd = new FormData(e.target);
                      setStudents([...students, { id: Date.now().toString(), name: fd.get('name'), className: fd.get('class'), gender: fd.get('gender'), admNo: fd.get('adm') }]);
                      e.target.reset();
                   }} className="grid md:grid-cols-4 gap-4">
                      <div className="md:col-span-2"><InputGroup name="name" placeholder="Full Name" icon={Search} required /></div>
                      <div className="md:col-span-1"><InputGroup name="adm" placeholder="Adm No" /></div>
                      <div className="md:col-span-1">
                         <select name="gender" className="w-full h-full bg-white border border-slate-200 rounded-xl px-3 text-sm focus:ring-2 focus:ring-indigo-500"><option value="M">Male</option><option value="F">Female</option></select>
                      </div>
                      <div className="md:col-span-4">
                         <select name="class" required className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500">
                            <option value="">Select Class...</option>
                            {classes.map((c,i)=><option key={i} value={c}>{c}</option>)}
                         </select>
                      </div>
                      <button className="md:col-span-4 bg-indigo-600 text-white font-bold py-3 rounded-xl hover:bg-indigo-700 transition-colors">Enrol Student</button>
                   </form>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                   {classes.map(cls => {
                      const classStudents = students.filter(s => s.className === cls);
                      if (classStudents.length === 0) return null;
                      return (
                         <div key={cls} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                            <div className="flex justify-between items-center mb-3 pb-2 border-b border-slate-100">
                               <h3 className="font-bold text-slate-800">{cls}</h3>
                               <span className="bg-slate-100 text-xs px-2 py-1 rounded-full text-slate-500">{classStudents.length}</span>
                            </div>
                            <div className="space-y-2 max-h-40 overflow-y-auto pr-1 custom-scrollbar">
                               {classStudents.map(s => (
                                  <div key={s.id} className="text-sm flex items-center gap-2 text-slate-600">
                                     <div className={`w-2 h-2 rounded-full ${s.gender==='M'?'bg-blue-400':'bg-pink-400'}`}/>
                                     <span className="truncate">{s.name}</span>
                                  </div>
                               ))}
                            </div>
                         </div>
                      )
                   })}
                </div>
             </div>
          )}

          {/* STEP 5: RESULTS */}
          {step === 5 && (
            <div className="h-[calc(100vh-140px)] flex flex-col lg:flex-row gap-6 animate-fade-in-up">
              <div className="w-full lg:w-1/3 flex flex-col gap-6 overflow-y-auto pr-2">
                 <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                    <label className="text-xs font-bold text-slate-400 uppercase mb-2 block">Select Student</label>
                    <select 
                      className="w-full p-3 bg-slate-50 border-none rounded-xl text-sm font-semibold text-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none"
                      onChange={(e) => setSelectedStudentId(e.target.value)}
                      value={selectedStudentId}
                    >
                       <option value="">-- Choose Student --</option>
                       {classes.map(cls => (
                          <optgroup key={cls} label={cls}>
                             {students.filter(s=>s.className===cls).map(s => (
                                <option key={s.id} value={s.id}>{s.name}</option>
                             ))}
                          </optgroup>
                       ))}
                    </select>
                 </div>

                 {selectedStudentId && (
                   <>
                     <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 space-y-4">
                        <div className="flex justify-between items-center">
                           <h3 className="font-bold text-slate-800">Input Scores</h3>
                           <div className="text-[10px] text-slate-400">Max: CA {scoreLimits.ca} / EX {scoreLimits.exam}</div>
                        </div>
                        {currentResult.scores.length > 0 ? currentResult.scores.map((score, i) => (
                           <div key={i} className="flex items-center gap-2">
                              <span className="text-xs font-bold text-slate-500 w-20 truncate" title={score.subject}>{score.subject}</span>
                              <input type="number" className="w-14 p-2 bg-slate-50 rounded-lg text-center text-xs font-bold focus:ring-1 focus:ring-indigo-500" placeholder="CA" 
                                value={score.ca} onChange={e=>updateScore(i,'ca',e.target.value)} />
                              <input type="number" className="w-14 p-2 bg-slate-50 rounded-lg text-center text-xs font-bold focus:ring-1 focus:ring-indigo-500" placeholder="EX" 
                                value={score.exam} onChange={e=>updateScore(i,'exam',e.target.value)} />
                              <span className={`text-xs font-bold w-10 text-center rounded py-1 ${score.total>100?'bg-red-100 text-red-600': score.total<40?'text-red-500':'text-emerald-600'}`}>
                                 {score.total}
                              </span>
                           </div>
                        )) : (
                           <div className="text-center text-slate-400 italic text-sm py-4">
                              No subjects assigned to this student's class.
                              <button onClick={()=>setStep(2)} className="block mx-auto mt-2 text-indigo-600 text-xs font-bold underline">Manage Subjects</button>
                           </div>
                        )}
                     </div>

                     <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 space-y-4">
                        <h3 className="font-bold text-slate-800">Signatures</h3>
                        <textarea className="w-full p-3 bg-slate-50 rounded-xl text-sm" placeholder="Tutor's Comment" rows="2"
                           value={currentResult.tutorComment} onChange={e=>setCurrentResult({...currentResult, tutorComment:e.target.value})}></textarea>
                        
                        <select className="w-full p-2 bg-slate-50 rounded-xl text-sm" value={currentResult.selectedTutor} onChange={e=>setCurrentResult({...currentResult, selectedTutor:e.target.value})}>
                           <option value="">Select Tutor...</option>
                           {classes.map(cls => (
                              <optgroup key={cls} label={cls}>
                                 {staff.teachers.filter(t=>t.assignedClass===cls).map((t,i)=><option key={i} value={t.name}>{t.name}</option>)}
                              </optgroup>
                           ))}
                           <optgroup label="General Staff">
                              {staff.teachers.filter(t=>!t.assignedClass).map((t,i)=><option key={i} value={t.name}>{t.name}</option>)}
                           </optgroup>
                        </select>

                        <textarea className="w-full p-3 bg-slate-50 rounded-xl text-sm" placeholder="Principal's Comment" rows="2"
                           value={currentResult.principalComment} onChange={e=>setCurrentResult({...currentResult, principalComment:e.target.value})}></textarea>
                        <select className="w-full p-2 bg-slate-50 rounded-xl text-sm" value={currentResult.selectedPrincipal} onChange={e=>setCurrentResult({...currentResult, selectedPrincipal:e.target.value})}>
                           <option value="">Select Principal...</option>
                           {staff.principals.map((p,i)=><option key={i} value={p}>{p}</option>)}
                        </select>
                     </div>
                   </>
                 )}
              </div>

              <div className="w-full lg:w-2/3 bg-slate-800 rounded-3xl overflow-hidden shadow-2xl relative flex flex-col">
                 <div className="bg-slate-900 p-3 flex justify-between items-center px-6">
                    <span className="text-slate-400 text-xs font-bold uppercase tracking-widest">Live Preview</span>
                 </div>
                 {selectedStudentId ? (
                   <PDFViewer className="flex-1 w-full h-full border-none">
                     <ResultPDF 
                        school={schoolData} 
                        student={students.find(s=>s.id===selectedStudentId)} 
                        results={currentResult} 
                        termInfo={termInfo} 
                     />
                   </PDFViewer>
                 ) : (
                   <div className="flex-1 flex flex-col items-center justify-center text-slate-500 space-y-4">
                      <div className="w-20 h-20 bg-slate-700/50 rounded-full flex items-center justify-center">
                         <FileText size={40} className="opacity-50"/>
                      </div>
                      <p>Select a student to generate result.</p>
                   </div>
                 )}
              </div>
            </div>
          )}

          {/* Nav */}
          <div className="flex justify-between mt-8 pt-6 border-t border-slate-200">
             <button onClick={()=>setStep(s=>Math.max(1, s-1))} disabled={step===1} className="text-slate-500 font-bold hover:text-slate-800 disabled:opacity-30 flex items-center gap-2"><ArrowRight className="rotate-180" size={18}/> Previous</button>
             {step < 5 && <button onClick={()=>setStep(s=>Math.min(5, s+1))} className="bg-slate-900 text-white px-8 py-3 rounded-full font-bold hover:bg-slate-800 flex items-center gap-2">Next Step <ArrowRight size={18}/></button>}
          </div>

        </div>
      </main>
    </div>
  );
};

export default App;
