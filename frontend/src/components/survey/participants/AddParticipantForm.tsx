import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { participantApi } from '../../../lib/api';
import { UserPlus, X } from 'lucide-react';
import toast from 'react-hot-toast';

interface AddParticipantFormProps {
    onClose: () => void;
    onSuccess: () => void;
}

export const AddParticipantForm: React.FC<AddParticipantFormProps> = ({ onClose, onSuccess }) => {
    const { id: surveyId } = useParams<{ id: string }>();
    const [formData, setFormData] = useState({
        email: '',
        firstName: '',
        lastName: '',
    });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!surveyId) return;

        setLoading(true);
        try {
            await participantApi.addParticipant(surveyId, formData);
            toast.success('Participant added successfully');
            onSuccess();
            onClose();
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Failed to add participant');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 dark:bg-opacity-70">
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl dark:shadow-slate-900/50 max-w-md w-full">
                <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
                    <h3 className="text-lg font-medium text-slate-900 dark:text-white flex items-center">
                        <UserPlus className="w-5 h-5 mr-2 text-blue-600 dark:text-blue-400" />
                        Add Participant
                    </h3>
                    <button onClick={onClose} className="text-slate-400 dark:text-slate-500 hover:text-slate-500 dark:hover:text-slate-300">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                            Email Address <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="email"
                            id="email"
                            required
                            className="w-full rounded-md border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                            placeholder="participant@example.com"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        />
                    </div>

                    <div>
                        <label htmlFor="firstName" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                            First Name
                        </label>
                        <input
                            type="text"
                            id="firstName"
                            className="w-full rounded-md border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                            placeholder="John"
                            value={formData.firstName}
                            onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                        />
                    </div>

                    <div>
                        <label htmlFor="lastName" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                            Last Name
                        </label>
                        <input
                            type="text"
                            id="lastName"
                            className="w-full rounded-md border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                            placeholder="Doe"
                            value={formData.lastName}
                            onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                        />
                    </div>

                    <div className="bg-blue-50 dark:bg-blue-950/50 p-3 rounded-md">
                        <p className="text-xs text-blue-800 dark:text-blue-300">
                            A unique access token will be generated automatically for this participant.
                        </p>
                    </div>

                    <div className="flex justify-end space-x-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-md text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading || !formData.email}
                            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                        >
                            {loading && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>}
                            Add Participant
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
