import React, { useState, useEffect, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Document, Page, Text, View, StyleSheet, PDFViewer, PDFDownloadLink, Image } from '@react-pdf/renderer';
import { Loader2, School, LogOut, Users, CheckCircle, Search, Menu, X, Upload, Shield, UserCog, Plus, BookOpen, Trash2, GraduationCap, MapPin, Phone } from 'lucide-react';

const supabaseUrl = 'https://ghlnenmfwlpwlqdrbean.supabase.co'; 
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdobG5lbm1md2xwd2xxZHJiZWFuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ0MTE0MDQsImV4cCI6MjA3OTk4NzQwNH0.rNILUdI035c4wl4kFkZFP4OcIM_t7bNMqktKm25d5Gg'; 
const supabase = createClient(supabaseUrl, supabaseKey);

const BEHAVIORS = ['RESPECT', 'RESPONSIBILITY', 'EMPATHY', 'SELF DISCIPLINE', 'COOPERATION', 'LEADERSHIP', 'HONESTY'];
const RATINGS = ['5', '4', '3', '2', '1'];
const CENTRAL_ADMIN_EMAIL = 'admin@admin.com';

// ==================== GRADING LOGIC (40/60) ====================
const getGrade = (score) => {
  if (score >= 80) return { g: 'A', r: 'Excellent' };
  if (score >= 70) return { g: 'B', r: 'Very Good' };
  if (score >= 60) return { g: 'C', r: 'Good' };
  if (score >= 50) return { g: 'P', r: 'Pass' };
  return { g: 'F', r: 'Needs Improvement' };
};

// ==================== NEW MODERN PDF STYLES ====================
const pdfStyles = StyleSheet.create({
  page: { padding: 40, fontSize: 9, fontFamily: 'Helvetica', color: '#1e293b' },
  header: { borderBottom: '2pt solid #4338ca', paddingBottom: 15, marginBottom: 20, flexDirection: 'row', alignItems: 'center' },
  logo: { width: 70, height: 70, marginRight: 20 },
  schoolInfo: { flex: 1 },
  schoolName: { fontSize: 22, fontWeight: 'bold', color: '#4338ca', marginBottom: 4 },
  reportTitle: { fontSize: 10, color: '#64748b', textTransform: 'uppercase', letterSpacing: 1 },
  bioGrid: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 25, backgroundColor: '#f8fafc', padding: 15, borderRadius: 8 },
  bioItem: { width: '50%', marginBottom: 6 },
  label: { color: '#64748b', fontSize: 8, textTransform: 'uppercase' },
  value: { fontWeight: 'bold', fontSize: 10 },
  table: { marginTop: 10 },
  th: { backgroundColor: '#4338ca', color: '#fff', flexDirection: 'row', padding: 8, fontWeight: 'bold' },
  tr: { flexDirection: 'row', borderBottom: '1pt solid #e2e8f0', padding: 8, alignItems: 'center' },
  td: { flex: 1 },
  tdSubject: { flex: 2, fontWeight: 'bold' },
  center: { textAlign: 'center' },
  behaviorSection: { marginTop: 30 },
  behaviorGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  behaviorCard: { width: '31%', padding: 8, border: '1pt solid #e2e8f0', borderRadius: 4 },
  footer: { marginTop: 'auto', flexDirection: 'row', justifyContent: 'space-between', borderTop: '1pt solid #e2e8f0', paddingTop: 20 },
  sig: { width: 150, textAlign: 'center' }
});

const ResultPDF = ({ school, student, results = [], comments }) => {
  const totalPoints = results.reduce((acc, r) => acc + (parseFloat(r.total) || 0), 0);
  const avg = results.length > 0 ? (totalPoints / results.length).toFixed(1) : 0;

  return (
    <Document>
      <Page size="A4" style={pdfStyles.page}>
        <View style={pdfStyles.header}>
          {school?.logo_url && <Image src={school.logo_url} style={pdfStyles.logo} />}
          <View style={pdfStyles.schoolInfo}>
            <Text style={pdfStyles.schoolName}>{school?.name?.toUpperCase() || 'SPRINGFORTH ACADEMY'}</Text>
            <Text>{school?.address || 'School Address Not Set'}</Text>
            <Text>{school?.contact_info || 'Contact Info Not Set'}</Text>
            <Text style={pdfStyles.reportTitle}>Student Progress Report Card</Text>
          </View>
        </View>

        <View style={pdfStyles.bioGrid}>
          <View style={pdfStyles.bioItem}><Text style={pdfStyles.label}>Student Name</Text><Text style={pdfStyles.value}>{student?.name}</Text></View>
          <View style={pdfStyles.bioItem}><Text style={pdfStyles.label}>Admission No</Text><Text style={pdfStyles.value}>{student?.admission_no}</Text></View>
          <View style={pdfStyles.bioItem}><Text style={pdfStyles.label}>Class</Text><Text style={pdfStyles.value}>{student?.classes?.name}</Text></View>
          <View style={pdfStyles.bioItem}><Text style={pdfStyles.label}>Performance</Text><Text style={pdfStyles.value}>Average: {avg}% ({getGrade(avg).g})</Text></View>
        </View>

        <View style={pdfStyles.table}>
          <View style={pdfStyles.th}>
            <Text style={pdfStyles.tdSubject}>Subject</Text>
            <Text style={[pdfStyles.td, pdfStyles.center]}>CA (40)</Text>
            <Text style={[pdfStyles.td, pdfStyles.center]}>Exam (60)</Text>
            <Text style={[pdfStyles.td, pdfStyles.center]}>Total</Text>
            <Text style={[pdfStyles.td, pdfStyles.center]}>Grade</Text>
          </View>
          {results.map((r, i) => (
            <View key={i} style={pdfStyles.tr}>
              <Text style={pdfStyles.tdSubject}>{r.subjects?.name}</Text>
              <Text style={[pdfStyles.td, pdfStyles.center]}>{r.scores?.ca || 0}</Text>
              <Text style={[pdfStyles.td, pdfStyles.center]}>{r.scores?.exam || 0}</Text>
              <Text style={[pdfStyles.td, pdfStyles.center]}>{r.total || 0}</Text>
              <Text style={[pdfStyles.td, pdfStyles.center]}>{getGrade(r.total).g}</Text>
            </View>
          ))}
        </View>

        <View style={pdfStyles.behaviorSection}>
          <Text style={[pdfStyles.label, { marginBottom: 10 }]}>Behavioral & Developmental Traits</Text>
          <View style={pdfStyles.behaviorGrid}>
            {BEHAVIORS.map(b => (
              <View key={b} style={pdfStyles.behaviorCard}>
                <Text style={{ fontSize: 7, color: '#64748b' }}>{b}</Text>
                <Text style={{ fontWeight: 'bold' }}>Rating: {comments?.behaviors?.[b] || 'N/A'}/5</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={{ marginTop: 25, backgroundColor: '#f1f5f9', padding: 10, borderRadius: 5 }}>
          <Text style={pdfStyles.label}>Tutor Remarks</Text>
          <Text style={{ marginTop: 5 }}>{comments?.tutor_comment || 'No comment provided.'}</Text>
          <Text style={[pdfStyles.label, { marginTop: 10 }]}>Principal's Comment</Text>
          <Text style={{ marginTop: 5 }}>{comments?.principal_comment || 'Awaiting review.'}</Text>
        </View>

        <View style={pdfStyles.footer}>
          <View style={pdfStyles.sig}><Text>__________________</Text><Text style={pdfStyles.label}>Form Tutor</Text></View>
          <View style={pdfStyles.sig}><Text>__________________</Text><Text style={pdfStyles.label}>School Principal</Text></View>
        </View>
      </Page>
    </Document>
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
  const [currentResults, setCurrentResults] = useState([]);
  const [commentData, setCommentData] = useState({ behaviors: {} });
  const [preview, setPreview] = useState(false);
  const [tab, setTab] = useState('scores');
  const [side, setSide] = useState(false);

  const init = useCallback(async () => {
    const { data: s } = await supabase.from('schools').select('*').eq('id', profile.school_id).single();
    const { data: c } = await supabase.from('classes').select('*').eq('school_id', profile.school_id);
    setSchool(s); setClassList(c || []);
  }, [profile.school_id]);

  useEffect(() => { init(); }, [init]);

  const addClass = async () => {
    const n = prompt("Class Name (e.g. Grade 1):");
    if(n) { await supabase.from('classes').insert({ name: n, school_id: profile.school_id }); init(); }
  };

  const loadClass = async (id) => {
    setSelectedClassId(id);
    const { data: st } = await supabase.from('students').select('*').eq('class_id', id);
    const { data: sub } = await supabase.from('subjects').select('*').eq('class_id', id);
    setStudents(st || []); setSubjects(sub || []); setSelectedStudent(null);
  };

  const addStudent = async () => {
    if(!selectedClassId) return alert("Select a class first");
    const n = prompt("Student Name:");
    if(n) {
      await supabase.from('students').insert({ name: n, class_id: selectedClassId, school_id: profile.school_id, admission_no: `ADM-${Math.floor(Math.random()*9000)}` });
      loadClass(selectedClassId);
    }
  };

  const addSubject = async () => {
    if(!selectedClassId) return alert("Select a class first");
    const n = prompt("Subject Name:");
    if(n) { await supabase.from('subjects').insert({ name: n, class_id: selectedClassId }); loadClass(selectedClassId); }
  };

  const selectStu = async (s) => {
    setSelectedStudent(s); setSide(false);
    const { data: rs } = await supabase.from('results').select('*, subjects(name)').eq('student_id', s.id);
    const { data: co } = await supabase.from('comments').select('*').eq('student_id', s.id).maybeSingle();
    setCurrentResults(rs || []);
    setScores(rs?.reduce((a, r) => ({ ...a, [r.subject_id]: r.scores }), {}) || {});
    setCommentData(co || { behaviors: {}, submission_status: 'draft' });
  };

  const save = async () => {
    const ups = subjects.map(s => {
      const sc = scores[s.id] || { ca: 0, exam: 0 };
      return { student_id: selectedStudent.id, subject_id: s.id, scores: sc, total: (parseFloat(sc.ca)||0) + (parseFloat(sc.exam)||0) };
    });
    await supabase.from('results').delete().eq('student_id', selectedStudent.id);
    await supabase.from('results').insert(ups);
    await supabase.from('comments').upsert({ student_id: selectedStudent.id, school_id: school.id, tutor_comment: commentData.tutor_comment, behaviors: commentData.behaviors, submission_status: 'pending' });
    alert("Saved!"); selectStu(selectedStudent);
  };

  return (
    <div className="flex h-screen bg-slate-50">
      <div className={`fixed lg:static inset-y-0 left-0 w-72 bg-indigo-950 text-white p-6 transition-transform z-40 ${side ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="flex justify-between items-center mb-10"><h1 className="text-xl font-black text-indigo-300 flex items-center gap-2"><School/> Portal</h1><button onClick={()=>setSide(false)} className="lg:hidden"><X/></button></div>
        
        <div className="flex justify-between items-center mb-2 text-[10px] font-black uppercase text-indigo-400">
          <span>Classes</span>
          <button onClick={addClass} className="hover:text-white"><Plus size={14}/></button>
        </div>
        <select className="w-full bg-indigo-900 border-none rounded-xl p-3 mb-6 text-sm" onChange={(e)=>loadClass(e.target.value)}>
          <option value="">Choose Class</option>
          {classList.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
        </select>

        {selectedClassId && (
          <div className="flex-1">
            <div className="flex justify-between items-center mb-2 text-[10px] font-black uppercase text-indigo-400">
              <span className="flex items-center gap-1"><Users size={12}/> Students</span>
              <button onClick={addStudent} className="hover:text-white"><Plus size={14}/></button>
            </div>
            <div className="space-y-1 mb-6 max-h-60 overflow-y-auto">
              {students.map(s => (
                <div key={s.id} onClick={()=>selectStu(s)} className={`p-2 rounded-lg cursor-pointer transition ${selectedStudent?.id === s.id ? 'bg-indigo-600' : 'hover:bg-white/5'}`}>{s.name}</div>
              ))}
            </div>
            
            <div className="flex justify-between items-center mb-2 text-[10px] font-black uppercase text-indigo-400">
              <span className="flex items-center gap-1"><BookOpen size={12}/> Subjects</span>
              <button onClick={addSubject} className="hover:text-white"><Plus size={14}/></button>
            </div>
            <div className="text-[11px] opacity-50 italic">Manage {subjects.length} subjects for this class</div>
          </div>
        )}
        <button onClick={onLogout} className="mt-auto flex items-center gap-3 text-red-400 font-bold p-3 hover:bg-red-400/10 rounded-xl w-full"><LogOut size={20}/> Logout</button>
      </div>

      <div className="flex-1 flex flex-col">
        <div className="p-6 bg-white border-b flex items-center gap-4">
          <button onClick={()=>setSide(true)} className="lg:hidden"><Menu/></button>
          <div className="flex-1"><h2 className="text-xl font-black text-slate-800">{selectedStudent?.name || "Academic Management"}</h2></div>
          {selectedStudent && <div className="flex gap-2"><button onClick={()=>setPreview(true)} className="bg-slate-100 px-4 py-2 rounded-xl font-bold">Preview</button><button onClick={save} className="bg-indigo-600 text-white px-6 py-2 rounded-xl font-bold">Save</button></div>}
        </div>

        {selectedStudent ? (
          <div className="p-8 max-w-4xl w-full mx-auto">
            <div className="flex gap-6 mb-8 border-b">
              <button onClick={()=>setTab('scores')} className={`pb-4 font-bold ${tab==='scores' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-slate-400'}`}>Scores</button>
              <button onClick={()=>setTab('traits')} className={`pb-4 font-bold ${tab==='traits' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-slate-400'}`}>Traits</button>
            </div>
            {tab==='scores' && (
              <div className="bg-white p-6 rounded-2xl shadow-sm border">
                <table className="w-full text-left">
                  <thead className="text-[10px] font-black uppercase text-slate-400"><tr><th className="pb-4">Subject</th><th>CA (40)</th><th>Exam (60)</th><th>Total</th></tr></thead>
                  <tbody>
                    {subjects.map(sub => (
                      <tr key={sub.id} className="border-t">
                        <td className="py-4 font-bold">{sub.name}</td>
                        <td><input type="number" className="w-20 border rounded-lg p-2" value={scores[sub.id]?.ca || ''} onChange={(e)=>setScores({...scores, [sub.id]: {...(scores[sub.id]||{}), ca: e.target.value}})} /></td>
                        <td><input type="number" className="w-20 border rounded-lg p-2" value={scores[sub.id]?.exam || ''} onChange={(e)=>setScores({...scores, [sub.id]: {...(scores[sub.id]||{}), exam: e.target.value}})} /></td>
                        <td className="font-bold text-indigo-600">{(parseFloat(scores[sub.id]?.ca)||0) + (parseFloat(scores[sub.id]?.exam)||0)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {tab==='traits' && (
              <div className="grid grid-cols-2 gap-4">
                {BEHAVIORS.map(b => (
                  <div key={b} className="p-4 bg-white rounded-xl border flex justify-between items-center">
                    <span className="text-xs font-bold">{b}</span>
                    <select className="border rounded p-1" value={commentData.behaviors?.[b] || ''} onChange={(e)=>setCommentData({...commentData, behaviors: {...commentData.behaviors, [b]: e.target.value}})}>
                      <option value="">-</option>{RATINGS.map(r=><option key={r} value={r}>{r}</option>)}
                    </select>
                  </div>
                ))}
                <textarea className="col-span-2 mt-4 p-4 border rounded-xl h-32" placeholder="Tutor Remark..." value={commentData.tutor_comment || ''} onChange={(e)=>setCommentData({...commentData, tutor_comment: e.target.value})} />
              </div>
            )}
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-300">
             <CheckCircle size={100} className="mb-4 opacity-10"/>
             <p className="font-bold uppercase tracking-widest">Select a student or manage classes in sidebar</p>
          </div>
        )}
      </div>

      {preview && (
        <div className="fixed inset-0 z-50 bg-slate-900/90 flex flex-col p-4 backdrop-blur-sm">
          <div className="bg-white p-4 flex justify-between rounded-t-2xl">
            <button onClick={()=>setPreview(false)} className="text-red-500 font-bold">✕ Close Preview</button>
            <PDFDownloadLink document={<ResultPDF school={school} student={selectedStudent} results={currentResults} comments={commentData} />} fileName="result.pdf" className="bg-indigo-600 text-white px-6 py-2 rounded-xl">Download</PDFDownloadLink>
          </div>
          <PDFViewer className="flex-1 rounded-b-2xl"><ResultPDF school={school} student={selectedStudent} results={currentResults} comments={commentData} /></PDFViewer>
        </div>
      )}
    </div>
  );
};

// ==================== SCHOOL ADMIN DASHBOARD ====================
const AdminDashboard = ({ profile, onLogout }) => {
  const [school, setSchool] = useState({});
  const [tab, setTab] = useState('review');
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [commentData, setCommentData] = useState({});

  const load = useCallback(async () => {
    const { data: s } = await supabase.from('schools').select('*').eq('id', profile.school_id).single();
    const { data: st } = await supabase.from('students').select('*, classes(name)').eq('school_id', profile.school_id);
    setSchool(s || {}); setStudents(st || []);
  }, [profile.school_id]);

  useEffect(() => { load(); }, [load]);

  const updateSchool = async () => {
    await supabase.from('schools').update({ name: school.name, address: school.address, contact_info: school.contact_info }).eq('id', school.id);
    alert("Profile Updated!");
  };

  const approve = async () => {
    await supabase.from('comments').update({ submission_status: 'approved', principal_comment: commentData.principal_comment }).eq('student_id', selectedStudent.id);
    alert("Approved!"); setSelectedStudent(null); load();
  };

  return (
    <div className="flex h-screen bg-slate-50">
      <div className="w-64 bg-slate-900 text-white p-6 flex flex-col">
        <h1 className="text-xl font-black mb-10 flex items-center gap-2"><Shield className="text-indigo-400"/> ADMIN</h1>
        <button onClick={()=>setTab('review')} className={`p-4 text-left rounded-xl mb-2 flex items-center gap-3 ${tab==='review' ? 'bg-indigo-600' : ''}`}><CheckCircle size={20}/> Approvals</button>
        <button onClick={()=>setTab('setup')} className={`p-4 text-left rounded-xl mb-2 flex items-center gap-3 ${tab==='setup' ? 'bg-indigo-600' : ''}`}><School size={20}/> School Profile</button>
        <button onClick={onLogout} className="mt-auto p-4 flex items-center gap-3 text-red-400 font-bold"><LogOut size={20}/> Logout</button>
      </div>
      <div className="flex-1 p-10 overflow-auto">
        {tab === 'setup' ? (
          <div className="max-w-2xl bg-white p-10 rounded-3xl shadow-sm border mx-auto">
            <h2 className="text-2xl font-black mb-6">School Profile</h2>
            <div className="space-y-4">
              <label className="block"><span className="text-xs font-bold uppercase text-slate-400">School Name</span><input className="w-full border-2 p-3 rounded-xl mt-1" value={school.name || ''} onChange={(e)=>setSchool({...school, name: e.target.value})} /></label>
              <label className="block"><span className="text-xs font-bold uppercase text-slate-400 flex items-center gap-1"><MapPin size={12}/> Address</span><input className="w-full border-2 p-3 rounded-xl mt-1" value={school.address || ''} onChange={(e)=>setSchool({...school, address: e.target.value})} /></label>
              <label className="block"><span className="text-xs font-bold uppercase text-slate-400 flex items-center gap-1"><Phone size={12}/> Contact Info</span><input className="w-full border-2 p-3 rounded-xl mt-1" value={school.contact_info || ''} onChange={(e)=>setSchool({...school, contact_info: e.target.value})} /></label>
              <button onClick={updateSchool} className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold">Save School Identity</button>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border shadow-sm">
            <div className="p-6 border-b font-black text-slate-700">Pending Results Review</div>
            {students.map(s => (
              <div key={s.id} onClick={async () => {
                const { data: co } = await supabase.from('comments').select('*').eq('student_id', s.id).maybeSingle();
                setSelectedStudent(s); setCommentData(co || {});
              }} className="p-6 border-b hover:bg-slate-50 cursor-pointer flex justify-between items-center transition">
                <span className="font-bold">{s.name} ({s.classes?.name})</span>
                <span className="text-indigo-600 font-bold text-xs uppercase">Review Result →</span>
              </div>
            ))}
          </div>
        )}
      </div>
      {selectedStudent && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50">
          <div className="bg-white p-8 rounded-3xl w-full max-w-xl">
            <h3 className="text-xl font-black mb-4">Final Review: {selectedStudent.name}</h3>
            <textarea className="w-full border-2 p-4 h-40 rounded-xl mb-6" placeholder="Principal remark..." value={commentData.principal_comment || ''} onChange={(e)=>setCommentData({...commentData, principal_comment: e.target.value})} />
            <div className="flex gap-4">
              <button onClick={approve} className="flex-1 bg-indigo-600 text-white py-4 rounded-xl font-bold">Approve & Publish</button>
              <button onClick={()=>setSelectedStudent(null)} className="px-6 font-bold text-slate-400">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ==================== CENTRAL ADMIN ====================
const CentralAdminDashboard = ({ onLogout }) => {
  const [users, setUsers] = useState([]);
  const [schools, setSchools] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);

  const load = useCallback(async () => {
    const { data: p } = await supabase.from('profiles').select('*, schools(name)');
    const { data: s } = await supabase.from('schools').select('*');
    setUsers(p || []); setSchools(s || []);
  }, []);

  useEffect(() => { load(); }, [load]);

  const updateStaff = async (uid, updates) => {
    try {
      const { error } = await supabase.from('profiles').update(updates).eq('id', uid);
      if (error) throw error;
      alert("Updated!"); load(); setSelectedUser(null);
    } catch (err) { alert(err.message); }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="flex justify-between items-center bg-slate-900 text-white p-6 rounded-2xl mb-8">
        <h1 className="text-2xl font-black flex items-center gap-3"><Shield className="text-indigo-400"/> SYSTEM CORE</h1>
        <button onClick={onLogout} className="bg-white/10 px-6 py-2 rounded-xl font-bold">Logout</button>
      </div>
      <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b text-[10px] font-black uppercase"><tr><th className="p-4">Staff Name</th><th>School</th><th>Role</th><th>Actions</th></tr></thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id} className="border-b hover:bg-slate-50 transition">
                <td className="p-4 font-bold text-slate-700">{u.full_name}</td>
                <td className="text-slate-500">{u.schools?.name || 'Floating'}</td>
                <td><span className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-bold uppercase">{u.role}</span></td>
                <td><button onClick={() => setSelectedUser(u)} className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg"><UserCog size={18}/></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {selectedUser && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50">
          <div className="bg-white p-8 rounded-3xl w-full max-w-sm shadow-2xl">
            <h3 className="text-lg font-black mb-6">Manage Account: {selectedUser.full_name}</h3>
            <div className="space-y-4">
              <label className="block text-xs font-bold text-slate-400 mb-1 uppercase">Role</label>
              <select className="w-full border-2 p-3 rounded-xl" defaultValue={selectedUser.role} onChange={(e) => updateStaff(selectedUser.id, { role: e.target.value })}>
                <option value="teacher">Teacher</option><option value="admin">School Admin</option>
              </select>
              <label className="block text-xs font-bold text-slate-400 mb-1 uppercase">Assigned School</label>
              <select className="w-full border-2 p-3 rounded-xl" defaultValue={selectedUser.school_id} onChange={(e) => updateStaff(selectedUser.id, { school_id: e.target.value })}>
                <option value="">None</option>
                {schools.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
              <button onClick={() => setSelectedUser(null)} className="w-full py-4 text-slate-400 font-bold">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ==================== AUTH & PORTALS ====================
const Auth = ({ onParent }) => {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ email: '', password: '', name: '', schoolId: '' });
  const [loading, setLoading] = useState(false);
  const [schools, setSchools] = useState([]);

  useEffect(() => { supabase.from('schools').select('id, name').then(({data}) => setSchools(data || [])); }, []);

  const submit = async (e) => {
    e.preventDefault(); setLoading(true);
    try {
      if (mode === 'login') await supabase.auth.signInWithPassword({ email: form.email, password: form.password });
      else {
        const { data: { user } } = await supabase.auth.signUp({ email: form.email, password: form.password });
        if (mode === 'school_reg') {
          const { data: s } = await supabase.from('schools').insert({ owner_id: user.id, name: form.name }).select().single();
          await supabase.from('profiles').insert({ id: user.id, full_name: form.name, role: 'admin', school_id: s.id });
        } else {
          await supabase.from('profiles').insert({ id: user.id, full_name: form.name, role: 'teacher', school_id: form.schoolId });
        }
        alert("Success! Check your email.");
      }
    } catch (err) { alert(err.message); }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-indigo-50 flex items-center justify-center p-4">
      <div className="bg-white p-10 rounded-[40px] shadow-2xl max-w-md w-full border-t-8 border-indigo-600">
        <h1 className="text-3xl font-black text-center mb-10 text-indigo-600">SPRINGFORTH</h1>
        <div className="flex gap-4 mb-8 border-b text-[10px] font-black uppercase pb-3 overflow-x-auto whitespace-nowrap">
          {['login', 'school_reg', 'teacher_reg'].map(m => (
            <button key={m} onClick={() => setMode(m)} className={mode === m ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-400'}>{m.replace('_',' ')}</button>
          ))}
        </div>
        <form onSubmit={submit} className="space-y-4">
          {mode !== 'login' && <input className="w-full border-2 p-4 rounded-2xl" placeholder="Full Name" onChange={(e)=>setForm({...form, name: e.target.value})} required />}
          <input className="w-full border-2 p-4 rounded-2xl" type="email" placeholder="Email Address" onChange={(e)=>setForm({...form, email: e.target.value})} required />
          <input className="w-full border-2 p-4 rounded-2xl" type="password" placeholder="Password" onChange={(e)=>setForm({...form, password: e.target.value})} required />
          {mode === 'teacher_reg' && (
            <select className="w-full border-2 p-4 rounded-2xl bg-white font-bold" onChange={(e)=>setForm({...form, schoolId: e.target.value})} required>
              <option value="">Choose School</option>
              {schools.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          )}
          <button className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black shadow-lg shadow-indigo-100 hover:scale-[1.02] transition">
            {loading ? <Loader2 className="animate-spin mx-auto"/> : 'Proceed to Dashboard'}
          </button>
        </form>
        <button onClick={onParent} className="w-full bg-slate-50 py-4 rounded-2xl mt-8 font-black uppercase text-slate-400 flex justify-center items-center gap-3 transition hover:bg-slate-100"><Search size={18}/> Parent Portal</button>
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
    else alert("Result not found or pending approval.");
    setLoading(false);
  };

  if (data) return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col">
      <button onClick={()=>setData(null)} className="p-6 bg-slate-100 font-black text-slate-600 flex items-center gap-3">← RETURN TO SEARCH</button>
      <PDFViewer className="flex-1 border-none"><ResultPDF school={data.schools} student={data} results={data.results} comments={data.comments[0]} /></PDFViewer>
    </div>
  );

  return (
    <div className="min-h-screen bg-indigo-950 flex items-center justify-center p-4">
      <div className="bg-white p-12 rounded-[50px] shadow-2xl max-w-md w-full text-center">
        <GraduationCap size={70} className="mx-auto text-indigo-600 mb-6"/>
        <h2 className="text-3xl font-black mb-2 text-slate-800">Student Portal</h2>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-8">Official Result Checking</p>
        <input className="w-full border-2 p-5 rounded-3xl mb-4 text-center font-black tracking-widest text-lg uppercase outline-none focus:border-indigo-600" placeholder="ADM-XXXX" onChange={(e)=>setId(e.target.value)} />
        <button onClick={lookup} className="w-full bg-indigo-600 text-white py-5 rounded-3xl font-black shadow-xl shadow-indigo-200 transition active:scale-95">
          {loading ? <Loader2 className="animate-spin mx-auto"/> : 'Access Transcript'}
        </button>
        <button onClick={onBack} className="mt-8 text-slate-400 block w-full text-xs font-black uppercase hover:underline tracking-widest">Employee Login</button>
      </div>
    </div>
  );
};

// ==================== MAIN APP ====================
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

  if (loading) return <div className="h-screen flex items-center justify-center bg-white"><Loader2 className="animate-spin text-indigo-600" size={48}/></div>;
  if (view === 'parent') return <ParentPortal onBack={() => setView('auth')} />;
  if (!session) return <Auth onParent={() => setView('parent')} />;
  if (profile?.role === 'central_admin') return <CentralAdminDashboard onLogout={() => supabase.auth.signOut()} />;
  if (profile?.role === 'admin') return <AdminDashboard profile={profile} onLogout={() => supabase.auth.signOut()} />;
  return <TeacherDashboard profile={profile} onLogout={() => supabase.auth.signOut()} />;
};

export default App;
