import React, { useState } from 'react';
import { 
  Search, 
  Pin, 
  Trash2, 
  BookOpen, 
  Sparkles, 
  Tag, 
  Smile, 
  Calendar,
  X,
  Plus,
  GitFork,
  Hourglass,
  Lock
} from 'lucide-react';
import { JournalEntry, JournalCategory } from '../types';
import { formatDate } from '../lib/utils';

interface SidebarHistoryProps {
  entries: JournalEntry[];
  selectedEntryId: string | null;
  onSelectEntry: (entry: JournalEntry) => void;
  onNewEntry: () => void;
  onDeleteEntry: (entryId: string) => void;
  onTogglePin: (entryId: string, currentPin: boolean) => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
}

const CATEGORIES: (JournalCategory | 'All')[] = [
  'All',
  'Reflection',
  'Brainstorming',
  'Action Plan',
  'Gratitude',
  'Personal Growth',
  'Problem Solving',
  'Decision Making',
  'Time Capsule',
];

export const SidebarHistory: React.FC<SidebarHistoryProps> = ({
  entries,
  selectedEntryId,
  onSelectEntry,
  onNewEntry,
  onDeleteEntry,
  onTogglePin,
  isOpenMobile,
  onCloseMobile,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<JournalCategory | 'All'>('All');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Filter entries
  const filteredEntries = entries.filter((entry) => {
    const matchesCategory = selectedCategory === 'All' || entry.category === selectedCategory;
    const q = searchQuery.toLowerCase().trim();
    if (!q) return matchesCategory;

    const matchesTitle = entry.title?.toLowerCase().includes(q);
    const matchesSummary = entry.summary?.toLowerCase().includes(q);
    const matchesMood = entry.mood?.toLowerCase().includes(q);
    const matchesTags = entry.tags?.some((t) => t.toLowerCase().includes(q));
    const matchesMessages = entry.messages?.some((m) => m.content.toLowerCase().includes(q));

    return matchesCategory && (matchesTitle || matchesSummary || matchesMood || matchesTags || matchesMessages);
  });

  // Sort pinned entries to top
  const sortedEntries = [...filteredEntries].sort((a, b) => {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    return (b.updatedAt || 0) - (a.updatedAt || 0);
  });

  const sidebarContent = (
    <div className="flex flex-col h-full bg-[#FAF7F2] border-r border-[#EAE4DC] w-full sm:w-80 lg:w-88 flex-shrink-0">
      {/* Sidebar Header */}
      <div className="p-4 border-b border-[#EAE4DC] bg-[#FAF7F2]">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <BookOpen className="w-5 h-5 text-[#8C5E3C]" />
            <h2 className="font-serif font-bold text-[#1A2826] text-lg">Past Reflections</h2>
            <span className="px-2 py-0.5 text-xs font-sans font-semibold rounded-full bg-[#EAE2D5] text-[#4A3B32] border border-[#DCD3C4]">
              {entries.length}
            </span>
          </div>

          <div className="flex items-center space-x-1">
            <button
              onClick={onNewEntry}
              className="p-1.5 text-[#2D4A43] bg-[#E8EFEA] hover:bg-[#D8E6DB] rounded-lg transition-colors border border-[#D0DFD4]"
              title="Create New Reflection"
            >
              <Plus className="w-4 h-4" />
            </button>
            <button
              onClick={onCloseMobile}
              className="sm:hidden p-1.5 text-[#737C78] hover:text-[#1A2826] rounded-lg"
              title="Close Drawer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Search input */}
        <div className="relative">
          <Search className="w-4 h-4 text-[#8C827A] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            id="history-search-input"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search entries, keywords, tags..."
            className="w-full pl-9 pr-8 py-2 text-xs bg-[#FFFFFF] border border-[#DCD3C4] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2D4A43]/20 focus:border-[#2D4A43] transition-colors placeholder:text-[#9E958C]"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#8C827A] hover:text-[#1A2826]"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Category horizontal scroll bar */}
        <div className="flex items-center space-x-1 mt-3 overflow-x-auto pb-1 scrollbar-none">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-2.5 py-1 rounded-md text-[11px] font-sans font-medium whitespace-nowrap transition-colors border ${
                selectedCategory === cat
                  ? 'bg-[#2D4A43] text-[#FAF7F2] border-[#2D4A43]'
                  : 'bg-[#F0EBE1] text-[#5A5046] hover:bg-[#E5DDCF] border-[#E2D8C7]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Entries List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
        {sortedEntries.length === 0 ? (
          <div className="text-center py-12 px-4">
            <div className="w-12 h-12 rounded-2xl bg-[#F0EBE1] border border-[#E2D8C7] flex items-center justify-center mx-auto text-[#8C827A] mb-3">
              <Sparkles className="w-5 h-5 text-[#C06014]" />
            </div>
            <p className="text-sm font-serif font-bold text-[#1A2826]">No reflections found</p>
            <p className="text-xs text-[#737C78] mt-1">
              {searchQuery || selectedCategory !== 'All'
                ? 'Try adjusting your search filters.'
                : 'Start your very first multi-turn reflection!'}
            </p>
            {(!searchQuery && selectedCategory === 'All') && (
              <button
                onClick={onNewEntry}
                className="mt-4 px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-[#2D4A43] text-[#FAF7F2] hover:bg-[#233A34] transition-colors shadow-sm"
              >
                Write First Reflection
              </button>
            )}
          </div>
        ) : (
          sortedEntries.map((entry) => {
            const isSelected = entry.id === selectedEntryId;
            const messageCount = entry.messages?.length || 0;
            const latestMessage = entry.messages?.[entry.messages.length - 1];

            return (
              <div
                key={entry.id}
                id={`history-item-${entry.id}`}
                onClick={() => {
                  onSelectEntry(entry);
                  onCloseMobile();
                }}
                className={`group relative p-3.5 rounded-xl border text-left cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-[#FFFFFF] border-[#8C5E3C] ring-2 ring-[#8C5E3C]/20 shadow-xs'
                    : 'bg-[#FFFFFF] border-[#E8E2D8] hover:border-[#D5C9B8] hover:bg-[#FDFCFB]'
                }`}
              >
                {/* Top Row: Title + Pin/Delete */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center space-x-1.5 min-w-0">
                    {entry.pinned && (
                      <Pin className="w-3.5 h-3.5 text-[#C06014] fill-[#C06014] flex-shrink-0" />
                    )}
                    <h3 className="text-sm font-serif font-bold text-[#1A2826] truncate leading-snug">
                      {entry.title || 'Untitled Reflection'}
                    </h3>
                  </div>

                  {/* Actions on hover/selected */}
                  <div className="flex items-center space-x-1 opacity-80 group-hover:opacity-100 transition-opacity">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onTogglePin(entry.id, !entry.pinned);
                      }}
                      title={entry.pinned ? 'Unpin' : 'Pin to top'}
                      className={`p-1 rounded hover:bg-[#EAE2D5] transition-colors ${
                        entry.pinned ? 'text-[#C06014]' : 'text-[#8C827A] hover:text-[#1A2826]'
                      }`}
                    >
                      <Pin className={`w-3.5 h-3.5 ${entry.pinned ? 'fill-current' : ''}`} />
                    </button>

                    {deleteConfirmId === entry.id ? (
                      <div className="flex items-center space-x-1 bg-[#FDF2F0] border border-[#F3C4BE] rounded p-0.5">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteEntry(entry.id);
                            setDeleteConfirmId(null);
                          }}
                          className="text-[10px] font-bold text-[#9C4124] px-1 hover:underline"
                        >
                          Confirm
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteConfirmId(null);
                          }}
                          className="text-[#8C827A] hover:text-[#1A2826] px-0.5"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteConfirmId(entry.id);
                        }}
                        title="Delete reflection"
                        className="p-1 rounded text-[#8C827A] hover:text-[#9C4124] hover:bg-[#FDF2F0] transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Summary or Snippet */}
                <p className="text-xs font-sans text-[#5A6360] mt-1.5 line-clamp-2 leading-relaxed">
                  {entry.summary || latestMessage?.content || 'No reflections yet.'}
                </p>

                {/* Badges & Meta */}
                <div className="mt-2.5 pt-2 border-t border-[#F0EBE1] flex flex-wrap items-center justify-between gap-1 text-[10px] text-[#737C78]">
                  <div className="flex items-center space-x-1.5 flex-wrap">
                    <span className="px-1.5 py-0.5 rounded bg-[#F0EBE1] text-[#4A3B32] font-medium border border-[#E2D8C7]">
                      {entry.category || 'Reflection'}
                    </span>
                    {entry.decisionAnalysis && (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-[#E8EFEA] text-[#2D4A43] border border-[#D0DFD4]" title="Decision Analysis included">
                        <GitFork className="w-2.5 h-2.5 mr-0.5" />
                        Decision
                      </span>
                    )}
                    {entry.timeCapsule && (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-[#EAE2D5] text-[#8C5E3C] border border-[#DCD3C4]" title="Time Capsule configured">
                        <Lock className="w-2.5 h-2.5 mr-0.5" />
                        Capsule
                      </span>
                    )}
                    {entry.mood && (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-[#EAE2D5] text-[#8C5E3C] border border-[#DCD3C4]">
                        <Smile className="w-2.5 h-2.5 mr-1" />
                        {entry.mood}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center space-x-2 text-[#8C827A]">
                    <span>{messageCount} {messageCount === 1 ? 'msg' : 'msgs'}</span>
                    <span>&bull;</span>
                    <span>{formatDate(entry.updatedAt || entry.createdAt)}</span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden sm:flex h-full">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Overlay */}
      {isOpenMobile && (
        <div className="sm:hidden fixed inset-0 z-50 flex">
          <div 
            className="fixed inset-0 bg-zinc-900/50 backdrop-blur-xs transition-opacity" 
            onClick={onCloseMobile} 
          />
          <div className="relative z-10 w-4/5 max-w-xs h-full shadow-2xl">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
