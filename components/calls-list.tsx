"use client";

import { Eye, Filter, RefreshCcw,Search, X } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback,useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useRecordsStore } from "@/lib/stores/calls-store";
import { UUID } from "@/lib/types/auth";

interface RecordingsListProps {
  organisationUuid: UUID;
  agentUuid?: UUID;
  pageSize?: number;
  showTitle?: boolean;
  title?: string;
  description?: string;
  enableQuickView?: boolean;
  onQuickView?: (recordId: string, agentUuid: string) => void;
  refreshKey?: number; // external trigger to refetch
}

// Filter options for customer data fields
const FILTER_OPTIONS = [
  { value: 'first_name', label: 'First name' },
  { value: 'last_name', label: 'Last name' },
  { value: 'phone_number', label: 'Phone number' },
  { value: 'email', label: 'Email' },
  { value: 'business_name', label: 'Business name' },
  { value: 'domain_url', label: 'Business Domain' },
  { value: 'external_id', label: 'External ID' },
];

// Waveform visualization component with proper HTML5 Audio streaming
const WaveformVisualization = ({ sentiment, audioUrl }: { sentiment: string; audioUrl?: string }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);
  
  // Create audio object only when needed (lazy loading)
  const createAudio = useCallback(() => {
    if (!audioUrl || audio) return audio;
    
    try {
      const newAudio = new Audio(audioUrl);

    const handleLoadStart = () => {
      setIsLoading(true);
      setHasError(false);
    };

    const handleCanPlay = () => {
      setIsLoading(false);
      setHasError(false);
    };

    const handleEnded = () => {
      setIsPlaying(false);
    };

    const handleError = () => {
        console.error('Audio playback error:', newAudio.error);
      setIsLoading(false);
      setHasError(true);
      setIsPlaying(false);
    };

      // Add event listeners
      newAudio.addEventListener('loadstart', handleLoadStart);
      newAudio.addEventListener('canplay', handleCanPlay);
      newAudio.addEventListener('ended', handleEnded);
      newAudio.addEventListener('error', handleError);

      setAudio(newAudio);
      return newAudio;
    } catch (error) {
      console.error('Failed to create audio element:', error);
      setHasError(true);
      return null;
    }
  }, [audioUrl, audio]);

  // Cleanup effect
  useEffect(() => {
    return () => {
      if (audio) {
      audio.pause();
        audio.src = '';
        setAudio(null);
      }
    };
  }, [audio]);

  const getColor = () => {
    if (hasError) return '#6B7280'; // Gray for error
    switch (sentiment) {
      case 'positive': return '#28F16B';
      case 'negative': return '#F52E60';
      default: return '#1AADF0';
    }
  };

  const handlePlayPause = async () => {
    if (hasError) return;

    try {
      const audioElement = audio || createAudio();
      if (!audioElement) return;

      if (isPlaying) {
        audioElement.pause();
        setIsPlaying(false);
      } else {
        // HTML5 Audio will automatically start progressive download/streaming
        await audioElement.play();
        setIsPlaying(true);
      }
    } catch (error) {
      console.error('Failed to play audio:', error);
      setHasError(true);
      setIsPlaying(false);
    }
  };

  // Generate dynamic waveform bars
  const bars = Array.from({ length: 20 }, (_, i) => {
    const height = Math.random() * 20 + 5; // Random height between 5-25px
    const opacity = isPlaying ? (Math.random() * 0.5 + 0.5) : 0.7; // Animate when playing
    
    return (
      <div
        key={i}
        style={{
          width: '2px',
          height: `${height}px`,
          backgroundColor: getColor(),
          margin: '0 1px',
          opacity: opacity,
          transition: 'opacity 0.3s ease'
        }}
      />
    );
  });

  if (!audioUrl) {
    return (
      <div className="flex items-center gap-2 h-6 text-gray-400">
        <div className="w-5 h-5 rounded-full bg-gray-300 flex items-center justify-center">
          <span className="text-xs">×</span>
        </div>
        <span className="text-xs">No audio</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 h-6">
      <button
        onClick={handlePlayPause}
        disabled={isLoading || hasError}
        className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-white text-xs hover:scale-110 transition-transform duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        style={{ backgroundColor: getColor() }}
        title={hasError ? 'Audio unavailable' : isLoading ? 'Loading...' : isPlaying ? 'Pause' : 'Play'}
      >
        {isLoading ? (
          <div className="w-2 h-2 border border-white border-t-transparent rounded-full animate-spin" />
        ) : hasError ? (
          '×'
        ) : isPlaying ? (
          '⏸'
        ) : (
          '▶'
        )}
      </button>
      <div className="flex items-center justify-center">
        {bars}
      </div>
    </div>
  );
};

export function RecordingsList({ 
  organisationUuid,
  agentUuid,
  pageSize = 10,
  showTitle = true,
  title = "Call Recordings",
  description = "Browse through all calls",
  enableQuickView = false,
  onQuickView,
  refreshKey
}: RecordingsListProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const { 
    records, 
    totalRecords,
    currentPage,
    pageSize: storePageSize,
    isLoading, 
    error, 
    getRecords, 
    setPage,
    getAgentRecords,
    filterField,
    filterValue,
    setFilter,
    clearFilter
  } = useRecordsStore();

  // Local filter state for UI
  const [selectedFilter, setSelectedFilter] = useState<string>('');
  const [inputValue, setInputValue] = useState('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Initialize filter state from URL
  useEffect(() => {
    const urlFilter = searchParams.get('filter') || '';
    const urlFilterValue = searchParams.get('filter_value') || '';
    
    setSelectedFilter(urlFilter);
    setInputValue(urlFilterValue);
    setFilter(urlFilter, urlFilterValue);
  }, [searchParams, setFilter]);

  // Update URL when filters change
  const updateURL = (filter: string, value: string, page: number = 1) => {
    const params = new URLSearchParams();
    if (filter && value) {
      params.set('filter', filter);
      params.set('filter_value', value);
    }
    if (page > 1) {
      params.set('page', page.toString());
    }
    
    const newUrl = `${window.location.pathname}${params.toString() ? '?' + params.toString() : ''}`;
    router.replace(newUrl, { scroll: false });
  };

  // Fetch records with current filters
  const fetchRecords = useCallback((page?: number) => {
    const filters = filterField && filterValue ? { filter: filterField, filter_value: filterValue } : undefined;
    
    if (agentUuid) {
      getAgentRecords(organisationUuid, agentUuid, page || currentPage, pageSize, filters);
    } else {
      getRecords(organisationUuid, page || currentPage, pageSize, filters);
    }
  }, [agentUuid, getAgentRecords, getRecords, organisationUuid, currentPage, pageSize, filterField, filterValue]);

  // Fetch data when dependencies change
  useEffect(() => {
    fetchRecords();
  }, [fetchRecords, refreshKey]);

  // Handle filter application
  const handleApplyFilter = () => {
    if (!selectedFilter || !inputValue.trim()) return;
    
    setFilter(selectedFilter, inputValue.trim());
    setPage(1); // Reset to first page
    updateURL(selectedFilter, inputValue.trim(), 1);
  };

  // Handle filter clearing
  const handleClearFilter = () => {
    setSelectedFilter('');
    setInputValue('');
    clearFilter();
    updateURL('', '', 1);
  };

  // Handle Enter key in search input
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleApplyFilter();
    }
  };

  // Manual refresh without full page reload
  const handleRefresh = () => {
    fetchRecords();
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getSentimentBadge = (sentiment: string) => {
    // Normalize sentiment to lowercase for better matching
    const normalizedSentiment = sentiment?.toLowerCase().trim();
    
    const config = {
      positive: { 
        label: 'Positive', 
        className: 'bg-[#27F06A] text-white hover:bg-[#27F06A]',
        style: { backgroundColor: '#27F06A', color: 'white' }
      },
      negative: { 
        label: 'Negative', 
        className: 'bg-[#F42D5F] text-white hover:bg-[#F42D5F]',
        style: { backgroundColor: '#F42D5F', color: 'white' }
      },
      neutral: { 
        label: 'Neutral', 
        className: 'bg-[#19ACEF] text-white hover:bg-[#19ACEF]',
        style: { backgroundColor: '#19ACEF', color: 'white' }
      }
    };
    
    // More robust sentiment matching
    let sentimentConfig;
    if (normalizedSentiment === 'positive' || normalizedSentiment === 'pos') {
      sentimentConfig = config.positive;
    } else if (normalizedSentiment === 'negative' || normalizedSentiment === 'neg') {
      sentimentConfig = config.negative;
    } else if (normalizedSentiment === 'neutral' || normalizedSentiment === 'neu') {
      sentimentConfig = config.neutral;
    } else {
      // Default to neutral if sentiment is unrecognized
      sentimentConfig = config.neutral;
    }
    
    return (
      <Badge 
        className={sentimentConfig.className}
        style={sentimentConfig.style}
      >
        {sentimentConfig.label}
      </Badge>
    );
  };

  const handlePageChange = async (newPage: number) => {
    if (newPage !== currentPage) {
      setPage(newPage);
      updateURL(filterField, filterValue, newPage);
    }
  };

  const totalPages = Math.ceil(totalRecords / pageSize);
  const hasRecords = totalRecords > 0;
  const hasActiveFilter = filterField && filterValue;

  // Open the filter panel automatically when a filter is active
  useEffect(() => {
    if (hasActiveFilter) {
      setIsFilterOpen(true);
    }
  }, [hasActiveFilter]);

  const content = (
    <div className="space-y-6">
      {/* Filter Section (collapsible) */}
      <div className="p-3 bg-gray-50/50 rounded-lg border border-gray-200/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Filter className="h-4 w-4" />
            <span className="font-medium">Filters</span>
            {hasActiveFilter && (
              <Badge variant="secondary" className="ml-1">Active</Badge>
            )}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsFilterOpen((prev) => !prev)}
            className="h-8 px-3"
            aria-expanded={isFilterOpen}
            aria-controls="recordings-filter-panel"
          >
            {isFilterOpen ? 'Hide' : 'Show'}
          </Button>
        </div>

        {isFilterOpen && (
          <div id="recordings-filter-panel" className="mt-3 flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span className="font-medium">Filter by:</span>
            </div>

            <Select value={selectedFilter} onValueChange={setSelectedFilter}>
              <SelectTrigger className="w-48 h-9 bg-white border-gray-300">
                <SelectValue placeholder="Select field..." />
              </SelectTrigger>
              <SelectContent>
                {FILTER_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Input
              placeholder="Enter search term..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              className="flex-1 min-w-[200px] h-9 bg-white border-gray-300"
              disabled={!selectedFilter}
            />

            <Button
              size="sm"
              onClick={handleApplyFilter}
              disabled={!selectedFilter || !inputValue.trim()}
              className="h-9 px-4 bg-blue-600 hover:bg-blue-700"
            >
              <Search className="h-4 w-4" />
            </Button>

            {hasActiveFilter && (
              <Button
                size="sm"
                variant="outline"
                onClick={handleClearFilter}
                className="h-9 px-4 border-gray-300 hover:bg-gray-50"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Active Filter Display */}
      {hasActiveFilter && (
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <span>Filtered by:</span>
          <Badge variant="secondary" className="bg-blue-100 text-blue-800">
            {FILTER_OPTIONS.find(opt => opt.value === filterField)?.label}: "{filterValue}"
          </Badge>
        </div>
      )}

      {/* Table Header */}
      <div className={`grid ${enableQuickView ? 'grid-cols-7' : 'grid-cols-6'} gap-4 px-4 py-2 text-sm font-medium text-gray-500`}>
        <div>Status</div>
        <div>Agent</div>
        <div>Date</div>
        <div>Duration</div>
        <div>Playback</div>
        {enableQuickView && <div></div>}
        <div></div>
      </div>

      {/* Table Content */}
      <div className="space-y-1">
        {isLoading ? (
          <>
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className={`grid ${enableQuickView ? 'grid-cols-7' : 'grid-cols-6'} gap-4 items-center px-4 py-4`}>
                <Skeleton className="h-6 w-20" />
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-5 w-16" />
                <Skeleton className="h-6 w-40" />
                {enableQuickView && <Skeleton className="h-8 w-20" />}
                <Skeleton className="h-8 w-16" />
              </div>
            ))}
          </>
        ) : records.length > 0 ? (
          records.map((record) => (
            <div key={record.id} className={`grid ${enableQuickView ? 'grid-cols-7' : 'grid-cols-6'} gap-4 items-center px-4 py-4 hover:bg-gray-50 transition-colors`}>
              {/* Status */}
              <div>
                {getSentimentBadge(record.sentiment)}
              </div>

              {/* Handler */}
              <div className="font-medium text-black truncate">
                {record.handler.name}
              </div>

              {/* Date */}
              <div className="text-gray-600">
                {formatDate(record.date)}
              </div>

              {/* Duration */}
              <div className="font-medium text-black">
                {formatDuration(record.duration)}
              </div>

              {/* Playback */}
              <div>
                <WaveformVisualization sentiment={record.sentiment} audioUrl={record.audio} />
              </div>

              {/* Quick View Button */}
              {enableQuickView && (
                <div className="text-center">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const targetAgentUuid = agentUuid || record.handler.id;
                      onQuickView?.(record.id, targetAgentUuid);
                    }}
                    className="h-8 px-3 border-[#1AADF0] text-[#1AADF0] hover:bg-[#1AADF0] hover:text-white hover:border-[#1AADF0] rounded-lg transition-colors font-medium"
                  >
                    <Eye className="h-3.5 w-3.5 mr-1.5" />
                    <span className="text-xs">Preview</span>
                  </Button>
                </div>
              )}

              {/* Review Button */}
              <div className="text-right">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    if (agentUuid) {
                      router.push(`/agents/${agentUuid}/calls/${record.id}`);
                    } else {
                      // For dashboard, we need to get the character UUID from the handler.id
                      router.push(`/agents/${record.handler.id}/calls/${record.id}`);
                    }
                  }}
                  className="text-gray-500 hover:text-black"
                >
                  Review
                </Button>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center text-gray-500 py-8">
            {hasActiveFilter ? `No recordings found matching &quot;${filterValue}&quot;` : "No recordings available yet"}
          </div>
        )}
      </div>

      {/* Pagination */}
      {hasRecords && totalPages > 1 && (
        <div className="flex items-center justify-between pt-4 border-t">
          <div className="text-sm text-gray-500">
            Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, totalRecords)} of {totalRecords} recordings
            {hasActiveFilter && <span className="ml-1">(filtered)</span>}
          </div>
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious 
                  onClick={() => handlePageChange(currentPage - 1)}
                  className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                />
              </PaginationItem>
              
              {/* Page Numbers */}
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                let pageNumber;
                if (totalPages <= 5) {
                  pageNumber = i + 1;
                } else if (currentPage <= 3) {
                  pageNumber = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNumber = totalPages - 4 + i;
                } else {
                  pageNumber = currentPage - 2 + i;
                }
                
                return (
                  <PaginationItem key={pageNumber}>
                    <PaginationLink
                      onClick={() => handlePageChange(pageNumber)}
                      isActive={pageNumber === currentPage}
                      className="cursor-pointer"
                    >
                      {pageNumber}
                    </PaginationLink>
                  </PaginationItem>
                );
              })}
              
              <PaginationItem>
                <PaginationNext 
                  onClick={() => handlePageChange(currentPage + 1)}
                  className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  );

  if (!showTitle) {
    return content;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="flex items-center gap-2">
            <span>{title}</span>
            {hasRecords && (
              <span className="text-sm font-normal text-gray-500">
                {totalRecords} total recordings
                {hasActiveFilter && <span className="ml-1">(filtered)</span>}
              </span>
            )}
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isLoading}
            className="h-8 px-3 border-[#1AADF0] text-[#1AADF0] hover:bg-[#1AADF0] hover:text-white"
            title="Refresh recordings"
          >
            <RefreshCcw className={`h-3.5 w-3.5 mr-1.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span className="text-xs">Refresh</span>
          </Button>
        </div>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>{content}</CardContent>
    </Card>
  );
} 