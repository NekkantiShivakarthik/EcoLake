import { supabase } from '@/lib/supabase';
import { Badge, Cleanup, Lake, Report, User } from '@/types/database';
import { useCallback, useEffect, useState } from 'react';

// Interface for nearby lake from OpenStreetMap
interface NearbyLake {
  id: string;
  name: string;
  lat: number;
  lng: number;
  distance?: number;
  type: string;
}

// Fetch all reports with lake info
export function useReports(filterStatus?: string) {
  const [reports, setReports] = useState<(Report & { lake: Lake | null; user: User | null })[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReports = useCallback(async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('reports')
        .select(`
          *,
          lake:lakes(*),
          user:users!reports_user_id_fkey(*)
        `)
        .order('created_at', { ascending: false });

      if (filterStatus && filterStatus !== 'all') {
        query = query.eq('status', filterStatus);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching reports:', error);
        throw error;
      }
      
      console.log('Fetched reports:', data?.length || 0);
      setReports((data as any) || []);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch reports:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch reports');
      setReports([]);
    } finally {
      setLoading(false);
    }
  }, [filterStatus]);

  useEffect(() => {
    fetchReports();

    // Set up real-time subscription
    const subscription = supabase
      .channel('reports_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reports' }, () => {
        fetchReports();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchReports]);

  return { reports, loading, error, refetch: fetchReports };
}

// Cache for lake search results
const lakeSearchCache = new Map<string, { data: NearbyLake[]; timestamp: number }>();
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

// Calculate distance between two coordinates (in km)
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Generate cache key from coordinates (rounded to 3 decimal places ~110m precision)
function getCacheKey(latitude: number, longitude: number, radiusKm: number): string {
  const lat = latitude.toFixed(3);
  const lng = longitude.toFixed(3);
  return `${lat},${lng},${radiusKm}`;
}

// Search for nearby lakes using OpenStreetMap Overpass API
async function searchNearbyLakes(
  latitude: number,
  longitude: number,
  radiusKm: number = 50
): Promise<NearbyLake[]> {
  try {
    // Check cache first
    const cacheKey = getCacheKey(latitude, longitude, radiusKm);
    const cached = lakeSearchCache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      console.log('Using cached lake search results');
      return cached.data;
    }

    // Convert radius from km to meters for Overpass API
    const radiusMeters = radiusKm * 1000;
    
    // Overpass API query to find water bodies (lakes, reservoirs, ponds)
    // Using multiple query patterns to catch different OSM tagging schemes:
    // 1. natural=water with water=lake/reservoir/pond
    // 2. natural=water without specific water tag (general water bodies)
    // 3. landuse=reservoir
    // 4. water=lake/reservoir/pond (standalone tag)
    const query = `
      [out:json][timeout:30];
      (
        // Lakes with specific water tag
        way["natural"="water"]["water"~"lake|reservoir|pond"](around:${radiusMeters},${latitude},${longitude});
        relation["natural"="water"]["water"~"lake|reservoir|pond"](around:${radiusMeters},${latitude},${longitude});
        // General water bodies (natural=water without specific type, often large lakes)
        way["natural"="water"]["name"](around:${radiusMeters},${latitude},${longitude});
        relation["natural"="water"]["name"](around:${radiusMeters},${latitude},${longitude});
        // Reservoirs tagged as landuse
        way["landuse"="reservoir"](around:${radiusMeters},${latitude},${longitude});
        relation["landuse"="reservoir"](around:${radiusMeters},${latitude},${longitude});
        // Standalone water tag
        way["water"~"lake|reservoir|pond|basin"](around:${radiusMeters},${latitude},${longitude});
        relation["water"~"lake|reservoir|pond|basin"](around:${radiusMeters},${latitude},${longitude});
      );
      out center;
    `;

    const response = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      body: query,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    if (!response.ok) {
      console.error('Overpass API error:', response.status, response.statusText);
      throw new Error(`Failed to fetch nearby lakes: ${response.status}`);
    }

    const data = await response.json();
    console.log('Overpass API response elements:', data.elements?.length || 0);
    const lakes: NearbyLake[] = [];

    // Process the results - deduplicate by name to avoid showing the same lake multiple times
    const seenNames = new Set<string>();
    
    for (const element of data.elements) {
      const name = element.tags?.name || `Unnamed Water Body`;
      let lat = element.lat;
      let lng = element.lon;

      // For ways and relations, use center coordinates
      if (element.center) {
        lat = element.center.lat;
        lng = element.center.lon;
      }

      if (lat && lng) {
        // Skip duplicates with same name (different OSM elements for same lake)
        const nameKey = name.toLowerCase();
        if (seenNames.has(nameKey) && name !== 'Unnamed Water Body') {
          continue;
        }
        seenNames.add(nameKey);
        
        const distance = calculateDistance(latitude, longitude, lat, lng);
        
        lakes.push({
          id: `osm-${element.type}-${element.id}`,
          name,
          lat,
          lng,
          distance,
          type: element.tags?.water || element.tags?.landuse || 'lake',
        });
      }
    }

    // Sort by distance
    lakes.sort((a, b) => (a.distance || 0) - (b.distance || 0));
    
    console.log('Found', lakes.length, 'unique lakes within', radiusKm, 'km');

    // Cache the results
    lakeSearchCache.set(cacheKey, { data: lakes, timestamp: Date.now() });

    return lakes;
  } catch (error) {
    console.error('Error searching nearby lakes:', error);
    return [];
  }
}

// Fetch nearby lakes from OpenStreetMap
export function useNearbyLakes(userLocation?: { latitude: number; longitude: number } | null, maxDistance: number = 50) {
  const [lakes, setLakes] = useState<NearbyLake[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchNearbyLakes() {
      if (!userLocation?.latitude || !userLocation?.longitude) {
        setLakes([]);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const nearbyLakes = await searchNearbyLakes(
          userLocation.latitude,
          userLocation.longitude,
          maxDistance
        );
        
        setLakes(nearbyLakes);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to search for nearby lakes');
      } finally {
        setLoading(false);
      }
    }

    fetchNearbyLakes();
  }, [userLocation?.latitude, userLocation?.longitude, maxDistance]);

  return { lakes, loading, error };
}

// Fetch all lakes with optional proximity sorting and filtering (legacy - for database lakes)
export function useLakes(userLocation?: { latitude: number; longitude: number } | null, maxDistance: number = 50) {
  const [lakes, setLakes] = useState<(Lake & { distance?: number })[]>([]);
  const [allLakes, setAllLakes] = useState<(Lake & { distance?: number })[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchLakes() {
      try {
        const { data, error } = await supabase
          .from('lakes')
          .select('*')
          .order('name');

        if (error) throw error;
        
        let lakesData = (data as any) || [];
        
        // If user location is provided, calculate distances and filter by proximity
        if (userLocation && userLocation.latitude && userLocation.longitude) {
          lakesData = lakesData.map((lake: Lake) => {
            if (lake.lat && lake.lng) {
              const distance = calculateDistance(
                userLocation.latitude,
                userLocation.longitude,
                lake.lat,
                lake.lng
              );
              return { ...lake, distance };
            }
            return { ...lake, distance: Infinity };
          });
          
          // Sort by distance (nearest first)
          lakesData.sort((a: any, b: any) => (a.distance || Infinity) - (b.distance || Infinity));
          
          // Store all lakes with distances
          setAllLakes(lakesData);
          
          // Filter to show only lakes within maxDistance km
          const nearbyLakes = lakesData.filter((lake: any) => 
            lake.distance !== undefined && lake.distance <= maxDistance
          );
          
          setLakes(nearbyLakes);
        } else {
          // No location, show all lakes
          setLakes(lakesData);
          setAllLakes(lakesData);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch lakes');
      } finally {
        setLoading(false);
      }
    }

    fetchLakes();
  }, [userLocation?.latitude, userLocation?.longitude, maxDistance]);

  return { lakes, allLakes, loading, error };
}

// Fetch leaderboard with time filter
export function useLeaderboard(timeFilter: 'weekly' | 'monthly' | 'all-time' = 'all-time') {
  const [leaderboard, setLeaderboard] = useState<{ user: User; total_points: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLeaderboard = useCallback(async () => {
    try {
      setLoading(true);

      // Calculate date range based on filter
      let dateFilter: Date | null = null;
      const now = new Date();

      if (timeFilter === 'weekly') {
        dateFilter = new Date(now.setDate(now.getDate() - 7));
      } else if (timeFilter === 'monthly') {
        dateFilter = new Date(now.setMonth(now.getMonth() - 1));
      }

      // Get all users with their points from points_log
      let query = supabase
        .from('points_log')
        .select(`
          user_id,
          change,
          balance_snapshot,
          created_at,
          user:users(*)
        `)
        .order('created_at', { ascending: false });

      if (dateFilter) {
        query = query.gte('created_at', dateFilter.toISOString());
      }

      const { data, error } = await query;

      if (error) throw error;

      // Aggregate points by user
      const userPointsMap = new Map<string, { user: User; total_points: number }>();

      if (timeFilter === 'all-time') {
        // For all-time, get the latest balance_snapshot for each user
        (data as any)?.forEach((entry: any) => {
          if (entry.user_id && entry.user && !userPointsMap.has(entry.user_id)) {
            userPointsMap.set(entry.user_id, {
              user: entry.user,
              total_points: entry.balance_snapshot || 0,
            });
          }
        });
      } else {
        // For weekly/monthly, sum points earned in that period
        (data as any)?.forEach((entry: any) => {
          if (entry.user_id && entry.user) {
            const existing = userPointsMap.get(entry.user_id);
            if (existing) {
              existing.total_points += entry.change || 0;
            } else {
              userPointsMap.set(entry.user_id, {
                user: entry.user,
                total_points: entry.change || 0,
              });
            }
          }
        });
      }

      const sortedLeaderboard = Array.from(userPointsMap.values())
        .sort((a, b) => b.total_points - a.total_points);

      setLeaderboard(sortedLeaderboard);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch leaderboard');
    } finally {
      setLoading(false);
    }
  }, [timeFilter]);

  useEffect(() => {
    fetchLeaderboard();

    // Set up real-time subscription for leaderboard updates
    const subscription = supabase
      .channel('leaderboard_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'points_log' }, (payload) => {
        console.log('Leaderboard: points_log changed', payload);
        fetchLeaderboard();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, (payload) => {
        console.log('Leaderboard: users changed', payload);
        fetchLeaderboard();
      })
      .subscribe((status) => {
        console.log('Leaderboard subscription status:', status);
      });

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchLeaderboard]);

  return { leaderboard, loading, error, refetch: fetchLeaderboard };
}

// Fetch user with badges
export function useUserProfile(userId?: string) {
  const [user, setUser] = useState<User | null>(null);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [points, setPoints] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPoints = useCallback(async (uid: string) => {
    // Fetch latest points
    const { data: pointsData } = await supabase
      .from('points_log')
      .select('balance_snapshot')
      .eq('user_id', uid)
      .order('created_at', { ascending: false })
      .limit(1);

    const newPoints = (pointsData as any)?.[0]?.balance_snapshot || 0;
    console.log('Fetched points:', newPoints);
    setPoints(newPoints);
  }, []);

  const fetchProfile = useCallback(async () => {
    if (!userId) {
      // If no user ID, get first user for demo
      const { data: users } = await supabase.from('users').select('*').limit(1);
      if ((users as any)?.[0]) {
        setUser((users as any)[0]);
        await fetchUserData((users as any)[0].id);
      }
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      setUser(data as any);
      await fetchUserData(userId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch profile');
      setLoading(false);
    }
  }, [userId]);

  async function fetchUserData(uid: string) {
    // Fetch badges
    const { data: userBadges, error: badgesError } = await supabase
      .from('user_badges')
      .select('badge:badges(*), awarded_at')
      .eq('user_id', uid);

    if (badgesError) {
      console.error('Error fetching user badges:', badgesError);
    } else {
      console.log('Fetched user badges:', userBadges);
    }

    const earnedBadges = (userBadges as any)?.map((ub: any) => ub.badge).filter(Boolean) || [];
    console.log('Earned badges:', earnedBadges);
    setBadges(earnedBadges);

    // Fetch latest points
    await fetchPoints(uid);
    setLoading(false);
  }

  useEffect(() => {
    fetchProfile();

    // Set up real-time subscription for points updates
    if (userId) {
      const channelName = `profile_points_${userId}_${Date.now()}`;
      console.log('Setting up realtime subscription for points:', channelName);
      
      const subscription = supabase
        .channel(channelName)
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'points_log',
          filter: `user_id=eq.${userId}`,
        }, (payload) => {
          console.log('Points log change detected:', payload);
          // Directly update points from the payload for instant update
          if (payload.new && typeof (payload.new as any).balance_snapshot === 'number') {
            setPoints((payload.new as any).balance_snapshot);
          } else {
            // Fallback to fetching
            fetchPoints(userId);
          }
        })
        .subscribe((status) => {
          console.log('Subscription status:', status);
        });

      return () => {
        console.log('Unsubscribing from:', channelName);
        subscription.unsubscribe();
      };
    }
  }, [fetchProfile, fetchPoints, userId]);

  return { user, badges, points, loading, error, refetch: fetchProfile };
}

// Fetch stats
export function useStats(userId?: string) {
  const [stats, setStats] = useState({
    totalReports: 0,
    cleanedReports: 0,
    totalLakes: 0,
    totalCleaners: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    async function fetchStats() {
      try {
        // userId is guaranteed to be defined here due to the early return above
        const userIdValue = userId as string;
        
        const [reportsRes, cleanedRes, lakesRes, cleanersRes] = await Promise.all([
          supabase.from('reports').select('id', { count: 'exact', head: true }).eq('user_id', userIdValue),
          supabase.from('reports').select('id', { count: 'exact', head: true }).eq('user_id', userIdValue).eq('status', 'cleaned'),
          supabase.from('lakes').select('id', { count: 'exact', head: true }),
          supabase.from('users').select('id', { count: 'exact', head: true }).eq('role', 'cleaner'),
        ]);

        setStats({
          totalReports: reportsRes.count || 0,
          cleanedReports: cleanedRes.count || 0,
          totalLakes: lakesRes.count || 0,
          totalCleaners: cleanersRes.count || 0,
        });
      } catch (err) {
        console.error('Failed to fetch stats:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchStats();

    // Set up real-time subscription for stats
    const subscription = supabase
      .channel('stats_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reports' }, () => {
        fetchStats();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [userId]);

  return { stats, loading };
}

// Badge checking and awarding function
export async function checkAndAwardBadges(userId: string): Promise<Badge[]> {
  const newBadges: Badge[] = [];
  
  try {
    // Get all badges
    const { data: allBadges } = await supabase.from('badges').select('*');
    if (!allBadges) return [];

    // Get user's existing badges
    const { data: userBadges } = await supabase
      .from('user_badges')
      .select('badge_id')
      .eq('user_id', userId);
    
    const earnedBadgeIds = new Set((userBadges || []).map((ub: any) => ub.badge_id));

    // Get user's report count
    const { count: reportCount } = await supabase
      .from('reports')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    // Get user's cleanup count
    const { count: cleanupCount } = await supabase
      .from('reports')
      .select('*', { count: 'exact', head: true })
      .eq('assigned_cleaner_id', userId)
      .eq('status', 'cleaned');

    // Get user's points
    const { data: pointsData } = await supabase
      .from('points_log')
      .select('balance_snapshot')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1);
    
    const userPoints = (pointsData as any)?.[0]?.balance_snapshot || 0;

    // Get report details for special badges
    const { data: reportDetails } = await supabase
      .from('reports')
      .select('category, severity, photos, description, created_at')
      .eq('user_id', userId);

    const reports = reportDetails || [];
    
    // Badge criteria mapping
    const badgeCriteria: Record<string, () => boolean> = {
      'First Report': () => (reportCount || 0) >= 1,
      '5 Reports': () => (reportCount || 0) >= 5,
      '10 Reports': () => (reportCount || 0) >= 10,
      'Eco Warrior': () => (reportCount || 0) >= 25,
      'Lake Champion': () => (reportCount || 0) >= 50,
      'Environmental Legend': () => (reportCount || 0) >= 100,
      '100 Points Club': () => userPoints >= 100,
      'Point Master': () => userPoints >= 500,
      'Point Legend': () => userPoints >= 1000,
      'Cleanup Hero': () => (cleanupCount || 0) >= 5,
      'Lake Guardian': () => (cleanupCount || 0) >= 10,
      'Super Cleaner': () => (cleanupCount || 0) >= 10,
      'Master Cleaner': () => (cleanupCount || 0) >= 25,
      'Early Bird': () => {
        return reports.some((r: any) => {
          const hour = new Date(r.created_at).getHours();
          return hour < 8;
        });
      },
      'Night Owl': () => {
        return reports.some((r: any) => {
          const hour = new Date(r.created_at).getHours();
          return hour >= 22;
        });
      },
      'Photo Pro': () => {
        const reportsWithPhotos = reports.filter((r: any) => r.photos && r.photos.length > 0);
        return reportsWithPhotos.length >= 10;
      },
      'Detail Detective': () => {
        const detailedReports = reports.filter((r: any) => r.description && r.description.length >= 50);
        return detailedReports.length >= 10;
      },
      'Severity Expert': () => {
        const severities = new Set(reports.map((r: any) => r.severity));
        return severities.size >= 5; // All 5 severity levels
      },
      'Category Master': () => {
        const categories = new Set(reports.map((r: any) => r.category));
        return categories.size >= 6; // All 6 categories
      },
    };

    // Check each badge
    for (const badge of allBadges as Badge[]) {
      // Skip if already earned
      if (earnedBadgeIds.has(badge.id)) continue;

      // Check if criteria met
      const checkFn = badgeCriteria[badge.name];
      if (checkFn && checkFn()) {
        // Award badge
        const { error } = await (supabase.from('user_badges') as any).insert({
          user_id: userId,
          badge_id: badge.id,
        });

        if (!error) {
          newBadges.push(badge);
          console.log(`Badge awarded: ${badge.name}`);
        } else {
          console.error(`Failed to award badge ${badge.name}:`, error);
        }
      }
    }

    return newBadges;
  } catch (err) {
    console.error('Error checking badges:', err);
    return [];
  }
}

// Fetch badges
export function useBadges() {
  const [badges, setBadges] = useState<Badge[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchBadges() {
      try {
        const { data, error: queryError } = await supabase.from('badges').select('*');
        
        if (queryError) {
          console.error('Error fetching badges:', queryError);
          setError(queryError.message);
        } else {
          console.log('Fetched all badges:', data);
          setBadges((data as any) || []);
        }
      } catch (err) {
        console.error('Failed to fetch badges:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch badges');
      } finally {
        setLoading(false);
      }
    }

    fetchBadges();
  }, []);

  return { badges, loading, error };
}

// Fetch cleanups
export function useCleanups() {
  const [cleanups, setCleanups] = useState<(Cleanup & { report: Report | null; cleaner: User | null })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCleanups() {
      const { data } = await supabase
        .from('cleanups')
        .select(`
          *,
          report:reports(*),
          cleaner:users(*)
        `)
        .order('created_at', { ascending: false });

      setCleanups((data as any) || []);
      setLoading(false);
    }

    fetchCleanups();
  }, []);

  return { cleanups, loading };
}

// Fetch notifications
export function useNotifications(userId?: string) {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);

      setNotifications((data as any) || []);
      setUnreadCount((data as any)?.filter((n: any) => !n.read).length || 0);
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const markAsRead = async (notificationIds: string[]) => {
    await (supabase
      .from('notifications') as any)
      .update({ read: true })
      .in('id', notificationIds);

    fetchNotifications();
  };

  useEffect(() => {
    fetchNotifications();

    // Real-time subscription for new notifications
    if (userId) {
      const subscription = supabase
        .channel('notifications_changes')
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        }, () => {
          fetchNotifications();
        })
        .subscribe();

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [fetchNotifications, userId]);

  return { notifications, unreadCount, loading, refetch: fetchNotifications, markAsRead };
}

// Submit report hook
export function useSubmitReport() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submitReport = async (data: {
    user_id?: string;
    lake_id?: string | null;
    lake_name?: string;
    category: string;
    severity: number;
    description: string;
    lat: number;
    lng: number;
    photo_urls?: string[];
  }) => {
    setLoading(true);
    setError(null);

    try {
      // Require authenticated user
      if (!data.user_id) {
        throw new Error('You must be logged in to submit a report');
      }

      const { error: insertError } = await supabase.from('reports').insert({
        user_id: data.user_id,
        lake_id: data.lake_id || null,
        lake_name: data.lake_name || 'Unknown Lake',
        category: data.category,
        severity: data.severity,
        description: data.description,
        lat: data.lat,
        lng: data.lng,
        photos: data.photo_urls || [],
        status: 'submitted',
        priority_score: data.severity * 20,
      } as any);

      if (insertError) throw insertError;

      // Award points for submitting a report (10 points base + severity bonus)
      const pointsEarned = 10 + (data.severity * 2);
      
      // Get current balance
      const { data: currentPoints } = await supabase
        .from('points_log')
        .select('balance_snapshot')
        .eq('user_id', data.user_id)
        .order('created_at', { ascending: false })
        .limit(1);
      
      const currentBalance = (currentPoints as any)?.[0]?.balance_snapshot || 0;
      const newBalance = currentBalance + pointsEarned;

      // Insert points log entry
      const { error: pointsError } = await (supabase.from('points_log') as any).insert({
        user_id: data.user_id,
        change: pointsEarned,
        reason: `Report submitted: ${data.lake_name || 'Unknown Lake'}`,
        balance_snapshot: newBalance,
      });

      if (pointsError) {
        console.error('Failed to award points:', pointsError);
      }

      // Check for new badges
      const newBadges = await checkAndAwardBadges(data.user_id);

      return { success: true, pointsEarned, newBadges };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to submit report';
      setError(message);
      return { success: false, error: message, newBadges: [] };
    } finally {
      setLoading(false);
    }
  };

  return { submitReport, loading, error };
}

// Update report hook
export function useUpdateReport() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateReport = async (
    reportId: string,
    data: {
      category?: string;
      severity?: number;
      description?: string;
    }
  ) => {
    setLoading(true);
    setError(null);

    try {
      const updateData: any = {};
      if (data.category) updateData.category = data.category;
      if (data.severity) updateData.severity = data.severity;
      if (data.description) updateData.description = data.description;
      if (data.severity) updateData.priority_score = data.severity * 20;
      updateData.updated_at = new Date().toISOString();

      const { error: updateError } = await (supabase
        .from('reports') as any)
        .update(updateData)
        .eq('id', reportId);

      if (updateError) throw updateError;

      return { success: true };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update report';
      setError(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  };

  return { updateReport, loading, error };
}

// Delete report hook
export function useDeleteReport() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const deleteReport = async (reportId: string) => {
    setLoading(true);
    setError(null);

    try {
      const { error: deleteError } = await (supabase
        .from('reports') as any)
        .delete()
        .eq('id', reportId);

      if (deleteError) throw deleteError;

      return { success: true };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete report';
      setError(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  };

  return { deleteReport, loading, error };
}

// Upload photos hook
export function usePhotoUpload() {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const uploadPhoto = async (uri: string, reportId?: string): Promise<string | null> => {
    setUploading(true);
    setProgress(0);

    try {
      // Create form data
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.jpg`;
      const filePath = reportId ? `reports/${reportId}/${fileName}` : `temp/${fileName}`;

      // Fetch the image as blob
      const response = await fetch(uri);
      const blob = await response.blob();

      const { data, error } = await supabase.storage
        .from('report-photos')
        .upload(filePath, blob, {
          contentType: 'image/jpeg',
          upsert: false,
        });

      if (error) throw error;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('report-photos')
        .getPublicUrl(data.path);

      setProgress(100);
      return urlData.publicUrl;
    } catch (err) {
      console.error('Upload error:', err);
      return null;
    } finally {
      setUploading(false);
    }
  };

  return { uploadPhoto, uploading, progress };
}

// Fetch rewards
export function useRewards(category?: string) {
  const [rewards, setRewards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRewards = useCallback(async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('rewards')
        .select('*')
        .eq('is_active', true)
        .order('points_required', { ascending: true });

      if (category && category !== 'all') {
        query = query.eq('category', category);
      }

      const { data, error: queryError } = await query;

      if (queryError) throw queryError;
      setRewards((data as any) || []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch rewards');
    } finally {
      setLoading(false);
    }
  }, [category]);

  useEffect(() => {
    fetchRewards();
  }, [fetchRewards]);

  return { rewards, loading, error, refetch: fetchRewards };
}

// Fetch user redemptions
export function useRedemptions(userId?: string) {
  const [redemptions, setRedemptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRedemptions = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      const { data, error: queryError } = await supabase
        .from('redemptions')
        .select(`
          *,
          reward:rewards(*)
        `)
        .eq('user_id', userId)
        .order('redeemed_at', { ascending: false });

      if (queryError) throw queryError;
      setRedemptions((data as any) || []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch redemptions');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchRedemptions();

    // Set up real-time subscription for redemptions
    if (userId) {
      const subscription = supabase
        .channel(`redemptions_${userId}`)
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'redemptions',
          filter: `user_id=eq.${userId}`,
        }, () => {
          fetchRedemptions();
        })
        .subscribe();

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [fetchRedemptions, userId]);

  return { redemptions, loading, error, refetch: fetchRedemptions };
}

// Redeem reward hook
export function useRedeemReward() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const redeemReward = async (userId: string, rewardId: string, userPoints: number) => {
    setLoading(true);
    setError(null);

    try {
      // Get reward details
      const { data: reward, error: rewardError } = await supabase
        .from('rewards')
        .select('*')
        .eq('id', rewardId)
        .single();

      if (rewardError) throw rewardError;

      // Check if user has enough points
      if (userPoints < (reward as any).points_required) {
        throw new Error('Insufficient points');
      }

      // Check stock
      if ((reward as any).stock_available <= 0) {
        throw new Error('Reward out of stock');
      }

      // Create redemption code
      const redemptionCode = `ECO-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

      // Insert redemption
      const { error: insertError } = await supabase.from('redemptions').insert({
        user_id: userId,
        reward_id: rewardId,
        points_spent: (reward as any).points_required,
        status: 'pending',
        redemption_code: redemptionCode,
      } as any);

      if (insertError) throw insertError;

      // Deduct points from user
      const { error: pointsError } = await supabase.from('points_log').insert({
        user_id: userId,
        points: -(reward as any).points_required,
        activity_type: 'redemption',
        description: `Redeemed: ${(reward as any).name}`,
        balance_snapshot: userPoints - (reward as any).points_required,
      } as any);

      if (pointsError) throw pointsError;

      // Update reward stock
      const { error: stockError } = await (supabase
        .from('rewards') as any)
        .update({ stock_available: (reward as any).stock_available - 1 })
        .eq('id', rewardId);

      if (stockError) console.error('Failed to update stock:', stockError);

      return { success: true, redemptionCode, error: null };
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to redeem reward';
      setError(errorMsg);
      return { success: false, redemptionCode: null, error: errorMsg };
    } finally {
      setLoading(false);
    }
  };

  return { redeemReward, loading, error };
}
