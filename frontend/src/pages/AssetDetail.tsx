import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import toast from 'react-hot-toast';
import {
  ArrowLeftIcon,
  ArrowPathIcon,
  UserPlusIcon,
  ArrowUturnLeftIcon,
  PhotoIcon,
} from '@heroicons/react/24/outline';
import { assetApi } from '../api/assets';
import { aiApi } from '../api/dashboard';
import type { Asset, AssignmentHistory, StatusHistory, AssetStatus, Employee, AiRiskAssessment } from '../types';
import { employeeApi } from '../api/organization';
import StatusBadge from '../components/StatusBadge';
import Modal from '../components/Modal';
import LoadingSpinner from '../components/LoadingSpinner';
import { formatDate, formatDateTime, formatCurrency, riskColors } from '../utils/status';

export default function AssetDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const assetId = Number(id);

  const [asset, setAsset] = useState<Asset | null>(null);
  const [assignments, setAssignments] = useState<AssignmentHistory[]>([]);
  const [statusHistory, setStatusHistory] = useState<StatusHistory[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [risk, setRisk] = useState<AiRiskAssessment | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'details' | 'assignments' | 'status-history' | 'qr'>('details');

  // Modals
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(false);

  // Forms
  const [statusForm, setStatusForm] = useState({ newStatus: '' as AssetStatus, changedBy: 'Admin', reason: '' });
  const [assignForm, setAssignForm] = useState({ employeeId: 0, assignedBy: 'Admin' });
  const [returnForm, setReturnForm] = useState({ returnedBy: 'Admin', returnNotes: '' });

  const loadAll = () => {
    setLoading(true);
    Promise.all([
      assetApi.getById(assetId),
      assetApi.getAssignmentHistory(assetId),
      assetApi.getStatusHistory(assetId),
      employeeApi.getActive(),
      aiApi.assessRisk(assetId).catch(() => null),
    ])
      .then(([a, ah, sh, emps, r]) => {
        setAsset(a);
        setAssignments(ah);
        setStatusHistory(sh);
        setEmployees(emps);
        setRisk(r);
        // Fetch resolved image URL (handles S3 presigned URLs and local fallback)
        if (a.imagePath) {
          assetApi.getImageUrl(assetId).then(url => setImageUrl(url)).catch(() => {
            // Fallback to local path if image-url endpoint fails
            setImageUrl(`/asset-images/${a.imagePath}`);
          });
        } else {
          setImageUrl(null);
        }
      })
      .catch((err: Error) => toast.error(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadAll(); }, [assetId]);

  const handleStatusChange = async () => {
    try {
      await assetApi.changeStatus(assetId, statusForm);
      toast.success('Status changed');
      setShowStatusModal(false);
      loadAll();
    } catch (err: any) { toast.error(err.message); }
  };

  const handleAssign = async () => {
    try {
      await assetApi.assign(assetId, { employeeId: assignForm.employeeId, assignedBy: assignForm.assignedBy });
      toast.success('Asset assigned');
      setShowAssignModal(false);
      loadAll();
    } catch (err: any) { toast.error(err.message); }
  };

  const handleReturn = async () => {
    try {
      await assetApi.returnAsset(assetId, returnForm);
      toast.success('Asset returned');
      setShowReturnModal(false);
      loadAll();
    } catch (err: any) { toast.error(err.message); }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      await assetApi.uploadImage(assetId, file);
      toast.success('Image uploaded');
      loadAll();
    } catch (err: any) { toast.error(err.message); }
  };

  if (loading) return <LoadingSpinner size="lg" />;
  if (!asset) return <p className="text-red-500">Asset not found</p>;

  const tabs = [
    { id: 'details' as const, label: 'Details' },
    { id: 'assignments' as const, label: `Assignments (${assignments.length})` },
    { id: 'status-history' as const, label: `Status History (${statusHistory.length})` },
    { id: 'qr' as const, label: 'QR Code' },
  ];

  // QR code now encodes a URL to the public asset summary page
  const qrUrl = `${window.location.origin}/public/assets/${asset.id}`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/assets')} className="p-2 hover:bg-gray-100 rounded-lg">
            <ArrowLeftIcon className="h-5 w-5 text-gray-500" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{asset.name}</h1>
            <p className="text-sm text-gray-500 font-mono">{asset.serialNumber}</p>
          </div>
          <StatusBadge status={asset.status} />
        </div>
        <div className="flex gap-2">
          {asset.status === 'REGISTERED' && (
            <button onClick={() => setShowAssignModal(true)}
              className="flex items-center gap-1 px-3 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700">
              <UserPlusIcon className="h-4 w-4" /> Assign
            </button>
          )}
          {asset.status === 'ASSIGNED' && (
            <button onClick={() => setShowReturnModal(true)}
              className="flex items-center gap-1 px-3 py-2 bg-orange-600 text-white rounded-lg text-sm hover:bg-orange-700">
              <ArrowUturnLeftIcon className="h-4 w-4" /> Return
            </button>
          )}
          <button onClick={() => setShowStatusModal(true)}
            className="flex items-center gap-1 px-3 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700">
            <ArrowPathIcon className="h-4 w-4" /> Change Status
          </button>
        </div>
      </div>

      {/* AI Risk Banner */}
      {risk && risk.riskLevel !== 'LOW' && (
        <div className={`rounded-lg p-4 border ${
          risk.riskLevel === 'CRITICAL' ? 'bg-red-50 border-red-200' :
          risk.riskLevel === 'HIGH' ? 'bg-orange-50 border-orange-200' :
          'bg-yellow-50 border-yellow-200'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">AI Risk Assessment: <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${riskColors[risk.riskLevel]}`}>{risk.riskLevel}</span></p>
              <p className="text-sm mt-1">{risk.riskFactors[0]}</p>
            </div>
            <p className="text-sm text-gray-600">{(risk.failureProbability * 100).toFixed(0)}% failure probability</p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex -mb-px space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-4 px-1 border-b-2 text-sm font-medium ${
                activeTab === tab.id
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'details' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Asset Information</h3>
            <dl className="space-y-3">
              {[
                ['Type', asset.type],
                ['Category', asset.categoryName],
                ['Description', asset.description || '-'],
                ['Purchase Date', formatDate(asset.purchaseDate)],
                ['Purchase Cost', formatCurrency(asset.purchaseCost)],
                ['Warranty Expiry', asset.warrantyExpiryDate ? formatDate(asset.warrantyExpiryDate) + (asset.warrantyExpired ? ' (EXPIRED)' : '') : '-'],
                ['Notes', asset.notes || '-'],
                ['Created', formatDateTime(asset.createdAt)],
                ['Updated', formatDateTime(asset.updatedAt)],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between py-2 border-b border-gray-100">
                  <dt className="text-sm text-gray-500">{label}</dt>
                  <dd className="text-sm font-medium text-gray-900">{value}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Current Assignment</h3>
              {asset.currentEmployee ? (
                <dl className="space-y-3">
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <dt className="text-sm text-gray-500">Employee</dt>
                    <dd className="text-sm font-medium text-gray-900">{asset.currentEmployee.fullName}</dd>
                  </div>
                  {asset.currentDepartment && (
                    <div className="flex justify-between py-2 border-b border-gray-100">
                      <dt className="text-sm text-gray-500">Department</dt>
                      <dd className="text-sm font-medium text-gray-900">{asset.currentDepartment.name}</dd>
                    </div>
                  )}
                  {asset.currentBranch && (
                    <div className="flex justify-between py-2 border-b border-gray-100">
                      <dt className="text-sm text-gray-500">Branch</dt>
                      <dd className="text-sm font-medium text-gray-900">{asset.currentBranch.name}</dd>
                    </div>
                  )}
                </dl>
              ) : (
                <p className="text-sm text-gray-500">Not currently assigned</p>
              )}
            </div>

            {/* Image */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Asset Image</h3>
              {imageUrl ? (
                <img src={imageUrl} alt={asset.name}
                  className="w-full h-48 object-cover rounded-lg" />
              ) : (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                  <PhotoIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <p className="mt-2 text-sm text-gray-500">No image uploaded</p>
                </div>
              )}
              <label className="mt-3 flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 cursor-pointer">
                <PhotoIcon className="h-4 w-4" />
                Upload Image
                <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
              </label>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'assignments' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employee</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Department</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Assigned At</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Returned At</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Assigned By</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {assignments.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-8 text-center text-gray-500">No assignment history</td></tr>
              ) : assignments.map((a) => (
                <tr key={a.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-900">{a.employeeName || '-'}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{a.departmentName || '-'}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{formatDateTime(a.assignedAt)}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{formatDateTime(a.returnedAt)}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{a.assignedBy}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${a.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                      {a.active ? 'Active' : 'Returned'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'status-history' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">From</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">To</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Changed By</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reason</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {statusHistory.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-500">No status history</td></tr>
              ) : statusHistory.map((h) => (
                <tr key={h.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-500">{formatDateTime(h.changedAt)}</td>
                  <td className="px-6 py-4">{h.oldStatus ? <StatusBadge status={h.oldStatus} size="sm" /> : '-'}</td>
                  <td className="px-6 py-4"><StatusBadge status={h.newStatus} size="sm" /></td>
                  <td className="px-6 py-4 text-sm text-gray-500">{h.changedBy}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{h.reason || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'qr' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <div className="flex flex-col items-center">
            <QRCodeSVG value={qrUrl} size={300} level="H" includeMargin />
            <div className="mt-4 text-center">
              <p className="text-lg font-semibold text-gray-900">{asset.name}</p>
              <p className="text-sm text-gray-500 font-mono">{asset.serialNumber}</p>
              <p className="text-sm text-gray-500 mt-1">Status: {asset.status}</p>
              {asset.currentEmployee && (
                <p className="text-sm text-gray-500">Owner: {asset.currentEmployee.fullName}</p>
              )}
            </div>
            <div className="mt-4 flex gap-2">
              <a
                href={assetApi.getQrCodeUrl(assetId)}
                download={`qr-${asset.serialNumber}.png`}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700"
              >
                Download QR Code (PNG)
              </a>
              <a
                href={`/api/public/assets/${assetId}/pdf`}
                download
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-50"
              >
                Download PDF Summary
              </a>
            </div>
            <p className="mt-3 text-xs text-gray-400">
              Scanning this QR code opens a public summary page (no login required)
            </p>
          </div>
        </div>
      )}

      {/* Status Change Modal */}
      <Modal open={showStatusModal} onClose={() => setShowStatusModal(false)} title="Change Asset Status">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Current Status</label>
            <StatusBadge status={asset.status} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">New Status *</label>
            <select
              value={statusForm.newStatus}
              onChange={(e) => setStatusForm({ ...statusForm, newStatus: e.target.value as AssetStatus })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            >
              <option value="">Select status</option>
              <option value="REGISTERED">Registered</option>
              <option value="IN_REPAIR">In Repair</option>
              <option value="LOST">Lost</option>
              <option value="WRITTEN_OFF">Written Off</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Changed By *</label>
            <input
              type="text"
              value={statusForm.changedBy}
              onChange={(e) => setStatusForm({ ...statusForm, changedBy: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
            <textarea
              value={statusForm.reason}
              onChange={(e) => setStatusForm({ ...statusForm, reason: e.target.value })}
              rows={3}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={() => setShowStatusModal(false)}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50">Cancel</button>
            <button onClick={handleStatusChange}
              disabled={!statusForm.newStatus || !statusForm.changedBy}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 disabled:opacity-50">
              Update Status
            </button>
          </div>
        </div>
      </Modal>

      {/* Assign Modal */}
      <Modal open={showAssignModal} onClose={() => setShowAssignModal(false)} title="Assign Asset">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Employee *</label>
            <select
              value={assignForm.employeeId}
              onChange={(e) => setAssignForm({ ...assignForm, employeeId: Number(e.target.value) })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            >
              <option value={0}>Select employee</option>
              {employees.map(e => (
                <option key={e.id} value={e.id}>{e.fullName} ({e.employeeCode})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Assigned By *</label>
            <input
              type="text"
              value={assignForm.assignedBy}
              onChange={(e) => setAssignForm({ ...assignForm, assignedBy: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={() => setShowAssignModal(false)}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50">Cancel</button>
            <button onClick={handleAssign}
              disabled={!assignForm.employeeId}
              className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 disabled:opacity-50">
              Assign
            </button>
          </div>
        </div>
      </Modal>

      {/* Return Modal */}
      <Modal open={showReturnModal} onClose={() => setShowReturnModal(false)} title="Return Asset">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Returning asset from: <strong>{asset.currentEmployee?.fullName}</strong>
          </p>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Returned By *</label>
            <input
              type="text"
              value={returnForm.returnedBy}
              onChange={(e) => setReturnForm({ ...returnForm, returnedBy: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea
              value={returnForm.returnNotes}
              onChange={(e) => setReturnForm({ ...returnForm, returnNotes: e.target.value })}
              rows={3}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={() => setShowReturnModal(false)}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50">Cancel</button>
            <button onClick={handleReturn}
              disabled={!returnForm.returnedBy}
              className="px-4 py-2 bg-orange-600 text-white rounded-lg text-sm hover:bg-orange-700 disabled:opacity-50">
              Return Asset
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
