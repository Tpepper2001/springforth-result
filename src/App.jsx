import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import {
  Document, Page, Text, View, StyleSheet, PDFViewer, Image as PDFImage, PDFDownloadLink
} from '@react-pdf/renderer';
import {
  LayoutDashboard, LogOut, Loader2, Plus, School, User, Download,
  X, Eye, Trash2, ShieldCheck, Menu, Users, UserPlus
} from 'lucide-react';

// ==================== SUPABASE CONFIG ====================
const supabaseUrl = 'https://ghlnenmfwlpwlqdrbean.supabase.co'; 
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdobG5lbm1md2xwd2xxZHJiZWFuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ0MTE0MDQsImV4cCI6MjA3OTk4NzQwNH0.rNILUdI035c4wl4kFkZFP4OcIM_t7bNMqktKm25d5Gg'; 
const supabase = createClient(supabaseUrl, supabaseKey);

// ==================== HELPERS ====================
const BEHAVIORAL_TRAITS = ['COOPERATION', 'LEADERSHIP', 'HONESTY', 'SELF DISCIPLINE', 'RESPECT', 'RESPONSIBILITY', 'EMPATHY', 'PUNCTUALITY', 'NEATNESS', 'INITIATIVE'];
const RATINGS = ['Excellent', 'Very Good', 'Good', 'Fair', 'Poor'];

const calculateGrade = (obtained, maxPossible) => {
  if (!maxPossible || maxPossible === 0) return { grade: '-', remark: '-' };
  const percentage = (obtained / maxPossible) * 100;
  if (percentage >= 86) return { grade: 'A*', remark: 'Distinction' };
  if (percentage >= 76) return { grade: 'A', remark: 'Excellent' };
  if (percentage >= 66) return { grade: 'B', remark: 'Very Good' };
  if (percentage >= 60) return { grade: 'C', remark: 'Good' };
  if (percentage >= 50) return { grade: 'D', remark: 'Fairly Good' };
  if (percentage >= 40) return { grade: 'E', remark: 'Pass' };
  return { grade: 'F', remark: 'Fail' };
};

const generatePIN = () => Math.floor(100000 + Math.random() * 900000).toString();
const generateAdmissionNumber = () => `${new Date().getFullYear()}/${Math.floor(1000 + Math.random() * 9000)}`;

const imageUrlToBase64 = async (url) => {
    if (!url) return null;
    try {
        const response = await fetch(url + '?t=' + new Date().getTime());
        const blob = await response.blob();
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.readAsDataURL(blob);
        });
    } catch (e) { return null; }
};

const useAutoSave = (callback, delay = 2000) => {
  const [saving, setSaving] = useState(false);
  const timeoutRef = useRef(null);
  const trigger = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(async () => {
      setSaving(true);
      await callback();
      setSaving(false);
    }, delay);
  }, [callback, delay]);
  return { save: trigger, saving };
};

// ==================== PDF STYLES ====================
const pdfStyles = StyleSheet.create({
  page: { padding: 30, fontFamily: 'Helvetica', fontSize: 9, color: '#333' },
  headerContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 15, borderBottomWidth: 2, borderBottomColor: '#0f172a', paddingBottom: 10 },
  logoBox: { width: 70, height: 70, marginRight: 15 },
  logo: { width: '100%', height: '100%', objectFit: 'contain' },
  schoolName: { fontSize: 22, fontFamily: 'Helvetica-Bold', color: '#0f172a', textTransform: 'uppercase' },
  reportTitleBox: { alignItems: 'center', marginBottom: 15, paddingVertical: 6, backgroundColor: '#f1f5f9' },
  infoContainer: { marginBottom: 15, borderWidth: 1, borderColor: '#e2e8f0' },
  infoRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#f1f5f9', padding: 6 },
  table: { width: '100%', marginBottom: 15, borderWidth: 1, borderColor: '#e2e8f0' },
  tableHeader: { flexDirection: 'row', backgroundColor: '#0f172a', paddingVertical: 6 },
  headerText: { color: 'white', fontSize: 8, fontWeight: 'bold', textAlign: 'center' },
  tableRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#e2e8f0', minHeight: 22, alignItems: 'center' },
  cell: { padding: 4, fontSize: 9 }
});

const ResultPDF = ({ school, student, results, classInfo, comments, behaviors = [], reportType = 'full', logoBase64 }) => {
  const config = school.assessment_config || [];
  const maxPossibleScore = config.reduce((sum, f) => sum + parseInt(f.max), 0);
  const processedResults = results.map(r => {
    const rawScores = r.scores || {};
    let total = 0;
    config.forEach(f => total += (parseFloat(rawScores[f.code]) || 0));
    const { grade, remark } = calculateGrade(total, maxPossibleScore);
    return { ...r, scores: rawScores, total, grade, remark };
  });

  return (
    <Document>
      <Page size="A4" style={pdfStyles.page}>
        <View style={pdfStyles.headerContainer}>
          <View style={pdfStyles.logoBox}>{logoBase64 && <PDFImage src={logoBase64} style={pdfStyles.logo} />}</View>
          <View style={{flex: 1}}><Text style={pdfStyles.schoolName}>{school?.name}</Text><Text>{school?.address}</Text></View>
        </View>
        <View style={pdfStyles.reportTitleBox}><Text>{reportType === 'mid' ? 'MID-TERM' : 'END OF TERM'} REPORT</Text></View>
        <View style={pdfStyles.infoContainer}>
            <View style={pdfStyles.infoRow}><Text style={{flex:1}}>Name: {student.name}</Text><Text style={{flex:1}}>Class: {classInfo?.name}</Text></View>
        </View>
        <View style={pdfStyles.table}>
          <View style={pdfStyles.tableHeader}>
            <Text style={[pdfStyles.cell, {width: '40%'}, pdfStyles.headerText]}>SUBJECT</Text>
            {config.map(f => <Text key={f.code} style={[pdfStyles.cell, {flex:1}, pdfStyles.headerText]}>{f.name}</Text>)}
            <Text style={[pdfStyles.cell, {width: '15%'}, pdfStyles.headerText]}>TOTAL</Text>
          </View>
          {processedResults.map((r, i) => (
            <View key={i} style={pdfStyles.tableRow}>
              <Text style={[pdfStyles.cell, {width: '40%'}]}>{r.subjects?.name}</Text>
              {config.map(f => <Text key={f.code} style={[pdfStyles.cell, {flex:1, textAlign: 'center'}]}>{r.scores[f.code] || 0}</Text>)}
              <Text style={[pdfStyles.cell, {width: '15%', textAlign: 'center'}]}>{r.total}</Text>
            </View>
          ))}
        </View>
      </Page>
    </Document>
  );
};

// ==================== COMPONENTS ====================

const SchoolAdmin = ({ profile, onLogout }) => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [school, setSchool] = useState(null);
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [teachers, setTeachers] = useState([]);

  const fetchData = useCallback(async () => {
    const { data: s } = await supabase.from('schools').select('*').eq('id', profile.school_id).single();
    setSchool(s);
    const { data: cls } = await supabase.from('classes').select('*, profiles(full_name)').eq('school_id', s.id);
    setClasses(cls || []);
    const { data: stu } = await supabase.from('students').select('*, classes(name), comments(submission_status)').eq('school_id', s.id);
    setStudents(stu || []);
    const { data: tch } = await supabase.from('profiles').select('*').eq('school_id', s.id).eq('role', 'teacher');
    setTeachers(tch || []);
  }, [profile.school_id]);

  useEffect(() => { fetchData(); }, [fetchData]);

  return (
    <div className="flex h-screen bg-gray-100">
      <div className="w-64 bg-slate-900 text-white p-6 space-y-4">
        <h2 className="font-bold text-xl mb-8 flex items-center gap-2"><School/> Admin</h2>
        <button onClick={()=>setActiveTab('dashboard')} className={`w-full text-left p-2 rounded ${activeTab==='dashboard'?'bg-blue-600':''}`}>Dashboard</button>
        <button onClick={()=>setActiveTab('students')} className={`w-full text-left p-2 rounded ${activeTab==='students'?'bg-blue-600':''}`}>Students</button>
        <button onClick={()=>setActiveTab('classes')} className={`w-full text-left p-2 rounded ${activeTab==='classes'?'bg-blue-600':''}`}>Classes</button>
        <button onClick={onLogout} className="text-red-400 mt-auto block">Logout</button>
      </div>
      <div className="flex-1 p-8 overflow-auto">
        {activeTab === 'dashboard' && <h1 className="text-2xl font-bold">Welcome to {school?.name}</h1>}
        {activeTab === 'students' && (
            <div className="bg-white rounded shadow">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 border-b">
                        <tr><th className="p-4">Name</th><th className="p-4">Class</th><th className="p-4">Status</th></tr>
                    </thead>
                    <tbody>
                        {students.map(s => (
                            <tr key={s.id} className="border-b">
                                <td className="p-4">{s.name}</td>
                                <td className="p-4">{s.classes?.name}</td>
                                <td className="p-4">{s.comments?.[0]?.submission_status || 'Draft'}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        )}
        {activeTab === 'classes' && (
            <div className="bg-white p-6 rounded shadow max-w-md">
                <form onSubmit={async(e)=>{
                    e.preventDefault(); const fd=new FormData(e.target);
                    await supabase.from('classes').insert({school_id:school.id, name:fd.get('name'), form_tutor_id:fd.get('tid')});
                    fetchData(); e.target.reset();
                }} className="space-y-4">
                    <input name="name" placeholder="Class Name" className="w-full border p-2 rounded" required />
                    <select name="tid" className="w-full border p-2 rounded">
                        <option value="">Select Tutor</option>
                        {teachers.map(t=><option key={t.id} value={t.id}>{t.full_name}</option>)}
                    </select>
                    <button className="w-full bg-blue-600 text-white py-2 rounded">Create Class</button>
                </form>
            </div>
        )}
      </div>
    </div>
  );
};

const TeacherDashboard = ({ profile, onLogout }) => {
  const [curClass, setCurClass] = useState(null);
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [scores, setScores] = useState({});
  const [subjects, setSubjects] = useState([]);
  const [school, setSchool] = useState(null);

  const { save, saving } = useAutoSave(async () => {
    if (!selectedStudent) return;
    const results = subjects.map(s => ({
        student_id: selectedStudent.id, subject_id: s.id, scores: scores[s.id] || {}, total: Object.values(scores[s.id]||{}).reduce((a,b)=>a+b,0)
    }));
    await supabase.from('results').delete().eq('student_id', selectedStudent.id);
    await supabase.from('results').insert(results);
  });

  useEffect(() => {
    const init = async () => {
        const { data: cls } = await supabase.from('classes').select('*, schools(*)').eq('form_tutor_id', profile.id).limit(1).single();
        if(cls) {
            setCurClass(cls);
            setSchool(cls.schools);
            const { data: sub } = await supabase.from('subjects').select('*').eq('class_id', cls.id);
            setSubjects(sub || []);
            const { data: stu } = await supabase.from('students').select('*').eq('class_id', cls.id);
            setStudents(stu || []);
        }
    };
    init();
  }, [profile.id]);

  const loadStudent = async (s) => {
      const { data: res } = await supabase.from('results').select('*').eq('student_id', s.id);
      const sm = {};
      res?.forEach(r => sm[r.subject_id] = r.scores);
      setScores(sm);
      setSelectedStudent(s);
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <div className="w-64 bg-white border-r flex flex-col">
        <div className="p-4 bg-slate-900 text-white font-bold">{profile.full_name}</div>
        <div className="p-4 border-b">
            <button onClick={async()=>{
                const n = window.prompt("Student Name:");
                if(n) {
                    await supabase.from('students').insert({name:n, school_id:school.id, class_id:curClass.id, admission_no:generateAdmissionNumber(), parent_pin:generatePIN()});
                    const { data } = await supabase.from('students').select('*').eq('class_id', curClass.id);
                    setStudents(data);
                }
            }} className="w-full bg-blue-600 text-white py-2 rounded text-sm">+ Add Student</button>
        </div>
        <div className="flex-1 overflow-auto">
            {students.map(s => (
                <div key={s.id} onClick={()=>loadStudent(s)} className={`p-3 border-b cursor-pointer ${selectedStudent?.id===s.id?'bg-blue-50 border-l-4 border-blue-600':''}`}>{s.name}</div>
            ))}
        </div>
        <button onClick={onLogout} className="p-4 text-red-500 border-t">Logout</button>
      </div>
      <div className="flex-1 p-8 overflow-auto">
        {!selectedStudent ? <div className="text-center text-gray-400 mt-20">Select a student</div> : (
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <h1 className="text-2xl font-bold">{selectedStudent.name}</h1>
                    {saving && <span className="text-green-500 animate-pulse">Saving...</span>}
                </div>
                <table className="w-full bg-white rounded shadow text-sm">
                    <thead className="bg-gray-50">
                        <tr><th className="p-3 text-left">Subject</th>{school?.assessment_config?.map(c=><th key={c.code} className="p-3">{c.name}</th>)}</tr>
                    </thead>
                    <tbody>
                        {subjects.map(s => (
                            <tr key={s.id} className="border-b">
                                <td className="p-3 font-bold">{s.name}</td>
                                {school?.assessment_config?.map(c => (
                                    <td key={c.code} className="p-3">
                                        <input type="number" className="w-16 border rounded p-1 text-center" 
                                            value={scores[s.id]?.[c.code] || ''} 
                                            onChange={(e)=>{
                                                const val = parseFloat(e.target.value) || 0;
                                                setScores(prev=>({...prev, [s.id]: {...(prev[s.id]||{}), [c.code]: val}}));
                                                save();
                                            }}
                                        />
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
                <button onClick={async()=>{
                    const n = window.prompt("Subject Name:");
                    if(n) {
                        await supabase.from('subjects').insert({class_id:curClass.id, name:n});
                        const { data } = await supabase.from('subjects').select('*').eq('class_id', curClass.id);
                        setSubjects(data);
                    }
                }} className="text-blue-600 font-bold">+ Add Subject to Class</button>
            </div>
        )}
      </div>
    </div>
  );
};

const Auth = ({ onLogin, onParent }) => {
    const [mode, setMode] = useState('login'); 
    const [form, setForm] = useState({ email: '', password: '', name: '', schoolId: '' });
    const [schools, setSchools] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        supabase.from('schools').select('id, name').then(({data}) => setSchools(data || []));
    }, []);

    const handleAuth = async (e) => {
        e.preventDefault(); setLoading(true);
        try {
            if (mode === 'school_reg') {
                const { data: auth, error: authError } = await supabase.auth.signUp({ email: form.email, password: form.password });
                if (authError) throw authError;
                if(auth.user) {
                    const { data: school, error: schoolError } = await supabase.from('schools').insert({ owner_id: auth.user.id, name: form.name }).select().single();
                    if (schoolError) throw schoolError;
                    await supabase.from('profiles').insert({ id: auth.user.id, full_name: form.name, role: 'admin', school_id: school.id });
                    alert("Success! Please log in."); setMode('login');
                }
            } else if (mode === 'teacher_reg' || mode === 'admin_reg') {
                 if (!form.schoolId) throw new Error("Select a school");
                 const { data: auth, error: authError } = await supabase.auth.signUp({ email: form.email, password: form.password });
                 if (authError) throw authError;
                 if(auth.user){
                    await supabase.from('profiles').insert({ id: auth.user.id, full_name: form.name, role: mode==='teacher_reg'?'teacher':'admin', school_id: form.schoolId });
                    alert("Success! Please log in."); setMode('login');
                 }
            } else {
                const { error } = await supabase.auth.signInWithPassword({ email: form.email, password: form.password });
                if (error) throw error;
            }
        } catch (err) { alert(err.message); } finally { setLoading(false); }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
            <div className="bg-white p-8 rounded shadow w-full max-w-md border-t-4 border-blue-600">
                <h1 className="text-2xl font-bold text-center mb-6">Springforth Results</h1>
                <div className="flex gap-2 mb-6 text-[10px] uppercase font-bold overflow-x-auto pb-2">
                    {['login', 'school_reg', 'teacher_reg'].map(m => (
                        <button key={m} onClick={()=>setMode(m)} className={mode===m?'text-blue-600':''}>{m.replace('_',' ')}</button>
                    ))}
                </div>
                <form onSubmit={handleAuth} className="space-y-4">
                    {mode !== 'login' && <input placeholder="Full Name" className="w-full p-2 border rounded" onChange={e=>setForm({...form, name:e.target.value})} required />}
                    <input type="email" placeholder="Email" className="w-full p-2 border rounded" onChange={e=>setForm({...form, email:e.target.value})} required />
                    <input type="password" placeholder="Password" className="w-full p-2 border rounded" onChange={e=>setForm({...form, password:e.target.value})} required />
                    {mode.includes('teacher') && (
                        <select className="w-full p-2 border rounded" onChange={e=>setForm({...form, schoolId:e.target.value})} required>
                            <option value="">Select School</option>
                            {schools.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                    )}
                    <button disabled={loading} className="w-full bg-blue-600 text-white py-2 rounded font-bold">{loading?'...':'Enter Portal'}</button>
                </form>
                {mode==='login' && <button onClick={onParent} className="w-full mt-4 bg-green-600 text-white py-2 rounded font-bold">Parent Access</button>}
            </div>
        </div>
    );
};

const ParentPortal = ({ onBack }) => {
    const [creds, setCreds] = useState({ adm: '', pin: '' });
    const [data, setData] = useState(null);

    const fetchResult = async (e) => {
        e.preventDefault();
        const { data: stu } = await supabase.from('students').select('*, schools(*), classes(*), results(*, subjects(*))').eq('admission_no', creds.adm).eq('parent_pin', creds.pin).maybeSingle();
        if (!stu) return alert('Invalid Credentials');
        const logo = await imageUrlToBase64(stu.schools.logo_url);
        setData({ student: stu, school: stu.schools, classInfo: stu.classes, results: stu.results, logoBase64: logo });
    };

    if (data) return (
        <div className="fixed inset-0 z-50 bg-white">
            <div className="p-4 flex justify-between border-b"><button onClick={()=>setData(null)}>Back</button></div>
            <PDFViewer className="w-full h-full"><ResultPDF {...data} /></PDFViewer>
        </div>
    );

    return (
        <div className="min-h-screen flex items-center justify-center bg-green-50 p-4">
            <form onSubmit={fetchResult} className="bg-white p-8 rounded shadow w-full max-w-sm">
                <h2 className="text-xl font-bold text-center mb-6">Parent Portal</h2>
                <input placeholder="Admission No" className="w-full p-2 border rounded mb-3" onChange={e=>setCreds({...creds, adm:e.target.value})} />
                <input type="password" placeholder="PIN" className="w-full p-2 border rounded mb-4" onChange={e=>setCreds({...creds, pin:e.target.value})} />
                <button className="w-full bg-green-600 text-white py-2 rounded font-bold">View Result</button>
                <button type="button" onClick={onBack} className="w-full text-center mt-4 text-sm text-gray-400">Back</button>
            </form>
        </div>
    );
};

// ==================== ROOT ====================
const App = () => {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [view, setView] = useState('auth');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => { setSession(session); if(!session) setLoading(false); });
    supabase.auth.onAuthStateChange((_event, session) => { setSession(session); if(!session) { setProfile(null); setView('auth'); } });
  }, []);

  useEffect(() => {
    if (session) {
      supabase.from('profiles').select('*').eq('id', session.user.id).maybeSingle().then(({data}) => {
        setProfile(data); setLoading(false);
      });
    }
  }, [session]);

  if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-blue-600" size={48}/></div>;
  if (view === 'parent') return <ParentPortal onBack={() => setView('auth')} />;
  if (!session) return <Auth onLogin={() => setView('dashboard')} onParent={() => setView('parent')} />;
  if (!profile) return <div className="p-20 text-center"><button onClick={()=>supabase.auth.signOut()} className="bg-red-500 text-white p-2">Error: No Profile found. Sign Out & Try Again</button></div>;

  return profile.role === 'admin' ? <SchoolAdmin profile={profile} onLogout={() => supabase.auth.signOut()} /> : <TeacherDashboard profile={profile} onLogout={() => supabase.auth.signOut()} />;
};

export default App;