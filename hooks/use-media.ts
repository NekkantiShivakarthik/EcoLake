import { supabase } from '@/lib/supabase';
import { decode } from 'base64-arraybuffer';
import { File } from 'expo-file-system/next';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { useState } from 'react';
import { Alert, Platform } from 'react-native';

export interface PhotoAsset {
  uri: string;
  width: number;
  height: number;
  type?: string;
  fileName?: string;
}

export interface LocationCoords {
  latitude: number;
  longitude: number;
  accuracy?: number | null;
  altitude?: number | null;
  heading?: number | null;
  speed?: number | null;
}

// Hook for image picker
export function useImagePicker() {
  const [images, setImages] = useState<PhotoAsset[]>([]);
  const [loading, setLoading] = useState(false);

  const requestPermissions = async () => {
    if (Platform.OS !== 'web') {
      const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
      const { status: libraryStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (cameraStatus !== 'granted' || libraryStatus !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Please allow camera and photo library access to add photos to your report.'
        );
        return false;
      }
    }
    return true;
  };

  const pickFromCamera = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    setLoading(true);
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        exif: true,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        const newImage: PhotoAsset = {
          uri: asset.uri,
          width: asset.width,
          height: asset.height,
          type: asset.mimeType || 'image/jpeg',
          fileName: asset.fileName || `photo_${Date.now()}.jpg`,
        };
        
        if (images.length < 5) {
          setImages([...images, newImage]);
        } else {
          Alert.alert('Limit Reached', 'Maximum 5 photos allowed per report.');
        }
      }
    } catch (error) {
      console.error('Camera error:', error);
      Alert.alert('Error', 'Failed to take photo. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const pickFromGallery = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    setLoading(true);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsMultipleSelection: true,
        selectionLimit: 5 - images.length,
        quality: 0.8,
        exif: true,
      });

      if (!result.canceled && result.assets.length > 0) {
        const newImages: PhotoAsset[] = result.assets.map((asset) => ({
          uri: asset.uri,
          width: asset.width,
          height: asset.height,
          type: asset.mimeType || 'image/jpeg',
          fileName: asset.fileName || `photo_${Date.now()}.jpg`,
        }));

        const totalImages = [...images, ...newImages].slice(0, 5);
        setImages(totalImages);
        
        if (images.length + newImages.length > 5) {
          Alert.alert('Note', 'Only the first 5 photos were added.');
        }
      }
    } catch (error) {
      console.error('Gallery error:', error);
      Alert.alert('Error', 'Failed to select photos. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const clearImages = () => {
    setImages([]);
  };

  return {
    images,
    loading,
    pickFromCamera,
    pickFromGallery,
    removeImage,
    clearImages,
  };
}

// Hook for location
export function useLocation() {
  const [location, setLocation] = useState<LocationCoords | null>(null);
  const [address, setAddress] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const requestPermission = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'Location permission is needed to geotag your report. This helps us identify pollution hotspots.'
      );
      return false;
    }
    return true;
  };

  const getCurrentLocation = async () => {
    const hasPermission = await requestPermission();
    if (!hasPermission) return null;

    setLoading(true);
    setError(null);

    try {
      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const coords: LocationCoords = {
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
        accuracy: currentLocation.coords.accuracy,
        altitude: currentLocation.coords.altitude,
        heading: currentLocation.coords.heading,
        speed: currentLocation.coords.speed,
      };

      setLocation(coords);

      // Try to get address
      try {
        const [reverseGeocode] = await Location.reverseGeocodeAsync({
          latitude: coords.latitude,
          longitude: coords.longitude,
        });

        if (reverseGeocode) {
          const addressParts = [
            reverseGeocode.name,
            reverseGeocode.street,
            reverseGeocode.city,
            reverseGeocode.region,
          ].filter(Boolean);
          setAddress(addressParts.join(', '));
        }
      } catch (geoError) {
        console.log('Reverse geocode failed:', geoError);
      }

      return coords;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to get location';
      setError(message);
      Alert.alert('Location Error', message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const clearLocation = () => {
    setLocation(null);
    setAddress(null);
    setError(null);
  };

  return {
    location,
    address,
    loading,
    error,
    getCurrentLocation,
    clearLocation,
    requestPermission,
  };
}

// Hook for uploading photos to Supabase Storage
export function usePhotoUpload() {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploadedUrls, setUploadedUrls] = useState<string[]>([]);

  const uploadPhotos = async (photos: PhotoAsset[]): Promise<string[]> => {
    if (photos.length === 0) return [];

    setUploading(true);
    setProgress(0);
    const urls: string[] = [];

    try {
      for (let i = 0; i < photos.length; i++) {
        const photo = photos[i];
        const fileExt = photo.fileName?.split('.').pop() || 'jpg';
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `reports/${fileName}`;

        let uploadError = null;
        let uploadData = null;

        if (Platform.OS === 'web') {
          // Web: Use fetch to get blob and upload directly
          const response = await fetch(photo.uri);
          const blob = await response.blob();
          
          const result = await supabase.storage
            .from('report-photos')
            .upload(filePath, blob, {
              contentType: photo.type || 'image/jpeg',
              upsert: false,
            });
          uploadError = result.error;
          uploadData = result.data;
        } else {
          // Mobile: Use new expo-file-system File API to read as base64
          const file = new File(photo.uri);
          const base64 = await file.base64();
          const arrayBuffer = decode(base64);
          
          const result = await supabase.storage
            .from('report-photos')
            .upload(filePath, arrayBuffer, {
              contentType: photo.type || 'image/jpeg',
              upsert: false,
            });
          uploadError = result.error;
          uploadData = result.data;
        }

        if (uploadError) {
          console.error('Upload error:', uploadError.message);
          Alert.alert('Upload Failed', `Failed to upload photo ${i + 1}: ${uploadError.message}`);
          continue;
        }

        if (uploadData) {
          // Get public URL
          const { data: urlData } = supabase.storage
            .from('report-photos')
            .getPublicUrl(uploadData.path);

          urls.push(urlData.publicUrl);
        }
        
        setProgress(((i + 1) / photos.length) * 100);
      }

      setUploadedUrls(urls);
      return urls;
    } catch (err) {
      console.error('Photo upload error:', err);
      Alert.alert('Upload Error', 'Failed to upload photos. Please try again.');
      return urls;
    } finally {
      setUploading(false);
    }
  };

  const clearUploads = () => {
    setUploadedUrls([]);
    setProgress(0);
  };

  return {
    uploading,
    progress,
    uploadedUrls,
    uploadPhotos,
    clearUploads,
  };
}
