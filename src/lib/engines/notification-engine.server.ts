import { getSupabaseServer } from '../supabase.server';

export type NotificationCategory = 'Information' | 'Warning' | 'Critical' | 'Opportunity' | 'Success';
export type NotificationPriority = 'low' | 'medium' | 'high';

export interface CreateNotificationParams {
  businessId: string;
  title: string;
  description: string;
  category: NotificationCategory;
  priority: NotificationPriority;
  relatedFeature?: string;
  suggestedAction?: Record<string, any>;
}

export async function createNotification(params: CreateNotificationParams) {
  const supabase = getSupabaseServer();
  
  const { data, error } = await supabase
    .from('notifications')
    .insert({
      business_id: params.businessId,
      title: params.title,
      description: params.description,
      category: params.category,
      priority: params.priority,
      related_feature: params.relatedFeature,
      suggested_action: params.suggestedAction,
    })
    .select()
    .single();
    
  if (error) {
    console.error('Failed to create notification:', error);
    throw error;
  }
  
  return data;
}

export async function getUnreadNotifications(businessId: string) {
  const supabase = getSupabaseServer();
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('business_id', businessId)
    .eq('is_read', false)
    .order('created_at', { ascending: false });
    
  if (error) throw error;
  return data;
}

export async function markNotificationRead(notificationId: string) {
  const supabase = getSupabaseServer();
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', notificationId);
    
  if (error) throw error;
}
