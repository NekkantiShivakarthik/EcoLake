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

  const deleteReport = useCallback(async (reportId: string) => {
    try {
      console.log('Attempting to delete report:', reportId);
      const { error, data, count } = await supabase
        .from('reports')
        .delete()
        .eq('id', reportId)
        .select();

      console.log('Delete response:', { error, data, count });
      
      if (error) {
        console.error('Supabase delete error:', error);
        throw error;
      }
      
      // Refresh the reports list
      await fetchReports();
      return { success: true };
    } catch (err) {
      console.error('Failed to delete report:', err);
      return { success: false, error: err instanceof Error ? err.message : 'Failed to delete report' };
    }
  }, [fetchReports]);

  return { reports, loading, error, refetch: fetchReports, deleteReport };
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
    const query = `
      [out:json][timeout:25];
      (
        way["natural"="water"]["water"~"lake|reservoir|pond"](around:${radiusMeters},${latitude},${longitude});
        relation["natural"="water"]["water"~"lake|reservoir|pond"](around:${radiusMeters},${latitude},${longitude});
      );
      out center;
    `;

    const response = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      body: query,
    });

    if (!response.ok) {
      throw new Error('Failed to fetch nearby lakes');
    }

    const data = await response.json();
    const lakes: NearbyLake[] = [];

    // Process the results
    for (const element of data.elements) {
      const name = element.tags?.name || `Unnamed Lake`;
      let lat = element.lat;
      let lng = element.lon;

      // For ways and relations, use center coordinates
      if (element.center) {
        lat = element.center.lat;
        lng = element.center.lon;
      }

      if (lat && lng) {
        const distance = calculateDistance(latitude, longitude, lat, lng);
        
        lakes.push({
          id: `osm-${element.type}-${element.id}`,
          name,
          lat,
          lng,
          distance,
          type: element.tags?.water || 'lake',
        });
      }
    }

    // Sort by distance
    lakes.sort((a, b) => (a.distance || 0) - (b.distance || 0));

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
          points,
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
              existing.total_points += entry.points || 0;
            } else {
              userPointsMap.set(entry.user_id, {
                user: entry.user,
                total_points: entry.points || 0,
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
    const { data: userBadges } = await supabase
      .from('user_badges')
      .select('badge:badges(*)')
      .eq('user_id', uid);

    setBadges((userBadges as any)?.map((ub: any) => ub.badge).filter(Boolean) || []);

    // Fetch latest points
    const { data: pointsData } = await supabase
      .from('points_log')
      .select('balance_snapshot')
      .eq('user_id', uid)
      .order('created_at', { ascending: false })
      .limit(1);

    setPoints((pointsData as any)?.[0]?.balance_snapshot || 0);
    setLoading(false);
  }

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

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
        const [reportsRes, cleanedRes, lakesRes, cleanersRes] = await Promise.all([
          supabase.from('reports').select('id', { count: 'exact', head: true }).eq('user_id', userId),
          supabase.from('reports').select('id', { count: 'exact', head: true }).eq('user_id', userId).eq('status', 'cleaned'),
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

// Fetch badges
export function useBadges() {
  const [badges, setBadges] = useState<Badge[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchBadges() {
      const { data } = await supabase.from('badges').select('*');
      setBadges((data as any) || []);
      setLoading(false);
    }

    fetchBadges();
  }, []);

  return { badges, loading };
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

      return { success: true };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to submit report';
      setError(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  };

  return { submitReport, loading, error };
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
  }, [fetchRedemptions]);

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
