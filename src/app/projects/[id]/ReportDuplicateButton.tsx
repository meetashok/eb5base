'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase';
import { useAuthPrompt } from '@/components/AuthPromptProvider';
import type { Project } from '@/lib/types';
import { PROJECT_SELECT } from '@/lib/types';
import { projectBrandName } from '@/lib/types';

interface ReportDuplicateButtonProps {
  projectId: string;
  userId: string | null;
  className?: string;
}

export default function ReportDuplicateButton({
  projectId,
  userId,
  className = 'text-meta text-neutral/50 hover:text-secondary transition-all duration-150',
}: ReportDuplicateButtonProps) {
  const { promptSignIn } = useAuthPrompt();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Project[]>([]);
  const [selected, setSelected] = useState<Project[]>([]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!query.trim() || query.trim().length < 2) {
      setResults([]);
      return;
    }
    const t = setTimeout(async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from('projects')
        .select(PROJECT_SELECT)
        .is('merged_into', null)
        .neq('id', projectId)
        .ilike('name', `%${query.trim()}%`)
        .limit(8);
      setResults((data as Project[]) || []);
    }, 250);
    return () => clearTimeout(t);
  }, [query, projectId]);

  function toggleSelect(p: Project) {
    setSelected((prev) =>
      prev.some((x) => x.id === p.id) ? prev.filter((x) => x.id !== p.id) : [...prev, p]
    );
  }

  async function submit() {
    if (!userId) {
      promptSignIn(`/projects/${projectId}`);
      return;
    }
    if (selected.length === 0) return;
    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase.from('duplicate_report_groups').insert({
      entity_type: 'project',
      reported_entity_id: projectId,
      duplicate_entity_ids: selected.map((p) => p.id),
      reported_by: userId,
      status: 'pending',
    });
    setSaving(false);
    if (error) {
      setMessage(error.message);
      return;
    }
    setMessage('Duplicate report submitted. Thank you.');
    setOpen(false);
    setSelected([]);
    setQuery('');
  }

  return (
    <>
      <button
        type="button"
        className={className}
        onClick={() => {
          if (!userId) {
            promptSignIn(`/projects/${projectId}`);
            return;
          }
          setOpen(true);
        }}
      >
        Report duplicate
      </button>
      {message && <p className="text-meta text-success">{message}</p>}

      {open && (
        <dialog className="modal modal-open">
          <div className="modal-box max-w-lg">
            <h3 className="font-bold text-lg text-primary">Report duplicate</h3>
            <p className="text-sm text-neutral/70 py-2">
              Search and select one or more projects this listing duplicates.
            </p>
            <input
              type="search"
              className="input input-bordered w-full"
              placeholder="Search projects…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <ul className="mt-3 max-h-48 overflow-auto space-y-1">
              {results.map((r) => {
                const isSelected = selected.some((x) => x.id === r.id);
                return (
                  <li key={r.id}>
                    <button
                      type="button"
                      className={`w-full text-left px-3 py-2 rounded-lg transition-all duration-150 ${
                        isSelected ? 'bg-primary text-primary-content' : 'hover:bg-base-200'
                      }`}
                      onClick={() => toggleSelect(r)}
                    >
                      <span className="font-medium">{r.name}</span>
                      <span className="block text-meta opacity-70">
                        {[projectBrandName(r), r.location_state].filter(Boolean).join(' · ')}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
            {selected.length > 0 && (
              <p className="text-meta text-neutral/60 mt-2">
                {selected.length} project{selected.length === 1 ? '' : 's'} selected
              </p>
            )}
            <div className="modal-action">
              <button type="button" className="btn btn-ghost" onClick={() => setOpen(false)}>
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary"
                disabled={selected.length === 0 || saving}
                onClick={submit}
              >
                {saving ? 'Submitting…' : 'Submit report'}
              </button>
            </div>
          </div>
          <form method="dialog" className="modal-backdrop">
            <button type="button" onClick={() => setOpen(false)}>
              close
            </button>
          </form>
        </dialog>
      )}
    </>
  );
}
