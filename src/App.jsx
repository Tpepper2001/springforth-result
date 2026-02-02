import React, { useState, useEffect, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Document, Page, Text, View, StyleSheet, PDFViewer, PDFDownloadLink, Image } from '@react-pdf/renderer';
import { Loader2, School, LogOut, Users, CheckCircle, Search, Menu, X, Upload, Shield, UserCog, Plus, BookOpen } from 'lucide-react';

// ==================== CONFIGURATION ====================
const supabaseUrl = 'https://ghlnenmfwlpwlqdrbean.supabase.co'; 
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdobG5lbm1md2xwd2xxZHJiZWFuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ0MTE0MDQsImV4cCI6MjA3OTk4NzQwNH0.rNILUdI035c4wl4kFkZFP4OcIM_t7bNMqktKm25d5Gg'; 
const supabase = createClient(supabaseUrl, supabaseKey);

const BEHAVIORS = ['RESPECT', 'RESPONSIBILITY', 'EMPATHY', 'SELF DISCIPLINE', 'COOPERATION', 'LEADERSHIP', 'HONESTY'];
const RATINGS = ['5', '4', '3', '2', '1'];
const CENTRAL_ADMIN_EMAIL = 'admin@admin.com';

// ==================== GRADING LOGIC ====================
const getGrade = (score) => {
  const s = parseFloat(score) || 0;
  if (s >= 86) return { g: 'A*', r: 'Excellent' };
  if (s >= 76) return { g: 'A', r: 'Outstanding' };
  if (s >= 66) return { g: 'B', r: 'Very Good' };
  if (s >= 60) return { g: 'C', r: 'Good' };
  if (s >= 50) return { g: 'D', r: 'Fairly Good' };
  if (s >= 40) return { g: 'E', r: 'Below Expectation' };
  return { g: 'E*', r: 'Rarely' };
};

// ==================== PDF STYLES ====================
const pdfStyles = StyleSheet.create({
  page: { padding: 20, fontSize: 7, fontFamily: 'Helvetica', color: '#000', border: '2pt solid red' },
  headerBox: { flexDirection: 'row', alignItems: 'center', borderBottom: '2pt solid #003366', paddingBottom: 5, marginBottom: 5 },
  schoolLogo: { width: 60, height: 60 },
  headerText: { flex: 1, textAlign: 'center' },
  schoolTitle: { fontSize: 18, fontWeight: 'bold', color: '#0066cc' },
  studentPhoto: { width: 60, height: 70, border: '1pt solid #000' },
  bioRow: { flexDirection: 'row', backgroundColor: '#add8e6', padding: 3, border: '1pt solid #000', marginBottom: 2 },
  bioCell: { flex: 1, fontWeight: 'bold' },
  table: { width: '100%', borderLeft: '1pt solid #000', borderTop: '1pt solid #000' },
  tRow: { flexDirection: 'row', borderBottom: '1pt solid #000' },
  tHeader: { backgroundColor: '#add8e6', fontWeight: 'bold', textAlign: 'center' },
  tCell: { borderRight: '1pt solid #000', padding: 2, textAlign: 'center' },
  tCellLeft: { borderRight: '1pt solid #000', padding: 2, textAlign: 'left', width: 100 },
  verticalText: { fontSize: 5, width: 25, textAlign: 'center' },
  remarkBox: { border: '1pt solid red', padding: 5, marginTop: 5 },
  behaviorTable: { width: '100%', border: '1pt solid #000', marginTop: 5 },
  sigRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10, borderTop: '1pt solid #000', paddingTop: 5 }
});

// ==================== PDF COMPONENT ====================
const ResultPDF = ({ school, student, results = [], comments, type = 'full' }) => {
  const totalScore = results.reduce((acc, r) => acc + (parseFloat(r.total) || 0), 0);
  const avg = results.length > 0 ? (totalScore / results.length).toFixed(1) : 0;

  return (
    <Document>
      <Page size="A4" style={pdfStyles.page}>
        <View style={pdfStyles.headerBox}>
          {school?.logo_url && <Image src={school.logo_url} style={pdfStyles.schoolLogo} />}
          <View style={pdfStyles.headerText}>
            <Text style={pdfStyles.schoolTitle}>{school?.name || 'THE CAVENDISH COLLEGE'}</Text>
            <Text>{school?.address || '26 KINSHASA ROAD, KADUNA'}</Text>
            <Text style={{ fontWeight: 'bold', marginTop: 3 }}>
              {type === 'ca' ? 'TERM ONE (HALF TERM) REPORT' : 'TERM ONE (FULL TERM) REPORT'} 2025/2026 SESSION
            </Text>
          </View>
          <View style={pdfStyles.studentPhoto}><Text style={{fontSize: 5}}>PHOTO</Text></View>
        </View>

        <View style={pdfStyles.bioRow}><Text style={pdfStyles.bioCell}>NAME: {student?.name?.toUpperCase()}</Text></View>
        <View style={pdfStyles.bioRow}>
          <Text style={pdfStyles.bioCell}>ADM: {student?.admission_no}</Text>
          <Text style={pdfStyles.bioCell}>AVG: {avg}%</Text>
          <Text style={pdfStyles.bioCell}>GRADE: {getGrade(avg).g}</Text>
        </View>

        <View style={pdfStyles.table}>
          <View style={[pdfStyles.tRow, pdfStyles.tHeader]}>
            <Text style={pdfStyles.tCellLeft}>SUBJECTS</Text>
            <Text style={pdfStyles.verticalText}>TOTAL</Text>
            <Text style={pdfStyles.verticalText}>GRADE</Text>
            <Text style={{ flex: 1 }}>REMARKS</Text>
          </View>
          {results.map((r, i) => (
            <View key={i} style={pdfStyles.tRow}>
              <Text style={pdfStyles.tCellLeft}>{r.subjects?.name}</Text>
              <Text style={pdfStyles.tCell}>{r.total}%</Text>
              <Text style={pdfStyles.tCell}>{getGrade(r.total).g}</Text>
              <Text style={{ flex: 1, paddingLeft: 3 }}>{getGrade(r.total).r}</Text>
            </View>
          ))}
        </View>

        <View style={pdfStyles.behaviorTable}>
           <Text style={{backgroundColor: '#add8e6', textAlign: 'center', fontWeight: 'bold'}}>BEHAVIOR</Text>
           {BEHAVIORS.map(b => (
             <View key={b} style={pdfStyles.tRow}>
               <Text style={{flex: 1, borderRight: '1pt solid #000', paddingLeft: 3}}>{b}</Text>
               <Text style={{width: 50, textAlign: 'center'}}>{comments?.behaviors?.[b] || '-'}</Text>
             </View>
           ))}
        </View>

        <View style={pdfStyles.remarkBox}>
          <Text style={{ fontWeight: 'bold' }}>TUTOR: {comments?.tutor_comment}</Text>
          <Text style={{ fontWeight: 'bold', marginTop: 4 }}>PRINCIPAL: {comments?.principal_comment}</Text>
        </View>
      </Page>
    </Document>
  );
};

// ==================== CENTRAL ADMIN DASHBOARD ====================
const CentralAdminDashboard = ({ onLogout }) => {
  const [users, setUsers] = useState([]);
  const [schools, setSchools] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [busy, setBusy] = useState(false);

  const loadData = useCallback(async () => {
    const { data: p } = await supabase.from('profiles').select('*, schools(name)');
    const { data: s } = await supabase.from('schools').select('*');
    setUsers(p || []); setSchools(s || []);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const updateStaff = async (uid, updates) => {
    setBusy(true);
    const cleanUpdates = { ...updates };
    if (cleanUpdates.school_id === "") cleanUpdates.school_id = null;

    const { data, error } = await supabase.from('profiles').update(cleanUpdates).eq('id', uid).select();

    if (error) alert("Error: " + error.message);
    else if (!data || data.length === 0) alert("Update failed: No rows affected. Check RLS Policies.");
    else {
      alert("Staff Record Updated!");
      await loadData();
      setSelectedUser(null);
    }
    setBusy(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="flex justify-between items-center bg-indigo-900 text-white p-6 rounded-2xl mb-8">
        <h1 className="text-2xl font-black flex items-center gap-3"><Shield size={32}/> CENTRAL CONTROL</h1>
        <button onClick={onLogout} className="bg-white/20 px-6 py-2 rounded-xl font-bold">Logout</button>
      </div>
      <div className="bg-white rounded-3xl shadow-xl overflow-hidden border">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b text-[10px] font-black uppercase">
            <tr><th className="p-4">Name</th><th>School</th><th>Role</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id} className="border-b hover:bg-slate-50">
                <td className="p-4 font-bold">{u.full_name}</td>
                <td>{u.schools?.name || 'Unassigned'}</td>
                <td><span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-xs font-bold uppercase">{u.role}</span></td>
                <td><button onClick={() => setSelectedUser(u)} className="text-indigo-600 p-2 hover:bg-indigo-50 rounded-lg"><UserCog/></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {selectedUser && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white p-8 rounded-3xl w-full max-w-md shadow-2xl">
            <h3 className="text-xl font-black mb-6">Manage Staff: {selectedUser.full_name}</h3>
            {busy && <div className="text-blue-600 font-bold mb-4 animate-pulse">Processing...</div>}
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-400">ASSIGN ROLE</label>
                <select className="w-full border-2 p-3 rounded-xl mt-1" defaultValue={selectedUser.role} onChange={(e) => updateStaff(selectedUser.id, { role: e.target.value })}>
                  <option value="teacher">Teacher</option><option value="admin">School Admin</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-400">TRANSFER SCHOOL</label>
                <select className="w-full border-2 p-3 rounded-xl mt-1" defaultValue={selectedUser.school_id || ""} onChange={(e) => updateStaff(selectedUser.id, { school_id: e.target.value })}>
                  <option value="">No School</option>
                  {schools.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <button onClick={() => setSelectedUser(null)} className="w-full py-3 text-slate-400 font-bold mt-4">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ==================== TEACHER DASHBOARD ====================
const TeacherDashboard = ({ profile, onLogout }) => {
  const [school, setSchool] = useState(null);
  const [classList, setClassList] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [students, setStudents] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [scores, setScores] = useState({});
  const [commentData, setCommentData] = useState({ behaviors: {} });
  const [tab, setTab] = useState('scores');
  const [side, setSide] = useState(false);

  const init = useCallback(async () => {
    const { data: s } = await supabase.from('schools').select('*').eq('id', profile.school_id).single();
    const { data: c } = await supabase.from('classes').select('*').eq('school_id', profile.school_id);
    setSchool(s); setClassList(c || []);
  }, [profile.school_id]);

  useEffect(() => { init(); }, [init]);

  const loadClass = async (id) => {
    setSelectedClassId(id);
    const { data: st } = await supabase.from('students').select('*').eq('class_id', id);
    const { data: sub } = await supabase.from('subjects').select('*').eq('class_id', id);
    setStudents(st || []); setSubjects(sub || []); setSelectedStudent(null);
  };

  const selectStu = async (s) => {
    setSelectedStudent(s); setSide(false);
    const { data: rs } = await supabase.from('results').select('*, subjects(name)').eq('student_id', s.id);
    const { data: co } = await supabase.from('comments').select('*').eq('student_id', s.id).maybeSingle();
    setScores(rs?.reduce((a, r) => ({ ...a, [r.subject_id]: r.scores }), {}) || {});
    setCommentData(co || { behaviors: {}, submission_status: 'draft' });
  };

  const save = async () => {
    const ups = subjects.map(s => {
      const sc = scores[s.id] || {};
      const total = (parseFloat(sc.note)||0) + (parseFloat(sc.cw)||0) + (parseFloat(sc.hw)||0) + (parseFloat(sc.test)||0) + (parseFloat(sc.ca1)||0);
      return { student_id: selectedStudent.id, subject_id: s.id, scores: sc, total };
    });
    await supabase.from('results').delete().eq('student_id', selectedStudent.id);
    await supabase.from('results').insert(ups);
    await supabase.from('comments').upsert({ student_id: selectedStudent.id, school_id: school.id, tutor_comment: commentData.tutor_comment, behaviors: commentData.behaviors, submission_status: 'pending' });
    alert("Data Saved!"); selectStu(selectedStudent);
  };

  return (
    <div className="flex h-screen bg-white">
      <div className={`fixed lg:static inset-y-0 left-0 w-72 bg-slate-900 text-white p-6 transition-transform z-40 ${side ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <h1 className="text-xl font-black text-blue-400 mb-10 flex items-center gap-2"><School/> {school?.name || 'Loading...'}</h1>
        <select className="w-full bg-slate-800 p-3 rounded-xl mb-6" onChange={(e)=>loadClass(e.target.value)}>
          <option value="">Choose Class</option>
          {classList.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <div className="flex-1 overflow-auto">
          {students.map(s => (
            <div key={s.id} onClick={()=>selectStu(s)} className={`p-3 cursor-pointer rounded-xl mb-1 ${selectedStudent?.id === s.id ? 'bg-blue-600' : 'hover:bg-white/5'}`}>{s.name}</div>
          ))}
        </div>
        <button onClick={onLogout} className="mt-6 flex items-center gap-3 text-red-400 font-bold p-3 hover:bg-red-400/10 rounded-xl w-full transition"><LogOut size={20}/> Logout</button>
      </div>

      <div className="flex-1 flex flex-col bg-slate-50">
        <div className="p-6 bg-white border-b flex items-center gap-4 shadow-sm">
          <button onClick={()=>setSide(true)} className="lg:hidden"><Menu/></button>
          <div className="flex-1">
            <h2 className="text-xl font-black">{selectedStudent?.name || "Select a Student"}</h2>
          </div>
          {selectedStudent && <button onClick={save} className="bg-blue-600 text-white px-6 py-2 rounded-xl font-bold">Save Report</button>}
        </div>

        <div className="p-8 overflow-auto">
          {selectedStudent ? (
            <div className="max-w-4xl mx-auto space-y-6">
              <div className="flex gap-4 border-b pb-2 text-xs font-bold uppercase tracking-widest text-slate-400">
                <button onClick={()=>setTab('scores')} className={tab==='scores'?'text-blue-600 border-b-2 border-blue-600':''}>Scores</button>
                <button onClick={()=>setTab('traits')} className={tab==='traits'?'text-blue-600 border-b-2 border-blue-600':''}>Behavior</button>
                <button onClick={()=>setTab('remarks')} className={tab==='remarks'?'text-blue-600 border-b-2 border-blue-600':''}>Remarks</button>
              </div>

              {tab === 'scores' && (
                <div className="bg-white p-6 rounded-3xl shadow-sm border overflow-auto">
                  <table className="w-full text-left">
                    <thead><tr className="text-[10px] text-slate-400 font-black uppercase"><th>Subject</th><th>Note</th><th>CW</th><th>HW</th><th>Test</th><th>CA1</th><th>Total</th></tr></thead>
                    <tbody>
                      {subjects.map(sub => (
                        <tr key={sub.id} className="border-b">
                          <td className="py-4 font-bold">{sub.name}</td>
                          {['note', 'cw', 'hw', 'test', 'ca1'].map(f => (
                            <td key={f}><input type="number" className="w-12 border p-1 rounded" value={scores[sub.id]?.[f] || ''} onChange={(e)=>{
                              const ns = {...scores}; ns[sub.id] = {...(ns[sub.id]||{}), [f]: e.target.value}; setScores(ns);
                            }}/></td>
                          ))}
                          <td className="font-bold text-blue-600">
                            {(parseFloat(scores[sub.id]?.note)||0) + (parseFloat(scores[sub.id]?.cw)||0) + (parseFloat(scores[sub.id]?.hw)||0) + (parseFloat(scores[sub.id]?.test)||0) + (parseFloat(scores[sub.id]?.ca1)||0)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <button onClick={() => {
                    const n = prompt("Subject Name:");
                    if(n) supabase.from('subjects').insert({ name: n, class_id: selectedClassId }).then(()=>loadClass(selectedClassId));
                  }} className="mt-4 text-blue-600 font-bold flex items-center gap-2"><Plus size={16}/> Add Subject</button>
                </div>
              )}

              {tab === 'traits' && (
                <div className="grid grid-cols-2 gap-4">
                  {BEHAVIORS.map(b => (
                    <div key={b} className="bg-white p-4 rounded-2xl border flex justify-between items-center">
                      <span className="font-bold text-slate-600">{b}</span>
                      <select className="border-2 rounded-lg p-1" value={commentData.behaviors?.[b] || ''} onChange={(e)=>setCommentData({...commentData, behaviors: {...commentData.behaviors, [b]: e.target.value}})}>
                        <option value="">-</option>
                        {RATINGS.map(r=><option key={r} value={r}>{r}</option>)}
                      </select>
                    </div>
                  ))}
                </div>
              )}

              {tab === 'remarks' && (
                <textarea className="w-full border-2 p-6 h-40 rounded-3xl outline-none" value={commentData.tutor_comment || ''} onChange={(e)=>setCommentData({...commentData, tutor_comment: e.target.value})} placeholder="Enter teacher remarks..." />
              )}
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-slate-300 italic">Select a student from the sidebar to begin.</div>
          )}
        </div>
      </div>
    </div>
  );
};

// ==================== SCHOOL ADMIN DASHBOARD ====================
const AdminDashboard = ({ profile, onLogout }) => {
  const [school, setSchool] = useState(null);
  const [students, setStudents] = useState([]);
  const [tab, setTab] = useState('review');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [commentData, setCommentData] = useState({});

  const load = useCallback(async () => {
    const { data: s } = await supabase.from('schools').select('*').eq('id', profile.school_id).single();
    const { data: st } = await supabase.from('students').select('*').eq('school_id', profile.school_id);
    setSchool(s); setStudents(st || []);
  }, [profile.school_id]);

  useEffect(() => { load(); }, [load]);

  const approve = async () => {
    await supabase.from('comments').update({ submission_status: 'approved', principal_comment: commentData.principal_comment }).eq('student_id', selectedStudent.id);
    alert("Report Card Approved!"); setSelectedStudent(null); load();
  };

  return (
    <div className="flex h-screen bg-slate-50">
      <div className="w-64 bg-indigo-950 text-white p-6">
        <h1 className="font-black text-xl mb-10 text-indigo-400">ADMIN</h1>
        <button onClick={()=>setTab('review')} className={`w-full text-left p-4 rounded-xl mb-2 ${tab==='review'?'bg-white/10':''}`}>Review Reports</button>
        <button onClick={onLogout} className="mt-10 text-red-400 p-4 flex items-center gap-2"><LogOut size={16}/> Logout</button>
      </div>
      <div className="flex-1 p-10 overflow-auto">
        <h2 className="text-3xl font-black mb-8">{school?.name}</h2>
        <div className="bg-white rounded-3xl border shadow-sm">
          {students.map(s => (
            <div key={s.id} onClick={async () => {
              const { data } = await supabase.from('comments').select('*').eq('student_id', s.id).maybeSingle();
              setSelectedStudent(s); setCommentData(data || {});
            }} className="p-6 border-b hover:bg-slate-50 flex justify-between cursor-pointer">
              <span className="font-bold">{s.name}</span>
              <span className="text-blue-600 font-bold text-xs uppercase">Review Report →</span>
            </div>
          ))}
        </div>
      </div>
      {selectedStudent && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white p-10 rounded-[40px] w-full max-w-xl">
             <h3 className="text-xl font-black mb-4">Review: {selectedStudent.name}</h3>
             <textarea className="w-full border-2 p-4 h-40 rounded-2xl mb-4" placeholder="Principal's comment..." value={commentData.principal_comment || ''} onChange={(e)=>setCommentData({...commentData, principal_comment: e.target.value})} />
             <div className="flex gap-4">
               <button onClick={approve} className="flex-1 bg-indigo-600 text-white py-4 rounded-xl font-bold">Approve & Publish</button>
               <button onClick={()=>setSelectedStudent(null)} className="px-6 text-slate-400">Cancel</button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ==================== AUTH & PORTALS ====================
const Auth = ({ onParent }) => {
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault(); setLoading(true);
    const { error } = await supabase.auth.signInWithPassword(form);
    if (error) alert(error.message);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="bg-white p-10 rounded-[50px] shadow-2xl max-w-md w-full border-t-[12px] border-blue-600">
        <h1 className="text-4xl font-black text-center mb-10 text-blue-600 italic tracking-tighter">SPRINGFORTH</h1>
        <form onSubmit={submit} className="space-y-4">
          <input className="w-full border-2 p-4 rounded-2xl" type="email" placeholder="Email" onChange={(e)=>setForm({...form, email: e.target.value})} required />
          <input className="w-full border-2 p-4 rounded-2xl" type="password" placeholder="Password" onChange={(e)=>setForm({...form, password: e.target.value})} required />
          <button className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black shadow-xl shadow-blue-100 uppercase tracking-widest">{loading ? <Loader2 className="animate-spin mx-auto"/> : 'Login'}</button>
        </form>
        <button onClick={onParent} className="w-full mt-6 bg-slate-50 py-4 rounded-2xl font-black text-slate-400 uppercase text-xs flex justify-center items-center gap-2"><Search size={16}/> Parent Portal</button>
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
    else alert("Report card not yet approved or student not found.");
    setLoading(false);
  };

  if (data) return (
    <div className="fixed inset-0 bg-white flex flex-col">
      <div className="p-4 bg-slate-900 text-white flex justify-between items-center">
        <button onClick={()=>setData(null)} className="font-bold">← New Search</button>
        <div className="font-black italic">REPORT PREVIEW</div>
        <PDFDownloadLink document={<ResultPDF school={data.schools} student={data} results={data.results} comments={data.comments[0]} />} fileName="report_card.pdf">
           <button className="bg-blue-600 px-4 py-2 rounded-lg font-bold">Download</button>
        </PDFDownloadLink>
      </div>
      <PDFViewer className="flex-1 border-none"><ResultPDF school={data.schools} student={data} results={data.results} comments={data.comments[0]} /></PDFViewer>
    </div>
  );

  return (
    <div className="min-h-screen bg-blue-50 flex items-center justify-center p-4">
      <div className="bg-white p-12 rounded-[50px] shadow-2xl max-w-sm w-full text-center">
        <h2 className="text-3xl font-black mb-8">Parent Portal</h2>
        <input className="w-full border-2 p-5 rounded-3xl mb-4 text-center font-bold outline-none focus:border-blue-600 text-xl" placeholder="ADM-XXXX" onChange={(e)=>setId(e.target.value)} />
        <button onClick={lookup} className="w-full bg-blue-600 text-white py-5 rounded-3xl font-black shadow-xl">{loading ? <Loader2 className="animate-spin mx-auto"/> : 'View Report'}</button>
        <button onClick={onBack} className="mt-8 text-slate-400 uppercase text-xs font-bold">Back to Staff Login</button>
      </div>
    </div>
  );
};

// ==================== ROOT APP ====================
const App = () => {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [view, setView] = useState('auth');
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(async (userId, userEmail) => {
    if (userEmail === CENTRAL_ADMIN_EMAIL) { setProfile({ role: 'central_admin' }); setLoading(false); return; }
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
    setProfile(data); setLoading(false);
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: s } }) => { 
      setSession(s); if (!s) setLoading(false); else loadProfile(s.user.id, s.user.email);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => { 
      setSession(s); if (!s) { setProfile(null); setView('auth'); setLoading(false); } else loadProfile(s.user.id, s.user.email);
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
