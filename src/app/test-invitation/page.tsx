'use client';

import { useState } from 'react';

export default function TestInvitationPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const createTestInvitation = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/create-test-invitation', {
        method: 'POST',
      });
      
      const data = await response.json();
      
      if (data.error) {
        setError(data.error);
      } else {
        setResult(data);
      }
    } catch (err) {
      setError('Failed to create test invitation');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const testDatabaseConnection = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/test-invitation');
      const data = await response.json();
      
      if (data.error) {
        setError(data.error);
      } else {
        setResult(data);
      }
    } catch (err) {
      setError('Failed to test database connection');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Test Invitation System</h1>
        
        <div className="space-y-6">
          {/* Database Connection Test */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">1. Test Database Connection</h2>
            <button
              onClick={testDatabaseConnection}
              disabled={loading}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Testing...' : 'Test Database Connection'}
            </button>
          </div>

          {/* Create Test Invitation */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">2. Create Test Invitation</h2>
            <button
              onClick={createTestInvitation}
              disabled={loading}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Test Invitation'}
            </button>
          </div>

          {/* Results */}
          {error && (
            <div className="bg-red-50 border border-red-200 p-4 rounded">
              <h3 className="text-red-800 font-semibold">Error:</h3>
              <p className="text-red-600">{error}</p>
            </div>
          )}

          {result && (
            <div className="bg-green-50 border border-green-200 p-4 rounded">
              <h3 className="text-green-800 font-semibold">Success!</h3>
              <pre className="text-sm text-green-700 mt-2 overflow-auto">
                {JSON.stringify(result, null, 2)}
              </pre>
              
              {result.testUrl && (
                <div className="mt-4">
                  <a
                    href={result.testUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 inline-block"
                  >
                    Test Invitation Page
                  </a>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
