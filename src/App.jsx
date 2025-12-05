import React, { useState, useEffect } from 'react';
import { Document, Page, Text, View, StyleSheet, PDFViewer, Image as PDFImage } from '@react-pdf/renderer';
import { 
  School, Users, BookOpen, GraduationCap, FileText, 
  ArrowRight, Plus, Trash2, UserPlus, Upload, CheckCircle, 
  LayoutDashboard, ChevronRight, Search, Mail, MapPin, Phone
} from 'lucide-react';

// ==========================================
// 1. PDF DOCUMENT STYLES (Print Layout)
// ==========================================
const pdfStyles = StyleSheet.create({
  page: { padding: 30, fontSize: 10, fontFamily: 'Helvetica', color: '#333' },
  header: { flexDirection: 'row', marginBottom: 20, borderBottom: '2px solid #1e40af', paddingBottom: 10 },
  logo: { width: 60, height: 60, marginRight: 15, borderRadius: 4 },
  schoolInfo: { justifyContent: 'center' },
  schoolName: { fontSize: 18, color: '#1e40af', fontWeight: 'bold', textTransform: 'uppercase' },
  schoolMeta: { fontSize: 9, color: '#555', marginTop: 2 },
  
  // Student Grid
  gridBox: { backgroundColor: '#f8fafc', padding: 10, borderRadius: 4, marginBottom: 15, flexDirection: 'row', flexWrap: 'wrap' },
  gridItem: { width: '33%', marginBottom: 5 },
  label: { fontSize: 8, color: '#64748b', fontWeight: 'bold', marginBottom: 2, textTransform: 'uppercase' },
  value: { fontSize: 10, fontWeight: 'bold', color: '#0f172a' },

  // Table
  table: { width: '100%', border: '1px solid #e2e8f0', borderRadius: 4, overflow: 'hidden', marginBottom: 20 },
  row: { flexDirection: 'row', borderBottom: '1px solid #e2e8f0' },
  headerRow: { backgroundColor: '#eff6ff', borderBottom: '1px solid #1e40af' },
  cell: { padding: 6, fontSize: 9, textAlign: 'center' },
  cellLeft: { textAlign: 'left', paddingLeft: 10 },
  wSub: { width: '35%' },
  wSmall: { width: '10%' },
  wRem: { flex: 1 },

  // Comments & Footer
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
        {/* Header */}
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

        {/* Student Info */}
        <View style={pdfStyles.gridBox}>
          <View style={pdfStyles.gridItem}><Text style={pdfStyles.label}>Student Name</Text><Text style={pdfStyles.value}>{student.name}</Text></View>
          <View style={pdfStyles.gridItem}><Text style={pdfStyles.label}>Admission No</Text><Text style={pdfStyles.value}>{student.admNo || '-'}</Text></View>
          <View style={pdfStyles.gridItem}><Text style={pdfStyles.label}>Class</Text><Text style={pdfStyles.value}>{student.className}</Text></View>
          <View style={pdfStyles.gridItem}><Text style={pdfStyles.label}>Gender</Text><Text style={pdfStyles.value}>{student.gender}</Text></View>
          <View style={pdfStyles.gridItem}><Text style={pdfStyles.label}>Average Score</Text><Text style={pdfStyles.value}>{average}%</Text></View>
          <View style={pdfStyles.gridItem}><Text style={pdfStyles.label}>Total Score</Text><Text style={pdfStyles.value}>{totalScore}</Text></View>
        </View>

        {/* Table */}
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

        {/* Comments */}
        <View style={pdfStyles.commentSection}>
          <Text style={{fontSize: 9, fontWeight: 'bold', color: '#1e40af', marginBottom: 4}}>FORM TUTOR'S REMARK</Text>
          <View style={pdfStyles.commentBox}><Text>{results.tutorComment || 'No comment provided.'}</Text></View>
          
          <Text style={{fontSize: 9, fontWeight: 'bold', color: '#1e40af', marginBottom: 4, marginTop: 10}}>PRINCIPAL'S REMARK</Text>
          <View style={pdfStyles.commentBox}><Text>{results.principalComment || 'No comment provided.'}</Text></View>
        </View>

        {/* Signatures */}
        <View style={pdfStyles.footer}>
          <View style={pdfStyles.signBox}>
            <Text style={{fontFamily: 'Helvetica-Bold', marginBottom: 2}}>{results.selectedTutor}</Text>
            <Text style={{fontSize: 7, color: '#94a3b8'}}>FORM TUTOR SIGNATURE</Text>
          </View>
          <View style={pdfStyles.signBox}>
            <Text style={{fontFamily: 'Helvetica-Bold', marginBottom: 2}}>{results.selectedPrincipal}</Text>
            <Text style={{fontSize: 7, color: '#94a3b8'}}>PRINCIPAL SIGNATURE</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
};

// ==========================================
// 2. UI COMPONENTS (Modern Styles)
// ==========================================

const InputGroup = ({ icon: Icon, label, ...props }) => (
  <div className="space-y-1.5">
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
  const [classes, setClasses] = useState([]);
  const [staff, setStaff] = useState({ principals: [], teachers: [] });
  const [subjects, setSubjects] = useState([]);
  const [students, setStudents] = useState([]);
  const [termInfo, setTermInfo] = useState({ term: 'First Term', session: '2024/2025' });
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [currentResult, setCurrentResult] = useState({
    scores: [], tutorComment: '', principalComment: '', selectedTutor: '', selectedPrincipal: ''
  });

  // Helper Logic
  const handleLogoUpload = (e) => {
    if (e.target.files[0]) setSchoolData({ ...schoolData, logo: URL.createObjectURL(e.target.files[0]) });
  };
  const addItem = (setter, list, item) => item.trim() && setter([...list, item]);
  const removeItem = (setter, list, idx) => setter(list.filter((_, i) => i !== idx));

  // Auto-init scores when student selected
  useEffect(() => {
    if (selectedStudentId) {
      setCurrentResult(prev => ({ 
        ...prev, 
        scores: subjects.map(sub => ({ subject: sub, ca: 0, exam: 0, total: 0, grade: 'F', remark: 'Fail' })) 
      }));
    }
  }, [selectedStudentId, subjects]);

  // Score Logic
  const updateScore = (idx, field, val) => {
    const updated = [...currentResult.scores];
    updated[idx][field] = val;
    const total = (parseFloat(updated[idx].ca)||0) + (parseFloat(updated[idx].exam)||0);
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
      {/* --- Sidebar Navigation --- */}
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
          {steps.map(s => (
            <StepCard 
              key={s.id} 
              active={step === s.id} 
              title={s.title} 
              subtitle={s.sub} 
              icon={s.icon} 
              onClick={() => setStep(s.id)} 
            />
          ))}
        </nav>

        <div className="pt-6 border-t border-slate-100">
           <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
             <div className="text-xs font-bold text-slate-400 uppercase mb-2">Current Session</div>
             <div className="font-semibold text-indigo-900">{termInfo.term}</div>
             <div className="text-sm text-slate-500">{termInfo.session}</div>
           </div>
        </div>
      </aside>

      {/* --- Main Content Area --- */}
      <main className="flex-1 overflow-y-auto relative scroll-smooth">
        <div className="max-w-5xl mx-auto p-8 lg:p-12">
          
          {/* STEP 1: SCHOOL PROFILE */}
          {step === 1 && (
            <div className="space-y-8 animate-fade-in-up">
              <div className="flex justify-between items-end">
                <div>
                  <h2 className="text-3xl font-bold text-slate-900 mb-2">School Identity</h2>
                  <p className="text-slate-500">Set up the official details that will appear on reports.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Logo Uploader */}
                <div className="lg:col-span-1">
                  <label className="block w-full aspect-square rounded-2xl border-2 border-dashed border-slate-300 hover:border-indigo-500 hover:bg-indigo-50 transition-all cursor-pointer flex flex-col items-center justify-center gap-3 group bg-white">
                    {schoolData.logo ? (
                      <img src={schoolData.logo} className="w-32 h-32 object-contain" alt="Logo" />
                    ) : (
                      <>
                        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 group-hover:text-indigo-600 group-hover:scale-110 transition-all">
                          <Upload size={24} />
                        </div>
                        <span className="text-sm font-medium text-slate-500 group-hover:text-indigo-600">Upload Logo</span>
                      </>
                    )}
                    <input type="file" className="hidden" accept="image/*" onChange={handleLogoUpload} />
                  </label>
                </div>

                {/* Details Form */}
                <div className="lg:col-span-2 space-y-5 bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
                   <InputGroup label="School Name" icon={School} value={schoolData.name} onChange={e => setSchoolData({...schoolData, name: e.target.value})} placeholder="e.g. Cambridge High School" />
                   <InputGroup label="Address" icon={MapPin} value={schoolData.address} onChange={e => setSchoolData({...schoolData, address: e.target.value})} placeholder="e.g. 123 Education Lane, Lagos" />
                   <InputGroup label="Contact Info" icon={Phone} value={schoolData.contact} onChange={e => setSchoolData({...schoolData, contact: e.target.value})} placeholder="Phone or Email address" />
                   
                   <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100">
                      <InputGroup label="Current Term" value={termInfo.term} onChange={e => setTermInfo({...termInfo, term: e.target.value})} />
                      <InputGroup label="Session" value={termInfo.session} onChange={e => setTermInfo({...termInfo, session: e.target.value})} />
                   </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: ACADEMICS */}
          {step === 2 && (
            <div className="space-y-8 animate-fade-in-up">
               <div>
                  <h2 className="text-3xl font-bold text-slate-900 mb-2">Academics</h2>
                  <p className="text-slate-500">Define the classes and subjects for this session.</p>
               </div>

               <div className="grid md:grid-cols-2 gap-8">
                 {/* Classes */}
                 <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 h-full">
                    <div className="flex justify-between items-center mb-6">
                       <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2"><LayoutDashboard className="text-indigo-500"/> Classes</h3>
                       <span className="bg-indigo-100 text-indigo-700 text-xs px-2 py-1 rounded-full font-bold">{classes.length}</span>
                    </div>
                    <div className="flex gap-2 mb-4">
                       <input id="clsIn" className="flex-1 bg-slate-50 border-none rounded-xl px-4 focus:ring-2 focus:ring-indigo-500" placeholder="Add Class..." />
                       <button onClick={()=>{addItem(setClasses, classes, document.getElementById('clsIn').value); document.getElementById('clsIn').value=''}} 
                         className="bg-indigo-600 hover:bg-indigo-700 text-white p-3 rounded-xl transition-colors"><Plus size={20}/></button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                       {classes.map((c, i) => (
                         <span key={i} className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium flex items-center gap-2 group hover:bg-red-50 hover:text-red-600 transition-colors cursor-pointer" onClick={()=>removeItem(setClasses, classes, i)}>
                           {c} <Trash2 size={14} className="opacity-0 group-hover:opacity-100"/>
                         </span>
                       ))}
                       {classes.length === 0 && <p className="text-slate-400 text-sm italic">No classes added yet.</p>}
                    </div>
                 </div>

                 {/* Subjects */}
                 <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 h-full">
                    <div className="flex justify-between items-center mb-6">
                       <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2"><BookOpen className="text-emerald-500"/> Subjects</h3>
                       <span className="bg-emerald-100 text-emerald-700 text-xs px-2 py-1 rounded-full font-bold">{subjects.length}</span>
                    </div>
                    <div className="flex gap-2 mb-4">
                       <input id="subIn" className="flex-1 bg-slate-50 border-none rounded-xl px-4 focus:ring-2 focus:ring-emerald-500" placeholder="Add Subject..." />
                       <button onClick={()=>{addItem(setSubjects, subjects, document.getElementById('subIn').value); document.getElementById('subIn').value=''}} 
                         className="bg-emerald-600 hover:bg-emerald-700 text-white p-3 rounded-xl transition-colors"><Plus size={20}/></button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                       {subjects.map((s, i) => (
                         <span key={i} className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium flex items-center gap-2 group hover:bg-red-50 hover:text-red-600 transition-colors cursor-pointer" onClick={()=>removeItem(setSubjects, subjects, i)}>
                           {s} <Trash2 size={14} className="opacity-0 group-hover:opacity-100"/>
                         </span>
                       ))}
                       {subjects.length === 0 && <p className="text-slate-400 text-sm italic">No subjects added yet.</p>}
                    </div>
                 </div>
               </div>
            </div>
          )}

          {/* STEP 3: STAFF */}
          {step === 3 && (
             <div className="space-y-8 animate-fade-in-up">
                <div>
                   <h2 className="text-3xl font-bold text-slate-900 mb-2">Staff Directory</h2>
                   <p className="text-slate-500">Manage signatures for Tutors and Principals.</p>
                </div>
                
                <div className="grid md:grid-cols-2 gap-8">
                  {/* Teachers Panel */}
                  <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                     <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-indigo-900"><Users size={18}/> Teachers</h3>
                     <div className="flex gap-2 mb-4">
                        <InputGroup id="teachIn" placeholder="Name..." icon={UserPlus} />
                        <button onClick={()=>{
                           const val = document.getElementById('teachIn').value;
                           if(val) setStaff({...staff, teachers: [...staff.teachers, val]});
                           document.getElementById('teachIn').value = '';
                        }} className="bg-slate-900 text-white px-4 rounded-xl font-medium hover:bg-slate-800">Add</button>
                     </div>
                     <div className="space-y-2">
                        {staff.teachers.map((t,i) => (
                           <div key={i} className="p-3 bg-slate-50 rounded-xl flex justify-between items-center text-sm font-medium text-slate-700">
                              {t} <button onClick={()=>removeItem((v)=>setStaff({...staff, teachers:v}), staff.teachers, i)} className="text-slate-400 hover:text-red-500"><Trash2 size={16}/></button>
                           </div>
                        ))}
                     </div>
                  </div>

                  {/* Principals Panel */}
                  <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                     <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-purple-900"><GraduationCap size={18}/> Principals</h3>
                     <div className="flex gap-2 mb-4">
                        <InputGroup id="prinIn" placeholder="Name..." icon={UserPlus} />
                        <button onClick={()=>{
                           const val = document.getElementById('prinIn').value;
                           if(val) setStaff({...staff, principals: [...staff.principals, val]});
                           document.getElementById('prinIn').value = '';
                        }} className="bg-slate-900 text-white px-4 rounded-xl font-medium hover:bg-slate-800">Add</button>
                     </div>
                     <div className="space-y-2">
                        {staff.principals.map((t,i) => (
                           <div key={i} className="p-3 bg-slate-50 rounded-xl flex justify-between items-center text-sm font-medium text-slate-700">
                              {t} <button onClick={()=>removeItem((v)=>setStaff({...staff, principals:v}), staff.principals, i)} className="text-slate-400 hover:text-red-500"><Trash2 size={16}/></button>
                           </div>
                        ))}
                     </div>
                  </div>
                </div>
             </div>
          )}

          {/* STEP 4: ENROLLMENT */}
          {step === 4 && (
             <div className="space-y-8 animate-fade-in-up">
                <div className="flex justify-between items-end">
                   <div>
                     <h2 className="text-3xl font-bold text-slate-900 mb-2">Student Enrollment</h2>
                     <p className="text-slate-500">Register students into classes.</p>
                   </div>
                   <div className="bg-white px-4 py-2 rounded-full border border-slate-200 text-sm font-semibold text-slate-600 shadow-sm">
                      Total Students: {students.length}
                   </div>
                </div>

                <div className="bg-white p-8 rounded-3xl shadow-lg shadow-slate-200/50 border border-slate-100">
                   <form onSubmit={(e) => {
                      e.preventDefault();
                      const fd = new FormData(e.target);
                      setStudents([...students, { id: Date.now().toString(), name: fd.get('name'), className: fd.get('class'), gender: fd.get('gender'), admNo: fd.get('adm') }]);
                      e.target.reset();
                   }} className="grid md:grid-cols-2 gap-6">
                      <div className="col-span-2"><InputGroup name="name" label="Full Name" placeholder="e.g. John Doe" icon={Search} required /></div>
                      <InputGroup name="adm" label="Admission No" placeholder="e.g. 2024/001" />
                      
                      <div className="space-y-1.5">
                         <label className="text-xs font-semibold text-slate-500 uppercase ml-1">Gender</label>
                         <select name="gender" className="w-full bg-white border border-slate-200 text-slate-700 text-sm rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-indigo-500 outline-none">
                            <option value="M">Male</option><option value="F">Female</option>
                         </select>
                      </div>

                      <div className="space-y-1.5 col-span-2 md:col-span-2">
                         <label className="text-xs font-semibold text-slate-500 uppercase ml-1">Class</label>
                         <select name="class" required className="w-full bg-white border border-slate-200 text-slate-700 text-sm rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-indigo-500 outline-none">
                            <option value="">Select Class...</option>
                            {classes.map((c,i)=><option key={i} value={c}>{c}</option>)}
                         </select>
                      </div>

                      <button className="col-span-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-indigo-500/30 flex justify-center items-center gap-2">
                         <UserPlus size={18}/> Enrol Student
                      </button>
                   </form>
                </div>

                {/* Student List */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                   {students.map(s => (
                      <div key={s.id} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
                         <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${s.gender==='M'?'bg-blue-500':'bg-pink-500'}`}>
                           {s.name.charAt(0)}
                         </div>
                         <div>
                            <div className="font-bold text-slate-800 text-sm">{s.name}</div>
                            <div className="text-xs text-slate-500">{s.className} • {s.admNo}</div>
                         </div>
                      </div>
                   ))}
                </div>
             </div>
          )}

          {/* STEP 5: RESULTS */}
          {step === 5 && (
            <div className="h-[calc(100vh-140px)] flex flex-col lg:flex-row gap-6 animate-fade-in-up">
              {/* Left Column: Controls */}
              <div className="w-full lg:w-1/3 flex flex-col gap-6 overflow-y-auto pr-2">
                 <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                    <label className="text-xs font-bold text-slate-400 uppercase mb-2 block">Select Student</label>
                    <select 
                      className="w-full p-3 bg-slate-50 border-none rounded-xl text-sm font-semibold text-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none"
                      onChange={(e) => setSelectedStudentId(e.target.value)}
                      value={selectedStudentId}
                    >
                       <option value="">-- Choose Student --</option>
                       {students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                 </div>

                 {selectedStudentId && (
                   <>
                     <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 space-y-4">
                        <h3 className="font-bold text-slate-800">Scores</h3>
                        {currentResult.scores.map((score, i) => (
                           <div key={i} className="flex items-center gap-2">
                              <span className="text-xs font-bold text-slate-500 w-20 truncate">{score.subject}</span>
                              <input type="number" className="w-14 p-2 bg-slate-50 rounded-lg text-center text-xs font-bold" placeholder="CA" 
                                value={score.ca} onChange={e=>updateScore(i,'ca',e.target.value)} />
                              <input type="number" className="w-14 p-2 bg-slate-50 rounded-lg text-center text-xs font-bold" placeholder="EX" 
                                value={score.exam} onChange={e=>updateScore(i,'exam',e.target.value)} />
                              <span className={`text-xs font-bold w-8 text-center ${score.total<40?'text-red-500':'text-emerald-600'}`}>{score.total}</span>
                           </div>
                        ))}
                     </div>

                     <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 space-y-4">
                        <h3 className="font-bold text-slate-800">Remarks</h3>
                        <textarea className="w-full p-3 bg-slate-50 rounded-xl text-sm" placeholder="Class Teacher's Comment" rows="2"
                           value={currentResult.tutorComment} onChange={e=>setCurrentResult({...currentResult, tutorComment:e.target.value})}></textarea>
                        <select className="w-full p-2 bg-slate-50 rounded-xl text-sm" value={currentResult.selectedTutor} onChange={e=>setCurrentResult({...currentResult, selectedTutor:e.target.value})}>
                           <option value="">Sign: Form Tutor</option>
                           {staff.teachers.map((t,i)=><option key={i} value={t}>{t}</option>)}
                        </select>
                        <textarea className="w-full p-3 bg-slate-50 rounded-xl text-sm" placeholder="Principal's Comment" rows="2"
                           value={currentResult.principalComment} onChange={e=>setCurrentResult({...currentResult, principalComment:e.target.value})}></textarea>
                        <select className="w-full p-2 bg-slate-50 rounded-xl text-sm" value={currentResult.selectedPrincipal} onChange={e=>setCurrentResult({...currentResult, selectedPrincipal:e.target.value})}>
                           <option value="">Sign: Principal</option>
                           {staff.principals.map((p,i)=><option key={i} value={p}>{p}</option>)}
                        </select>
                     </div>
                   </>
                 )}
              </div>

              {/* Right Column: PDF Preview */}
              <div className="w-full lg:w-2/3 bg-slate-800 rounded-3xl overflow-hidden shadow-2xl relative flex flex-col">
                 <div className="bg-slate-900 p-3 flex justify-between items-center px-6">
                    <span className="text-slate-400 text-xs font-bold uppercase tracking-widest">Live Preview</span>
                    {selectedStudentId && <div className="flex gap-2">
                       <div className="w-3 h-3 rounded-full bg-red-500"/>
                       <div className="w-3 h-3 rounded-full bg-yellow-500"/>
                       <div className="w-3 h-3 rounded-full bg-green-500"/>
                    </div>}
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

          {/* Navigation Buttons (Bottom) */}
          <div className="flex justify-between mt-8 pt-6 border-t border-slate-200">
             <button 
               onClick={()=>setStep(s=>Math.max(1, s-1))} disabled={step===1}
               className="text-slate-500 font-bold hover:text-slate-800 disabled:opacity-30 flex items-center gap-2 transition-colors">
               <ArrowRight className="rotate-180" size={18}/> Previous
             </button>
             {step < 5 && (
               <button 
                 onClick={()=>setStep(s=>Math.min(5, s+1))}
                 className="bg-slate-900 text-white px-8 py-3 rounded-full font-bold hover:bg-slate-800 flex items-center gap-2 transition-transform hover:scale-105 shadow-lg shadow-slate-900/20">
                 Next Step <ArrowRight size={18}/>
               </button>
             )}
          </div>

        </div>
      </main>
      
      {/* Global CSS for Animations */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        body { font-family: 'Inter', sans-serif; }
        .animate-fade-in-up { animation: fadeInUp 0.5s ease-out forwards; }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        /* Hide scrollbar for clean look */
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
        ::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
      `}</style>
    </div>
  );
};

export default App;
