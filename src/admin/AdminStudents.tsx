import React, { useState } from 'react';
import type { Student } from '../types/quiz';
import { toNepaliDigits, formatNepalDate } from '../lib/nepaliUtils';
import { dataService } from '../lib/dataService';
import { Search, Filter, ShieldAlert, CheckCircle, Trash2, Ban, AlertTriangle, X } from 'lucide-react';

interface AdminStudentsProps {
  students: Student[];
  onRefresh: () => void;
}

export const AdminStudents: React.FC<AdminStudentsProps> = ({ students, onRefresh }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'restricted' | 'blocked'>('all');
  const [deleteConfirmStudent, setDeleteConfirmStudent] = useState<Student | null>(null);

  const filteredStudents = students.filter(s => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.rollNo.includes(searchTerm) ||
      s.class.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.phone.includes(searchTerm);

    const matchesStatus = statusFilter === 'all' || s.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleStatusChange = (studentId: string, status: 'active' | 'restricted' | 'blocked') => {
    dataService.updateStudentStatus(studentId, status, 'admin@fsudmc.com');
    onRefresh();
  };

  const handleDelete = () => {
    if (!deleteConfirmStudent) return;
    dataService.deleteStudent(deleteConfirmStudent.id, 'admin@fsudmc.com');
    setDeleteConfirmStudent(null);
    onRefresh();
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
            विद्यार्थी व्यवस्थापन (Student Management)
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            दर्ता भएका क्याम्पस विद्यार्थीहरूको सूची, खाता स्थिति नियन्त्रण र प्रमाणीकरण
          </p>
        </div>
        <span className="text-xs font-bold text-slate-600 bg-white px-3 py-1.5 rounded-xl border border-slate-200">
          जम्मा: {toNepaliDigits(filteredStudents.length)} जना
        </span>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="नाम, रोल, कक्षा वा ID बाट खोज्नुहोस्..."
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs focus:outline-hidden focus:ring-2 focus:ring-red-500 font-medium"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as any)}
            className="w-full sm:w-auto px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold bg-white text-slate-700"
          >
            <option value="all">सबै स्थिति (All)</option>
            <option value="active">सक्रिय (Active)</option>
            <option value="restricted">प्रतिबन्धित (Restricted)</option>
            <option value="blocked">ब्लक (Blocked)</option>
          </select>
        </div>
      </div>

      {/* Students Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-4">विद्यार्थी</th>
                <th className="py-3.5 px-4">ID (Username)</th>
                <th className="py-3.5 px-4">कक्षा / सेमेस्टर</th>
                <th className="py-3.5 px-4">रोल नम्बर</th>
                <th className="py-3.5 px-4">फोन नम्बर</th>
                <th className="py-3.5 px-4">स्थिति</th>
                <th className="py-3.5 px-4">दर्ता मिति</th>
                <th className="py-3.5 px-4 text-right">कार्य (Actions)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
              {filteredStudents.length > 0 ? (
                filteredStudents.map(student => (
                  <tr key={student.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full overflow-hidden bg-slate-200 shrink-0 border border-slate-300">
                          <img
                            src={student.profilePhoto || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=face'}
                            alt={student.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <span className="font-bold text-slate-900">{student.name}</span>
                      </div>
                    </td>

                    <td className="py-3 px-4 font-mono font-bold text-red-600">
                      {student.id}
                    </td>

                    <td className="py-3 px-4">
                      {student.class} ({student.semester})
                    </td>

                    <td className="py-3 px-4 font-bold text-slate-800">
                      {toNepaliDigits(student.rollNo)}
                    </td>

                    <td className="py-3 px-4 font-mono text-slate-600">
                      {student.phone}
                    </td>

                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          student.status === 'active'
                            ? 'bg-emerald-100 text-emerald-800'
                            : student.status === 'restricted'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {student.status === 'active' ? 'सक्रिय' : student.status === 'restricted' ? 'प्रतिबन्धित' : 'ब्लक'}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                      {formatNepalDate(student.createdAt, false)}
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {student.status !== 'active' && (
                          <button
                            onClick={() => handleStatusChange(student.id, 'active')}
                            title="सक्रिय बनाउनुहोस्"
                            className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition cursor-pointer"
                          >
                            <CheckCircle className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {student.status !== 'restricted' && (
                          <button
                            onClick={() => handleStatusChange(student.id, 'restricted')}
                            title="प्रतिबन्ध लगाउनुहोस्"
                            className="p-1.5 rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-100 transition cursor-pointer"
                          >
                            <ShieldAlert className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {student.status !== 'blocked' && (
                          <button
                            onClick={() => handleStatusChange(student.id, 'blocked')}
                            title="ब्लक गर्नुहोस्"
                            className="p-1.5 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 transition cursor-pointer"
                          >
                            <Ban className="w-3.5 h-3.5" />
                          </button>
                        )}

                        <button
                          onClick={() => setDeleteConfirmStudent(student)}
                          title="स्थायी मेटाउनुहोस्"
                          className="p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    कुनै विद्यार्थी भेटिएन।
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirmStudent && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-4 animate-in zoom-in-95">
            <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto text-2xl font-bold">
              ⚠️
            </div>
            <div className="text-center">
              <h3 className="text-lg font-black text-slate-900">विद्यार्थी मेटाउने पुष्टि</h3>
              <p className="text-xs text-slate-600 mt-1">
                के तपाईं <b>{deleteConfirmStudent.name}</b> ({deleteConfirmStudent.id}) को खाता प्रणालीबाट पूर्ण रूपमा मेटाउन निश्चित हुनुहुन्छ? यो कार्य फिर्ता गर्न सकिँदैन।
              </p>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setDeleteConfirmStudent(null)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
              >
                रद्द गर्नुहोस्
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow transition"
              >
                हो, मेटाउनुहोस्
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
