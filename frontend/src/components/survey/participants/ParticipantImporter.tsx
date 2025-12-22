import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { participantApi } from '../../../lib/api';
import { Upload, FileText, Check, AlertCircle, X } from 'lucide-react';

interface ParticipantImporterProps {
    onImportSuccess: () => void;
    onClose: () => void;
}

export const ParticipantImporter: React.FC<ParticipantImporterProps> = ({ onImportSuccess, onClose }) => {
    const { id: surveyId } = useParams<{ id: string }>();
    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<{ imported: number; skipped: number; errors: string[] } | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setError(null);
            setResult(null);
        }
    };

    const handleImport = async () => {
        if (!surveyId || !file) return;

        setLoading(true);
        setError(null);

        try {
            const options = {
                hasHeader: true,
                emailColumn: 0,
                firstNameColumn: 1,
                lastNameColumn: 2,
                skipDuplicates: true
            };

            const res = await participantApi.importParticipants(surveyId, file, options);

            setResult(res);
            if (res.imported > 0) {
                onImportSuccess();
            }
        } catch (err: any) {
            setError(err.message || 'Failed to import participants');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
            <div className="bg-white rounded-lg shadow-xl max-w-lg w-full overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                    <h3 className="text-lg font-medium text-gray-900 flex items-center">
                        <Upload className="w-5 h-5 mr-2 text-blue-500" />
                        Import Participants
                    </h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6">
                    {!result ? (
                        <div className="space-y-4">
                            <p className="text-sm text-gray-500">
                                Upload a CSV file with columns: <strong>Email</strong>, <strong>First Name</strong>, <strong>Last Name</strong>.
                            </p>

                            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 flex flex-col items-center justify-center text-center hover:bg-gray-50 transition-colors">
                                <FileText className="w-10 h-10 text-gray-400 mb-2" />
                                <input
                                    type="file"
                                    accept=".csv"
                                    onChange={handleFileChange}
                                    className="hidden"
                                    id="file-upload"
                                />
                                <label htmlFor="file-upload" className="cursor-pointer">
                                    <span className="text-blue-600 font-medium hover:text-blue-500">Click to upload</span>
                                    <span className="text-gray-500"> or drag and drop</span>
                                </label>
                                <p className="text-xs text-gray-400 mt-1">CSV up to 10MB</p>
                                {file && (
                                    <div className="mt-3 flex items-center text-sm text-green-600 bg-green-50 px-3 py-1 rounded-full">
                                        <Check className="w-3 h-3 mr-1" /> {file.name}
                                    </div>
                                )}
                            </div>

                            {error && (
                                <div className="rounded-md bg-red-50 p-4">
                                    <div className="flex">
                                        <div className="flex-shrink-0">
                                            <AlertCircle className="h-5 w-5 text-red-400" />
                                        </div>
                                        <div className="ml-3">
                                            <h3 className="text-sm font-medium text-red-800">Import failed</h3>
                                            <div className="mt-2 text-sm text-red-700">{error}</div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="bg-green-50 p-4 rounded-md">
                                <div className="flex items-center">
                                    <Check className="h-5 w-5 text-green-500 mr-2" />
                                    <p className="text-green-800 font-medium">Import completed!</p>
                                </div>
                                <ul className="mt-2 text-sm text-green-700 list-disc list-inside ml-2">
                                    <li>Imported: {result.imported}</li>
                                    <li>Skipped: {result.skipped}</li>
                                </ul>
                            </div>

                            {result.errors.length > 0 && (
                                <div className="bg-yellow-50 p-4 rounded-md max-h-40 overflow-y-auto">
                                    <p className="text-yellow-800 font-medium mb-1 flex items-center">
                                        <AlertCircle className="w-4 h-4 mr-1" />
                                        Warning details ({result.errors.length})
                                    </p>
                                    <ul className="text-xs text-yellow-700 list-disc list-inside">
                                        {result.errors.map((err, i) => (
                                            <li key={i}>{err}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="bg-gray-50 px-6 py-4 flex justify-end space-x-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-white"
                    >
                        {result ? 'Close' : 'Cancel'}
                    </button>
                    {!result && (
                        <button
                            onClick={handleImport}
                            disabled={!file || loading}
                            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                        >
                            {loading && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>}
                            Import Participants
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};
