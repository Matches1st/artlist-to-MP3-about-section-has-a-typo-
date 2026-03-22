/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Download, Link as LinkIcon, Loader2, Music } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function App() {
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<{ audioUrl: string; songName: string } | null>(null);

  const handleDownload = async () => {
    if (!result) return;
    setIsDownloading(true);
    setError('');
    try {
      const response = await fetch(`/api/download?url=${encodeURIComponent(result.audioUrl)}&name=${encodeURIComponent(result.songName)}`);
      if (!response.ok) throw new Error('Failed to download audio file');
      
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = `${result.songName}.aac`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(blobUrl);
    } catch (err: any) {
      setError(err.message || 'Failed to download file');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleExtract = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;

    setIsLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await fetch('/api/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to extract audio');
      }

      setResult(data);
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-4 font-sans text-zinc-100">
      <div className="max-w-xl w-full bg-zinc-900/50 border border-zinc-800/50 rounded-3xl p-8 backdrop-blur-xl shadow-2xl flex flex-col gap-8">
        <div className="text-center space-y-3">
          <div className="w-16 h-16 bg-indigo-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-indigo-500/30">
            <Music className="w-8 h-8 text-indigo-400" />
          </div>
          <h1 className="text-3xl font-medium tracking-tight text-white">Artlist Downloader</h1>
          <p className="text-zinc-400 text-sm">Paste an Artlist track URL to get the audio file</p>
        </div>

        <form onSubmit={handleExtract} className="flex flex-col gap-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <LinkIcon className="h-5 w-5 text-zinc-500" />
            </div>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://artlist.io/sfx/track/..."
              className="block w-full pl-11 pr-4 py-4 bg-zinc-950/50 border border-zinc-800 rounded-2xl text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
              required
            />
          </div>

          <motion.button
            type="submit"
            disabled={isLoading || !url}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 disabled:bg-zinc-800 disabled:text-zinc-500 text-white rounded-2xl font-medium transition-colors flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Extracting...
              </>
            ) : (
              'Get Audio File'
            )}
          </motion.button>
        </form>

        <AnimatePresence mode="wait">
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-sm text-center"
            >
              {error}
            </motion.div>
          )}

          {result && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="p-6 bg-zinc-950/50 border border-zinc-800 rounded-2xl flex flex-col items-center gap-4"
            >
              <div className="text-center">
                <h3 className="text-lg font-medium text-zinc-200">{result.songName}</h3>
                <p className="text-xs text-zinc-500 mt-1">Ready to download</p>
              </div>
              
              <button
                onClick={handleDownload}
                disabled={isDownloading}
                className="flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-800 disabled:text-emerald-300 text-white rounded-xl font-medium transition-colors"
              >
                {isDownloading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Downloading...
                  </>
                ) : (
                  <>
                    <Download className="w-5 h-5" />
                    Download AAC
                  </>
                )}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
