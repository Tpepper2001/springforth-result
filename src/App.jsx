import React, { useState, useEffect, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Document, Page, Text, View, StyleSheet, PDFViewer, PDFDownloadLink, Image } from '@react-pdf/renderer';
import { Loader2, School, LogOut, Users, Settings, CheckCircle, Search, Menu, X, Upload, Shield, UserCog, Plus, BookOpen } from 'lucide-react';

const supabaseUrl = 'https://ghlnenmfwlpwlqdrbean.supabase.co'; 
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdobG5lbm1md2xwd2xxZHJiZWFuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ0MTE0MDQsImV4cCI6MjA3OTk4NzQwNH0.rNILUdI035c4wl4kFkZFP4OcIM_t7bNMqktKm25d5Gg'; 
const supabase = createClient(supabaseUrl, supabaseKey);

const BEHAVIORS = ['Cooperation', 'Honesty', 'Self-Control', 'Neatness', 'Punctuality'];
const RATINGS = ['Excellent', 'Very Good', 'Good', 'Fair', 'Poor'];
const CENTRAL_ADMIN_EMAIL = 'admin@admin.com';

const getGrade = (obtained, max) => {
  const percent = (obtained / max) * 100;
  if (percent >= 90) return { g: 'A', r: 'Excellent' };
  if (percent >= 70) return { g: 'B', r: 'Very Good' };
  if (percent >= 60) return { g: 'C', r: 'Good' };
  if (percent >= 40) return { g: 'D', r: 'Pass' };
  return { g: 'E', r: 'Fail' };
};

const pdfStyles = StyleSheet.create({
  page: { padding: 30, fontSize: 8, fontFamily: 'Helvetica' },
  header: { textAlign: 'center', marginBottom: 15, borderBottom: 2, paddingBottom: 10 },
  schoolName: { fontSize: 20, fontWeight: 'bold', color: '#1e3a8a' },
  logo: { width: 60, height: 60, marginBottom: 5, alignSelf: 'center' },
  bio: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10, padding: 8, backgroundColor: '#f3f4f6' },
  table: { width: '100%', borderTop: 1 },
  row: { flexDirection: 'row', borderBottom: 1, padding: 4 },
  cell: { flex: 1, textAlign: 'center' },
  psychRow: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 10, border: 1, padding: 5, borderColor: '#ccc' }
});

// ==================== PDF COMPONENT ====================
const ResultPDF = ({ school, student, results, comments, type = 'full' }) => {
  const totalObtained = results.reduce((acc, r) => acc + (parseFloat(r.scores?.ca) || 0) + (parseFloat(r.scores?.exam) || 0), 0);
  const avg = results.length > 0 ? totalObtained / results.length : 0;

  return (
    <Document>
      <Page size="A4" style={pdfStyles.page}>
        <View style={pdfStyles.header}>
          {school?.logo_url && <Image src={school.logo_url} style={pdfStyles.logo} />}
          <Text style={pdfStyles.schoolName}>{school?.name}</Text>
          <Text style={{ fontSize: 9 }}>{school?.motto}</Text>
          <Text style={{ marginTop: 5, fontWeight: 'bold' }}>{type === 'ca' ? 'MID-TERM CA REPORT' : 'END OF TERM REPORT'}</Text>
        </View>

        <View style={pdfStyles.bio}>
          <View>
            <Text>Name: {student?.name}</Text>
            <Text>Adm No: {student?.admission_no}</Text>
          </View>
          <View>
            <Text>Class: {student?.classes?.name}</Text>
            <Text>Gender: {student?.gender}</Text>
          </View>
        </View>

        <View style={pdfStyles.table}>
          <View style={[pdfStyles.row, { backgroundColor: '#1e3a8a', color: 'white' }]}>
            <Text style={{ width: 120 }}>Subject</Text>
            <Text style={pdfStyles.cell}>CA (40)</Text>
            {type === 'full' && <Text style={pdfStyles.cell}>Exam (60)</Text>}
            <Text style={pdfStyles.cell}>Total</Text>
            <Text style={pdfStyles.cell}>Grade</Text>
          </View>
          {results.map(r => {
            const ca = parseFloat(r.scores?.ca) || 0;
            const ex = parseFloat(r.scores?.exam) || 0;
            const tot = type === 'ca' ? ca : (ca + ex);
            const m = type === 'ca' ? 40 : 100;
            return (
              <View key={r.id} style={pdfStyles.row}>
                <Text style={{ width: 120 }}>{r.subjects?.name}</Text>
                <Text style={pdfStyles.cell}>{ca}</Text>
                {type === 'full' && <Text style={pdfStyles.cell}>{ex}</Text>}
                <Text style={pdfStyles.cell}>{tot}</Text>
                <Text style={pdfStyles.cell}>{getGrade(tot, m).g}</Text>
              </View>
            );
          })}
        </View>

        {type === 'full' && (
          <View style={{ marginTop: 15 }}>
            <Text style={{ fontWeight: 'bold', marginBottom: 5 }}>Psychomotor Skills:</Text>
            <View style={pdfStyles.psychRow}>
              {Object.entries(comments?.behaviors || {}).map(([k, v]) => (
                <Text key={k} style={{ width: '33%', fontSize: 7 }}>{k}: {v}</Text>
              ))}
            </View>
          </View>
        )}

        <View style={{ marginTop: 20 }}>
          <Text>Teacher's Remark: {comments?.tutor_comment}</Text>
          <Text>Average Score: {avg.toFixed(2)}%</Text>
        </View>
      </Page>
    </Document>
  );
};

// ==================== DASHBOARDS ====================

const CentralAdminDashboard = ({ onLogout }) => {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);

  const load = useCallback(async () => {
    const { data } = await supabase.from('profiles').select('*, schools(name)');
    setUsers(data || []);
  }, []);

  useEffect(() => { load(); }, [load]);

  const changeRole = async (userId, role) => {
    await supabase.from('profiles').update({ role }).eq('id', userId);
    load(); 
    setSelectedUser(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="flex justify-between items-center bg-blue-900 text-white p-6 rounded-xl mb-6 shadow-lg">
        <h1 className="text-xl font-bold flex items-center gap-2"><Shield /> System Control</h1>
        <button onClick={onLogout} className="bg-white/20 p-2 rounded flex items-center gap-2"><LogOut size={18}/> Logout</button>
      </div>
      <div className="bg-white rounded-xl shadow p-4">
        {users.map(u => (
          <div key={u.id} className="flex justify-between items-center p-3 border-b last:border-0">
            <div>
              <p className="font-bold">{u.full_name}</p>
              <p className="text-xs text-slate-400">{u.schools?.name || 'No School'} • {u.role}</p>
            </div>
            <button onClick={() => setSelectedUser(u)} className="p-2 bg-slate-100 rounded hover:bg-slate-200"><UserCog size={18}/></button>
          </div>
        ))}
      </div>
      {selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white p-6 rounded-xl w-full max-w-xs shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold">Set User Role</h3>
              <button onClick={() => setSelectedUser(null)}><X/></button>
            </div>
            <select className="w-full border p-2 rounded mb-4 outline-none" onChange={(e) => changeRole(selectedUser.id, e.target.value)}>
              <option value="">Select Role</option>
              <option value="teacher">Teacher</option>
              <option value="admin">Admin</option>
            </select>
            <button onClick={() => setSelectedUser(null)} className="w-full py-2 text-slate-400 text-sm">Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
};

const TeacherDashboard = ({ profile, onLogout }) => {
  const [school, setSchool] = useState(null);
  const [classList, setClassList] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [students, setStudents] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [scores, setScores] = useState({});
  const [commentData, setCommentData] = useState({ behaviors: {} });
  const [results, setResults] = useState([]);
  const [preview, setPreview] = useState(null);
  const [tab, setTab] = useState('scores');
  const [side, setSide] = useState(false);
  const [saving, setSaving] = useState(false);

  const init = useCallback(async () => {
    const { data: s } = await supabase.from('schools').select('*').eq('id', profile.school_id).single();
    setSchool(s);
    const { data: c } = await supabase.from('classes').select('*').eq('school_id', profile.school_id);
    setClassList(c || []);
  }, [profile.school_id]);

  useEffect(() => { init(); }, [init]);

  const loadClass = async (id) => {
    setSelectedClassId(id);
    const { data: st } = await supabase.from('students').select('*').eq('class_id', id);
    setStudents(st || []);
    const { data: sub } = await supabase.from('subjects').select('*').eq('class_id', id);
    setSubjects(sub || []);
    setSelectedStudent(null);
  };

  const selectStu = async (s) => {
    setSelectedStudent(s); 
    setSide(false);
    const { data: rs } = await supabase.from('results').select('*, subjects(name)').eq('student_id', s.id);
    const { data: co } = await supabase.from('comments').select('*').eq('student_id', s.id).maybeSingle();
    setResults(rs || []);
    setScores(rs?.reduce((a, r) => ({ ...a, [r.subject_id]: r.scores }), {}) || {});
    setCommentData(co || { behaviors: {}, submission_status: 'draft' });
  };

  const save = async () => {
    setSaving(true);
    const ups = subjects.map(s => {
      const caVal = Math.min(40, parseFloat(scores[s.id]?.ca) || 0);
      const exVal = Math.min(60, parseFloat(scores[s.id]?.exam) || 0);
      return { student_id: selectedStudent.id, subject_id: s.id, scores: { ca: caVal, exam: exVal }, total: caVal + exVal };
    });
    await supabase.from('results').delete().eq('student_id', selectedStudent.id);
    await supabase.from('results').insert(ups);
    await supabase.from('comments').upsert({ 
      student_id: selectedStudent.id, 
      school_id: school.id, 
      tutor_comment: commentData.tutor_comment, 
      behaviors: commentData.behaviors, 
      submission_status: 'pending' 
    });
    setSaving(false); 
    alert("Submitted!"); 
    selectStu(selectedStudent);
  };

  return (
    <div className="flex h-screen bg-slate-50">
      <div className={`fixed lg:static inset-y-0 left-0 w-64 bg-slate-900 text-white p-4 transition-transform z-40 ${side ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="flex justify-between items-center mb-8">
          <h1 className="flex items-center gap-2 font-bold"><School/> Portal</h1>
          <button onClick={()=>setSide(false)} className="lg:hidden"><X/></button>
        </div>
        <select className="w-full bg-slate-800 p-2 rounded mb-6 outline-none text-sm" onChange={(e)=>loadClass(e.target.value)}>
          <option value="">Select Class</option>
          {classList.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <div className="flex justify-between items-center text-[10px] uppercase text-slate-500 font-bold mb-2">
          <span>Students</span>
          <Plus size={14} className="cursor-pointer" onClick={() => {
            const name = prompt("Enter Student Name:");
            if (name && selectedClassId) {
              const adm = `SF-${new Date().getFullYear()}-${Math.floor(1000+Math.random()*9000)}`;
              supabase.from('students').insert({ name, admission_no: adm, class_id: selectedClassId, school_id: profile.school_id, gender: 'Male' }).then(() => loadClass(selectedClassId));
            }
          }}/>
        </div>
        <div className="flex-1 overflow-auto">
          {students.map(s => (
            <div key={s.id} onClick={()=>selectStu(s)} className={`p-2 cursor-pointer rounded mb-1 flex justify-between items-center text-sm ${selectedStudent?.id === s.id ? 'bg-blue-600' : 'hover:bg-white/10'}`}>
              <span className="truncate">{s.name}</span>
              {commentData.submission_status === 'approved' && <CheckCircle size={12} className="text-green-400"/>}
            </div>
          ))}
        </div>
        <button onClick={onLogout} className="flex items-center gap-2 text-red-400 mt-4 p-2 text-sm"><LogOut size={16}/> Logout</button>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="p-4 border-b bg-white flex items-center gap-4">
          <button onClick={()=>setSide(true)} className="lg:hidden p-2 bg-slate-100 rounded"><Menu size={20}/></button>
          <div className="flex-1">
            <h2 className="font-bold text-slate-800">{selectedStudent?.name || "Dashboard"}</h2>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{selectedStudent?.admission_no || "Select a student to begin"}</p>
          </div>
          {selectedStudent && (
            <div className="flex gap-2">
              <button onClick={()=>setPreview('ca')} className="bg-slate-100 p-2 rounded hover:bg-slate-200"><Search size={18}/></button>
              <button onClick={()=>setPreview('full')} className="bg-slate-100 px-3 py-2 rounded font-bold text-xs hover:bg-slate-200">PDF</button>
              <button onClick={save} className="bg-blue-600 text-white px-4 py-2 rounded font-bold text-xs flex items-center gap-2">
                {saving ? <Loader2 className="animate-spin" size={14}/> : 'Submit'}
              </button>
            </div>
          )}
        </div>

        {selectedStudent ? (
          <div className="flex-1 overflow-auto p-6">
            <div className="flex gap-6 border-b mb-6 font-bold text-slate-400 text-sm">
              <button onClick={()=>setTab('scores')} className={`pb-2 ${tab==='scores' ? 'text-blue-600 border-b-2 border-blue-600' : ''}`}>Scores</button>
              <button onClick={()=>setTab('traits')} className={`pb-2 ${tab==='traits' ? 'text-blue-600 border-b-2 border-blue-600' : ''}`}>Psychomotor</button>
              <button onClick={()=>setTab('settings')} className={`pb-2 ${tab==='settings' ? 'text-blue-600 border-b-2 border-blue-600' : ''}`}>Remarks</button>
            </div>
            {tab === 'scores' && (
              <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-500">
                    <tr><th className="p-4">Subject</th><th>CA (40)</th><th>Exam (60)</th><th className="text-center">Total</th></tr>
                  </thead>
                  <tbody>
                    {subjects.map(s => (
                      <tr key={s.id} className="border-t hover:bg-slate-50 transition">
                        <td className="p-4 font-bold text-slate-700 flex items-center gap-2"><BookOpen size={14} className="text-slate-300"/>{s.name}</td>
                        <td><input type="number" className="border p-2 rounded w-20 text-sm" value={scores[s.id]?.ca || ''} onChange={(e)=>setScores({...scores, [s.id]: {...scores[s.id], ca: e.target.value}})}/></td>
                        <td><input type="number" className="border p-2 rounded w-20 text-sm" value={scores[s.id]?.exam || ''} onChange={(e)=>setScores({...scores, [s.id]: {...scores[s.id], exam: e.target.value}})}/></td>
                        <td className="text-center font-black text-blue-600">{(parseFloat(scores[s.id]?.ca)||0) + (parseFloat(scores[s.id]?.exam)||0)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {tab === 'traits' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {BEHAVIORS.map(b => (
                  <div key={b} className="flex justify-between items-center p-4 bg-white border rounded-xl shadow-sm">
                    <span className="font-bold text-slate-600">{b}</span>
                    <select className="text-xs border p-2 rounded bg-slate-50 outline-none" value={commentData.behaviors?.[b] || ''} onChange={(e)=>setCommentData({...commentData, behaviors: {...commentData.behaviors, [b]: e.target.value}})}>
                      <option value="">Rate</option>{RATINGS.map(r=><option key={r} value={r}>{r}</option>)}
                    </select>
                  </div>
                ))}
              </div>
            )}
            {tab === 'settings' && (
              <div className="bg-white p-6 rounded-xl shadow-sm border space-y-4">
                <div className="flex items-center gap-2 text-slate-500 font-bold mb-2"><Settings size={18}/> Teacher Remarks</div>
                <textarea className="w-full border p-4 h-40 rounded-xl bg-slate-50 outline-none focus:ring-2 focus:ring-blue-100" placeholder="Provide a detailed remark for the report card..." value={commentData.tutor_comment || ''} onChange={(e)=>setCommentData({...commentData, tutor_comment: e.target.value})}/>
              </div>
            )}
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-300">
            <Users size={80} className="mb-4 opacity-10"/>
            <p className="font-bold uppercase tracking-widest text-sm">Select Student to Begin</p>
          </div>
        )}
      </div>

      {preview && (
        <div className="fixed inset-0 z-50 bg-slate-900 flex flex-col p-2 lg:p-4">
          <div className="bg-white p-4 flex justify-between rounded-t-xl items-center">
            <button onClick={()=>setPreview(null)} className="font-bold text-red-500 flex items-center gap-2 hover:bg-red-50 px-4 py-2 rounded transition"><X size={18}/> Close</button>
            <span className="font-black text-slate-800 uppercase text-xs">Report Preview</span>
            <PDFDownloadLink document={<ResultPDF school={school} student={selectedStudent} results={results} comments={commentData} type={preview}/>} fileName="result.pdf">
              <button className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold shadow-lg flex items-center gap-2"><Plus size={16}/> Download PDF</button>
            </PDFDownloadLink>
          </div>
          <PDFViewer className="flex-1 rounded-b-xl border-none"><ResultPDF school={school} student={selectedStudent} results={results} comments={commentData} type={preview}/></PDFViewer>
        </div>
      )}
    </div>
  );
};

const AdminDashboard = ({ profile, onLogout }) => {
  const [school, setSchool] = useState(null);
  const [loadingLogo, setLoadingLogo] = useState(false);
  const [tab, setTab] = useState('review');

  const load = useCallback(async () => {
    const { data } = await supabase.from('schools').select('*').eq('id', profile.school_id).single();
    setSchool(data);
  }, [profile.school_id]);

  useEffect(() => { load(); }, [load]);

  const uploadLogo = async (e) => {
    const file = e.target.files[0]; 
    if (!file) return;
    setLoadingLogo(true);
    const fileName = `logo-${school.id}-${Date.now()}`;
    const { data } = await supabase.storage.from('school-logos').upload(fileName, file);
    if (data) {
      const { data: { publicUrl } } = supabase.storage.from('school-logos').getPublicUrl(data.path);
      await supabase.from('schools').update({ logo_url: publicUrl }).eq('id', school.id);
      load();
    }
    setLoadingLogo(false);
  };

  return (
    <div className="flex h-screen bg-slate-100">
      <div className="w-64 bg-indigo-950 text-white p-4 flex flex-col">
        <h1 className="font-black text-xl mb-8 flex items-center gap-2 text-indigo-400"><Shield/> ADMIN</h1>
        <button onClick={()=>setTab('review')} className={`p-3 text-left rounded-xl flex items-center gap-2 mb-2 ${tab === 'review' ? 'bg-white/10' : ''}`}><Users size={18}/> Review</button>
        <button onClick={()=>setTab('setup')} className={`p-3 text-left rounded-xl flex items-center gap-2 ${tab === 'setup' ? 'bg-white/10' : ''}`}><Settings size={18}/> Setup</button>
        <button onClick={onLogout} className="mt-auto p-3 flex items-center gap-2 text-red-400 font-bold"><LogOut size={18}/> Logout</button>
      </div>
      <div className="flex-1 p-8">
        {tab === 'setup' ? (
          <div className="bg-white p-10 rounded-3xl shadow-xl text-center max-w-sm mx-auto">
            {school?.logo_url ? <img src={school.logo_url} alt="Logo" className="h-24 mx-auto mb-6"/> : <School size={64} className="mx-auto mb-6 text-slate-100"/>}
            <label className="bg-slate-50 p-8 rounded-2xl border-2 border-dashed border-slate-200 block cursor-pointer hover:bg-slate-100 transition">
              {loadingLogo ? <Loader2 className="animate-spin mx-auto text-indigo-600"/> : <Upload className="mx-auto mb-2 text-slate-400"/>}
              <p className="font-black text-slate-600 uppercase text-xs">Upload School Logo</p>
              <input type="file" className="hidden" onChange={uploadLogo} accept="image/*"/>
            </label>
          </div>
        ) : (
          <div className="text-center text-slate-400 mt-20 font-bold uppercase tracking-widest">Select Results to Review via Classes</div>
        )}
      </div>
    </div>
  );
};

const Auth = ({ onParent }) => {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ email: '', password: '', name: '', schoolId: '' });
  const [busy, setBusy] = useState(false);
  const [schools, setSchools] = useState([]);

  useEffect(() => { supabase.from('schools').select('id, name').then(({data}) => setSchools(data || [])); }, []);

  const submit = async (e) => {
    e.preventDefault(); setBusy(true);
    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email: form.email, password: form.password });
        if (error) throw error;
      } else {
        const { data: { user } } = await supabase.auth.signUp({ email: form.email, password: form.password });
        if (mode === 'school_reg') {
          const { data: s } = await supabase.from('schools').insert({ owner_id: user.id, name: form.name }).select().single();
          await supabase.from('profiles').insert({ id: user.id, full_name: form.name, role: 'admin', school_id: s.id });
        } else {
          await supabase.from('profiles').insert({ id: user.id, full_name: form.name, role: 'teacher', school_id: form.schoolId });
        }
        alert("Verification email sent!");
      }
    } catch (err) { alert(err.message); }
    setBusy(false);
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-3xl shadow-2xl max-w-md w-full border-t-8 border-blue-600">
        <h1 className="text-3xl font-black text-center mb-6 tracking-tighter">SPRINGFORTH</h1>
        <div className="flex gap-4 mb-8 border-b text-[10px] font-black uppercase pb-2">
          {['login', 'school_reg', 'teacher_reg'].map(m => (
            <button key={m} onClick={() => setMode(m)} className={mode === m ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-400'}>{m.replace('_',' ')}</button>
          ))}
        </div>
        <form onSubmit={submit} className="space-y-4">
          {mode !== 'login' && <input className="w-full border-2 p-4 rounded-2xl outline-none focus:border-blue-600" placeholder="Full Name" onChange={(e)=>setForm({...form, name: e.target.value})} required />}
          <input className="w-full border-2 p-4 rounded-2xl outline-none focus:border-blue-600" type="email" placeholder="Email" onChange={(e)=>setForm({...form, email: e.target.value})} required />
          <input className="w-full border-2 p-4 rounded-2xl outline-none focus:border-blue-600" type="password" placeholder="Password" onChange={(e)=>setForm({...form, password: e.target.value})} required />
          {mode === 'teacher_reg' && (
            <select className="w-full border-2 p-4 rounded-2xl bg-white outline-none" onChange={(e)=>setForm({...form, schoolId: e.target.value})} required>
              <option value="">Choose School</option>
              {schools.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          )}
          <button className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black shadow-xl shadow-blue-100 uppercase tracking-widest">{busy ? <Loader2 className="animate-spin mx-auto"/> : 'Enter'}</button>
        </form>
        <button onClick={onParent} className="w-full bg-slate-50 py-4 rounded-2xl mt-6 font-black uppercase text-slate-400 flex justify-center items-center gap-2 hover:bg-slate-100 transition"><Search size={18}/> Student Portal</button>
      </div>
    </div>
  );
};

const ParentPortal = ({ onBack }) => {
  const [id, setId] = useState('');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const lookup = async () => {
    setLoading(true);
    const { data: st } = await supabase.from('students').select('*, schools(*), classes(*), results(*, subjects(*)), comments(*)').eq('admission_no', id).maybeSingle();
    if (st && st.comments?.[0]?.submission_status === 'approved') setData(st);
    else alert("Record not found or not published.");
    setLoading(false);
  };

  if (data) return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col">
      <button onClick={()=>setData(null)} className="p-4 bg-slate-100 font-bold text-slate-600 flex items-center gap-2"><Menu size={18}/> Back to Search</button>
      <PDFViewer className="flex-1 border-none"><ResultPDF school={data.schools} student={data} results={data.results} comments={data.comments[0]} /></PDFViewer>
    </div>
  );

  return (
    <div className="min-h-screen bg-blue-50 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-3xl shadow-2xl max-w-sm w-full text-center">
        <Search size={48} className="mx-auto text-blue-600 mb-4 bg-blue-50 p-3 rounded-full"/>
        <h2 className="text-2xl font-black mb-2 tracking-tight">Parent Portal</h2>
        <p className="text-xs text-slate-400 font-bold uppercase mb-6">Enter Admission ID</p>
        <input className="w-full border-2 p-4 rounded-2xl mb-4 text-center font-black tracking-widest outline-none focus:border-blue-600" placeholder="SF-2025-XXXX" onChange={(e)=>setId(e.target.value)} />
        <button onClick={lookup} className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black shadow-lg uppercase">{loading ? <Loader2 className="animate-spin mx-auto"/> : 'View Result'}</button>
        <button onClick={onBack} className="mt-8 text-slate-400 block w-full text-xs font-bold hover:underline uppercase">Return to Login</button>
      </div>
    </div>
  );
};

const App = () => {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [view, setView] = useState('auth');
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(async (userId, userEmail) => {
    if (userEmail === CENTRAL_ADMIN_EMAIL) { setProfile({ role: 'central_admin' }); setLoading(false); return; }
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
    setProfile(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: s } }) => { 
      setSession(s); 
      if (!s) setLoading(false);
      else loadProfile(s.user.id, s.user.email);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => { 
      setSession(s); 
      if (!s) { setProfile(null); setView('auth'); setLoading(false); }
      else loadProfile(s.user.id, s.user.email);
    });
    return () => subscription.unsubscribe();
  }, [loadProfile]);

  if (loading) return <div className="h-screen flex items-center justify-center bg-white"><Loader2 className="animate-spin text-blue-600" size={48}/></div>;
  if (view === 'parent') return <ParentPortal onBack={() => setView('auth')} />;
  if (!session) return <Auth onParent={() => setView('parent')} />;
  if (profile?.role === 'central_admin') return <CentralAdminDashboard onLogout={() => supabase.auth.signOut()} />;
  if (profile?.role === 'admin') return <AdminDashboard profile={profile} onLogout={() => supabase.auth.signOut()} />;
  return <TeacherDashboard profile={profile} onLogout={() => supabase.auth.signOut()} />;
};

export default App;
