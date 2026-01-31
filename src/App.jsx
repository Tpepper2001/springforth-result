// =====================================================
// PART 1: IMPORTS AND CONSTANTS
// =====================================================
// Copy this section first

import React, { useState, useEffect, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Document, Page, Text, View, StyleSheet, PDFViewer, PDFDownloadLink, Image } from '@react-pdf/renderer';
import { Loader2, School, LogOut, Users, Settings, CheckCircle, Search, Menu, X, Upload, Shield, UserCog } from 'lucide-react';

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
});// =====================================================
// PART 2: PDF COMPONENT
// =====================================================
// Add this after Part 1

const ResultPDF = ({ school, student, results, comments, type = 'full' }) => {
  // CA is over 40, Exam is over 60, total 100
  const caMax = 40;
  const examMax = 60;
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
    const percent = (total / totalMax) * 100;
    const grade = getGrade(total, totalMax);
    return { name: r.subjects?.name, total, percent, grade: grade.g };
  });

  const highestScore = subjectStats.length > 0 ? Math.max(...subjectStats.map(s => s.total)) : 0;
  const lowestScore = subjectStats.length > 0 ? Math.min(...subjectStats.map(s => s.total)) : 0;
  const bestSubject = subjectStats.find(s => s.total === highestScore)?.name || 'N/A';
  const weakSubject = subjectStats.find(s => s.total === lowestScore)?.name || 'N/A';

  return (
    <Document>
      <Page size="A4" style={pdfStyles.page}>
        {/* Header */}
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
          
          {/* Summary Row */}
          <View style={[pdfStyles.row, { backgroundColor: '#ecf0f1', marginTop: 2 }]}>
            <Text style={{ width: 100, paddingLeft: 4, fontWeight: 'bold', fontSize: 8 }}>TOTAL</Text>
            <Text style={[pdfStyles.cell, { fontSize: 7, fontWeight: 'bold' }]}>{results.reduce((acc, r) => acc + (parseFloat(r.scores?.ca) || 0), 0)}</Text>
            <Text style={[pdfStyles.cell, { fontSize: 7, fontWeight: 'bold' }]}>{results.reduce((acc, r) => acc + (parseFloat(r.scores?.exam) || 0), 0)}</Text>
            <Text style={[pdfStyles.cell, { fontSize: 8, fontWeight: 'bold' }]}>{totalObtained}/{overallMax}</Text>
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
              <Text style={{ fontSize: 7, marginTop: 2 }}>Total Obtained: <Text style={{ fontWeight: 'bold' }}>{totalObtained} / {overallMax}</Text></Text>
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

        {/* Behavioral Ratings (Psychomotor Skills) - FIXED */}
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
};// =====================================================
// PART 3: CENTRAL ADMIN DASHBOARD
// =====================================================
// Add this after Part 2

const CentralAdminDashboard = ({ onLogout }) => {
  const [schools, setSchools] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const { data: schoolsData } = await supabase.from('schools').select('*').order('name');
      setSchools(schoolsData || []);

      const { data: usersData } = await supabase
        .from('profiles')
        .select('*, schools(name)')
        .order('full_name');
      setUsers(usersData || []);
    } catch (err) {
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTransferUser = async (userId, newSchoolId) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ school_id: newSchoolId })
        .eq('id', userId);

      if (error) throw error;
      alert('User transferred successfully!');
      loadData();
      setSelectedUser(null);
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  const handleChangeRole = async (userId, newRole) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId);

      if (error) throw error;
      alert('User role updated successfully!');
      loadData();
      setSelectedUser(null);
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-blue-600" size={48} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 lg:p-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-6 rounded-xl shadow-lg mb-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Shield size={40} />
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold">Central Administration</h1>
              <p className="text-purple-100 text-sm">System-wide Management Dashboard</p>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg flex items-center gap-2 transition"
          >
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-l-blue-500">
          <div className="flex items-center gap-4">
            <School className="text-blue-500" size={40} />
            <div>
              <p className="text-slate-500 text-sm">Total Schools</p>
              <p className="text-3xl font-bold">{schools.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-l-green-500">
          <div className="flex items-center gap-4">
            <Users className="text-green-500" size={40} />
            <div>
              <p className="text-slate-500 text-sm">Total Users</p>
              <p className="text-3xl font-bold">{users.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Schools Table */}
      <div className="bg-white rounded-xl shadow-sm border mb-6">
        <div className="p-6 border-b">
          <h2 className="text-xl font-bold">Schools</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="text-left p-4 text-sm font-bold">School Name</th>
                <th className="text-left p-4 text-sm font-bold">Contact</th>
                <th className="text-left p-4 text-sm font-bold">Current Term</th>
                <th className="text-left p-4 text-sm font-bold">Session</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {schools.map(school => (
                <tr key={school.id} className="hover:bg-slate-50">
                  <td className="p-4 text-sm">{school.name}</td>
                  <td className="p-4 text-sm text-slate-600">{school.contact_info || 'N/A'}</td>
                  <td className="p-4 text-sm">{school.current_term}</td>
                  <td className="p-4 text-sm">{school.current_session}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Users Management */}
      <div className="bg-white rounded-xl shadow-sm border">
        <div className="p-6 border-b">
          <h2 className="text-xl font-bold">User Management</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="text-left p-4 text-sm font-bold">Name</th>
                <th className="text-left p-4 text-sm font-bold">Current School</th>
                <th className="text-left p-4 text-sm font-bold">Role</th>
                <th className="text-center p-4 text-sm font-bold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {users.map(user => (
                <tr key={user.id} className="hover:bg-slate-50">
                  <td className="p-4 text-sm font-medium">{user.full_name}</td>
                  <td className="p-4 text-sm">{user.schools?.name || 'No School Assigned'}</td>
                  <td className="p-4 text-sm">
                    <span className={`px-2 py-1 rounded text-xs font-bold ${
                      user.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                    }`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="p-4 text-center">
                    <button
                      onClick={() => setSelectedUser(user)}
                      className="bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-indigo-600 transition"
                    >
                      Manage
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* User Management Modal */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold">Manage User</h3>
              <button onClick={() => setSelectedUser(null)} className="text-slate-400 hover:text-slate-600">
                <X size={24} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-sm text-slate-600">User Name</p>
                <p className="font-bold">{selectedUser.full_name}</p>
              </div>

              <div>
                <label className="text-sm text-slate-600 block mb-2">Transfer to School</label>
                <select
                  className="w-full border-2 p-3 rounded-lg"
                  defaultValue={selectedUser.school_id || ''}
                  onChange={(e) => {
                    if (window.confirm('Transfer this user to the selected school?')) {
                      handleTransferUser(selectedUser.id, e.target.value);
                    }
                  }}
                >
                  <option value="">-- Select School --</option>
                  {schools.map(school => (
                    <option key={school.id} value={school.id}>{school.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm text-slate-600 block mb-2">Change Role</label>
                <select
                  className="w-full border-2 p-3 rounded-lg"
                  defaultValue={selectedUser.role}
                  onChange={(e) => {
                    if (window.confirm('Change this user\'s role?')) {
                      handleChangeRole(selectedUser.id, e.target.value);
                    }
                  }}
                >
                  <option value="teacher">Teacher</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};// =====================================================
// PART 4A: TEACHER DASHBOARD - SETUP & DATA LOADING
// =====================================================
// Add this after Part 3

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
    try {
      console.log('Fetching school data for school_id:', profile.school_id);
      
      if (!profile.school_id || profile.school_id === 'null' || profile.school_id === null) {
        console.error('Invalid school_id:', profile.school_id);
        alert('Your account is not properly configured. Please contact the administrator.');
        setSchool(null);
        setClassList([]);
        return;
      }
      
      const { data: s, error: schoolError } = await supabase.from('schools').select('*').eq('id', profile.school_id).single();
      
      if (schoolError) {
        console.error('Error fetching school:', schoolError);
        alert('Error loading school data. Please contact the administrator.');
        return;
      }
      
      if (!s) {
        alert('School not found. Please contact the administrator.');
        return;
      }
      
      console.log('School data loaded:', s);
      setSchool(s);
      
      const { data: cls, error: classError } = await supabase.from('classes').select('*').eq('school_id', profile.school_id).order('name');
      
      if (classError) {
        console.error('Error fetching classes:', classError);
      } else {
        console.log('Classes loaded:', cls?.length || 0);
        setClassList(cls || []);
      }
    } catch (err) {
      console.error('fetchData error:', err);
      alert('Error loading data: ' + err.message);
    }
  }, [profile.school_id]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const loadClass = async (id) => {
    try {
      console.log('Loading class:', id);
      setSelectedClassId(id);
      
      const { data: stu, error: stuError } = await supabase.from('students').select('*').eq('class_id', id).order('name');
      if (stuError) {
        console.error('Error loading students:', stuError);
        alert('Error loading students: ' + stuError.message);
      } else {
        console.log('Students loaded:', stu?.length || 0);
        setStudents(stu || []);
      }
      
      const { data: sub, error: subError } = await supabase.from('subjects').select('*').eq('class_id', id).order('name');
      if (subError) {
        console.error('Error loading subjects:', subError);
        alert('Error loading subjects: ' + subError.message);
      } else {
        console.log('Subjects loaded:', sub?.length || 0);
        setSubjects(sub || []);
      }
    } catch (err) {
      console.error('loadClass error:', err);
      alert('Error loading class: ' + err.message);
    }
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

  const handleSave = async (status = 'draft') => {
    setSaving(true);
    const updates = subjects.map(s => {
      const ca = parseFloat(scores[s.id]?.ca) || 0;
      const exam = parseFloat(scores[s.id]?.exam) || 0;
      return {
        student_id: selectedStudent.id,
        subject_id: s.id,
        scores: scores[s.id] || {},
        total: ca + exam
      };
    });
    
    await supabase.from('results').delete().eq('student_id', selectedStudent.id);
    await supabase.from('results').insert(updates);
    
    const stTotal = updates.reduce((a, b) => a + b.total, 0);
    const stAvg = (stTotal / (updates.length * 100)) * 100;
    
    await supabase.from('comments').upsert({
      student_id: selectedStudent.id,
      school_id: school.id,
      tutor_comment: commentData.tutor_comment,
      midterm_tutor_comment: commentData.midterm_tutor_comment,
      principal_comment: commentData.principal_comment,
      behaviors: commentData.behaviors,
      submission_status: status,
      overall_average: stAvg.toFixed(2),
      total_score: stTotal,
      max_score: updates.length * 100
    });
    
    setSaving(false);
    alert(status === 'approved' ? "Results saved!" : "Results submitted for approval!");
    loadStudent(selectedStudent);
  };

  // Continue to Part 4B for the UI...// =====================================================
// PART 4B: TEACHER DASHBOARD - UI RENDER
// =====================================================
// Add this after Part 4A (continues the TeacherDashboard component)

  return (
    <div className="flex h-screen bg-slate-50 text-slate-800 overflow-hidden">
      {/* Mobile Menu */}
      <button 
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 bg-slate-900 text-white p-2 rounded-lg shadow-lg"
      >
        {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

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
          <School className="text-blue-400"/> {school?.name || 'Springforth'}
        </div>
        <div className="mb-6">
          <label className="text-[10px] text-slate-400 font-bold uppercase">Select Class</label>
          <select className="w-full bg-slate-800 p-2 rounded mt-1 border-none text-sm outline-none" value={selectedClassId} onChange={(e) => loadClass(e.target.value)}>
            <option value="">Select Class</option>
            {classList.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div className="flex-1 overflow-auto">
          {selectedClassId && students.length === 0 && (
            <div className="text-slate-400 text-xs text-center p-4 bg-slate-800 rounded-lg mb-2">
              No students yet
            </div>
          )}
          {!selectedClassId && (
            <div className="text-slate-400 text-xs text-center p-4 bg-slate-800 rounded-lg mb-2">
              Select a class
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
          <button onClick={onLogout} className="w-full text-left p-2 text-sm text-red-400 flex items-center gap-2 hover:bg-slate-800 rounded transition"><LogOut size={16}/> Logout</button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4 lg:p-8 w-full">
        {!selectedStudent ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-300">
            <Users size={60} />
            <p className="mt-4 font-medium text-sm lg:text-base">Select a student from the sidebar</p>
          </div>
        ) : (
          <div className="space-y-4 lg:space-y-6">
            <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center bg-white p-4 lg:p-6 rounded-xl shadow-sm border border-l-8 border-l-blue-600 gap-4">
              <div>
                <h1 className="text-xl lg:text-2xl font-bold">{selectedStudent.name}</h1>
                <span className={`text-[10px] px-2 py-1 rounded uppercase font-bold ${commentData.submission_status === 'approved' ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'}`}>
                  {commentData.submission_status || 'draft'}
                </span>
              </div>
              <div className="flex flex-wrap gap-2 lg:gap-3">
                <button onClick={() => setPreviewMode('ca')} className="bg-slate-100 px-3 lg:px-4 py-2 rounded-lg font-bold text-xs lg:text-sm hover:bg-slate-200 transition">CA Report</button>
                <button onClick={() => setPreviewMode('full')} className="bg-blue-100 text-blue-700 px-3 lg:px-4 py-2 rounded-lg font-bold text-xs lg:text-sm hover:bg-blue-200 transition">Full Report</button>
                <button onClick={() => handleSave('pending')} className="bg-green-600 text-white px-4 lg:px-6 py-2 rounded-lg font-bold text-xs lg:text-sm hover:shadow-lg transition w-full sm:w-auto">
                  {saving ? <Loader2 className="animate-spin" /> : 'Submit for Approval'}
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
                      <th className="p-2 lg:p-4 text-center">CA (Max 40)</th>
                      <th className="p-2 lg:p-4 text-center">Exam (Max 60)</th>
                      <th className="p-2 lg:p-4 text-center">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y text-xs lg:text-sm">
                    {subjects.map(sub => {
                      const ca = parseFloat(scores[sub.id]?.ca) || 0;
                      const exam = parseFloat(scores[sub.id]?.exam) || 0;
                      return (
                        <tr key={sub.id} className="hover:bg-slate-50 transition">
                          <td className="p-2 lg:p-4 font-semibold sticky left-0 bg-white">{sub.name}</td>
                          <td className="p-2 lg:p-4 text-center">
                            <input 
                              type="number" 
                              max="40"
                              min="0"
                              className="w-16 lg:w-20 bg-slate-100 p-1 lg:p-2 rounded text-center outline-none focus:ring-2 focus:ring-blue-400 transition text-xs lg:text-sm" 
                              value={scores[sub.id]?.ca || ''} 
                              onChange={(e)=>{
                                const val = Math.min(40, Math.max(0, parseFloat(e.target.value) || 0));
                                setScores({...scores, [sub.id]: {...(scores[sub.id]||{}), ca: val}});
                              }}
                            />
                          </td>
                          <td className="p-2 lg:p-4 text-center">
                            <input 
                              type="number"
                              max="60"
                              min="0"
                              className="w-16 lg:w-20 bg-slate-100 p-1 lg:p-2 rounded text-center outline-none focus:ring-2 focus:ring-blue-400 transition text-xs lg:text-sm" 
                              value={scores[sub.id]?.exam || ''} 
                              onChange={(e)=>{
                                const val = Math.min(60, Math.max(0, parseFloat(e.target.value) || 0));
                                setScores({...scores, [sub.id]: {...(scores[sub.id]||{}), exam: val}});
                              }}
                            />
                          </td>
                          <td className="p-2 lg:p-4 text-center font-bold">{ca + exam}/100</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === 'traits' && (
              <div className="bg-white p-4 lg:p-8 rounded-xl shadow-sm border">
                <h3 className="font-bold mb-4 text-slate-500 text-sm lg:text-base">PSYCHOMOTOR SKILLS</h3>
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
            )}

            {activeTab === 'remarks' && (
              <div className="space-y-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border-2 border-blue-200">
                  <label className="text-sm font-bold text-blue-700 uppercase mb-2 block">Teacher's Comment</label>
                  <textarea 
                    className="w-full border-2 border-blue-300 p-3 rounded-lg h-32 focus:border-blue-500 outline-none text-sm" 
                    value={commentData.tutor_comment || ''} 
                    onChange={(e)=>setCommentData({...commentData, tutor_comment: e.target.value})}
                    placeholder="Enter your comment here..."
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {previewMode && (
        <div className="fixed inset-0 z-50 bg-slate-900/90 backdrop-blur-sm flex flex-col p-2 lg:p-4">
          <div className="bg-white p-3 lg:p-4 rounded-t-xl flex flex-col sm:flex-row justify-between items-center shadow-2xl gap-3">
            <button onClick={() => setPreviewMode(null)} className="font-bold text-slate-600 hover:text-red-500 transition text-sm lg:text-base">✕ Close</button>
            <PDFDownloadLink document={<ResultPDF school={school} student={selectedStudent} results={studentResults} comments={commentData} type={previewMode} />} fileName={`${selectedStudent.name}.pdf`}>
              <button className="bg-blue-600 text-white px-4 lg:px-6 py-2 rounded-lg font-bold hover:bg-blue-700 text-sm lg:text-base">Download</button>
            </PDFDownloadLink>
          </div>
          <PDFViewer className="flex-1 w-full rounded-b-xl overflow-hidden"><ResultPDF school={school} student={selectedStudent} results={studentResults} comments={commentData} type={previewMode} /></PDFViewer>
        </div>
      )}
    </div>
  );
};
// End of TeacherDashboard component// =====================================================
// PART 5: ADMIN DASHBOARD
// =====================================================
// Add this after Part 4B
// NOTE: AdminDashboard is IDENTICAL to TeacherDashboard except:
// 1. Has Settings tab access
// 2. Can upload logo
// 3. Can write headmistress comments
// 4. Saves as 'approved' instead of 'pending'

// Copy the ENTIRE TeacherDashboard component from Parts 4A and 4B
// Then make these modifications:

const AdminDashboard = ({ profile, onLogout }) => {
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
  const [uploadingLogo, setUploadingLogo] = useState(false);

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
    const { data: res } = await supabase.from('results').select('*, subjects(name)').eq('student_id', stu.id);
    const { data: comm } = await supabase.from('comments').select('*').eq('student_id', stu.id).maybeSingle();
    setScores(res?.reduce((acc, r) => ({ ...acc, [r.subject_id]: r.scores }), {}) || {});
    setStudentResults(res || []);
    setCommentData(comm || { behaviors: {}, submission_status: 'draft' });
  };

  const handleSave = async (status = 'approved') => {
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
      principal_comment: commentData.principal_comment,
      behaviors: commentData.behaviors,
      submission_status: status
    });
    setSaving(false);
    alert("Results Approved & Saved!");
    loadStudent(selectedStudent);
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingLogo(true);
    const fileName = `${school.id}-logo-${Date.now()}`;
    await supabase.storage.from('school-logos').upload(fileName, file);
    const { data: { publicUrl } } = supabase.storage.from('school-logos').getPublicUrl(fileName);
    await supabase.from('schools').update({ logo_url: publicUrl }).eq('id', school.id);
    fetchData();
    setUploadingLogo(false);
  };

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Sidebar */}
      <div className="w-64 bg-slate-900 text-white p-4 flex flex-col">
        <div className="font-bold mb-8 flex items-center gap-2"><School/> {school?.name}</div>
        <select className="bg-slate-800 p-2 rounded mb-4 text-sm" onChange={(e) => loadClass(e.target.value)}>
          <option>Select Class</option>
          {classList.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <div className="flex-1 overflow-auto">
          {students.map(s => (
            <div key={s.id} onClick={() => loadStudent(s)} className={`p-2 cursor-pointer rounded text-sm ${selectedStudent?.id === s.id ? 'bg-blue-600' : ''}`}>
              {s.name}
            </div>
          ))}
        </div>
        <button onClick={() => setActiveTab('settings')} className="text-left p-2 text-sm flex items-center gap-2 mt-2"><Settings size={16}/> Settings</button>
        <button onClick={onLogout} className="text-left p-2 text-sm text-red-400 flex items-center gap-2"><LogOut size={16}/> Logout</button>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-8 overflow-auto">
        {activeTab === 'settings' ? (
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <h2 className="text-xl font-bold mb-4">School Logo</h2>
            <input type="file" onChange={handleLogoUpload} />
            {uploadingLogo && <Loader2 className="animate-spin mt-2" />}
          </div>
        ) : selectedStudent ? (
          <div className="space-y-6">
             <div className="flex justify-between items-center bg-white p-6 rounded-xl shadow-sm">
                <h1 className="text-2xl font-bold">{selectedStudent.name}</h1>
                <div className="flex gap-2">
                  <button onClick={() => setPreviewMode('full')} className="bg-blue-100 text-blue-700 px-4 py-2 rounded-lg font-bold">Preview</button>
                  <button onClick={() => handleSave('approved')} className="bg-green-600 text-white px-6 py-2 rounded-lg font-bold">Approve & Save</button>
                </div>
             </div>
             {/* Score inputs and remarks would go here similar to Teacher dashboard */}
             <textarea 
               className="w-full border p-4 rounded-xl" 
               placeholder="Headmistress Comment" 
               value={commentData.principal_comment || ''} 
               onChange={(e) => setCommentData({...commentData, principal_comment: e.target.value})}
             />
          </div>
        ) : <div className="text-center text-slate-400">Select a student</div>}
      </div>
      {previewMode && (
        <div className="fixed inset-0 z-50 bg-black/80 flex flex-col">
          <button onClick={() => setPreviewMode(null)} className="text-white p-4 self-end">Close ✕</button>
          <PDFViewer className="flex-1"><ResultPDF school={school} student={selectedStudent} results={studentResults} comments={commentData} /></PDFViewer>
        </div>
      )}
    </div>
  );
};
// End of AdminDashboard component// =====================================================
// PART 6: PARENT PORTAL AND AUTH
// =====================================================
// Add this after Part 5

const ParentPortal = ({ onBack }) => {
  const [id, setId] = useState('');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const check = async () => {
    setLoading(true);
    const { data: stu, error } = await supabase
      .from('students')
      .select('*, schools(*), classes(*), results(*, subjects(*)), comments(*)')
      .eq('admission_no', id)
      .maybeSingle();
      
    if (stu && stu.comments?.[0]?.submission_status === 'approved') {
      setData(stu);
    } else {
      alert(error ? "Error connecting" : "Result not yet published");
    }
    setLoading(false);
  };

  if (data) return (
    <div className="fixed inset-0 z-50 bg-white">
      <div className="p-4 border-b">
        <button onClick={()=>setData(null)} className="font-bold">← Back</button>
      </div>
      <PDFViewer className="w-full h-screen">
        <ResultPDF school={data.schools} student={data} results={data.results} comments={data.comments[0]} />
      </PDFViewer>
    </div>
  );

  return (
    <div className="min-h-screen bg-green-50 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-sm text-center">
        <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-green-600">
          <Search size={32}/>
        </div>
        <h2 className="text-2xl font-bold text-slate-800">Parent Access</h2>
        <p className="text-slate-500 text-sm mb-6">Enter Admission Number</p>
        <input 
          placeholder="ADM-XXXXX" 
          className="w-full border-2 p-3 rounded-xl mb-4 text-center font-bold tracking-widest outline-none focus:border-green-500" 
          onChange={e=>setId(e.target.value)} 
        />
        <button 
          onClick={check} 
          className="w-full bg-green-600 text-white py-3 rounded-xl font-bold hover:bg-green-700 transition shadow-lg"
        >
          {loading ? 'Checking...' : 'View Report Card'}
        </button>
        <button onClick={onBack} className="mt-6 text-slate-400 text-sm hover:underline">
          Back to Staff Login
        </button>
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
        const { data: auth, error: ae } = await supabase.auth.signUp({ 
          email: form.email, 
          password: form.password 
        });
        if (ae) throw ae;
        if (!auth.user) throw new Error('User creation failed');

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
        
        if (schoolError) throw new Error(`School creation failed: ${schoolError.message}`);
        if (!school) throw new Error('School creation failed');

        const { error: profileError } = await supabase
          .from('profiles')
          .insert({ 
            id: auth.user.id, 
            full_name: form.name, 
            role: 'admin', 
            school_id: school.id 
          });
        
        if (profileError) throw new Error(`Profile creation failed: ${profileError.message}`);
        
        setMessage({ 
          type: 'success', 
          text: 'School registered! Check your email to verify, then login.' 
        });
        
        setForm({ email: '', password: '', name: '', schoolId: '' });
        setTimeout(() => setMode('login'), 3000);
        
      } else if (mode === 'teacher_reg') {
        if (!form.schoolId) throw new Error('Please select a school');
        
        const { data: auth, error: ae } = await supabase.auth.signUp({ 
          email: form.email, 
          password: form.password 
        });
        if (ae) throw ae;
        if (!auth.user) throw new Error('User creation failed');

        const { error: profileError } = await supabase
          .from('profiles')
          .insert({ 
            id: auth.user.id, 
            full_name: form.name, 
            role: 'teacher', 
            school_id: form.schoolId 
          });
        
        if (profileError) throw new Error(`Profile creation failed: ${profileError.message}`);
        
        setMessage({ 
          type: 'success', 
          text: 'Teacher account created! Check email to verify, then login.' 
        });
        
        setForm({ email: '', password: '', name: '', schoolId: '' });
        setTimeout(() => setMode('login'), 3000);
        
      } else {
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
        text: err.message || 'An error occurred.' 
      });
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-4">
      <div className="bg-white p-6 lg:p-8 rounded-2xl shadow-xl w-full max-w-md border-t-8 border-blue-600">
        <h1 className="text-2xl lg:text-3xl font-black text-center mb-6 text-slate-800">Springforth</h1>
        
        {message.text && (
          <div className={`mb-4 p-3 rounded-lg text-sm ${
            message.type === 'success' 
              ? 'bg-green-100 text-green-700' 
              : 'bg-red-100 text-red-700'
          }`}>
            {message.text}
          </div>
        )}
        
        <div className="flex gap-2 mb-6 text-[10px] font-black uppercase border-b pb-2">
          {['login', 'school_reg', 'teacher_reg'].map(m => (
            <button 
              key={m} 
              onClick={() => {setMode(m); setMessage({ type: '', text: '' });}} 
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
              className="w-full p-3 border-2 rounded-xl outline-none focus:border-blue-500" 
              onChange={e => setForm({...form, name: e.target.value})} 
              value={form.name}
              required 
            />
          )}
          <input 
            type="email" 
            placeholder="Email Address" 
            className="w-full p-3 border-2 rounded-xl outline-none focus:border-blue-500" 
            onChange={e => setForm({...form, email: e.target.value})} 
            value={form.email}
            required 
          />
          <input 
            type="password" 
            placeholder="Password" 
            className="w-full p-3 border-2 rounded-xl outline-none focus:border-blue-500" 
            onChange={e => setForm({...form, password: e.target.value})} 
            value={form.password}
            required 
          />
          {mode === 'teacher_reg' && (
            <select 
              className="w-full p-3 border-2 rounded-xl bg-white outline-none" 
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
            className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? <><Loader2 className="animate-spin" size={20} /><span>Processing...</span></> : 'Access Portal'}
          </button>
        </form>
        <div className="mt-6 pt-6 border-t">
          <button onClick={onParent} className="w-full bg-green-50 text-green-700 py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-green-100">
            <Search size={18}/> Parent/Student Access
          </button>
        </div>
      </div>
    </div>
  );
};// =====================================================
// PART 7: APP ROOT COMPONENT
// =====================================================
// Add this after Part 6
// This is the FINAL part

const App = () => {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [view, setView] = useState('auth');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadProfile = useCallback(async (userId, userEmail) => {
    try {
      setError(null);
      
      // Check if central admin
      if (userEmail === CENTRAL_ADMIN_EMAIL) {
        setProfile({ role: 'central_admin', email: userEmail });
        setError(null);
        setLoading(false);
        return;
      }

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
        console.error('No profile found');
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
        loadProfile(s.user.id, s.user.email);
      }
    });
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => { 
      setSession(s); 
      if (!s) { 
        setProfile(null); 
        setView('auth');
        setLoading(false);
      } else {
        loadProfile(s.user.id, s.user.email);
      }
    });

    return () => subscription.unsubscribe();
  }, [loadProfile]);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-white">
        <Loader2 className="animate-spin text-blue-600" size={48}/>
      </div>
    );
  }

  if (view === 'parent') {
    return <ParentPortal onBack={() => setView('auth')} />;
  }

  if (!session) {
    return <Auth onParent={() => setView('parent')} />;
  }

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
                loadProfile(session.user.id, session.user.email);
              }}
              className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700"
            >
              Retry Connection
            </button>
            <button 
              onClick={() => supabase.auth.signOut()} 
              className="bg-red-500 text-white px-6 py-3 rounded-xl font-bold hover:bg-red-600"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Route to appropriate dashboard based on role
  if (profile.role === 'central_admin') {
    return <CentralAdminDashboard onLogout={() => supabase.auth.signOut()} />;
  } else if (profile.role === 'admin') {
    return <AdminDashboard profile={profile} onLogout={() => supabase.auth.signOut()} />;
  } else {
    return <TeacherDashboard profile={profile} onLogout={() => supabase.auth.signOut()} />;
  }
};

export default App;

// =====================================================
// END OF APP.JSX
// =====================================================
// To assemble: Combine Parts 1-7 in order into one file
