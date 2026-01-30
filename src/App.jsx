import React, { useState, useEffect, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Document, Page, Text, View, StyleSheet, PDFViewer, PDFDownloadLink } from '@react-pdf/renderer';
import { Loader2, School, LogOut, Users, Settings, CheckCircle, Search, Menu, X } from 'lucide-react';

const supabaseUrl = 'https://ghlnenmfwlpwlqdrbean.supabase.co'; 
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdobG5lbm1md2xwd2xxZHJiZWFuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ0MTE0MDQsImV4cCI6MjA3OTk4NzQwNH0.rNILUdI035c4wl4kFkZFP4OcIM_t7bNMqktKm25d5Gg'; 
const supabase = createClient(supabaseUrl, supabaseKey);

const BEHAVIORS = ['Cooperation', 'Honesty', 'Self-Control', 'Neatness', 'Punctuality'];
const RATINGS = ['Excellent', 'Very Good', 'Good', 'Fair', 'Poor'];

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
  table: { width: '100%', marginTop: 10, borderTop: 1 },
  row: { flexDirection: 'row', borderBottom: 1, padding: 4 },
  cell: { flex: 1, textAlign: 'center' },
  footer: { marginTop: 20, flexDirection: 'row', justifyContent: 'space-between' }
});

const ResultPDF = ({ school, student, results, comments, type = 'full' }) => {
  const allConfig = school?.assessment_config || [];
  const config = type === 'ca' ? allConfig.filter(c => !c.name.toLowerCase().includes('exam')) : allConfig;
  const maxPossible = config.reduce((s, f) => s + parseInt(f.max), 0);
  
  let totalObtained = 0;
  let subjectCount = results.length;
  results.forEach(r => {
      totalObtained += config.reduce((acc, f) => acc + (parseFloat(r.scores[f.code]) || 0), 0);
  });
  
  const overallTotal = totalObtained;
  const overallMax = subjectCount * maxPossible;
  const avg = (totalObtained / overallMax) * 100;
  const gradeInfo = getGrade(avg, 100);

  // Calculate position and statistics
  const subjectStats = results.map(r => {
    const total = config.reduce((acc, f) => acc + (parseFloat(r.scores[f.code]) || 0), 0);
    const percent = (total / maxPossible) * 100;
    const grade = getGrade(total, maxPossible);
    return { name: r.subjects?.name, total, percent, grade: grade.g };
  });

  const highestScore = Math.max(...subjectStats.map(s => s.total));
  const lowestScore = Math.min(...subjectStats.map(s => s.total));
  const bestSubject = subjectStats.find(s => s.total === highestScore)?.name || 'N/A';
  const weakSubject = subjectStats.find(s => s.total === lowestScore)?.name || 'N/A';

  return (
    <Document>
      <Page size="A4" style={pdfStyles.page}>
        {/* Header */}
        <View style={pdfStyles.header}>
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

        {/* Student Bio-Data */}
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

        {/* Results Table */}
        <View style={pdfStyles.table}>
          <View style={[pdfStyles.row, { backgroundColor: '#2c3e50', color: 'white' }]}>
            <Text style={{ width: 100, paddingLeft: 4, fontWeight: 'bold' }}>SUBJECT</Text>
            {config.map(c => <Text key={c.code} style={[pdfStyles.cell, { fontWeight: 'bold' }]}>{c.name}</Text>)}
            <Text style={[pdfStyles.cell, { fontWeight: 'bold' }]}>TOTAL</Text>
            <Text style={[pdfStyles.cell, { fontWeight: 'bold' }]}>GRADE</Text>
            <Text style={[pdfStyles.cell, { fontWeight: 'bold' }]}>REMARK</Text>
          </View>
          {results.map((r, idx) => {
            const subTotal = config.reduce((acc, f) => acc + (parseFloat(r.scores[f.code]) || 0), 0);
            const subGrade = getGrade(subTotal, maxPossible);
            return (
              <View key={r.id} style={[pdfStyles.row, { backgroundColor: idx % 2 === 0 ? '#ffffff' : '#f8f9fa' }]}>
                <Text style={{ width: 100, paddingLeft: 4, fontSize: 7 }}>{r.subjects?.name}</Text>
                {config.map(c => <Text key={c.code} style={[pdfStyles.cell, { fontSize: 7 }]}>{r.scores[c.code] || 0}</Text>)}
                <Text style={[pdfStyles.cell, { fontSize: 7, fontWeight: 'bold' }]}>{subTotal}/{maxPossible}</Text>
                <Text style={[pdfStyles.cell, { fontSize: 7, fontWeight: 'bold' }]}>{subGrade.g}</Text>
                <Text style={[pdfStyles.cell, { fontSize: 6 }]}>{subGrade.r}</Text>
              </View>
            );
          })}
          
          {/* Summary Row */}
          <View style={[pdfStyles.row, { backgroundColor: '#ecf0f1', marginTop: 2 }]}>
            <Text style={{ width: 100, paddingLeft: 4, fontWeight: 'bold', fontSize: 8 }}>TOTAL</Text>
            {config.map(c => {
              const colTotal = results.reduce((acc, r) => acc + (parseFloat(r.scores[c.code]) || 0), 0);
              return <Text key={c.code} style={[pdfStyles.cell, { fontSize: 7, fontWeight: 'bold' }]}>{colTotal}</Text>;
            })}
            <Text style={[pdfStyles.cell, { fontSize: 8, fontWeight: 'bold' }]}>{overallTotal}/{overallMax}</Text>
            <Text style={[pdfStyles.cell, { fontSize: 8, fontWeight: 'bold' }]}>{gradeInfo.g}</Text>
            <Text style={[pdfStyles.cell, { fontSize: 6 }]}>{gradeInfo.r}</Text>
          </View>
        </View>

        {/* Statistics Section */}
        <View style={{ marginTop: 10, padding: 8, backgroundColor: '#e8f4f8', borderRadius: 4 }}>
          <Text style={{ fontWeight: 'bold', fontSize: 9, marginBottom: 4 }}>PERFORMANCE ANALYSIS</Text>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 7 }}>Overall Average: <Text style={{ fontWeight: 'bold' }}>{avg.toFixed(2)}%</Text></Text>
              <Text style={{ fontSize: 7, marginTop: 2 }}>Overall Grade: <Text style={{ fontWeight: 'bold' }}>{gradeInfo.g}</Text></Text>
              <Text style={{ fontSize: 7, marginTop: 2 }}>Total Obtained: <Text style={{ fontWeight: 'bold' }}>{overallTotal} / {overallMax}</Text></Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 7 }}>Best Subject: <Text style={{ fontWeight: 'bold' }}>{bestSubject} ({highestScore})</Text></Text>
              <Text style={{ fontSize: 7, marginTop: 2 }}>Needs Improvement: <Text style={{ fontWeight: 'bold' }}>{weakSubject} ({lowestScore})</Text></Text>
              <Text style={{ fontSize: 7, marginTop: 2 }}>No. of Subjects: <Text style={{ fontWeight: 'bold' }}>{subjectCount}</Text></Text>
            </View>
          </View>
        </View>

        {/* Grading Key */}
        <View style={{ marginTop: 8, padding: 6, backgroundColor: '#fff3cd', borderRadius: 4 }}>
          <Text style={{ fontWeight: 'bold', fontSize: 8, marginBottom: 3 }}>GRADING SYSTEM</Text>
          <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
            <Text style={{ fontSize: 6 }}>A: 90-100% (Excellent)</Text>
            <Text style={{ fontSize: 6 }}>B: 70-89% (Very Good)</Text>
            <Text style={{ fontSize: 6 }}>C: 60-69% (Good)</Text>
            <Text style={{ fontSize: 6 }}>D: 40-59% (Pass)</Text>
            <Text style={{ fontSize: 6 }}>E: Below 40% (Fail)</Text>
          </View>
        </View>

        {/* Behavioral Ratings (only for full term) */}
        {type === 'full' && comments?.behaviors && (
          <View style={{ marginTop: 8, padding: 6, backgroundColor: '#f0f0f0', borderRadius: 4 }}>
            <Text style={{ fontWeight: 'bold', fontSize: 8, marginBottom: 3 }}>BEHAVIORAL ASSESSMENT</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
              {Object.entries(comments.behaviors).map(([key, value]) => (
                <Text key={key} style={{ fontSize: 6, marginRight: 10 }}>
                  {key}: <Text style={{ fontWeight: 'bold' }}>{value}</Text>
                </Text>
              ))}
            </View>
          </View>
        )}

        {/* Comments Section */}
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

        {/* Signatures */}
        <View style={{ marginTop: 15, flexDirection: 'row', justifyContent: 'space-between' }}>
          <View style={{ textAlign: 'center', width: 120 }}>
            <View style={{ borderTop: 1, marginBottom: 2 }}></View>
            <Text style={{ fontSize: 7 }}>Class Teacher's Signature</Text>
            <Text style={{ fontSize: 6, marginTop: 1 }}>Date: ___________</Text>
          </View>
          <View style={{ textAlign: 'center', width: 120 }}>
            <View style={{ borderTop: 1, marginBottom: 2 }}></View>
            <Text style={{ fontSize: 7 }}>Headmistress's Signature</Text>
            <Text style={{ fontSize: 6, marginTop: 1 }}>Date: ___________</Text>
          </View>
          <View style={{ textAlign: 'center', width: 120 }}>
            <View style={{ borderTop: 1, marginBottom: 2 }}></View>
            <Text style={{ fontSize: 7 }}>Parent's Signature</Text>
            <Text style={{ fontSize: 6, marginTop: 1 }}>Date: ___________</Text>
          </View>
        </View>

        {/* Footer */}
        <View style={{ marginTop: 10, textAlign: 'center', borderTop: 1, paddingTop: 4 }}>
          <Text style={{ fontSize: 6, fontStyle: 'italic' }}>
            Next Term Begins: ________________     This is a computer-generated result slip
          </Text>
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
  const [commentData, setCommentData] = useState({ behaviors: {} });
  const [studentResults, setStudentResults] = useState([]);
  const [saving, setSaving] = useState(false);
  const [previewMode, setPreviewMode] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
  };

  const loadStudent = async (stu) => {
    setSelectedStudent(stu);
    setSidebarOpen(false); // Close sidebar on mobile
    const { data: res } = await supabase.from('results').select('*, subjects(name)').eq('student_id', stu.id);
    const { data: comm } = await supabase.from('comments').select('*').eq('student_id', stu.id).maybeSingle();
    setScores(res?.reduce((acc, r) => ({ ...acc, [r.subject_id]: r.scores }), {}) || {});
    setStudentResults(res || []);
    setCommentData(comm || { behaviors: {}, submission_status: 'draft' });
  };

  const handleSave = async (status = 'draft') => {
    setSaving(true);
    const updates = subjects.map(s => ({
      student_id: selectedStudent.id, subject_id: s.id, scores: scores[s.id] || {},
      total: Object.values(scores[s.id] || {}).reduce((a, b) => a + (parseFloat(b) || 0), 0)
    }));
    await supabase.from('results').delete().eq('student_id', selectedStudent.id);
    await supabase.from('results').insert(updates);
    
    // Calculate overall performance for auto-comment
    const config = school.assessment_config || [];
    const max = config.reduce((a, b) => a + parseInt(b.max), 0);
    let stTotal = updates.reduce((a, b) => a + b.total, 0);
    const stAvg = (stTotal / (updates.length * max)) * 100;
    const overallMax = updates.length * max;
    
    // Generate suggested comment based on performance
    let suggestedComment = '';
    if (stAvg >= 90) {
      suggestedComment = `Excellent performance! ${selectedStudent.name} has demonstrated outstanding academic ability with ${stAvg.toFixed(1)}%. Keep up the exceptional work!`;
    } else if (stAvg >= 70) {
      suggestedComment = `Very good result with ${stAvg.toFixed(1)}%. ${selectedStudent.name} shows strong understanding. Continue working hard for excellence.`;
    } else if (stAvg >= 60) {
      suggestedComment = `Good effort with ${stAvg.toFixed(1)}%. ${selectedStudent.name} is performing satisfactorily but has room for improvement. Focus on weaker areas.`;
    } else if (stAvg >= 40) {
      suggestedComment = `Fair performance at ${stAvg.toFixed(1)}%. ${selectedStudent.name} needs to put in more effort and dedication to improve results.`;
    } else {
      suggestedComment = `Below average performance at ${stAvg.toFixed(1)}%. ${selectedStudent.name} requires serious attention and extra support to catch up.`;
    }

    await supabase.from('comments').upsert({
      student_id: selectedStudent.id, 
      school_id: school.id,
      tutor_comment: commentData.tutor_comment || suggestedComment,
      midterm_tutor_comment: commentData.midterm_tutor_comment || suggestedComment,
      principal_comment: commentData.principal_comment,
      behaviors: commentData.behaviors,
      submission_status: status,
      overall_average: stAvg.toFixed(2),
      total_score: stTotal,
      max_score: overallMax
    });
    
    setSaving(false); 
    alert(status === 'approved' ? "Results approved and published!" : "Results saved successfully!"); 
    loadStudent(selectedStudent);
  };

  return (
    <div className="flex h-screen bg-slate-50 text-slate-800 overflow-hidden">
      {/* Mobile Menu Button */}
      <button 
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 bg-slate-900 text-white p-2 rounded-lg shadow-lg"
      >
        {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Sidebar - Mobile Overlay */}
      {sidebarOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/50 z-30"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} 
        lg:translate-x-0 
        fixed lg:static 
        inset-y-0 left-0 
        w-64 
        bg-slate-900 text-white 
        flex flex-col p-4 shadow-xl 
        transition-transform duration-300 ease-in-out 
        z-40
      `}>
        <div className="font-bold text-xl mb-8 flex items-center gap-2 border-b border-slate-700 pb-4 mt-12 lg:mt-0">
          <School className="text-blue-400"/> Springforth
        </div>
        <div className="mb-6">
          <label className="text-[10px] text-slate-400 font-bold uppercase">Active Class</label>
          <select className="w-full bg-slate-800 p-2 rounded mt-1 border-none text-sm outline-none" value={selectedClassId} onChange={(e) => loadClass(e.target.value)}>
            <option value="">Select Class</option>
            {classList.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div className="flex-1 overflow-auto">
          {selectedClassId && students.length === 0 && (
            <div className="text-slate-400 text-xs text-center p-4 bg-slate-800 rounded-lg mb-2">
              No students in this class yet. Add students in Settings.
            </div>
          )}
          {!selectedClassId && (
            <div className="text-slate-400 text-xs text-center p-4 bg-slate-800 rounded-lg mb-2">
              Select a class to view students
            </div>
          )}
          {students.map(s => (
            <div key={s.id} onClick={() => loadStudent(s)} className={`p-2 cursor-pointer rounded text-sm mb-1 flex justify-between items-center ${selectedStudent?.id === s.id ? 'bg-blue-600' : 'hover:bg-slate-800'}`}>
              <span className="truncate">{s.name}</span>
              {commentData?.submission_status === 'approved' && <CheckCircle size={14} className="text-green-400" />}
            </div>
          ))}
        </div>
        <div className="border-t border-slate-700 pt-4 space-y-2">
          {profile.role === 'admin' && <button onClick={() => setActiveTab('settings')} className="w-full text-left p-2 text-sm flex items-center gap-2 hover:bg-slate-800 rounded transition"><Settings size={16}/> School Profile</button>}
          <button onClick={onLogout} className="w-full text-left p-2 text-sm text-red-400 flex items-center gap-2 hover:bg-slate-800 rounded transition"><LogOut size={16}/> Logout</button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4 lg:p-8 w-full">
        {activeTab === 'settings' ? (
          <div className="space-y-6">
            {/* School Profile */}
            <div className="bg-white p-4 lg:p-8 rounded-xl shadow-sm border">
              <h2 className="text-xl lg:text-2xl font-bold mb-6">School Profile</h2>
              <form onSubmit={async(e)=>{
                e.preventDefault(); 
                const fd=new FormData(e.target);
                const { error } = await supabase.from('schools').update({
                    name: fd.get('n'), 
                    motto: fd.get('m'), 
                    address: fd.get('a'), 
                    contact_info: fd.get('c'), 
                    current_term: fd.get('t'), 
                    current_session: fd.get('s')
                }).eq('id', school.id);
                
                if (error) {
                  alert("Error: " + error.message);
                } else {
                  alert("School profile updated successfully!");
                  fetchData();
                }
              }} className="space-y-4">
                <input name="n" defaultValue={school?.name} placeholder="School Name" className="w-full border-2 p-3 rounded-lg" required />
                <input name="m" defaultValue={school?.motto} placeholder="School Motto" className="w-full border-2 p-3 rounded-lg" />
                <textarea name="a" defaultValue={school?.address} placeholder="Address" className="w-full border-2 p-3 rounded-lg h-20" />
                <input name="c" defaultValue={school?.contact_info} placeholder="Contact Info (Phone/Email)" className="w-full border-2 p-3 rounded-lg" />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <input name="t" defaultValue={school?.current_term} placeholder="Term (e.g., First Term)" className="border-2 p-3 rounded-lg" required />
                  <input name="s" defaultValue={school?.current_session} placeholder="Session (e.g., 2024/2025)" className="border-2 p-3 rounded-lg" required />
                </div>
                <button type="submit" className="bg-blue-600 text-white px-8 py-3 rounded-lg font-bold w-full sm:w-auto hover:bg-blue-700 transition">Update School Profile</button>
              </form>
            </div>

            {/* Class Management */}
            <div className="bg-white p-4 lg:p-8 rounded-xl shadow-sm border">
              <h2 className="text-xl lg:text-2xl font-bold mb-6">Manage Classes</h2>
              
              {/* Add New Class */}
              <form onSubmit={async(e)=>{
                e.preventDefault();
                const fd = new FormData(e.target);
                const { error } = await supabase.from('classes').insert({
                  school_id: school.id,
                  name: fd.get('className'),
                  class_teacher: fd.get('teacher')
                });
                
                if (error) {
                  alert("Error: " + error.message);
                } else {
                  alert("Class added successfully!");
                  e.target.reset();
                  fetchData();
                }
              }} className="mb-6 p-4 bg-slate-50 rounded-lg">
                <h3 className="font-bold mb-3 text-sm uppercase text-slate-600">Add New Class</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input name="className" placeholder="Class Name (e.g., JSS 1)" className="border-2 p-2 rounded-lg" required />
                  <input name="teacher" placeholder="Class Teacher (optional)" className="border-2 p-2 rounded-lg" />
                </div>
                <button type="submit" className="mt-3 bg-green-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-green-700 transition text-sm">Add Class</button>
              </form>

              {/* Classes List */}
              <div className="space-y-2">
                <h3 className="font-bold text-sm uppercase text-slate-600 mb-3">Existing Classes</h3>
                {classList.length === 0 ? (
                  <p className="text-slate-400 text-sm">No classes yet. Add your first class above.</p>
                ) : (
                  classList.map(cls => (
                    <div key={cls.id} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition">
                      <div>
                        <span className="font-semibold">{cls.name}</span>
                        {cls.class_teacher && <span className="text-slate-500 text-sm ml-2">({cls.class_teacher})</span>}
                      </div>
                      <button 
                        onClick={async()=>{
                          if (window.confirm(`Delete ${cls.name}? This will also delete all students and subjects in this class.`)) {
                            await supabase.from('classes').delete().eq('id', cls.id);
                            fetchData();
                          }
                        }}
                        className="text-red-500 hover:text-red-700 text-sm font-bold"
                      >
                        Delete
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Student Management */}
            <div className="bg-white p-4 lg:p-8 rounded-xl shadow-sm border">
              <h2 className="text-xl lg:text-2xl font-bold mb-6">Manage Students</h2>
              
              {/* Select Class First */}
              <div className="mb-6">
                <label className="text-sm font-bold text-slate-600 uppercase mb-2 block">Select Class to Manage</label>
                <select 
                  className="w-full border-2 p-3 rounded-lg bg-white" 
                  value={selectedClassId} 
                  onChange={(e) => loadClass(e.target.value)}
                >
                  <option value="">-- Select a Class --</option>
                  {classList.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              {selectedClassId && (
                <>
                  {/* Add New Student */}
                  <form onSubmit={async(e)=>{
                    e.preventDefault();
                    const fd = new FormData(e.target);
                    const { error } = await supabase.from('students').insert({
                      class_id: selectedClassId,
                      name: fd.get('studentName'),
                      admission_no: fd.get('admNo'),
                      gender: fd.get('gender'),
                      date_of_birth: fd.get('dob') || null,
                      parent_name: fd.get('parentName'),
                      parent_contact: fd.get('parentContact'),
                      address: fd.get('address'),
                      blood_group: fd.get('bloodGroup'),
                      religion: fd.get('religion'),
                      state_of_origin: fd.get('stateOfOrigin'),
                      previous_school: fd.get('previousSchool')
                    });
                    
                    if (error) {
                      alert("Error: " + error.message);
                    } else {
                      alert("Student added successfully!");
                      e.target.reset();
                      loadClass(selectedClassId);
                    }
                  }} className="mb-6 p-4 bg-slate-50 rounded-lg">
                    <h3 className="font-bold mb-3 text-sm uppercase text-slate-600">Add New Student</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      <input name="studentName" placeholder="Full Name *" className="border-2 p-2 rounded-lg" required />
                      <input name="admNo" placeholder="Admission No (e.g., ADM-001) *" className="border-2 p-2 rounded-lg" required />
                      <select name="gender" className="border-2 p-2 rounded-lg bg-white" required>
                        <option value="">Gender *</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                      </select>
                      <input name="dob" type="date" placeholder="Date of Birth" className="border-2 p-2 rounded-lg" />
                      <input name="bloodGroup" placeholder="Blood Group (e.g., O+)" className="border-2 p-2 rounded-lg" />
                      <input name="religion" placeholder="Religion" className="border-2 p-2 rounded-lg" />
                      <input name="stateOfOrigin" placeholder="State of Origin" className="border-2 p-2 rounded-lg" />
                      <input name="address" placeholder="Home Address" className="border-2 p-2 rounded-lg sm:col-span-2" />
                      <input name="parentName" placeholder="Parent/Guardian Name *" className="border-2 p-2 rounded-lg" required />
                      <input name="parentContact" placeholder="Parent Contact *" className="border-2 p-2 rounded-lg" required />
                      <input name="previousSchool" placeholder="Previous School" className="border-2 p-2 rounded-lg" />
                    </div>
                    <button type="submit" className="mt-3 bg-green-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-green-700 transition text-sm">Add Student</button>
                  </form>

                  {/* Students List */}
                  <div className="space-y-2">
                    <h3 className="font-bold text-sm uppercase text-slate-600 mb-3">Students in Class ({students.length})</h3>
                    {students.length === 0 ? (
                      <p className="text-slate-400 text-sm">No students yet. Add students using the form above.</p>
                    ) : (
                      <div className="max-h-96 overflow-y-auto space-y-2">
                        {students.map(stu => (
                          <div key={stu.id} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition">
                            <div className="flex-1">
                              <div className="font-semibold">{stu.name}</div>
                              <div className="text-slate-500 text-xs">{stu.admission_no} {stu.gender && `• ${stu.gender}`}</div>
                            </div>
                            <button 
                              onClick={async()=>{
                                if (window.confirm(`Delete ${stu.name}? This will also delete all their results.`)) {
                                  await supabase.from('students').delete().eq('id', stu.id);
                                  loadClass(selectedClassId);
                                }
                              }}
                              className="text-red-500 hover:text-red-700 text-sm font-bold ml-4"
                            >
                              Delete
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Subject Management */}
            <div className="bg-white p-4 lg:p-8 rounded-xl shadow-sm border">
              <h2 className="text-xl lg:text-2xl font-bold mb-6">Manage Subjects</h2>
              
              {/* Select Class First */}
              <div className="mb-6">
                <label className="text-sm font-bold text-slate-600 uppercase mb-2 block">Select Class to Manage Subjects</label>
                <select 
                  className="w-full border-2 p-3 rounded-lg bg-white" 
                  value={selectedClassId} 
                  onChange={(e) => loadClass(e.target.value)}
                >
                  <option value="">-- Select a Class --</option>
                  {classList.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              {selectedClassId && (
                <>
                  {/* Add New Subject */}
                  <form onSubmit={async(e)=>{
                    e.preventDefault();
                    const fd = new FormData(e.target);
                    const { error } = await supabase.from('subjects').insert({
                      class_id: selectedClassId,
                      name: fd.get('subjectName'),
                      teacher_name: fd.get('teacherName')
                    });
                    
                    if (error) {
                      alert("Error: " + error.message);
                    } else {
                      alert("Subject added successfully!");
                      e.target.reset();
                      loadClass(selectedClassId);
                    }
                  }} className="mb-6 p-4 bg-slate-50 rounded-lg">
                    <h3 className="font-bold mb-3 text-sm uppercase text-slate-600">Add New Subject</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <input name="subjectName" placeholder="Subject Name (e.g., Mathematics) *" className="border-2 p-2 rounded-lg" required />
                      <input name="teacherName" placeholder="Teacher Name (optional)" className="border-2 p-2 rounded-lg" />
                    </div>
                    <button type="submit" className="mt-3 bg-green-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-green-700 transition text-sm">Add Subject</button>
                  </form>

                  {/* Subjects List */}
                  <div className="space-y-2">
                    <h3 className="font-bold text-sm uppercase text-slate-600 mb-3">Subjects in Class ({subjects.length})</h3>
                    {subjects.length === 0 ? (
                      <p className="text-slate-400 text-sm">No subjects yet. Add subjects using the form above.</p>
                    ) : (
                      subjects.map(sub => (
                        <div key={sub.id} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition">
                          <div>
                            <span className="font-semibold">{sub.name}</span>
                            {sub.teacher_name && <span className="text-slate-500 text-sm ml-2">({sub.teacher_name})</span>}
                          </div>
                          <button 
                            onClick={async()=>{
                              if (window.confirm(`Delete ${sub.name}?`)) {
                                await supabase.from('subjects').delete().eq('id', sub.id);
                                loadClass(selectedClassId);
                              }
                            }}
                            className="text-red-500 hover:text-red-700 text-sm font-bold"
                          >
                            Delete
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        ) : !selectedStudent ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-300"><Users size={60} className="lg:w-20 lg:h-20"/><p className="mt-4 font-medium text-sm lg:text-base">Select a student from the sidebar</p></div>
        ) : (
          <div className="space-y-4 lg:space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center bg-white p-4 lg:p-6 rounded-xl shadow-sm border border-l-8 border-l-blue-600 gap-4">
              <div>
                <h1 className="text-xl lg:text-2xl font-bold">{selectedStudent.name}</h1>
                <span className={`text-[10px] px-2 py-1 rounded uppercase font-bold ${commentData.submission_status === 'approved' ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'}`}>
                    {commentData.submission_status}
                </span>
              </div>
              <div className="flex flex-wrap gap-2 lg:gap-3">
                <button onClick={() => setPreviewMode('ca')} className="bg-slate-100 px-3 lg:px-4 py-2 rounded-lg font-bold text-xs lg:text-sm hover:bg-slate-200 transition flex-1 sm:flex-none">CA Report</button>
                <button onClick={() => setPreviewMode('full')} className="bg-blue-100 text-blue-700 px-3 lg:px-4 py-2 rounded-lg font-bold text-xs lg:text-sm hover:bg-blue-200 transition flex-1 sm:flex-none">Full Report</button>
                <button onClick={() => handleSave(profile.role === 'admin' ? 'approved' : 'pending')} className="bg-green-600 text-white px-4 lg:px-6 py-2 rounded-lg font-bold text-xs lg:text-sm hover:shadow-lg transition w-full sm:w-auto">
                    {saving ? <Loader2 className="animate-spin" /> : (profile.role === 'admin' ? 'Approve & Save' : 'Submit for Approval')}
                </button>
              </div>
            </div>

            <div className="flex gap-3 lg:gap-6 border-b text-xs lg:text-sm font-bold text-slate-400 overflow-x-auto">
              {['scores', 'traits', 'remarks'].map(t => (
                <button key={t} onClick={() => setActiveTab(t)} className={`pb-2 px-2 capitalize transition whitespace-nowrap ${activeTab === t ? 'border-b-2 border-blue-600 text-blue-600' : 'hover:text-slate-600'}`}>{t}</button>
              ))}
            </div>

            {activeTab === 'scores' && (
              <div className="bg-white rounded-xl shadow-sm border p-3 lg:p-6 overflow-x-auto">
                <table className="w-full min-w-[600px]">
                  <thead>
                    <tr className="bg-slate-50 text-left border-b text-xs lg:text-sm">
                      <th className="p-2 lg:p-4 sticky left-0 bg-slate-50">Subject</th>
                      {school?.assessment_config?.map(c=><th key={c.code} className="p-2 lg:p-4 text-center">{c.name}</th>)}
                    </tr>
                  </thead>
                  <tbody className="divide-y text-xs lg:text-sm">
                    {subjects.map(sub => (
                      <tr key={sub.id} className="hover:bg-slate-50 transition">
                        <td className="p-2 lg:p-4 font-semibold sticky left-0 bg-white">{sub.name}</td>
                        {school?.assessment_config?.map(c => (
                          <td key={c.code} className="p-2 lg:p-4 text-center">
                            <input type="number" className="w-16 lg:w-20 bg-slate-100 p-1 lg:p-2 rounded text-center outline-none focus:ring-2 focus:ring-blue-400 transition text-xs lg:text-sm" value={scores[sub.id]?.[c.code] || ''} 
                              onChange={(e)=>setScores({...scores, [sub.id]: {...(scores[sub.id]||{}), [c.code]: e.target.value}})}/>
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === 'traits' && (
              <div className="bg-white p-4 lg:p-8 rounded-xl shadow-sm border grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-8">
                <div>
                  <h3 className="font-bold mb-4 text-slate-500 text-sm lg:text-base">BEHAVIORAL RATINGS</h3>
                  {BEHAVIORS.map(b => (
                    <div key={b} className="flex justify-between items-center py-3 border-b border-slate-100 last:border-none">
                      <span className="text-xs lg:text-sm font-medium">{b}</span>
                      <select className="bg-slate-50 border p-1 rounded text-xs" value={commentData.behaviors?.[b] || 'Good'} 
                        onChange={(e)=>setCommentData({...commentData, behaviors: {...(commentData.behaviors || {}), [b]: e.target.value}})}>
                        {RATINGS.map(r => <option key={r} value={r}>{r}</option>)}
                      </select>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'remarks' && (
              <div className="space-y-6">
                {/* Performance Summary */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl border-2 border-blue-200">
                  <h3 className="font-bold text-lg mb-4 text-blue-900">Performance Summary</h3>
                  {studentResults.length > 0 && (() => {
                    const config = school.assessment_config || [];
                    const max = config.reduce((a, b) => a + parseInt(b.max), 0);
                    const total = studentResults.reduce((acc, r) => acc + (r.total || 0), 0);
                    const overallMax = studentResults.length * max;
                    const avg = (total / overallMax) * 100;
                    const grade = getGrade(avg, 100);
                    
                    return (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-white p-4 rounded-lg shadow-sm">
                          <div className="text-xs text-slate-500 uppercase">Overall Score</div>
                          <div className="text-2xl font-bold text-blue-600">{total}/{overallMax}</div>
                        </div>
                        <div className="bg-white p-4 rounded-lg shadow-sm">
                          <div className="text-xs text-slate-500 uppercase">Average</div>
                          <div className="text-2xl font-bold text-green-600">{avg.toFixed(1)}%</div>
                        </div>
                        <div className="bg-white p-4 rounded-lg shadow-sm">
                          <div className="text-xs text-slate-500 uppercase">Grade</div>
                          <div className="text-2xl font-bold text-purple-600">{grade.g}</div>
                        </div>
                        <div className="bg-white p-4 rounded-lg shadow-sm">
                          <div className="text-xs text-slate-500 uppercase">Status</div>
                          <div className="text-sm font-bold text-orange-600">{commentData.submission_status || 'Draft'}</div>
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {/* Mid-Term Comment */}
                <div className="bg-white p-6 rounded-xl shadow-sm border-2 border-amber-200">
                  <div className="flex justify-between items-center mb-4">
                    <label className="text-sm font-bold text-amber-700 uppercase">Mid-Term Teacher's Comment</label>
                    <button
                      type="button"
                      onClick={() => {
                        if (studentResults.length > 0) {
                          const config = school.assessment_config || [];
                          const max = config.reduce((a, b) => a + parseInt(b.max), 0);
                          const total = studentResults.reduce((acc, r) => acc + (r.total || 0), 0);
                          const avg = (total / (studentResults.length * max)) * 100;
                          let suggestion = '';
                          if (avg >= 90) suggestion = `Outstanding mid-term performance at ${avg.toFixed(1)}%! ${selectedStudent.name} demonstrates excellent grasp of concepts. Maintain this momentum.`;
                          else if (avg >= 70) suggestion = `Very good mid-term showing at ${avg.toFixed(1)}%! ${selectedStudent.name} is on track. Continue the hard work for end of term.`;
                          else if (avg >= 60) suggestion = `Satisfactory mid-term progress at ${avg.toFixed(1)}%. ${selectedStudent.name} should intensify efforts before final exams.`;
                          else if (avg >= 40) suggestion = `Mid-term result shows ${avg.toFixed(1)}%. ${selectedStudent.name} must work harder to improve by term end.`;
                          else suggestion = `Mid-term performance at ${avg.toFixed(1)}% needs urgent improvement. Extra lessons recommended.`;
                          setCommentData({...commentData, midterm_tutor_comment: suggestion});
                        }
                      }}
                      className="text-xs bg-amber-100 text-amber-700 px-3 py-1 rounded-lg hover:bg-amber-200 transition font-semibold"
                    >
                      Suggest Comment
                    </button>
                  </div>
                  <textarea 
                    className="w-full border-2 border-amber-300 p-3 rounded-lg h-32 focus:border-amber-500 outline-none text-sm" 
                    value={commentData.midterm_tutor_comment || ''} 
                    onChange={(e)=>setCommentData({...commentData, midterm_tutor_comment: e.target.value})}
                    placeholder="Enter mid-term progress comment here..."
                  />
                </div>

                {/* Full Term Comment */}
                <div className="bg-white p-6 rounded-xl shadow-sm border-2 border-blue-200">
                  <div className="flex justify-between items-center mb-4">
                    <label className="text-sm font-bold text-blue-700 uppercase">End of Term Teacher's Comment</label>
                    <button
                      type="button"
                      onClick={() => {
                        if (studentResults.length > 0) {
                          const config = school.assessment_config || [];
                          const max = config.reduce((a, b) => a + parseInt(b.max), 0);
                          const total = studentResults.reduce((acc, r) => acc + (r.total || 0), 0);
                          const avg = (total / (studentResults.length * max)) * 100;
                          let suggestion = '';
                          if (avg >= 90) suggestion = `Excellent terminal result of ${avg.toFixed(1)}%! ${selectedStudent.name} has performed exceptionally well this term. Well done!`;
                          else if (avg >= 70) suggestion = `Very good overall performance at ${avg.toFixed(1)}%. ${selectedStudent.name} has worked hard. Keep it up next term!`;
                          else if (avg >= 60) suggestion = `Good result at ${avg.toFixed(1)}%. ${selectedStudent.name} shows potential but needs more consistency in studies.`;
                          else if (avg >= 40) suggestion = `Fair performance at ${avg.toFixed(1)}%. ${selectedStudent.name} must be more serious and dedicated next term.`;
                          else suggestion = `Below expectation at ${avg.toFixed(1)}%. ${selectedStudent.name} needs significant improvement. Parents should provide extra support.`;
                          setCommentData({...commentData, tutor_comment: suggestion});
                        }
                      }}
                      className="text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded-lg hover:bg-blue-200 transition font-semibold"
                    >
                      Suggest Comment
                    </button>
                  </div>
                  <textarea 
                    className="w-full border-2 border-blue-300 p-3 rounded-lg h-32 focus:border-blue-500 outline-none text-sm" 
                    value={commentData.tutor_comment || ''} 
                    onChange={(e)=>setCommentData({...commentData, tutor_comment: e.target.value})}
                    placeholder="Enter end of term comment here..."
                  />
                </div>

                {/* Headmistress Comment */}
                <div className="bg-white p-6 rounded-xl shadow-sm border-2 border-purple-200">
                  <div className="flex justify-between items-center mb-4">
                    <label className="text-sm font-bold text-purple-700 uppercase">Headmistress's Comment</label>
                    {profile.role === 'admin' && (
                      <button
                        type="button"
                        onClick={() => {
                          if (studentResults.length > 0) {
                            const config = school.assessment_config || [];
                            const max = config.reduce((a, b) => a + parseInt(b.max), 0);
                            const total = studentResults.reduce((acc, r) => acc + (r.total || 0), 0);
                            const avg = (total / (studentResults.length * max)) * 100;
                            let suggestion = '';
                            if (avg >= 90) suggestion = 'Excellent work! You have made the school proud. Continue to aim high.';
                            else if (avg >= 70) suggestion = 'Well done! Your dedication is commendable. Maintain this standard.';
                            else if (avg >= 60) suggestion = 'Good effort. With more focus, you can achieve greater heights.';
                            else if (avg >= 40) suggestion = 'Fair result. You must work harder and be more committed to your studies.';
                            else suggestion = 'Improvement is urgently needed. Please see me for counseling and support.';
                            setCommentData({...commentData, principal_comment: suggestion});
                          }
                        }}
                        className="text-xs bg-purple-100 text-purple-700 px-3 py-1 rounded-lg hover:bg-purple-200 transition font-semibold"
                      >
                        Suggest Comment
                      </button>
                    )}
                  </div>
                  <textarea 
                    className="w-full border-2 border-purple-300 p-3 rounded-lg h-32 focus:border-purple-500 outline-none text-sm" 
                    disabled={profile.role !== 'admin'} 
                    value={commentData.principal_comment || ''} 
                    onChange={(e)=>setCommentData({...commentData, principal_comment: e.target.value})}
                    placeholder={profile.role === 'admin' ? "Enter headmistress's comment here..." : "Only headmistress can edit this comment"}
                  />
                  {profile.role !== 'admin' && (
                    <p className="text-xs text-slate-500 mt-2 italic">Only the headmistress (admin) can write or edit this comment.</p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {previewMode && (
        <div className="fixed inset-0 z-50 bg-slate-900/90 backdrop-blur-sm flex flex-col p-2 lg:p-4">
          <div className="bg-white p-3 lg:p-4 rounded-t-xl flex flex-col sm:flex-row justify-between items-center shadow-2xl gap-3">
            <button onClick={() => setPreviewMode(null)} className="font-bold text-slate-600 hover:text-red-500 transition text-sm lg:text-base order-2 sm:order-1">✕ Close Preview</button>
            <PDFDownloadLink document={<ResultPDF school={school} student={selectedStudent} results={studentResults} comments={commentData} type={previewMode} />} fileName={`${selectedStudent.name}.pdf`}>
              <button className="bg-blue-600 text-white px-4 lg:px-6 py-2 rounded-lg font-bold hover:bg-blue-700 text-sm lg:text-base w-full sm:w-auto order-1 sm:order-2">Download Result</button>
            </PDFDownloadLink>
          </div>
          <PDFViewer className="flex-1 w-full rounded-b-xl overflow-hidden"><ResultPDF school={school} student={selectedStudent} results={studentResults} comments={commentData} type={previewMode} /></PDFViewer>
        </div>
      )}
    </div>
  );
};

// ==================== AUTH & PORTALS ====================
const ParentPortal = ({ onBack }) => {
    const [id, setId] = useState('');
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);

    const check = async () => {
        setLoading(true);
        const { data: stu, error } = await supabase.from('students').select('*, schools(*), classes(*), results(*, subjects(*)), comments(*)').eq('admission_no', id).maybeSingle();
        if (stu && stu.comments?.[0]?.submission_status === 'approved') {
            setData(stu);
        } else {
            alert(error ? "Error connecting" : "Result not yet published/Approved by Admin.");
        }
        setLoading(false);
    };

    if (data) return (
        <div className="fixed inset-0 z-50 bg-white"><div className="p-4 border-b"><button onClick={()=>setData(null)} className="font-bold">← Back</button></div>
        <PDFViewer className="w-full h-screen"><ResultPDF school={data.schools} student={data} results={data.results} comments={data.comments[0]} /></PDFViewer></div>
    );

    return (
        <div className="min-h-screen bg-green-50 flex items-center justify-center p-4">
            <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-sm text-center">
                <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-green-600"><Search size={32}/></div>
                <h2 className="text-2xl font-bold text-slate-800">Parent Access</h2>
                <p className="text-slate-500 text-sm mb-6">Enter Admission Number to view approved result</p>
                <input placeholder="ADM-XXXXX" className="w-full border-2 p-3 rounded-xl mb-4 text-center font-bold tracking-widest outline-none focus:border-green-500" onChange={e=>setId(e.target.value)} />
                <button onClick={check} className="w-full bg-green-600 text-white py-3 rounded-xl font-bold hover:bg-green-700 transition shadow-lg">{loading ? 'Checking...' : 'View Report Card'}</button>
                <button onClick={onBack} className="mt-6 text-slate-400 text-sm hover:underline">Back to Staff Login</button>
            </div>
        </div>
    );
};

const Auth = ({ onParent }) => {
  const [mode, setMode] = useState('login');
  const [loading, setLoading] = useState(false);
  const [schools, setSchools] = useState([]);
  const [form, setForm] = useState({ email: '', password: '', name: '', schoolId: '' });
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => { 
    supabase.from('schools').select('id, name').then(({data}) => setSchools(data || [])); 
  }, []);

  const handleAuth = async (e) => {
    e.preventDefault(); 
    setLoading(true);
    setMessage({ type: '', text: '' });
    
    try {
      if (mode === 'school_reg') {
        // Step 1: Sign up the user
        const { data: auth, error: ae } = await supabase.auth.signUp({ 
          email: form.email, 
          password: form.password 
        });
        if (ae) throw ae;
        
        if (!auth.user) {
          throw new Error('User creation failed');
        }

        // Step 2: Create the school
        const { data: school, error: schoolError } = await supabase
          .from('schools')
          .insert({ 
            owner_id: auth.user.id, 
            name: form.name,
            motto: 'Excellence in Education',
            address: '',
            contact_info: '',
            current_term: 'First Term',
            current_session: '2024/2025'
          })
          .select()
          .single();
        
        if (schoolError) {
          console.error('School creation error:', schoolError);
          throw new Error(`School creation failed: ${schoolError.message}`);
        }
        
        if (!school) {
          throw new Error('School creation failed - no data returned');
        }

        // Step 3: Create the profile
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({ 
            id: auth.user.id, 
            full_name: form.name, 
            role: 'admin', 
            school_id: school.id 
          });
        
        if (profileError) {
          console.error('Profile creation error:', profileError);
          throw new Error(`Profile creation failed: ${profileError.message}`);
        }
        
        setMessage({ 
          type: 'success', 
          text: 'School registered successfully! Please check your email to verify your account, then login.' 
        });
        
        // Clear form
        setForm({ email: '', password: '', name: '', schoolId: '' });
        
        // Switch to login after delay
        setTimeout(() => setMode('login'), 3000);
        
      } else if (mode === 'teacher_reg') {
        if (!form.schoolId) {
          throw new Error('Please select a school');
        }
        
        // Step 1: Sign up the user
        const { data: auth, error: ae } = await supabase.auth.signUp({ 
          email: form.email, 
          password: form.password 
        });
        if (ae) throw ae;
        
        if (!auth.user) {
          throw new Error('User creation failed');
        }

        // Step 2: Create the profile
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({ 
            id: auth.user.id, 
            full_name: form.name, 
            role: 'teacher', 
            school_id: form.schoolId 
          });
        
        if (profileError) {
          console.error('Profile creation error:', profileError);
          throw new Error(`Profile creation failed: ${profileError.message}`);
        }
        
        setMessage({ 
          type: 'success', 
          text: 'Teacher account created! Please check your email to verify your account, then login.' 
        });
        
        // Clear form
        setForm({ email: '', password: '', name: '', schoolId: '' });
        
        // Switch to login after delay
        setTimeout(() => setMode('login'), 3000);
        
      } else {
        // Login
        const { error } = await supabase.auth.signInWithPassword({ 
          email: form.email, 
          password: form.password 
        });
        if (error) throw error;
      }
    } catch (err) { 
      console.error('Auth error:', err);
      setMessage({ 
        type: 'error', 
        text: err.message || 'An error occurred. Please try again.' 
      });
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-4">
      <div className="bg-white p-6 lg:p-8 rounded-2xl shadow-xl w-full max-w-md border-t-8 border-blue-600">
        <h1 className="text-2xl lg:text-3xl font-black text-center mb-6 lg:mb-8 text-slate-800">Springforth</h1>
        
        {message.text && (
          <div className={`mb-4 p-3 rounded-lg text-sm ${
            message.type === 'success' 
              ? 'bg-green-100 text-green-700 border border-green-300' 
              : 'bg-red-100 text-red-700 border border-red-300'
          }`}>
            {message.text}
          </div>
        )}
        
        <div className="flex gap-2 lg:gap-4 mb-6 lg:mb-8 text-[9px] lg:text-[10px] font-black uppercase tracking-widest border-b pb-2 overflow-x-auto">
          {['login', 'school_reg', 'teacher_reg'].map(m => (
            <button 
              key={m} 
              onClick={() => {
                setMode(m);
                setMessage({ type: '', text: '' });
              }} 
              className={`whitespace-nowrap ${mode === m ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-400'}`}
            >
              {m.replace('_',' ')}
            </button>
          ))}
        </div>
        
        <form onSubmit={handleAuth} className="space-y-4">
          {mode !== 'login' && (
            <input 
              placeholder="Full Name" 
              className="w-full p-3 border-2 rounded-xl outline-none focus:border-blue-500 transition text-sm lg:text-base" 
              onChange={e => setForm({...form, name: e.target.value})} 
              value={form.name}
              required 
            />
          )}
          <input 
            type="email" 
            placeholder="Email Address" 
            className="w-full p-3 border-2 rounded-xl outline-none focus:border-blue-500 transition text-sm lg:text-base" 
            onChange={e => setForm({...form, email: e.target.value})} 
            value={form.email}
            required 
          />
          <input 
            type="password" 
            placeholder="Password" 
            className="w-full p-3 border-2 rounded-xl outline-none focus:border-blue-500 transition text-sm lg:text-base" 
            onChange={e => setForm({...form, password: e.target.value})} 
            value={form.password}
            required 
          />
          {mode === 'teacher_reg' && (
            <select 
              className="w-full p-3 border-2 rounded-xl bg-white outline-none text-sm lg:text-base" 
              onChange={e => setForm({...form, schoolId: e.target.value})} 
              value={form.schoolId}
              required
            >
              <option value="">Select School</option>
              {schools.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          )}
          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 shadow-lg transition text-sm lg:text-base disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin" size={20} />
                <span>Processing...</span>
              </>
            ) : (
              'Access Portal'
            )}
          </button>
        </form>
        <div className="mt-6 lg:mt-8 pt-4 lg:pt-6 border-t border-slate-100">
            <button onClick={onParent} className="w-full bg-green-50 text-green-700 py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-green-100 transition text-sm lg:text-base"><Search size={18}/> Parent/Student Access</button>
        </div>
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
  const [error, setError] = useState(null);

  const loadProfile = useCallback(async (userId) => {
    try {
      setError(null);
      const { data, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();
      
      if (profileError) {
        console.error('Profile load error:', profileError);
        setError(profileError.message);
        setProfile(null);
      } else if (!data) {
        console.error('No profile found for user');
        setError('Profile not found. Please contact administrator.');
        setProfile(null);
      } else {
        setProfile(data);
        setError(null);
      }
    } catch (err) {
      console.error('Profile load exception:', err);
      setError(err.message);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: s } }) => { 
      setSession(s); 
      if (!s) {
        setLoading(false);
      } else {
        loadProfile(s.user.id);
      }
    });
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => { 
      setSession(s); 
      if (!s) { 
        setProfile(null); 
        setView('auth');
        setLoading(false);
      } else {
        loadProfile(s.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, [loadProfile]);

  if (loading) return <div className="h-screen flex items-center justify-center bg-white"><Loader2 className="animate-spin text-blue-600" size={48}/></div>;
  if (view === 'parent') return <ParentPortal onBack={() => setView('auth')} />;
  if (!session) return <Auth onParent={() => setView('parent')} />;
  if (error || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center space-y-4">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
            <X className="text-red-600" size={32} />
          </div>
          <h2 className="text-xl font-bold text-slate-800">Connection Error</h2>
          <p className="text-slate-600 text-sm">
            {error || 'Unable to load profile. Please try again.'}
          </p>
          <div className="flex flex-col gap-3 pt-4">
            <button 
              onClick={() => {
                setLoading(true);
                loadProfile(session.user.id);
              }}
              className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 transition"
            >
              Retry Connection
            </button>
            <button 
              onClick={() => supabase.auth.signOut()} 
              className="bg-red-500 text-white px-6 py-3 rounded-xl font-bold hover:bg-red-600 transition"
            >
              Sign Out & Return to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <Dashboard profile={profile} onLogout={() => supabase.auth.signOut()} />;
};

export default App;
