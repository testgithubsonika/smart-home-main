// Firebase imports removed - using Supabase service instead
import { supabase } from '@/lib/supabase';

export interface FloorPlan {
  id: string;
  householdId: string;
  userId: string;
  name: string;
  fileUrl: string;
  thumbnailUrl?: string;
  description?: string;
  fileSize?: number;
  fileType?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateFloorPlanData {
  householdId: string;
  userId: string;
  name: string;
  file: File;
  description?: string;
}

export interface UpdateFloorPlanData {
  name?: string;
  description?: string;
  file?: File;
}

// Create a new floor plan
export const createFloorPlan = async (data: CreateFloorPlanData): Promise<string> => {
  try {
    // Upload file to Supabase Storage
    const filePath = `floorplans/${data.householdId}/${data.file.name}`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('floorplans')
      .upload(filePath, data.file);

    if (uploadError) throw uploadError;

    const { data: urlData } = supabase.storage
      .from('floorplans')
      .getPublicUrl(filePath);

    const fileUrl = urlData.publicUrl;

    // Create document in Supabase
    const floorPlanData = {
      household_id: data.householdId,
      user_id: data.userId,
      name: data.name,
      file_url: fileUrl,
      description: data.description,
      file_size: data.file.size,
      file_type: data.file.type,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data: insertData, error: insertError } = await supabase
      .from('floor_plans')
      .insert(floorPlanData)
      .select()
      .single();

    if (insertError) throw insertError;
    return insertData.id;
  } catch (error) {
    console.error('Error creating floor plan:', error);
    throw new Error('Failed to create floor plan');
  }
};

// Get floor plan by ID
export const getFloorPlan = async (floorPlanId: string): Promise<FloorPlan | null> => {
  try {
    const { data, error } = await supabase
      .from('floor_plans')
      .select('*')
      .eq('id', floorPlanId)
      .single();

    if (error) return null;

    if (data) {
      return {
        id: data.id,
        householdId: data.household_id,
        userId: data.user_id,
        name: data.name,
        fileUrl: data.file_url,
        thumbnailUrl: data.thumbnail_url,
        description: data.description,
        fileSize: data.file_size,
        fileType: data.file_type,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      } as FloorPlan;
    }
    return null;
  } catch (error) {
    console.error('Error getting floor plan:', error);
    throw new Error('Failed to get floor plan');
  }
};

// Get floor plans by household ID
export const getFloorPlansByHousehold = async (householdId: string): Promise<FloorPlan[]> => {
  try {
    const { data, error } = await supabase
      .from('floor_plans')
      .select('*')
      .eq('household_id', householdId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []).map(item => ({
      id: item.id,
      householdId: item.household_id,
      userId: item.user_id,
      name: item.name,
      fileUrl: item.file_url,
      thumbnailUrl: item.thumbnail_url,
      description: item.description,
      fileSize: item.file_size,
      fileType: item.file_type,
      createdAt: item.created_at,
      updatedAt: item.updated_at,
    })) as FloorPlan[];
  } catch (error) {
    console.error('Error getting floor plans by household:', error);
    throw new Error('Failed to get floor plans');
  }
};

// Get floor plans by user ID
export const getFloorPlansByUser = async (userId: string): Promise<FloorPlan[]> => {
  try {
    const { data, error } = await supabase
      .from('floor_plans')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []).map(item => ({
      id: item.id,
      householdId: item.household_id,
      userId: item.user_id,
      name: item.name,
      fileUrl: item.file_url,
      thumbnailUrl: item.thumbnail_url,
      description: item.description,
      fileSize: item.file_size,
      fileType: item.file_type,
      createdAt: item.created_at,
      updatedAt: item.updated_at,
    })) as FloorPlan[];
  } catch (error) {
    console.error('Error getting floor plans by user:', error);
    throw new Error('Failed to get floor plans');
  }
};

// Update floor plan
export const updateFloorPlan = async (floorPlanId: string, data: UpdateFloorPlanData): Promise<void> => {
  try {
    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (data.name) updateData.name = data.name;
    if (data.description) updateData.description = data.description;

    // If a new file is provided, upload it and update the URL
    if (data.file) {
      const floorPlan = await getFloorPlan(floorPlanId);
      if (!floorPlan) throw new Error('Floor plan not found');

      // Delete old file from storage
      if (floorPlan.fileUrl) {
        try {
          const filePath = floorPlan.fileUrl.split('/').pop(); // Extract filename from URL
          if (filePath) {
            await supabase.storage
              .from('floorplans')
              .remove([`${floorPlan.householdId}/${filePath}`]);
          }
        } catch (error) {
          console.warn('Failed to delete old file:', error);
        }
      }

      // Upload new file
      const filePath = `floorplans/${floorPlan.householdId}/${data.file.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('floorplans')
        .upload(filePath, data.file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('floorplans')
        .getPublicUrl(filePath);

      updateData.file_url = urlData.publicUrl;
      updateData.file_size = data.file.size;
      updateData.file_type = data.file.type;
    }

    const { error } = await supabase
      .from('floor_plans')
      .update(updateData)
      .eq('id', floorPlanId);

    if (error) throw error;
  } catch (error) {
    console.error('Error updating floor plan:', error);
    throw new Error('Failed to update floor plan');
  }
};

// Delete floor plan
export const deleteFloorPlan = async (floorPlanId: string): Promise<void> => {
  try {
    const floorPlan = await getFloorPlan(floorPlanId);
    if (!floorPlan) throw new Error('Floor plan not found');

    // Delete file from storage
    if (floorPlan.fileUrl) {
      try {
        const filePath = floorPlan.fileUrl.split('/').pop(); // Extract filename from URL
        if (filePath) {
          await supabase.storage
            .from('floorplans')
            .remove([`${floorPlan.householdId}/${filePath}`]);
        }
      } catch (error) {
        console.warn('Failed to delete file from storage:', error);
      }
    }

    // Delete document from Supabase
    const { error } = await supabase
      .from('floor_plans')
      .delete()
      .eq('id', floorPlanId);

    if (error) throw error;
  } catch (error) {
    console.error('Error deleting floor plan:', error);
    throw new Error('Failed to delete floor plan');
  }
};

// Subscribe to floor plans changes
export const subscribeToFloorPlans = (
  householdId: string,
  callback: (floorPlans: FloorPlan[]) => void
) => {
  return supabase
    .channel(`floor-plans-${householdId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'floor_plans',
        filter: `household_id=eq.${householdId}`,
      },
      async () => {
        // Refetch floor plans when there are changes
        const floorPlans = await getFloorPlansByHousehold(householdId);
        callback(floorPlans);
      }
    )
    .subscribe();
};

// Upload floor plan file and get URL
export const uploadFloorPlanFile = async (file: File, householdId: string): Promise<string> => {
  try {
    const filePath = `floorplans/${householdId}/${file.name}`;
    const { data, error } = await supabase.storage
      .from('floorplans')
      .upload(filePath, file);

    if (error) throw error;

    const { data: urlData } = supabase.storage
      .from('floorplans')
      .getPublicUrl(filePath);

    return urlData.publicUrl;
  } catch (error) {
    console.error('Error uploading floor plan file:', error);
    throw new Error('Failed to upload floor plan file');
  }
};

// Generate thumbnail from floor plan
export const generateFloorPlanThumbnail = async (fileUrl: string, householdId: string): Promise<string> => {
  try {
    // This is a simplified version - in a real implementation, you might want to use a server-side service
    // to generate thumbnails from 3D models or images
    const response = await fetch(fileUrl);
    const blob = await response.blob();
    
    // Create a canvas to generate thumbnail
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    const img = new Image();
    
    return new Promise((resolve, reject) => {
      img.onload = () => {
        // Set canvas size for thumbnail
        const maxSize = 200;
        const ratio = Math.min(maxSize / img.width, maxSize / img.height);
        canvas.width = img.width * ratio;
        canvas.height = img.height * ratio;
        
        // Draw image on canvas
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        
        // Convert to blob and upload
        canvas.toBlob(async (thumbnailBlob) => {
          if (thumbnailBlob) {
            const thumbnailFile = new File([thumbnailBlob], 'thumbnail.jpg', { type: 'image/jpeg' });
            const thumbnailUrl = await uploadFloorPlanFile(thumbnailFile, householdId);
            resolve(thumbnailUrl);
          } else {
            reject(new Error('Failed to generate thumbnail'));
          }
        }, 'image/jpeg', 0.8);
      };
      
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = URL.createObjectURL(blob);
    });
  } catch (error) {
    console.error('Error generating thumbnail:', error);
    throw new Error('Failed to generate thumbnail');
  }
}; 