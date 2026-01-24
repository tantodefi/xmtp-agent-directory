'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Agent } from '../types/agent';

export function useAgentFilter(agents: Agent[]) {
  const router = useRouter();
  const pathname = usePathname();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    if (searchQuery) params.set('search', searchQuery);
    if (selectedCategory) params.set('category', selectedCategory);
    
    const newUrl = params.toString() ? `${pathname}?${params.toString()}` : pathname;
    router.replace(newUrl, { scroll: false });
  }, [searchQuery, selectedCategory, pathname, router]);

  // Filter agents based on search and category
  const filteredAgents = useMemo(() => {
    return agents.filter((agent) => {
      // Search filter (matches name or ENS)
      const matchesSearch = !searchQuery || 
        agent.agentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (agent.agentENS?.toLowerCase().includes(searchQuery.toLowerCase()));

      // Category filter
      const matchesCategory = !selectedCategory || 
        agent.agentCategories.includes(selectedCategory);

      return matchesSearch && matchesCategory;
    });
  }, [agents, searchQuery, selectedCategory]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleCategorySelect = (category: string | null) => {
    setSelectedCategory(category);
  };

  return {
    searchQuery,
    selectedCategory,
    filteredAgents,
    handleSearch,
    handleCategorySelect,
  };
}
