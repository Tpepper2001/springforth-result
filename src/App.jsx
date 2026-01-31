import React, { useState, useEffect, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Document, Page, Text, View, StyleSheet, PDFViewer, PDFDownloadLink, Image } from '@react-pdf/renderer';
import { Loader2, School, LogOut,  Settings, Search, Menu,  Shield } from 'lucide-react';

const supabaseUrl = 'https://ghlnenmfwlpwlqdrbean.supabase.co'; 
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdobG5lbm1md2xwd2xxZHJiZWFuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ0MTE0MDQsImV4cCI6MjA3OTk4NzQwNH0.rNILUdI035c4wl4kFkZFP4OcIM_t7bNMqktKm25d5Gg'; 
const supabase = createClient(supabaseUrl, supabaseKey);

const BEHAVIORS = ['Cooperation', 'Honesty', 'Self-Control', 'Neatness', 'Punctuality'];
const RATINGS = ['Excellent', 'Very Good', 'Good', 'Fair', 'Poor'];

// Central Admin Credentials
const CENTRAL_ADMIN_EMAIL = 'admin@admin.com';

// ==================== LOGIC HELPERS ====================
const getGrade = (obtained, max) => {
  const percent = (obtained / max) * 100;
  if (percent >= 90) return { g: 'A', r: 'Excellent', c: 'An outstanding performance. Keep it up!' };
  if (percent >= 70) return { g: 'B', r: 'Very Good', c: 'A very good result. Room for more improvement.' };
  if (percent >= 60) return { g: 'C', r: 'Good', c: 'Good performance. Put in more effort.' };
  if (percent >= 40) return { g: 'D', r: 'Pass', c: 'A fair result. You need to work harder.' };
  return { g: 'E', r: 'Fail', c: 'Poor performance. Serious improvement is required.' };
};

// ==================== PDF STYLES ====================
const pdfStyles = StyleSheet.create({
  page: { padding: 40, fontSize: 8, fontFamily: 'Helvetica' },
  header: { textAlign: 'center', marginBottom: 15, borderBottom: 2, paddingBottom: 5 },
  schoolName: { fontSize: 20, fontWeight: 'bold' },
  motto: { fontStyle: 'italic', fontSize: 9, marginBottom: 5 },
  logo: { width: 60, height: 60, marginBottom: 5, alignSelf: 'center' },
  table: { width: '100%', marginTop: 10, borderTop: 1 },
  row: { flexDirection: 'row', borderBottom: 1, padding: 4 },
  cell: { flex: 1, textAlign: 'center' },
  footer: { marginTop: 20, flexDirection: 'row', justifyContent: 'space-between' }
});

// ==================== PDF COMPONENT ====================
const ResultPDF = ({ school, student, results, comments, type = 'full' }) => {
  const totalMax = 100;
  let totalObtained = 0;
  let subjectCount = results.length;
  
  results.forEach(r => {
    const ca = parseFloat(r.scores?.ca) || 0;
    const exam = parseFloat(r.scores?.exam) || 0;
    totalObtained += ca + exam;
  });
  
  const overallMax = subjectCount * totalMax;
  const avg = subjectCount > 0 ? (totalObtained / overallMax) * 100 : 0;
  const gradeInfo = getGrade(avg, 100);

  const subjectStats = results.map(r => {
    const ca = parseFloat(r.scores?.ca) || 0;
    const exam = parseFloat(r.scores?.exam) || 0;
    const total = ca + exam;
    return { name: r.subjects?.name, total };
  });

  const highestScore = subjectStats.length > 0 ? Math.max(...subjectStats.map(s => s.total)) : 0;
  const lowestScore = subjectStats.length > 0 ? Math.min(...subjectStats.map(s => s.total)) : 0;
  const bestSubject = subjectStats.find(s => s.total === highestScore)?.name || 'N/A';
  const weakSubject = subjectStats.find(s => s.total === lowestScore)?.name || 'N/A';

  return (
    <Document>
      <Page size="A4" style={pdfStyles.page}>
        <View style={pdfStyles.header}>
          {school?.logo_url && <Image src={school.logo_url} style={pdfStyles.logo} />}
          <Text style={pdfStyles.schoolName}>{school?.name}</Text>
          <Text style={pdfStyles.motto}>"{school?.motto}"</Text>
          <Text style={{ fontSize: 7 }}>{school?.address}</Text>
          <Text style={{ fontSize: 7 }}>{school?.contact_info}</Text>
          <Text style={{ marginTop: 8, fontWeight: 'bold', fontSize: 11 }}>
            {type === 'ca' ? 'MID-TERM ASSESSMENT REPORT' : 'END OF TERM REPORT'}
          </Text>
          <Text style={{ fontSize: 8, marginTop: 2 }}>
            {school?.current_term} - {school?.current_session}
          </Text>
        </View>

        <View style={{ marginTop: 10, padding: 8, backgroundColor: '#f8f9fa', borderRadius: 4 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 8 }}><Text style={{ fontWeight: 'bold' }}>Student Name:</Text> {student?.name}</Text>
              <Text style={{ fontSize: 8, marginTop: 2 }}><Text style={{ fontWeight: 'bold' }}>Admission No:</Text> {student?.admission_no}</Text>
              <Text style={{ fontSize: 8, marginTop: 2 }}><Text style={{ fontWeight: 'bold' }}>Gender:</Text> {student?.gender || 'N/A'}</Text>
            </View>
            <View style={{ flex: 1, textAlign: 'right' }}>
              <Text style={{ fontSize: 8 }}><Text style={{ fontWeight: 'bold' }}>Date of Birth:</Text> {student?.date_of_birth || 'N/A'}</Text>
              <Text style={{ fontSize: 8, marginTop: 2 }}><Text style={{ fontWeight: 'bold' }}>Class:</Text> {student?.classes?.name || 'N/A'}</Text>
              <Text style={{ fontSize: 8, marginTop: 2 }}><Text style={{ fontWeight: 'bold' }}>No. in Class:</Text> {subjectCount}</Text>
            </View>
          </View>
        </View>

        <View style={pdfStyles.table}>
          <View style={[pdfStyles.row, { backgroundColor: '#2c3e50', color: 'white' }]}>
            <Text style={{ width: 100, paddingLeft: 4, fontWeight: 'bold' }}>SUBJECT</Text>
            <Text style={[pdfStyles.cell, { fontWeight: 'bold' }]}>CA (40)</Text>
            <Text style={[pdfStyles.cell, { fontWeight: 'bold' }]}>EXAM (60)</Text>
            <Text style={[pdfStyles.cell, { fontWeight: 'bold' }]}>TOTAL (100)</Text>
            <Text style={[pdfStyles.cell, { fontWeight: 'bold' }]}>GRADE</Text>
            <Text style={[pdfStyles.cell, { fontWeight: 'bold' }]}>REMARK</Text>
          </View>
          {results.map((r, idx) => {
            const ca = parseFloat(r.scores?.ca) || 0;
            const exam = parseFloat(r.scores?.exam) || 0;
            const subTotal = ca + exam;
            const subGrade = getGrade(subTotal, totalMax);
            return (
              <View key={r.id} style={[pdfStyles.row, { backgroundColor: idx % 2 === 0 ? '#ffffff' : '#f8f9fa' }]}>
                <Text style={{ width: 100, paddingLeft: 4, fontSize: 7 }}>{r.subjects?.name}</Text>
                <Text style={[pdfStyles.cell, { fontSize: 7 }]}>{ca}</Text>
                <Text style={[pdfStyles.cell, { fontSize: 7 }]}>{exam}</Text>
                <Text style={[pdfStyles.cell, { fontSize: 7, fontWeight: 'bold' }]}>{subTotal}</Text>
                <Text style={[pdfStyles.cell, { fontSize: 7, fontWeight: 'bold' }]}>{subGrade.g}</Text>
                <Text style={[pdfStyles.cell, { fontSize: 6 }]}>{subGrade.r}</Text>
              </View>
            );
          })}
          
          <View style={[pdfStyles.row, { backgroundColor: '#ecf0f1', marginTop: 2 }]}>
            <Text style={{ width: 100, paddingLeft: 4, fontWeight: 'bold', fontSize: 8 }}>TOTAL</Text>
            <Text style={[pdfStyles.cell, { fontSize: 7, fontWeight: 'bold' }]}>{results.reduce((acc, r) => acc + (parseFloat(r.scores?.ca) || 0), 0)}</Text>
            <Text style={[pdfStyles.cell, { fontSize: 7, fontWeight: 'bold' }]}>{results.reduce((acc, r) => acc + (parseFloat(r.scores?.exam) || 0), 0)}</Text>
            <Text style={[pdfStyles.cell, { fontSize: 8, fontWeight: 'bold' }]}>{totalObtained}/{overallMax}</Text>
            <Text style={[pdfStyles.cell, { fontSize: 8, fontWeight: 'bold' }]}>{gradeInfo.g}</Text>
            <Text style={[pdfStyles.cell, { fontSize: 6 }]}>{gradeInfo.r}</Text>
          </View>
        </View>

        <View style={{ marginTop: 10, padding: 8, backgroundColor: '#e8f4f8', borderRadius: 4 }}>
          <Text style={{ fontWeight: 'bold', fontSize: 9, marginBottom: 4 }}>PERFORMANCE ANALYSIS</Text>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 7 }}>Overall Average: <Text style={{ fontWeight: 'bold' }}>{avg.toFixed(2)}%</Text></Text>
              <Text style={{ fontSize: 7, marginTop: 2 }}>Overall Grade: <Text style={{ fontWeight: 'bold' }}>{gradeInfo.g}</Text></Text>
              <Text style={{ fontSize: 7, marginTop: 2 }}>Total Obtained: <Text style={{ fontWeight: 'bold' }}>{totalObtained} / {overallMax}</Text></Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 7 }}>Best Subject: <Text style={{ fontWeight: 'bold' }}>{bestSubject} ({highestScore})</Text></Text>
              <Text style={{ fontSize: 7, marginTop: 2 }}>Needs Improvement: <Text style={{ fontWeight: 'bold' }}>{weakSubject} ({lowestScore})</Text></Text>
              <Text style={{ fontSize: 7, marginTop: 2 }}>No. of Subjects: <Text style={{ fontWeight: 'bold' }}>{subjectCount}</Text></Text>
            </View>
          </View>
        </View>

        {type === 'full' && comments?.behaviors && Object.keys(comments.behaviors).length > 0 && (
          <View style={{ marginTop: 8, padding: 6, backgroundColor: '#f0f0f0', borderRadius: 4 }}>
            <Text style={{ fontWeight: 'bold', fontSize: 8, marginBottom: 3 }}>PSYCHOMOTOR SKILLS ASSESSMENT</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
              {Object.entries(comments.behaviors).map(([key, value]) => (
                <Text key={key} style={{ fontSize: 6, marginRight: 10, width: '45%' }}>
                  {key}: <Text style={{ fontWeight: 'bold' }}>{value}</Text>
                </Text>
              ))}
            </View>
          </View>
        )}

        <View style={{ marginTop: 10 }}>
          <Text style={{ fontWeight: 'bold', fontSize: 9, borderBottom: 1, paddingBottom: 2 }}>REMARKS</Text>
          <View style={{ marginTop: 6 }}>
            <Text style={{ fontSize: 7, fontWeight: 'bold' }}>Class Teacher's Comment:</Text>
            <Text style={{ fontSize: 7, marginTop: 2, fontStyle: 'italic' }}>
              {type === 'ca' ? comments?.midterm_tutor_comment : comments?.tutor_comment}
            </Text>
          </View>
          <View style={{ marginTop: 6 }}>
            <Text style={{ fontSize: 7, fontWeight: 'bold' }}>Headmistress's Comment:</Text>
            <Text style={{ fontSize: 7, marginTop: 2, fontStyle: 'italic' }}>
              {comments?.principal_comment || 'Good performance. Keep it up!'}
            </Text>
          </View>
        </View>

        <View style={{ marginTop: 15, flexDirection: 'row', justifyContent: 'space-between' }}>
          <View style={{ textAlign: 'center', width: 120 }}>
            <View style={{ borderTop: 1, marginBottom: 2 }}></View>
            <Text style={{ fontSize: 7 }}>Class Teacher's Signature</Text>
          </View>
          <View style={{ textAlign: 'center', width: 120 }}>
            <View style={{ borderTop: 1, marginBottom: 2 }}></View>
            <Text style={{ fontSize: 7 }}>Headmistress's Signature</Text>
          </View>
          <View style={{ textAlign: 'center', width: 120 }}>
            <View style={{ borderTop: 1, marginBottom: 2 }}></View>
            <Text style={{ fontSize: 7 }}>Parent's Signature</Text>
          </View>
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
    try {
      const { data: schoolsData } = await supabase.from('schools').select('*').order('name');
      setSchools(schoolsData || []);
      const { data: usersData } = await supabase.from('profiles').select('*, schools(name)').order('full_name');
      setUsers(usersData || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleTransferUser = async (userId, newSchoolId) => {
    const { error } = await supabase.from('profiles').update({ school_id: newSchoolId }).eq('id', userId);
    if (!error) { alert('Transferred!'); loadData(); setSelectedUser(null); }
  };

  if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="flex justify-between items-center mb-8 bg-indigo-600 p-6 rounded-xl text-white shadow-lg">
        <h1 className="text-2xl font-bold flex items-center gap-2"><Shield /> Central Admin</h1>
        <button onClick={onLogout} className="bg-white/20 px-4 py-2 rounded flex items-center gap-2"><LogOut size={18}/> Logout</button>
      </div>

      <div className="bg-white rounded-xl shadow p-6 mb-8">
        <h2 className="text-xl font-bold mb-4">Users</h2>
        <table className="w-full text-left">
          <thead><tr className="border-b"><th>Name</th><th>School</th><th>Role</th><th>Action</th></tr></thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id} className="border-b">
                <td className="py-3">{u.full_name}</td>
                <td>{u.schools?.name || 'Unassigned'}</td>
                <td>{u.role}</td>
                <td><button onClick={() => setSelectedUser(u)} className="text-indigo-600 font-bold">Manage</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white p-6 rounded-xl max-w-sm w-full">
            <h3 className="font-bold mb-4">Transfer {selectedUser.full_name}</h3>
            <select className="w-full border p-2 mb-4" onChange={(e) => handleTransferUser(selectedUser.id, e.target.value)}>
              <option value="">Select School</option>
              {schools.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <button onClick={() => setSelectedUser(null)} className="w-full py-2 text-slate-500">Cancel</button>
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
  const [saving, setSaving] = useState(false);
  const [previewMode, setPreviewMode] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('scores');

  const fetchData = useCallback(async () => {
    if (!profile.school_id) return;
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
  };

  const loadStudent = async (stu) => {
    setSelectedStudent(stu);
    setSidebarOpen(false);
    const { data: res } = await supabase.from('results').select('*, subjects(name)').eq('student_id', stu.id);
    const { data: comm } = await supabase.from('comments').select('*').eq('student_id', stu.id).maybeSingle();
    setScores(res?.reduce((acc, r) => ({ ...acc, [r.subject_id]: r.scores }), {}) || {});
    setStudentResults(res || []);
    setCommentData(comm || { behaviors: {}, submission_status: 'draft' });
  };

  const handleSave = async (status = 'pending') => {
    setSaving(true);
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
      submission_status: status
    });
    setSaving(false);
    alert("Submitted!");
    loadStudent(selectedStudent);
  };

  return (
    <div className="flex h-screen bg-slate-50">
      <div className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 fixed lg:static w-64 bg-slate-900 text-white p-4 h-full z-40 transition-transform`}>
        <div className="font-bold mb-8 flex items-center gap-2"><School/> {school?.name}</div>
        <select className="w-full bg-slate-800 p-2 rounded mb-4" value={selectedClassId} onChange={(e) => loadClass(e.target.value)}>
          <option value="">Class</option>
          {classList.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <div className="flex-1 overflow-auto">
          {students.map(s => (
            <div key={s.id} onClick={() => loadStudent(s)} className={`p-2 cursor-pointer rounded mb-1 ${selectedStudent?.id === s.id ? 'bg-blue-600' : ''}`}>{s.name}</div>
          ))}
        </div>
        <button onClick={onLogout} className="w-full text-left p-2 text-red-400 mt-4 flex items-center gap-2"><LogOut size={16}/> Logout</button>
      </div>

      <div className="flex-1 p-8 overflow-auto">
        <button className="lg:hidden mb-4" onClick={() => setSidebarOpen(true)}><Menu/></button>
        {!selectedStudent ? <div>Select a student</div> : (
          <div className="space-y-6">
            <div className="flex justify-between items-center bg-white p-6 rounded-xl shadow">
              <h1 className="text-2xl font-bold">{selectedStudent.name}</h1>
              <div className="flex gap-2">
                <button onClick={() => setPreviewMode('full')} className="bg-slate-100 px-4 py-2 rounded font-bold">Preview</button>
                <button onClick={() => handleSave('pending')} className="bg-blue-600 text-white px-4 py-2 rounded font-bold">{saving ? '...' : 'Submit'}</button>
              </div>
            </div>
            
            <div className="flex gap-4 border-b">
              {['scores', 'traits', 'remarks'].map(t => (
                <button key={t} onClick={() => setActiveTab(t)} className={`pb-2 capitalize ${activeTab === t ? 'border-b-2 border-blue-600 text-blue-600' : ''}`}>{t}</button>
              ))}
            </div>

            {activeTab === 'scores' && (
              <div className="bg-white p-6 rounded-xl shadow">
                <table className="w-full">
                  <thead><tr className="text-left border-b"><th className="pb-2">Subject</th><th>CA (40)</th><th>Exam (60)</th></tr></thead>
                  <tbody>
                    {subjects.map(s => (
                      <tr key={s.id} className="border-b">
                        <td className="py-3">{s.name}</td>
                        <td><input type="number" className="w-20 border p-1" value={scores[s.id]?.ca || ''} onChange={e => setScores({...scores, [s.id]: {...(scores[s.id]||{}), ca: e.target.value}})} /></td>
                        <td><input type="number" className="w-20 border p-1" value={scores[s.id]?.exam || ''} onChange={e => setScores({...scores, [s.id]: {...(scores[s.id]||{}), exam: e.target.value}})} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === 'traits' && (
              <div className="bg-white p-6 rounded-xl shadow">
                {BEHAVIORS.map(b => (
                  <div key={b} className="flex justify-between py-2 border-b">
                    <span>{b}</span>
                    <select value={commentData.behaviors?.[b] || ''} onChange={e => setCommentData({...commentData, behaviors: {...commentData.behaviors, [b]: e.target.value}})}>
                      {RATINGS.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'remarks' && (
              <textarea className="w-full border p-4 h-32 rounded-xl shadow" value={commentData.tutor_comment || ''} onChange={e => setCommentData({...commentData, tutor_comment: e.target.value})} placeholder="Remarks..." />
            )}
          </div>
        )}
      </div>

      {previewMode && (
        <div className="fixed inset-0 z-50 bg-black/90 flex flex-col p-4">
          <div className="bg-white p-4 flex justify-between items-center rounded-t-xl">
            <button onClick={() => setPreviewMode(null)} className="font-bold">Close</button>
            <PDFDownloadLink document={<ResultPDF school={school} student={selectedStudent} results={studentResults} comments={commentData} type={previewMode} />} fileName="result.pdf">
              <button className="bg-blue-600 text-white px-4 py-2 rounded">Download</button>
            </PDFDownloadLink>
          </div>
          <PDFViewer className="flex-1 rounded-b-xl"><ResultPDF school={school} student={selectedStudent} results={studentResults} comments={commentData} type={previewMode} /></PDFViewer>
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
  const [activeTab, setActiveTab] = useState('scores');

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
        <div className="font-bold mb-8"><School/> Admin</div>
        <select className="w-full bg-slate-800 p-2 rounded mb-4" onChange={e => loadClass(e.target.value)}>
          <option>Select Class</option>
          {classList.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <div className="flex-1 overflow-auto">
          {students.map(s => (
            <div key={s.id} onClick={() => loadStudent(s)} className={`p-2 cursor-pointer rounded ${selectedStudent?.id === s.id ? 'bg-blue-600' : ''}`}>{s.name}</div>
          ))}
        </div>
        <button onClick={() => setActiveTab('settings')} className="text-left p-2 mt-4 flex items-center gap-2"><Settings size={16}/> Settings</button>
        <button onClick={onLogout} className="text-left p-2 text-red-400 mt-2 flex items-center gap-2"><LogOut size={16}/> Logout</button>
      </div>

      <div className="flex-1 p-8 overflow-auto">
        {activeTab === 'settings' ? (
          <div className="bg-white p-6 rounded-xl shadow">Settings View</div>
        ) : selectedStudent ? (
          <div className="space-y-6">
            <div className="flex justify-between items-center bg-white p-6 rounded-xl shadow">
              <h1 className="text-2xl font-bold">{selectedStudent.name}</h1>
              <div className="flex gap-2">
                <button onClick={() => setPreviewMode('full')} className="bg-slate-100 px-4 py-2 rounded">Preview</button>
                <button onClick={handleApprove} className="bg-green-600 text-white px-4 py-2 rounded">Approve</button>
              </div>
            </div>
            <textarea className="w-full border p-4 h-32 rounded-xl shadow" value={commentData.principal_comment || ''} onChange={e => setCommentData({...commentData, principal_comment: e.target.value})} placeholder="Headmistress Comment..." />
          </div>
        ) : <div>Select a student</div>}
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
    else alert("Result not found or not published.");
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
        <input className="w-full border-2 p-3 rounded mb-4" placeholder="Admission Number" onChange={e => setId(e.target.value)} />
        <button onClick={check} className="w-full bg-green-600 text-white py-3 rounded font-bold">{loading ? '...' : 'View Result'}</button>
        <button onClick={onBack} className="mt-4 text-slate-400 block w-full">Back</button>
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
        const sId = mode === 'school_reg' ? null : form.schoolId;
        if (mode === 'school_reg') {
          const { data: school } = await supabase.from('schools').insert({ owner_id: auth.user.id, name: form.name }).select().single();
          await supabase.from('profiles').insert({ id: auth.user.id, full_name: form.name, role: 'admin', school_id: school.id });
        } else {
          await supabase.from('profiles').insert({ id: auth.user.id, full_name: form.name, role: 'teacher', school_id: sId });
        }
        alert("Success! Check email for verification.");
      }
    } catch (err) { alert(err.message); }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full border-t-8 border-blue-600">
        <h1 className="text-3xl font-black text-center mb-6">Springforth</h1>
        <div className="flex gap-4 mb-6 border-b pb-2 text-xs font-bold uppercase">
          {['login', 'school_reg', 'teacher_reg'].map(m => (
            <button key={m} onClick={() => setMode(m)} className={`${mode === m ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-400'}`}>{m.replace('_',' ')}</button>
          ))}
        </div>
        <form onSubmit={handleAuth} className="space-y-4">
          {mode !== 'login' && <input className="w-full border p-3 rounded" placeholder="Full Name" onChange={e => setForm({...form, name: e.target.value})} required />}
          <input className="w-full border p-3 rounded" type="email" placeholder="Email" onChange={e => setForm({...form, email: e.target.value})} required />
          <input className="w-full border p-3 rounded" type="password" placeholder="Password" onChange={e => setForm({...form, password: e.target.value})} required />
          {mode === 'teacher_reg' && (
            <select className="w-full border p-3 rounded bg-white" onChange={e => setForm({...form, schoolId: e.target.value})} required>
              <option value="">Select School</option>
              {schools.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          )}
          <button className="w-full bg-blue-600 text-white py-3 rounded font-bold" disabled={loading}>{loading ? '...' : 'Submit'}</button>
        </form>
        <button onClick={onParent} className="w-full bg-green-50 text-green-700 py-3 rounded mt-6 font-bold">Parent Access</button>
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
