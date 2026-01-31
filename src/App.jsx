import React, { useState, useEffect, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Document, Page, Text, View, StyleSheet, PDFViewer, PDFDownloadLink, Image } from '@react-pdf/renderer';
import { Loader2, School, LogOut,  Search,  Shield, Plus, UserCog, BookOpen } from 'lucide-react';

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
  page: { padding: 40, fontSize: 8, fontFamily: 'Helvetica' },
  header: { textAlign: 'center', marginBottom: 15, borderBottom: 2, paddingBottom: 5 },
  schoolName: { fontSize: 20, fontWeight: 'bold' },
  motto: { fontStyle: 'italic', fontSize: 9, marginBottom: 5 },
  logo: { width: 60, height: 60, marginBottom: 5, alignSelf: 'center' },
  table: { width: '100%', marginTop: 10, borderTop: 1 },
  row: { flexDirection: 'row', borderBottom: 1, padding: 4 },
  cell: { flex: 1, textAlign: 'center' }
});

// ==================== PDF COMPONENT ====================
const ResultPDF = ({ school, student, results, comments, type = 'full' }) => {
  const totalMax = 100;
  let totalObtained = results.reduce((acc, r) => acc + (parseFloat(r.scores?.ca) || 0) + (parseFloat(r.scores?.exam) || 0), 0);
  let subjectCount = results.length;
  const overallMax = subjectCount * totalMax;
  const avg = subjectCount > 0 ? (totalObtained / overallMax) * 100 : 0;
  const gradeInfo = getGrade(avg, 100);

  return (
    <Document>
      <Page size="A4" style={pdfStyles.page}>
        <View style={pdfStyles.header}>
          {school?.logo_url && <Image src={school.logo_url} style={pdfStyles.logo} />}
          <Text style={pdfStyles.schoolName}>{school?.name}</Text>
          <Text style={pdfStyles.motto}>"{school?.motto}"</Text>
          <Text style={{ marginTop: 8, fontWeight: 'bold', fontSize: 11 }}>
            {type === 'ca' ? 'MID-TERM REPORT' : 'END OF TERM REPORT'}
          </Text>
        </View>
        <View style={{ marginBottom: 10, padding: 5, backgroundColor: '#f0f0f0' }}>
          <Text>Name: {student?.name} | Adm: {student?.admission_no}</Text>
          <Text>Class: {student?.classes?.name} | Term: {school?.current_term}</Text>
        </View>
        <View style={pdfStyles.table}>
          <View style={[pdfStyles.row, { backgroundColor: '#eee' }]}>
            <Text style={{ width: 120 }}>Subject</Text>
            <Text style={pdfStyles.cell}>CA</Text>
            <Text style={pdfStyles.cell}>Exam</Text>
            <Text style={pdfStyles.cell}>Total</Text>
            <Text style={pdfStyles.cell}>Grade</Text>
          </View>
          {results.map(r => {
            const subTotal = (parseFloat(r.scores?.ca) || 0) + (parseFloat(r.scores?.exam) || 0);
            return (
              <View key={r.id} style={pdfStyles.row}>
                <Text style={{ width: 120 }}>{r.subjects?.name}</Text>
                <Text style={pdfStyles.cell}>{r.scores?.ca}</Text>
                <Text style={pdfStyles.cell}>{r.scores?.exam}</Text>
                <Text style={pdfStyles.cell}>{subTotal}</Text>
                <Text style={pdfStyles.cell}>{getGrade(subTotal, 100).g}</Text>
              </View>
            );
          })}
        </View>
        <View style={{ marginTop: 15 }}>
          <Text>Average: {avg.toFixed(2)}% | Grade: {gradeInfo.g}</Text>
          <Text style={{ marginTop: 10 }}>Teacher: {comments?.tutor_comment}</Text>
          <Text>Headmistress: {comments?.principal_comment}</Text>
        </View>
      </Page>
    </Document>
  );
};

// ==================== CENTRAL ADMIN ====================
const CentralAdminDashboard = ({ onLogout }) => {
  const [schools, setSchools] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);

  const loadData = useCallback(async () => {
    const { data: s } = await supabase.from('schools').select('*').order('name');
    setSchools(s || []);
    const { data: u } = await supabase.from('profiles').select('*, schools(name)').order('full_name');
    setUsers(u || []);
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const updateRole = async (userId, newRole) => {
    const { error } = await supabase.from('profiles').update({ role: newRole }).eq('id', userId);
    if (!error) { alert("Role Updated!"); loadData(); setSelectedUser(null); }
  };

  if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="flex justify-between items-center mb-8 bg-indigo-700 p-6 rounded-xl text-white">
        <h1 className="text-2xl font-bold flex items-center gap-2"><Shield /> Central Admin</h1>
        <button onClick={onLogout} className="bg-white/20 px-4 py-2 rounded">Logout</button>
      </div>
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-100"><tr><th className="p-4">Name</th><th>School</th><th>Role</th><th>Action</th></tr></thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id} className="border-t">
                <td className="p-4">{u.full_name}</td>
                <td>{u.schools?.name || 'N/A'}</td>
                <td><span className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs font-bold uppercase">{u.role}</span></td>
                <td><button onClick={() => setSelectedUser(u)} className="text-indigo-600 font-bold flex items-center gap-1"><UserCog size={16}/> Manage</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white p-6 rounded-xl max-w-sm w-full">
            <h3 className="font-bold mb-4">Manage {selectedUser.full_name}</h3>
            <select className="w-full border p-2 rounded mb-4" defaultValue={selectedUser.role} onChange={(e) => updateRole(selectedUser.id, e.target.value)}>
               <option value="teacher">Teacher</option>
               <option value="admin">School Admin</option>
            </select>
            <div className="flex flex-col gap-2">
               <label className="text-xs font-bold text-slate-400 uppercase">Transfer School</label>
               <select className="w-full border p-2 rounded mb-4" onChange={(e) => {
                 supabase.from('profiles').update({ school_id: e.target.value }).eq('id', selectedUser.id).then(() => { alert("Transferred!"); loadData(); setSelectedUser(null); });
               }}>
                  <option value="">Select School</option>
                  {schools.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
               </select>
            </div>
            <button onClick={() => setSelectedUser(null)} className="w-full text-slate-400">Cancel</button>
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
  const [studentResults, setStudentResults] = useState([]);
  const [previewMode, setPreviewMode] = useState(null);
  const [activeTab, setActiveTab] = useState('scores');
  
  const [showAddClass, setShowAddClass] = useState(false);
  const [newClassName, setNewClassName] = useState('');
  const [showAddStudent, setShowAddStudent] = useState(false);
  const [newStudent, setNewStudent] = useState({ name: '', admission_no: '', gender: 'Male' });
  const [showAddSubject, setShowAddSubject] = useState(false);
  const [newSubjectName, setNewSubjectName] = useState('');

  const fetchData = useCallback(async () => {
    const { data: s } = await supabase.from('schools').select('*').eq('id', profile.school_id).single();
    setSchool(s);
    const { data: cls } = await supabase.from('classes').select('*').eq('school_id', profile.school_id).order('name');
    setClassList(cls || []);
  }, [profile.school_id]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const loadClass = async (id) => {
    setSelectedClassId(id);
    const { data: stu } = await supabase.from('students').select('*').eq('class_id', id).order('name');
    setStudents(stu || []);
    const { data: sub } = await supabase.from('subjects').select('*').eq('class_id', id).order('name');
    setSubjects(sub || []);
    setSelectedStudent(null);
  };

  const handleCreateClass = async (e) => {
    e.preventDefault();
    const { error } = await supabase.from('classes').insert({ name: newClassName, school_id: profile.school_id });
    if (!error) { alert("Class Created!"); setNewClassName(''); setShowAddClass(false); fetchData(); }
  };

  const handleAddSubject = async (e) => {
    e.preventDefault();
    const { error } = await supabase.from('subjects').insert({ name: newSubjectName, class_id: selectedClassId });
    if (!error) { alert("Subject Added!"); setNewSubjectName(''); setShowAddSubject(false); loadClass(selectedClassId); }
  };

  const handleRegisterStudent = async (e) => {
    e.preventDefault();
    const { error } = await supabase.from('students').insert({ ...newStudent, class_id: selectedClassId, school_id: profile.school_id });
    if (!error) { alert("Student Registered!"); setShowAddStudent(false); loadClass(selectedClassId); }
  };

  const loadStudent = async (stu) => {
    setSelectedStudent(stu);
    const { data: res } = await supabase.from('results').select('*, subjects(name)').eq('student_id', stu.id);
    const { data: comm } = await supabase.from('comments').select('*').eq('student_id', stu.id).maybeSingle();
    setScores(res?.reduce((acc, r) => ({ ...acc, [r.subject_id]: r.scores }), {}) || {});
    setStudentResults(res || []);
    setCommentData(comm || { behaviors: {}, submission_status: 'draft' });
  };

  const handleSave = async () => {
    const updates = subjects.map(s => ({
      student_id: selectedStudent.id,
      subject_id: s.id,
      scores: scores[s.id] || {},
      total: (parseFloat(scores[s.id]?.ca) || 0) + (parseFloat(scores[s.id]?.exam) || 0)
    }));
    await supabase.from('results').delete().eq('student_id', selectedStudent.id);
    await supabase.from('results').insert(updates);
    await supabase.from('comments').upsert({
      student_id: selectedStudent.id,
      school_id: school.id,
      tutor_comment: commentData.tutor_comment,
      behaviors: commentData.behaviors,
      submission_status: 'pending'
    });
    alert("Results Saved & Submitted!");
    loadStudent(selectedStudent);
  };

  return (
    <div className="flex h-screen bg-slate-50">
      <div className="w-64 bg-slate-900 text-white p-4 flex flex-col">
        <div className="font-bold mb-6 flex items-center gap-2 text-blue-400"><School/> {school?.name}</div>
        
        <div className="flex justify-between items-center mb-1">
           <label className="text-[10px] text-slate-400 uppercase font-bold">Class List</label>
           <button onClick={() => setShowAddClass(true)} className="hover:text-blue-400"><Plus size={16}/></button>
        </div>
        <select className="bg-slate-800 p-2 rounded mb-6 text-sm" value={selectedClassId} onChange={(e) => loadClass(e.target.value)}>
          <option value="">Select Class</option>
          {classList.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>

        {selectedClassId && (
          <>
            <div className="flex justify-between items-center mb-1">
               <span className="text-[10px] text-slate-400 uppercase font-bold">Subjects</span>
               <button onClick={() => setShowAddSubject(true)} className="hover:text-blue-400"><BookOpen size={14}/></button>
            </div>
            <div className="mb-4 text-[10px] text-slate-500 italic">{subjects.length} subjects added</div>

            <div className="flex justify-between items-center mb-2">
               <span className="text-[10px] text-slate-400 uppercase font-bold">Students</span>
               <button onClick={() => setShowAddStudent(true)} className="p-1 bg-blue-600 rounded"><Plus size={14}/></button>
            </div>
            <div className="flex-1 overflow-auto space-y-1">
              {students.map(s => (
                <div key={s.id} onClick={() => loadStudent(s)} className={`p-2 cursor-pointer rounded text-sm ${selectedStudent?.id === s.id ? 'bg-blue-600' : 'hover:bg-slate-800'}`}>{s.name}</div>
              ))}
            </div>
          </>
        )}
        <button onClick={onLogout} className="text-left p-2 text-red-400 text-sm flex items-center gap-2 border-t border-slate-700 pt-4"><LogOut size={16}/> Logout</button>
      </div>

      <div className="flex-1 p-8 overflow-auto">
        {!selectedStudent ? (
           <div className="h-full flex flex-col items-center justify-center text-slate-400 text-center">
              <School size={64} className="mb-4 opacity-10"/>
              <p>1. Create/Select a Class<br/>2. Add Subjects<br/>3. Register Students</p>
           </div>
        ) : (
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="bg-white p-6 rounded-xl shadow flex justify-between items-center border-l-8 border-blue-600">
               <div><h1 className="text-2xl font-bold">{selectedStudent.name}</h1><p className="text-xs uppercase font-bold text-slate-400">{commentData.submission_status}</p></div>
               <div className="flex gap-2">
                  <button onClick={() => setPreviewMode('full')} className="bg-slate-100 px-4 py-2 rounded font-bold">Preview</button>
                  <button onClick={handleSave} className="bg-blue-600 text-white px-4 py-2 rounded font-bold">Submit</button>
               </div>
            </div>
            <div className="flex gap-6 border-b text-sm font-bold">
               {['scores', 'traits', 'remarks'].map(t => (
                 <button key={t} onClick={() => setActiveTab(t)} className={`pb-2 capitalize ${activeTab === t ? 'border-b-2 border-blue-600 text-blue-600' : 'text-slate-400'}`}>{t}</button>
               ))}
            </div>
            {activeTab === 'scores' && (
               <div className="bg-white rounded-xl shadow overflow-hidden">
                  <table className="w-full text-left">
                     <thead className="bg-slate-50 border-b"><tr><th className="p-4">Subject</th><th>CA (40)</th><th>Exam (60)</th><th>Total</th></tr></thead>
                     <tbody>
                        {subjects.map(sub => (
                           <tr key={sub.id} className="border-b">
                              <td className="p-4">{sub.name}</td>
                              <td><input type="number" className="w-16 border rounded p-1" value={scores[sub.id]?.ca || ''} onChange={e => setScores({...scores, [sub.id]: {...(scores[sub.id]||{}), ca: e.target.value}})} /></td>
                              <td><input type="number" className="w-16 border rounded p-1" value={scores[sub.id]?.exam || ''} onChange={e => setScores({...scores, [sub.id]: {...(scores[sub.id]||{}), exam: e.target.value}})} /></td>
                              <td className="font-bold">{(parseFloat(scores[sub.id]?.ca)||0) + (parseFloat(scores[sub.id]?.exam)||0)}</td>
                           </tr>
                        ))}
                     </tbody>
                  </table>
               </div>
            )}
            {activeTab === 'traits' && (
               <div className="bg-white p-6 rounded-xl shadow grid grid-cols-2 gap-4">
                  {BEHAVIORS.map(b => (
                     <div key={b} className="flex justify-between items-center p-2 bg-slate-50 rounded">
                        <span className="text-sm">{b}</span>
                        <select className="text-xs border p-1 rounded" value={commentData.behaviors?.[b] || ''} onChange={e => setCommentData({...commentData, behaviors: {...commentData.behaviors, [b]: e.target.value}})}>
                           <option value="">Rate</option>{RATINGS.map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                     </div>
                  ))}
               </div>
            )}
            {activeTab === 'remarks' && <textarea className="w-full border p-4 h-32 rounded-lg shadow" value={commentData.tutor_comment || ''} onChange={e => setCommentData({...commentData, tutor_comment: e.target.value})} placeholder="Teacher's Remark..."/>}
          </div>
        )}
      </div>

      {/* Modals */}
      {showAddClass && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <form onSubmit={handleCreateClass} className="bg-white p-6 rounded-xl max-w-sm w-full shadow-2xl">
            <h3 className="font-bold mb-4">Create New Class</h3>
            <input className="w-full border p-2 rounded mb-4" placeholder="Class Name (e.g. Primary 1)" onChange={e => setNewClassName(e.target.value)} required />
            <div className="flex gap-2">
               <button type="submit" className="flex-1 bg-blue-600 text-white py-2 rounded font-bold">Create</button>
               <button type="button" onClick={() => setShowAddClass(false)} className="flex-1 text-slate-400">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {showAddSubject && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <form onSubmit={handleAddSubject} className="bg-white p-6 rounded-xl max-w-sm w-full shadow-2xl">
            <h3 className="font-bold mb-4">Add Subject to Class</h3>
            <input className="w-full border p-2 rounded mb-4" placeholder="Subject Name (e.g. Mathematics)" onChange={e => setNewSubjectName(e.target.value)} required />
            <div className="flex gap-2">
               <button type="submit" className="flex-1 bg-indigo-600 text-white py-2 rounded font-bold">Add</button>
               <button type="button" onClick={() => setShowAddSubject(false)} className="flex-1 text-slate-400">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {showAddStudent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <form onSubmit={handleRegisterStudent} className="bg-white p-6 rounded-xl max-w-sm w-full shadow-2xl">
            <h3 className="font-bold mb-4">Register Student</h3>
            <div className="space-y-3">
               <input className="w-full border p-2 rounded" placeholder="Full Name" onChange={e => setNewStudent({...newStudent, name: e.target.value})} required />
               <input className="w-full border p-2 rounded" placeholder="Admission No" onChange={e => setNewStudent({...newStudent, admission_no: e.target.value})} required />
               <select className="w-full border p-2 rounded" onChange={e => setNewStudent({...newStudent, gender: e.target.value})}>
                  <option value="Male">Male</option><option value="Female">Female</option>
               </select>
               <div className="flex gap-2">
                  <button type="submit" className="flex-1 bg-blue-600 text-white py-2 rounded font-bold">Register</button>
                  <button type="button" onClick={() => setShowAddStudent(false)} className="flex-1 text-slate-400">Cancel</button>
               </div>
            </div>
          </form>
        </div>
      )}

      {previewMode && (
        <div className="fixed inset-0 z-50 bg-black/90 flex flex-col p-4">
          <div className="bg-white p-4 flex justify-between rounded-t-xl">
             <button onClick={() => setPreviewMode(null)} className="font-bold text-red-500">Close</button>
             <PDFDownloadLink document={<ResultPDF school={school} student={selectedStudent} results={studentResults} comments={commentData} />} fileName="result.pdf">
                <button className="bg-blue-600 text-white px-4 py-2 rounded font-bold">Download</button>
             </PDFDownloadLink>
          </div>
          <PDFViewer className="flex-1 rounded-b-xl"><ResultPDF school={school} student={selectedStudent} results={studentResults} comments={commentData} /></PDFViewer>
        </div>
      )}
    </div>
  );
};

// ==================== ADMIN DASHBOARD ====================
const AdminDashboard = ({ profile, onLogout }) => {
  const [school, setSchool] = useState(null);
  const [classList, setClassList] = useState([]);
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [commentData, setCommentData] = useState({ behaviors: {} });
  const [studentResults, setStudentResults] = useState([]);
  const [previewMode, setPreviewMode] = useState(null);

  const fetchData = useCallback(async () => {
    const { data: s } = await supabase.from('schools').select('*').eq('id', profile.school_id).single();
    setSchool(s);
    const { data: cls } = await supabase.from('classes').select('*').eq('school_id', profile.school_id).order('name');
    setClassList(cls || []);
  }, [profile.school_id]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const loadClass = async (id) => {
    const { data: stu } = await supabase.from('students').select('*').eq('class_id', id).order('name');
    setStudents(stu || []);
  };

  const loadStudent = async (stu) => {
    setSelectedStudent(stu);
    const { data: res } = await supabase.from('results').select('*, subjects(name)').eq('student_id', stu.id);
    const { data: comm } = await supabase.from('comments').select('*').eq('student_id', stu.id).maybeSingle();
    setStudentResults(res || []);
    setCommentData(comm || { behaviors: {}, submission_status: 'draft' });
  };

  const handleApprove = async () => {
    await supabase.from('comments').update({ submission_status: 'approved', principal_comment: commentData.principal_comment }).eq('student_id', selectedStudent.id);
    alert("Approved!");
    loadStudent(selectedStudent);
  };

  return (
    <div className="flex h-screen bg-slate-50">
      <div className="w-64 bg-slate-900 text-white p-4">
        <div className="font-bold mb-8 flex items-center gap-2"><Shield/> Admin</div>
        <select className="w-full bg-slate-800 p-2 rounded mb-4" onChange={e => loadClass(e.target.value)}>
          <option>Select Class</option>
          {classList.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <div className="flex-1 overflow-auto">
          {students.map(s => (
            <div key={s.id} onClick={() => loadStudent(s)} className={`p-2 cursor-pointer rounded text-sm ${selectedStudent?.id === s.id ? 'bg-blue-600' : ''}`}>{s.name}</div>
          ))}
        </div>
        <button onClick={onLogout} className="text-left p-2 text-red-400 mt-4 flex items-center gap-2 border-t border-slate-700 pt-4"><LogOut size={16}/> Logout</button>
      </div>
      <div className="flex-1 p-8 overflow-auto">
        {selectedStudent ? (
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="bg-white p-6 rounded-xl shadow flex justify-between items-center border-t-8 border-green-600">
               <div><h1 className="text-2xl font-bold">{selectedStudent.name}</h1><p className="text-xs font-bold text-orange-500 uppercase">{commentData.submission_status}</p></div>
               <div className="flex gap-2">
                 <button onClick={() => setPreviewMode('full')} className="bg-slate-100 px-4 py-2 rounded">Review</button>
                 <button onClick={handleApprove} className="bg-green-600 text-white px-6 py-2 rounded font-bold shadow-lg">Approve</button>
               </div>
            </div>
            <textarea className="w-full border p-4 h-32 rounded-lg shadow" value={commentData.principal_comment || ''} onChange={e => setCommentData({...commentData, principal_comment: e.target.value})} placeholder="Final verdict..."/>
          </div>
        ) : <div className="text-center text-slate-400 mt-20">Select a student</div>}
      </div>
      {previewMode && (
        <div className="fixed inset-0 z-50 bg-black/80 flex flex-col">
          <button onClick={() => setPreviewMode(null)} className="text-white p-4 self-end">Close</button>
          <PDFViewer className="flex-1"><ResultPDF school={school} student={selectedStudent} results={studentResults} comments={commentData} /></PDFViewer>
        </div>
      )}
    </div>
  );
};

// ==================== PARENT PORTAL & AUTH ====================
const ParentPortal = ({ onBack }) => {
  const [id, setId] = useState('');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const check = async () => {
    setLoading(true);
    const { data: stu } = await supabase.from('students').select('*, schools(*), classes(*), results(*, subjects(*)), comments(*)').eq('admission_no', id).maybeSingle();
    if (stu && stu.comments?.[0]?.submission_status === 'approved') setData(stu);
    else alert("Not found or not published.");
    setLoading(false);
  };
  if (data) return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col">
      <button onClick={() => setData(null)} className="p-4 bg-slate-100 font-bold">← Back</button>
      <PDFViewer className="flex-1"><ResultPDF school={data.schools} student={data} results={data.results} comments={data.comments[0]} /></PDFViewer>
    </div>
  );
  return (
    <div className="min-h-screen bg-green-50 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl max-w-sm w-full text-center">
        <Search size={48} className="mx-auto text-green-600 mb-4"/>
        <h2 className="text-2xl font-bold mb-4">Parent Portal</h2>
        <input className="w-full border-2 p-3 rounded mb-4 text-center font-bold" placeholder="Admission Number" onChange={e => setId(e.target.value)} />
        <button onClick={check} className="w-full bg-green-600 text-white py-3 rounded font-bold">{loading ? '...' : 'View Report'}</button>
        <button onClick={onBack} className="mt-4 text-slate-400 block w-full">Staff Login</button>
      </div>
    </div>
  );
};

const Auth = ({ onParent }) => {
  const [mode, setMode] = useState('login');
  const [loading, setLoading] = useState(false);
  const [schools, setSchools] = useState([]);
  const [form, setForm] = useState({ email: '', password: '', name: '', schoolId: '' });
  useEffect(() => { supabase.from('schools').select('id, name').then(({data}) => setSchools(data || [])); }, []);
  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email: form.email, password: form.password });
        if (error) throw error;
      } else {
        const { data: auth, error: ae } = await supabase.auth.signUp({ email: form.email, password: form.password });
        if (ae) throw ae;
        if (mode === 'school_reg') {
          const { data: school } = await supabase.from('schools').insert({ owner_id: auth.user.id, name: form.name }).select().single();
          await supabase.from('profiles').insert({ id: auth.user.id, full_name: form.name, role: 'admin', school_id: school.id });
        } else {
          await supabase.from('profiles').insert({ id: auth.user.id, full_name: form.name, role: 'teacher', school_id: form.schoolId });
        }
        alert("Verify your email then login.");
      }
    } catch (err) { alert(err.message); }
    setLoading(false);
  };
  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full border-t-8 border-blue-600 text-center">
        <h1 className="text-3xl font-black mb-6">Springforth</h1>
        <div className="flex gap-4 mb-6 border-b pb-2 text-[10px] font-bold uppercase">
          {['login', 'school_reg', 'teacher_reg'].map(m => (
            <button key={m} onClick={() => setMode(m)} className={mode === m ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-400'}>{m.replace('_',' ')}</button>
          ))}
        </div>
        <form onSubmit={handleAuth} className="space-y-4">
          {mode !== 'login' && <input className="w-full border p-3 rounded" placeholder="Full Name" onChange={e => setForm({...form, name: e.target.value})} required />}
          <input className="w-full border p-3 rounded" type="email" placeholder="Email" onChange={e => setForm({...form, email: e.target.value})} required />
          <input className="w-full border p-3 rounded" type="password" placeholder="Password" onChange={e => setForm({...form, password: e.target.value})} required />
          {mode === 'teacher_reg' && (
            <select className="w-full border p-3 rounded" onChange={e => setForm({...form, schoolId: e.target.value})} required>
              <option value="">Select School</option>
              {schools.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          )}
          <button className="w-full bg-blue-600 text-white py-3 rounded font-bold" disabled={loading}>{loading ? '...' : 'Enter'}</button>
        </form>
        <button onClick={onParent} className="w-full bg-green-50 text-green-700 py-3 rounded mt-6 font-bold flex items-center justify-center gap-2"><Search size={18}/> Parent Portal</button>
      </div>
    </div>
  );
};

// ==================== APP ROOT ====================
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

  if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-blue-600" size={48}/></div>;
  if (view === 'parent') return <ParentPortal onBack={() => setView('auth')} />;
  if (!session) return <Auth onParent={() => setView('parent')} />;
  if (profile?.role === 'central_admin') return <CentralAdminDashboard onLogout={() => supabase.auth.signOut()} />;
  if (profile?.role === 'admin') return <AdminDashboard profile={profile} onLogout={() => supabase.auth.signOut()} />;
  return <TeacherDashboard profile={profile} onLogout={() => supabase.auth.signOut()} />;
};

export default App;
