import React, { useState, useEffect, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Document, Page, Text, View, StyleSheet, PDFViewer, PDFDownloadLink } from '@react-pdf/renderer';
import { Loader2, Plus, School, LogOut, Users, Settings, Save, Eye, Trash2, FileText, Star, MessageSquare } from 'lucide-react';

const supabaseUrl = 'https://ghlnenmfwlpwlqdrbean.supabase.co'; 
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdobG5lbm1md2xwd2xxZHJiZWFuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ0MTE0MDQsImV4cCI6MjA3OTk4NzQwNH0.rNILUdI035c4wl4kFkZFP4OcIM_t7bNMqktKm25d5Gg'; 
const supabase = createClient(supabaseUrl, supabaseKey);

const BEHAVIORS = ['Cooperation', 'Honesty', 'Self-Control', 'Neatness', 'Punctuality', 'Leadership', 'Responsibility'];
const RATINGS = ['Excellent', 'Very Good', 'Good', 'Fair', 'Poor'];

// ==================== PDF STYLES ====================
const pdfStyles = StyleSheet.create({
  page: { padding: 40, fontSize: 9, fontFamily: 'Helvetica' },
  header: { textAlign: 'center', marginBottom: 15, borderBottom: 2, paddingBottom: 10 },
  schoolName: { fontSize: 18, fontWeight: 'bold' },
  sectionTitle: { fontSize: 10, fontWeight: 'bold', marginTop: 15, backgroundColor: '#f0f0f0', padding: 3 },
  table: { width: '100%', marginTop: 10, borderTop: 1 },
  row: { flexDirection: 'row', borderBottom: 1, padding: 4 },
  cell: { flex: 1, textAlign: 'center' },
  commentBox: { marginTop: 10, padding: 5, border: 1, borderColor: '#ccc', fontStyle: 'italic' }
});

const ResultPDF = ({ school, student, results, comments }) => {
  const config = school?.assessment_config || [];
  const behaviors = comments?.behaviors || {};
  
  return (
    <Document>
      <Page size="A4" style={pdfStyles.page}>
        <View style={pdfStyles.header}>
          <Text style={pdfStyles.schoolName}>{school?.name}</Text>
          <Text>{school?.address}</Text>
          <Text>{school?.current_term} Report - {school?.current_session}</Text>
        </View>
        <Text>Student: {student?.name} | Admission: {student?.admission_no}</Text>

        <Text style={pdfStyles.sectionTitle}>ACADEMIC PERFORMANCE</Text>
        <View style={pdfStyles.table}>
          <View style={[pdfStyles.row, { backgroundColor: '#eee' }]}>
            <Text style={{ width: 120 }}>Subject</Text>
            {config.map(c => <Text key={c.code} style={pdfStyles.cell}>{c.name}</Text>)}
            <Text style={pdfStyles.cell}>Total</Text>
          </View>
          {results.map(r => (
            <View key={r.id} style={pdfStyles.row}>
              <Text style={{ width: 120 }}>{r.subjects?.name}</Text>
              {config.map(c => <Text key={c.code} style={pdfStyles.cell}>{r.scores[c.code] || 0}</Text>)}
              <Text style={pdfStyles.cell}>{r.total}</Text>
            </View>
          ))}
        </View>

        <Text style={pdfStyles.sectionTitle}>PSYCHOMOTOR & BEHAVIOR</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 5 }}>
          {BEHAVIORS.map(b => (
            <Text key={b} style={{ width: '50%', marginBottom: 3 }}>{b}: {behaviors[b] || 'Good'}</Text>
          ))}
        </View>

        <Text style={pdfStyles.sectionTitle}>TEACHER'S REMARKS</Text>
        <View style={pdfStyles.commentBox}>
           <Text>Mid-term: {comments?.midterm_tutor_comment || 'No comment.'}</Text>
           <Text style={{ marginTop: 5 }}>Final: {comments?.tutor_comment || 'No comment.'}</Text>
        </View>
      </Page>
    </Document>
  );
};

// ==================== DASHBOARD ====================
const Dashboard = ({ profile, onLogout }) => {
  const [activeTab, setActiveTab] = useState('scores');
  const [school, setSchool] = useState(null);
  const [classList, setClassList] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [students, setStudents] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [scores, setScores] = useState({});
  const [commentData, setCommentData] = useState({ tutor_comment: '', midterm_tutor_comment: '', behaviors: {} });
  const [studentResults, setStudentResults] = useState([]);
  const [saving, setSaving] = useState(false);
  const [previewing, setPreviewing] = useState(false);

  const fetchBaseData = useCallback(async () => {
    const { data: s } = await supabase.from('schools').select('*').eq('id', profile.school_id).single();
    setSchool(s);
    const { data: cls } = await supabase.from('classes').select('*').eq('school_id', profile.school_id).order('name');
    setClassList(cls || []);
  }, [profile.school_id]);

  useEffect(() => { fetchBaseData(); }, [fetchBaseData]);

  const loadClass = async (id) => {
    setSelectedClassId(id);
    setSelectedStudent(null);
    const { data: stu } = await supabase.from('students').select('*').eq('class_id', id).order('name');
    setStudents(stu || []);
    const { data: sub } = await supabase.from('subjects').select('*').eq('class_id', id).order('name');
    setSubjects(sub || []);
  };

  const loadStudent = async (stu) => {
    setSelectedStudent(stu);
    const { data: res } = await supabase.from('results').select('*, subjects(name)').eq('student_id', stu.id);
    const { data: comm } = await supabase.from('comments').select('*').eq('student_id', stu.id).maybeSingle();
    
    const sm = {};
    res?.forEach(r => sm[r.subject_id] = r.scores);
    setScores(sm);
    setStudentResults(res || []);
    setCommentData(comm || { tutor_comment: '', midterm_tutor_comment: '', behaviors: {} });
  };

  const handleSave = async () => {
    if (!selectedStudent) return;
    setSaving(true);
    const updates = subjects.map(s => ({
      student_id: selectedStudent.id, subject_id: s.id,
      scores: scores[s.id] || {},
      total: Object.values(scores[s.id] || {}).reduce((a, b) => a + (parseFloat(b) || 0), 0)
    }));
    
    await supabase.from('results').delete().eq('student_id', selectedStudent.id);
    await supabase.from('results').insert(updates);
    
    await supabase.from('comments').upsert({
      student_id: selectedStudent.id, school_id: school.id,
      tutor_comment: commentData.tutor_comment || '',
      midterm_tutor_comment: commentData.midterm_tutor_comment || '',
      behaviors: commentData.behaviors || {}
    });

    setSaving(false);
    alert("Record Saved!");
    loadStudent(selectedStudent);
  };

  return (
    <div className="flex h-screen bg-gray-50 text-slate-800">
      {/* SIDEBAR */}
      <div className="w-64 bg-slate-900 text-white flex flex-col p-4">
        <div className="flex items-center gap-2 font-bold text-xl mb-6"><School /> Results</div>
        
        <div className="mb-6">
          <label className="text-[10px] text-gray-400 font-bold uppercase">Class Manager</label>
          <select className="w-full bg-slate-800 p-2 rounded mt-1 text-sm border-none outline-none" value={selectedClassId} onChange={(e) => loadClass(e.target.value)}>
            <option value="">Select Class</option>
            {classList.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <button onClick={async() => {
            const n = prompt("New Class Name:");
            if(n) { await supabase.from('classes').insert({name: n, school_id: school.id}); fetchBaseData(); }
          }} className="text-[10px] text-blue-400 mt-2 hover:underline">+ ADD NEW CLASS</button>
        </div>

        <div className="flex-1 overflow-auto">
          <label className="text-[10px] text-gray-400 font-bold uppercase">Students List</label>
          {students.map(s => (
            <div key={s.id} onClick={() => loadStudent(s)} className={`p-2 cursor-pointer rounded text-sm mt-1 flex justify-between group ${selectedStudent?.id === s.id ? 'bg-blue-600 text-white font-bold' : 'hover:bg-slate-800'}`}>
              <span className="truncate">{s.name}</span>
              <button onClick={async(e) => { e.stopPropagation(); if(window.confirm("Delete Student?")) { await supabase.from('students').delete().eq('id', s.id); loadClass(selectedClassId); } }} className="hidden group-hover:block"><Trash2 size={14}/></button>
            </div>
          ))}
          {selectedClassId && <button onClick={async() => {
            const n = prompt("Student Full Name:");
            if(n) { await supabase.from('students').insert({name: n, class_id: selectedClassId, school_id: school.id, admission_no: `ADM-${Date.now()}`}); loadClass(selectedClassId); }
          }} className="text-[10px] text-blue-400 mt-4 block">+ REGISTER STUDENT</button>}
        </div>

        <div className="border-t border-slate-700 pt-4 space-y-1">
          {profile.role === 'admin' && <button onClick={() => setActiveTab('settings')} className={`w-full text-left p-2 text-sm flex items-center gap-2 rounded ${activeTab === 'settings' ? 'bg-blue-600' : 'hover:bg-slate-800'}`}><Settings size={16}/> School Profile</button>}
          <button onClick={onLogout} className="w-full text-left p-2 text-sm text-red-400 flex items-center gap-2 hover:bg-slate-800 rounded"><LogOut size={16}/> Logout</button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-8">
        {!selectedStudent && activeTab !== 'settings' ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-300">
            <Users size={64}/> <p className="mt-2 font-medium">Select a class and student from the sidebar</p>
          </div>
        ) : activeTab === 'settings' ? (
          <div className="bg-white p-8 rounded shadow max-w-xl">
             <h2 className="text-xl font-bold mb-4">Edit School Information</h2>
             <form onSubmit={async(e)=>{
               e.preventDefault(); const fd=new FormData(e.target);
               await supabase.from('schools').update({name: fd.get('n'), address: fd.get('a'), current_term: fd.get('t'), current_session: fd.get('s')}).eq('id', school.id);
               alert("School Information Updated!"); fetchBaseData();
             }} className="space-y-4">
               <div><label className="text-xs font-bold text-gray-500">School Name</label><input name="n" defaultValue={school?.name} className="w-full border p-2 rounded" /></div>
               <div><label className="text-xs font-bold text-gray-500">Address</label><input name="a" defaultValue={school?.address} className="w-full border p-2 rounded" /></div>
               <div className="grid grid-cols-2 gap-4">
                 <div><label className="text-xs font-bold text-gray-500">Term</label><input name="t" defaultValue={school?.current_term} className="border p-2 rounded w-full" /></div>
                 <div><label className="text-xs font-bold text-gray-500">Session</label><input name="s" defaultValue={school?.current_session} className="border p-2 rounded w-full" /></div>
               </div>
               <button className="bg-blue-600 text-white px-6 py-2 rounded font-bold">Save Profile</button>
             </form>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex justify-between items-center bg-white p-4 rounded shadow border-l-4 border-blue-600">
              <div><h1 className="text-xl font-bold">{selectedStudent.name}</h1><p className="text-xs text-gray-500">Adm No: {selectedStudent.admission_no}</p></div>
              <div className="flex gap-2">
                <button onClick={() => setPreviewing(true)} className="bg-slate-100 px-4 py-2 rounded flex items-center gap-2 font-bold hover:bg-slate-200"><Eye size={18}/> Preview</button>
                <button onClick={handleSave} disabled={saving} className="bg-green-600 text-white px-4 py-2 rounded flex items-center gap-2 font-bold hover:bg-green-700">
                  {saving ? <Loader2 className="animate-spin" size={18}/> : <Save size={18}/>} Save Record
                </button>
              </div>
            </div>

            <div className="flex gap-4 border-b">
              {[ {id: 'scores', icon: <FileText size={16}/>, label: 'Results'}, {id: 'psychomotor', icon: <Star size={16}/>, label: 'Behavior'}, {id: 'comments', icon: <MessageSquare size={16}/>, label: 'Remarks'} ].map(t => (
                <button key={t.id} onClick={() => { setActiveTab(t.id); }} className={`pb-2 px-4 font-bold text-sm flex items-center gap-2 ${activeTab === t.id ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-400'}`}>{t.icon} {t.label}</button>
              ))}
            </div>

            {activeTab === 'scores' && (
              <div className="bg-white rounded shadow p-6">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-50 text-left"><th className="p-3 border">Subject</th>{school?.assessment_config?.map(c=><th key={c.code} className="p-3 border text-center">{c.name} ({c.max})</th>)}</tr>
                  </thead>
                  <tbody>
                    {subjects.map(sub => (
                      <tr key={sub.id}>
                        <td className="p-3 border font-medium">{sub.name}</td>
                        {school?.assessment_config?.map(c => (
                          <td key={c.code} className="p-3 border">
                            <input type="number" className="w-full text-center outline-none bg-transparent" value={scores[sub.id]?.[c.code] || ''} 
                              onChange={(e)=>setScores({...scores, [sub.id]: {...(scores[sub.id]||{}), [c.code]: e.target.value}})}/>
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
                <button onClick={async() => {
                  const n = prompt("Enter Subject Name (Applied to Class):");
                  if(n) { await supabase.from('subjects').insert({name: n, class_id: selectedClassId}); loadClass(selectedClassId); }
                }} className="mt-4 text-blue-600 font-bold flex items-center gap-1"><Plus size={16}/> Add Subject</button>
              </div>
            )}

            {activeTab === 'psychomotor' && (
              <div className="bg-white p-6 rounded shadow max-w-md">
                <h3 className="font-bold mb-4 flex items-center gap-2 text-slate-700">Psychomotor Traits</h3>
                {BEHAVIORS.map(b => (
                  <div key={b} className="flex justify-between items-center py-2 border-b">
                    <span className="text-sm">{b}</span>
                    <select className="border p-1 text-xs rounded bg-gray-50" value={commentData.behaviors?.[b] || 'Good'} 
                      onChange={(e)=>setCommentData({...commentData, behaviors: {...(commentData.behaviors || {}), [b]: e.target.value}})}>
                      {RATINGS.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'comments' && (
              <div className="bg-white p-6 rounded shadow space-y-4">
                <h3 className="font-bold text-slate-700">Remarks</h3>
                <div>
                  <label className="text-xs font-bold text-gray-400">MID-TERM REMARK</label>
                  <textarea className="w-full border p-2 rounded mt-1 h-24 outline-none" value={commentData.midterm_tutor_comment || ''} onChange={(e)=>setCommentData({...commentData, midterm_tutor_comment: e.target.value})} />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-400">FINAL REMARK</label>
                  <textarea className="w-full border p-2 rounded mt-1 h-24 outline-none" value={commentData.tutor_comment || ''} onChange={(e)=>setCommentData({...commentData, tutor_comment: e.target.value})} />
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {previewing && (
        <div className="fixed inset-0 z-50 bg-slate-900 flex flex-col">
          <div className="p-4 bg-white flex justify-between items-center">
            <button onClick={() => setPreviewing(false)} className="font-bold text-slate-700">← Back</button>
            <PDFDownloadLink document={<ResultPDF school={school} student={selectedStudent} results={studentResults} comments={commentData} />} fileName={`${selectedStudent.name}_Result.pdf`}>
                <button className="bg-blue-600 text-white px-4 py-2 rounded font-bold">Download PDF</button>
            </PDFDownloadLink>
          </div>
          <PDFViewer className="flex-1 w-full"><ResultPDF school={school} student={selectedStudent} results={studentResults} comments={commentData} /></PDFViewer>
        </div>
      )}
    </div>
  );
};

// ==================== AUTH ====================
const Auth = () => {
  const [mode, setMode] = useState('login');
  const [loading, setLoading] = useState(false);
  const [schools, setSchools] = useState([]);
  const [form, setForm] = useState({ email: '', password: '', name: '', schoolId: '' });

  useEffect(() => { supabase.from('schools').select('id, name').then(({data}) => setSchools(data || [])); }, []);

  const handleAuth = async (e) => {
    e.preventDefault(); setLoading(true);
    try {
      if (mode === 'school_reg') {
        const { data: auth, error: ae } = await supabase.auth.signUp({ email: form.email, password: form.password });
        if (ae) throw ae;
        const { data: s, error: se } = await supabase.from('schools').insert({ owner_id: auth.user.id, name: form.name }).select().single();
        if (se) throw se;
        await supabase.from('profiles').insert({ id: auth.user.id, full_name: form.name, role: 'admin', school_id: s.id });
        alert("Success! Please Login."); setMode('login');
      } else if (mode === 'teacher_reg') {
        const { data: auth, error: ae } = await supabase.auth.signUp({ email: form.email, password: form.password });
        if (ae) throw ae;
        if (!form.schoolId) throw new Error("Please Select a school");
        await supabase.from('profiles').insert({ id: auth.user.id, full_name: form.name, role: 'teacher', school_id: form.schoolId });
        alert("Success! Please Login."); setMode('login');
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email: form.email, password: form.password });
        if (error) throw error;
      }
    } catch (err) { alert(err.message); }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded shadow w-full max-w-md border-t-4 border-blue-600">
        <h1 className="text-2xl font-bold text-center mb-6">Springforth Results</h1>
        <div className="flex gap-4 mb-6 text-xs font-bold border-b pb-2">
          {['login', 'school_reg', 'teacher_reg'].map(m => (
            <button key={m} onClick={() => setMode(m)} className={mode === m ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-400'}>{m.replace('_',' ')}</button>
          ))}
        </div>
        <form onSubmit={handleAuth} className="space-y-4">
          {mode !== 'login' && <input placeholder="Full Name" className="w-full p-2 border rounded" onChange={e => setForm({...form, name: e.target.value})} required />}
          <input type="email" placeholder="Email" className="w-full p-2 border rounded" onChange={e => setForm({...form, email: e.target.value})} required />
          <input type="password" placeholder="Password" className="w-full p-2 border rounded" onChange={e => setForm({...form, password: e.target.value})} required />
          {mode === 'teacher_reg' && (
            <select className="w-full p-2 border rounded bg-white" onChange={e => setForm({...form, schoolId: e.target.value})} required>
              <option value="">Select School</option>
              {schools.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          )}
          <button className="w-full bg-blue-600 text-white py-2 rounded font-bold">{loading ? '...' : 'Access Portal'}</button>
        </form>
      </div>
    </div>
  );
};

// ==================== ROOT ====================
const App = () => {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: s } }) => { setSession(s); if(!s) setLoading(false); });
    supabase.auth.onAuthStateChange((_event, s) => { setSession(s); if(!s) setProfile(null); });
  }, []);

  useEffect(() => {
    if (session) {
      supabase.from('profiles').select('*').eq('id', session.user.id).maybeSingle().then(({data}) => { setProfile(data); setLoading(false); });
    }
  }, [session]);

  if (loading) return <div className="h-screen flex items-center justify-center bg-gray-50"><Loader2 className="animate-spin text-blue-600" size={40}/></div>;
  if (!session) return <Auth />;
  if (!profile) return <div className="p-20 text-center"><button onClick={() => supabase.auth.signOut()} className="bg-red-500 text-white p-2 rounded">Session Broken. Logout & Retry</button></div>;

  return <Dashboard profile={profile} onLogout={() => supabase.auth.signOut()} />;
};

export default App;