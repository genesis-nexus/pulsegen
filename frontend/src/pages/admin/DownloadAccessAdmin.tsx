import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface AccessRequest {
  id: string;
  email: string;
  githubUsername: string;
  fullName?: string;
  youtubeSubscribed: boolean;
  instagramFollowed: boolean;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'INVITED';
  statusNote?: string;
  referralSource?: string;
  createdAt: string;
  reviewedAt?: string;
  githubInviteSent: boolean;
  githubInvitedAt?: string;
}

interface Stats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  invited: number;
}

const DownloadAccessAdmin: React.FC = () => {
  const [requests, setRequests] = useState<AccessRequest[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [selectedRequest, setSelectedRequest] = useState<AccessRequest | null>(null);
  const [actionNote, setActionNote] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchData();
  }, [filter]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [requestsRes, statsRes] = await Promise.all([
        axios.get('/api/download-access/requests', {
          params: filter !== 'all' ? { status: filter.toUpperCase() } : {}
        }),
        axios.get('/api/download-access/stats')
      ]);

      setRequests(requestsRes.data.requests);
      setStats(statsRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    setProcessing(true);
    try {
      await axios.post(`/api/download-access/requests/${id}/approve`, {
        note: actionNote
      });
      setActionNote('');
      setSelectedRequest(null);
      fetchData();
    } catch (error) {
      console.error('Error approving request:', error);
      alert('Failed to approve request');
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async (id: string) => {
    setProcessing(true);
    try {
      await axios.post(`/api/download-access/requests/${id}/reject`, {
        note: actionNote
      });
      setActionNote('');
      setSelectedRequest(null);
      fetchData();
    } catch (error) {
      console.error('Error rejecting request:', error);
      alert('Failed to reject request');
    } finally {
      setProcessing(false);
    }
  };

  const handleSendInvite = async (id: string) => {
    setProcessing(true);
    try {
      await axios.post(`/api/download-access/requests/${id}/invite`);
      fetchData();
    } catch (error) {
      console.error('Error sending invite:', error);
      alert('Failed to send GitHub invitation');
    } finally {
      setProcessing(false);
    }
  };

  const getStatusBadgeClass = (status: string) => {
    const classes = {
      PENDING: 'bg-yellow-100 text-yellow-800',
      APPROVED: 'bg-green-100 text-green-800',
      REJECTED: 'bg-red-100 text-red-800',
      INVITED: 'bg-blue-100 text-blue-800'
    };
    return classes[status as keyof typeof classes] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Download Access Requests
          </h1>
          <p className="text-gray-600">
            Manage download access requests for PulseGen
          </p>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-sm text-gray-600 mb-1">Total</div>
              <div className="text-3xl font-bold text-gray-900">{stats.total}</div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-sm text-gray-600 mb-1">Pending</div>
              <div className="text-3xl font-bold text-yellow-600">{stats.pending}</div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-sm text-gray-600 mb-1">Approved</div>
              <div className="text-3xl font-bold text-green-600">{stats.approved}</div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-sm text-gray-600 mb-1">Invited</div>
              <div className="text-3xl font-bold text-blue-600">{stats.invited}</div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-sm text-gray-600 mb-1">Rejected</div>
              <div className="text-3xl font-bold text-red-600">{stats.rejected}</div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex gap-2">
            {['all', 'pending', 'approved', 'invited', 'rejected'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filter === f
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Requests Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-gray-500">Loading...</div>
          ) : requests.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No requests found</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      GitHub
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Verification
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {requests.map((request) => (
                    <tr key={request.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {request.fullName || 'N/A'}
                        </div>
                        <div className="text-sm text-gray-500">{request.email}</div>
                        {request.referralSource && (
                          <div className="text-xs text-gray-400">via {request.referralSource}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <a
                          href={`https://github.com/${request.githubUsername}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:text-blue-800"
                        >
                          @{request.githubUsername}
                        </a>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          {request.youtubeSubscribed && (
                            <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-red-100 text-red-800">
                              YouTube ✓
                            </span>
                          )}
                          {request.instagramFollowed && (
                            <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-pink-100 text-pink-800">
                              Instagram ✓
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(request.status)}`}>
                          {request.status}
                        </span>
                        {request.githubInviteSent && (
                          <div className="text-xs text-gray-500 mt-1">Invite sent</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(request.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex gap-2">
                          {request.status === 'PENDING' && (
                            <>
                              <button
                                onClick={() => setSelectedRequest(request)}
                                className="text-green-600 hover:text-green-900"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedRequest(request);
                                  setActionNote('');
                                }}
                                className="text-red-600 hover:text-red-900"
                              >
                                Reject
                              </button>
                            </>
                          )}
                          {request.status === 'APPROVED' && !request.githubInviteSent && (
                            <button
                              onClick={() => handleSendInvite(request.id)}
                              disabled={processing}
                              className="text-blue-600 hover:text-blue-900 disabled:opacity-50"
                            >
                              Send Invite
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Action Modal */}
        {selectedRequest && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">
                {actionNote === 'reject' ? 'Reject' : 'Approve'} Request
              </h3>

              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">
                  <strong>Email:</strong> {selectedRequest.email}
                </p>
                <p className="text-sm text-gray-600 mb-2">
                  <strong>GitHub:</strong> @{selectedRequest.githubUsername}
                </p>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Note (Optional)
                </label>
                <textarea
                  value={actionNote}
                  onChange={(e) => setActionNote(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Add a note about this decision..."
                />
              </div>

              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => {
                    setSelectedRequest(null);
                    setActionNote('');
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleReject(selectedRequest.id)}
                  className="px-4 py-2 text-white bg-red-600 rounded-lg hover:bg-red-700"
                  disabled={processing}
                >
                  Reject
                </button>
                <button
                  onClick={() => handleApprove(selectedRequest.id)}
                  className="px-4 py-2 text-white bg-green-600 rounded-lg hover:bg-green-700"
                  disabled={processing}
                >
                  Approve
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DownloadAccessAdmin;
