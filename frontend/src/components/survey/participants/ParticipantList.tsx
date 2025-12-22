import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { participantApi } from '../../../lib/api';
import { Participant, ParticipantStatus } from '../../../types';
import {
    Users, Search, UserPlus, Upload, Mail, MoreHorizontal,
    CheckCircle, XCircle, Clock, Send, AlertTriangle
} from 'lucide-react';

interface ParticipantListProps {
    onRefreshStats: () => void;
    onImport?: () => void;
    onAdd?: () => void;
    onInvite?: (ids: string[]) => void;
}

export const ParticipantList: React.FC<ParticipantListProps> = ({ onImport, onAdd, onInvite }) => {
    const { id: surveyId } = useParams<{ id: string }>();
    const [participants, setParticipants] = useState<Participant[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [activeTab, setActiveTab] = useState<'all' | ParticipantStatus>('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedIds, setSelectedIds] = useState<string[]>([]);

    useEffect(() => {
        fetchParticipants();
    }, [surveyId, page, activeTab, searchTerm]);

    const fetchParticipants = async () => {
        if (!surveyId) return;
        setLoading(true);
        try {
            const params: any = { page, limit: 10 };
            if (activeTab !== 'all') params.status = activeTab;
            if (searchTerm) params.search = searchTerm;

            const data = await participantApi.getParticipants(surveyId, params);
            setParticipants(data.participants);
            setTotalPages(data.pagination.pages);
        } catch (error) {
            console.error('Failed to fetch participants', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
            setSelectedIds(participants.map(p => p.id));
        } else {
            setSelectedIds([]);
        }
    };

    const handleSelectOne = (id: string) => {
        if (selectedIds.includes(id)) {
            setSelectedIds(selectedIds.filter(pid => pid !== id));
        } else {
            setSelectedIds([...selectedIds, id]);
        }
    };

    const getStatusBadge = (status: ParticipantStatus) => {
        switch (status) {
            case ParticipantStatus.COMPLETED:
                return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" /> Completed</span>;
            case ParticipantStatus.INVITED:
                return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"><Send className="w-3 h-3 mr-1" /> Invited</span>;
            case ParticipantStatus.STARTED:
                return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800"><Clock className="w-3 h-3 mr-1" /> In Progress</span>;
            case ParticipantStatus.BOUNCED:
                return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800"><AlertTriangle className="w-3 h-3 mr-1" /> Bounced</span>;
            case ParticipantStatus.OPTED_OUT:
                return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800"><XCircle className="w-3 h-3 mr-1" /> Opted Out</span>;
            default:
                return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">Pending</span>;
        }
    };

    return (
        <div className="bg-white shadow rounded-lg">
            {/* Header & Controls */}
            <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">Participants</h3>
                    <div className="flex space-x-2">
                        <button
                            onClick={onImport}
                            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
                        >
                            <Upload className="w-4 h-4 mr-2" />
                            Import CSV
                        </button>
                        <button
                            onClick={onAdd}
                            className="inline-flex items-center px-3 py-2 border border-transparent shadow-sm text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none"
                        >
                            <UserPlus className="w-4 h-4 mr-2" />
                            Add Participant
                        </button>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
                    {/* Tabs */}
                    <div className="hidden sm:block">
                        <nav className="flex space-x-4" aria-label="Tabs">
                            {['all', 'PENDING', 'INVITED', 'COMPLETED'].map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab as any)}
                                    className={`${activeTab === tab
                                        ? 'bg-blue-100 text-blue-700'
                                        : 'text-gray-500 hover:text-gray-700'
                                        } px-3 py-2 font-medium text-sm rounded-md capitalize`}
                                >
                                    {tab.toLowerCase()}
                                </button>
                            ))}
                        </nav>
                    </div>

                    {/* Search */}
                    <div className="relative rounded-md shadow-sm max-w-xs w-full">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search className="h-4 w-4 text-gray-400" />
                        </div>
                        <input
                            type="text"
                            className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md py-2"
                            placeholder="Search email or name"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {/* Bulk Actions Bar */}
            {selectedIds.length > 0 && (
                <div className="bg-blue-50 px-4 py-3 border-b border-blue-200 flex items-center justify-between">
                    <span className="text-sm text-blue-800 font-medium">
                        {selectedIds.length} participant{selectedIds.length > 1 ? 's' : ''} selected
                    </span>
                    <div className="flex space-x-2">
                        <button
                            onClick={() => onInvite && onInvite(selectedIds)}
                            className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-blue-700 bg-blue-100 hover:bg-blue-200"
                        >
                            <Mail className="w-3 h-3 mr-1.5" />
                            Send Invitation
                        </button>
                        <button className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-red-700 bg-red-100 hover:bg-red-200">
                            Delete
                        </button>
                    </div>
                </div>
            )}

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-10">
                                <input
                                    type="checkbox"
                                    className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                                    checked={participants.length > 0 && selectedIds.length === participants.length}
                                    onChange={handleSelectAll}
                                />
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Name / Email
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Status
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Invited
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {loading ? (
                            [...Array(5)].map((_, i) => (
                                <tr key={i} className="animate-pulse">
                                    <td colSpan={5} className="px-6 py-4">
                                        <div className="h-4 bg-gray-200 rounded w-full"></div>
                                    </td>
                                </tr>
                            ))
                        ) : participants.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-6 py-10 text-center text-gray-500">
                                    <Users className="mx-auto h-12 w-12 text-gray-400 mb-2" />
                                    <p>No participants found.</p>
                                </td>
                            </tr>
                        ) : (
                            participants.map((participant) => (
                                <tr key={participant.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <input
                                            type="checkbox"
                                            className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                                            checked={selectedIds.includes(participant.id)}
                                            onChange={() => handleSelectOne(participant.id)}
                                        />
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div className="flex-shrink-0 h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 font-bold uppercase">
                                                {(participant.firstName?.[0] || participant.email[0]).toUpperCase()}
                                            </div>
                                            <div className="ml-4">
                                                <div className="text-sm font-medium text-gray-900">
                                                    {participant.firstName} {participant.lastName}
                                                </div>
                                                <div className="text-sm text-gray-500">{participant.email}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {getStatusBadge(participant.status)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {participant.invitedAt ? new Date(participant.invitedAt).toLocaleDateString() : '-'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <button className="text-gray-400 hover:text-gray-600">
                                            <MoreHorizontal className="w-5 h-5" />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                    <div className="flex-1 flex justify-between sm:justify-end">
                        <button
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1}
                            className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                        >
                            Previous
                        </button>
                        <button
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            disabled={page === totalPages}
                            className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                        >
                            Next
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
