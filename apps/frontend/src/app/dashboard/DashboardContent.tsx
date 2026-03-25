'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { apiFetch, apiUpload } from '@/lib/api';
import SignOutButton from './SignOutButton';

interface ApiStatus {
  label: string;
  endpoint: string;
  status: 'checking' | 'enabled' | 'disabled';
  latency?: number;
}

interface UploadedFile {
  id: string;
  originalName: string;
  size: number;
  mimeType: string;
  uploadedAt: string;
}

const API_LIST: { label: string; endpoint: string }[] = [
  { label: 'Health Check', endpoint: '/health' },
  { label: 'Auth (GET /users/me)', endpoint: '/users/me' },
  { label: 'File Upload (GET /upload)', endpoint: '/upload' },
];

export default function DashboardContent({
  userEmail,
  userId,
  accessToken,
}: {
  userEmail: string;
  userId: string;
  accessToken: string;
}) {
  const [apiStatuses, setApiStatuses] = useState<ApiStatus[]>(
    API_LIST.map((a) => ({ ...a, status: 'checking' })),
  );
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  // Check a single API endpoint
  const checkApi = useCallback(async (index: number, endpoint: string) => {
    const start = performance.now();
    try {
      const res = await apiFetch(endpoint, {}, accessToken);
      const latency = Math.round(performance.now() - start);
      setApiStatuses((prev) => {
        const next = [...prev];
        next[index] = {
          ...next[index],
          status: res.success ? 'enabled' : 'disabled',
          latency,
        };
        return next;
      });
    } catch {
      const latency = Math.round(performance.now() - start);
      setApiStatuses((prev) => {
        const next = [...prev];
        next[index] = { ...next[index], status: 'disabled', latency };
        return next;
      });
    }
  }, [accessToken]);

  // Auto-check all APIs on mount
  const hasMounted = useRef(false);
  useEffect(() => {
    if (hasMounted.current) return;
    hasMounted.current = true;
    API_LIST.forEach((api, i) => checkApi(i, api.endpoint));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const refreshAll = useCallback(() => {
    setApiStatuses(API_LIST.map((a) => ({ ...a, status: 'checking' })));
    API_LIST.forEach((api, i) => checkApi(i, api.endpoint));
  }, [checkApi]);

  // File upload handlers
  const handleFileUpload = useCallback(async (file: File) => {
    setUploading(true);
    setUploadError(null);
    try {
      const res = await apiUpload<UploadedFile>('/upload', file, accessToken);
      if (res.success && res.data) {
        setUploadedFiles((prev) => [res.data!, ...prev]);
      } else {
        setUploadError(res.error || 'Upload failed');
      }
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  }, []);

  const handleDeleteFile = useCallback(async (id: string) => {
    try {
      const res = await apiFetch(`/upload/${id}`, { method: 'DELETE' }, accessToken);
      if (res.success) {
        setUploadedFiles((prev) => prev.filter((f) => f.id !== id));
      }
    } catch {
      // ignore
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFileUpload(file);
    },
    [handleFileUpload],
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFileUpload(file);
      e.target.value = '';
    },
    [handleFileUpload],
  );

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <main className="min-h-screen bg-background font-body text-text">
      {/* Header */}
      <header className="bg-surface border-b border-border">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-heading font-semibold text-text">Dashboard</h1>
            <p className="text-sm text-text-secondary mt-0.5">{userEmail}</p>
          </div>
          <SignOutButton />
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-8 space-y-8">
        {/* API Status Section */}
        <section className="bg-surface rounded-xl border border-border p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-lg font-heading font-semibold">API Status</h2>
              <p className="text-sm text-text-secondary mt-0.5">
                Backend API 연결 상태를 확인합니다
              </p>
            </div>
            <button
              onClick={refreshAll}
              className="px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-dark transition-colors"
            >
              Refresh
            </button>
          </div>

          <div className="space-y-3">
            {apiStatuses.map((api) => (
              <div
                key={api.endpoint}
                className="flex items-center justify-between p-4 rounded-lg border border-border bg-background"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <code className="text-xs text-text-secondary bg-surface px-2 py-1 rounded border border-border shrink-0">
                    GET {api.endpoint}
                  </code>
                  <span className="text-sm font-medium truncate">{api.label}</span>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  {api.latency !== undefined && (
                    <span className="text-xs text-text-secondary">{api.latency}ms</span>
                  )}
                  <StatusBadge status={api.status} />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* File Upload Section */}
        <section className="bg-surface rounded-xl border border-border p-6">
          <div className="mb-5">
            <h2 className="text-lg font-heading font-semibold">File Upload</h2>
            <p className="text-sm text-text-secondary mt-0.5">
              파일 업로드 기능을 테스트합니다 (최대 10MB)
            </p>
          </div>

          {/* Drop Zone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            className={`
              relative border-2 border-dashed rounded-xl p-10 text-center transition-colors cursor-pointer
              ${dragOver ? 'border-primary bg-primary/5' : 'border-border hover:border-text-secondary'}
              ${uploading ? 'pointer-events-none opacity-60' : ''}
            `}
            onClick={() => document.getElementById('file-input')?.click()}
          >
            <input
              id="file-input"
              type="file"
              className="hidden"
              onChange={handleFileInput}
              accept=".jpg,.jpeg,.png,.gif,.webp,.pdf,.txt,.csv,.json,.xlsx,.docx,.zip"
            />
            <div className="text-4xl mb-3">{uploading ? '⏳' : '📁'}</div>
            <p className="font-medium text-sm">
              {uploading ? 'Uploading...' : 'Drop a file here or click to browse'}
            </p>
            <p className="text-xs text-text-secondary mt-1">
              jpg, png, gif, pdf, txt, csv, json, xlsx, docx, zip
            </p>
          </div>

          {uploadError && (
            <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
              {uploadError}
            </div>
          )}

          {uploadedFiles.length > 0 && (
            <div className="mt-5 space-y-2">
              <h3 className="text-sm font-medium text-text-secondary mb-2">
                Uploaded Files ({uploadedFiles.length})
              </h3>
              {uploadedFiles.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center gap-3 p-3 rounded-lg border border-border bg-background"
                >
                  <span className="text-lg">
                    {file.mimeType.startsWith('image/') ? '🖼️' : '📄'}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{file.originalName}</p>
                    <p className="text-xs text-text-secondary">
                      {formatBytes(file.size)} · {new Date(file.uploadedAt).toLocaleTimeString()}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDeleteFile(file.id)}
                    className="text-xs text-red-500 hover:text-red-700 px-2 py-1 rounded hover:bg-red-50 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Session Info */}
        <section className="bg-surface rounded-xl border border-border p-6">
          <h2 className="text-lg font-heading font-semibold mb-3">Session Info</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-text-secondary">Email</span>
              <p className="font-medium mt-0.5">{userEmail}</p>
            </div>
            <div>
              <span className="text-text-secondary">User ID</span>
              <p className="font-mono text-xs mt-0.5 break-all">{userId}</p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function StatusBadge({ status }: { status: ApiStatus['status'] }) {
  if (status === 'checking') {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-500">
        <span className="w-2 h-2 rounded-full bg-gray-400 animate-pulse" />
        Checking
      </span>
    );
  }

  if (status === 'enabled') {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-green-50 text-green-700 border border-green-200">
        <span className="w-2 h-2 rounded-full bg-green-500" />
        Enabled
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200">
      <span className="w-2 h-2 rounded-full bg-red-500" />
      Disabled
    </span>
  );
}
